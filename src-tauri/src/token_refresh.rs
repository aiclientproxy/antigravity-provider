//! Token 刷新模块

#![allow(dead_code)]

use crate::auth::oauth::{is_token_valid, refresh_access_token};
use crate::credentials::AntigravityCredentials;
use anyhow::Result;
use chrono::Utc;
use tracing::{info, warn};

/// Token 刷新结果
#[derive(Debug, Clone)]
pub struct TokenRefreshResult {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expiry_date: Option<i64>,
}

/// 刷新凭证的 Token
pub async fn refresh_credential_token(
    credential: &mut AntigravityCredentials,
) -> Result<TokenRefreshResult> {
    let refresh_token = credential
        .refresh_token
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("缺少 refresh_token"))?;

    info!("开始刷新 Antigravity OAuth Token");

    let result = refresh_access_token(refresh_token).await?;

    // 更新凭证
    credential.access_token = Some(result.access_token.clone());
    if let Some(ref rt) = result.refresh_token {
        credential.refresh_token = Some(rt.clone());
    }
    credential.expiry_date = result.expiry_date;
    if let Some(expiry) = result.expiry_date {
        credential.expire = chrono::DateTime::from_timestamp_millis(expiry)
            .map(|dt| dt.to_rfc3339());
    }
    credential.last_refresh = Some(Utc::now().to_rfc3339());
    credential.is_healthy = true;
    credential.last_error = None;

    info!("Antigravity OAuth Token 刷新成功");

    Ok(TokenRefreshResult {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expiry_date: result.expiry_date,
    })
}

/// 检查并刷新 Token（如果需要）
pub async fn ensure_valid_token(
    credential: &mut AntigravityCredentials,
) -> Result<String> {
    // 检查是否有 access_token
    let access_token = credential
        .access_token
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("缺少 access_token"))?;

    // 检查 token 是否有效
    if is_token_valid(credential.expiry_date) {
        return Ok(access_token.clone());
    }

    // Token 已过期或即将过期，尝试刷新
    if credential.refresh_token.is_some() {
        let result = refresh_credential_token(credential).await?;
        return Ok(result.access_token);
    }

    // 没有 refresh_token，返回当前 token（可能已过期）
    warn!("Token 可能已过期，但没有 refresh_token 可用");
    Ok(access_token.clone())
}

/// 带重试的 Token 刷新
pub async fn refresh_token_with_retry(
    credential: &mut AntigravityCredentials,
    max_retries: u32,
) -> Result<TokenRefreshResult> {
    let mut last_error = None;

    for attempt in 0..max_retries {
        match refresh_credential_token(credential).await {
            Ok(result) => return Ok(result),
            Err(e) => {
                warn!(
                    "Token 刷新失败 (尝试 {}/{}): {}",
                    attempt + 1,
                    max_retries,
                    e
                );
                last_error = Some(e);
                // 指数退避
                let delay = std::time::Duration::from_millis(1000 * 2_u64.pow(attempt));
                tokio::time::sleep(delay).await;
            }
        }
    }

    Err(last_error.unwrap())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_token_refresh_result() {
        let result = TokenRefreshResult {
            access_token: "test-token".to_string(),
            refresh_token: Some("test-refresh".to_string()),
            expiry_date: Some(Utc::now().timestamp_millis() + 3600000),
        };

        assert!(!result.access_token.is_empty());
        assert!(result.refresh_token.is_some());
        assert!(result.expiry_date.is_some());
    }
}
