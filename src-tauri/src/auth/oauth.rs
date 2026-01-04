//! Google OAuth 2.0 + PKCE 认证模块

#![allow(dead_code)]

use anyhow::Result;
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use chrono::Utc;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tracing::{debug, info};

/// Gemini CLI OAuth 配置 - 公开的 Gemini CLI 凭据
pub const OAUTH_CLIENT_ID: &str =
    "681255809395-oo8ft2oprdrnp9e3aqf6av3hmdib135j.apps.googleusercontent.com";
pub const OAUTH_CLIENT_SECRET: &str = "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";
pub const OAUTH_SCOPES: &[&str] = &["https://www.googleapis.com/auth/cloud-platform"];
pub const OAUTH_REDIRECT_URI: &str = "https://codeassist.google.com/authcode";
pub const OAUTH_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
pub const OAUTH_AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
pub const OAUTH_USERINFO_URL: &str = "https://www.googleapis.com/oauth2/v2/userinfo";

/// PKCE 验证器
#[derive(Debug, Clone)]
pub struct PkceVerifier {
    pub code_verifier: String,
    pub code_challenge: String,
}

/// 生成 PKCE code_verifier 和 code_challenge
pub fn generate_pkce() -> PkceVerifier {
    // 生成 43-128 字符的随机字符串作为 code_verifier
    let code_verifier: String = (0..64)
        .map(|_| {
            let idx = rand::random::<u8>() % 66;
            let chars = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
            chars[idx as usize] as char
        })
        .collect();

    // 计算 code_challenge = BASE64URL(SHA256(code_verifier))
    let mut hasher = Sha256::new();
    hasher.update(code_verifier.as_bytes());
    let hash = hasher.finalize();
    let code_challenge = URL_SAFE_NO_PAD.encode(hash);

    PkceVerifier {
        code_verifier,
        code_challenge,
    }
}

/// 生成 OAuth 授权 URL（使用 PKCE）
pub fn generate_auth_url(state: &str, code_challenge: &str) -> String {
    let scopes = OAUTH_SCOPES.join(" ");

    let params = [
        ("access_type", "offline"),
        ("client_id", OAUTH_CLIENT_ID),
        ("code_challenge", code_challenge),
        ("code_challenge_method", "S256"),
        ("prompt", "select_account"),
        ("redirect_uri", OAUTH_REDIRECT_URI),
        ("response_type", "code"),
        ("scope", &scopes),
        ("state", state),
    ];

    let query = params
        .iter()
        .map(|(k, v)| format!("{}={}", k, urlencoding::encode(v)))
        .collect::<Vec<_>>()
        .join("&");

    format!("{}?{}", OAUTH_AUTH_URL, query)
}

/// Token 响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    #[serde(default)]
    pub refresh_token: Option<String>,
    #[serde(default)]
    pub token_type: String,
    #[serde(default)]
    pub expires_in: Option<i64>,
    #[serde(default)]
    pub scope: Option<String>,
    #[serde(default)]
    pub expiry_date: Option<i64>,
}

/// 交换授权码获取 tokens (支持 PKCE)
pub async fn exchange_code_for_tokens(
    code: &str,
    redirect_uri: &str,
    code_verifier: &str,
) -> Result<TokenResponse> {
    let client = Client::builder()
        .connect_timeout(std::time::Duration::from_secs(30))
        .timeout(std::time::Duration::from_secs(60))
        .build()?;

    debug!("交换授权码获取 tokens");

    let params = [
        ("code", code),
        ("client_id", OAUTH_CLIENT_ID),
        ("client_secret", OAUTH_CLIENT_SECRET),
        ("code_verifier", code_verifier),
        ("redirect_uri", redirect_uri),
        ("grant_type", "authorization_code"),
    ];

    let response = client
        .post(OAUTH_TOKEN_URL)
        .form(&params)
        .send()
        .await?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        anyhow::bail!("Token 交换失败: {} - {}", status, body);
    }

    let mut token_response: TokenResponse = response.json().await?;

    // 计算过期时间戳
    if token_response.expiry_date.is_none() {
        if let Some(expires_in) = token_response.expires_in {
            token_response.expiry_date = Some(Utc::now().timestamp_millis() + expires_in * 1000);
        }
    }

    info!("Token 交换成功");
    Ok(token_response)
}

/// 刷新访问令牌
pub async fn refresh_access_token(refresh_token: &str) -> Result<TokenResponse> {
    let client = Client::builder()
        .connect_timeout(std::time::Duration::from_secs(30))
        .timeout(std::time::Duration::from_secs(60))
        .build()?;

    debug!("刷新 Google OAuth Token");

    let params = [
        ("client_id", OAUTH_CLIENT_ID),
        ("client_secret", OAUTH_CLIENT_SECRET),
        ("refresh_token", refresh_token),
        ("grant_type", "refresh_token"),
    ];

    let response = client
        .post(OAUTH_TOKEN_URL)
        .form(&params)
        .send()
        .await?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        anyhow::bail!("Token 刷新失败: {} - {}", status, body);
    }

    let mut token_response: TokenResponse = response.json().await?;

    // 保留原 refresh_token 如果没有返回新的
    if token_response.refresh_token.is_none() {
        token_response.refresh_token = Some(refresh_token.to_string());
    }

    // 计算过期时间戳
    if token_response.expiry_date.is_none() {
        if let Some(expires_in) = token_response.expires_in {
            token_response.expiry_date = Some(Utc::now().timestamp_millis() + expires_in * 1000);
        } else {
            // 默认 1 小时
            token_response.expiry_date = Some(Utc::now().timestamp_millis() + 3600000);
        }
    }

    info!(
        "Token 刷新成功，新过期时间: {}",
        chrono::DateTime::from_timestamp_millis(token_response.expiry_date.unwrap_or(0))
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_default()
    );

    Ok(token_response)
}

/// 用户信息响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserInfo {
    #[serde(default)]
    pub id: Option<String>,
    #[serde(default)]
    pub email: Option<String>,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub picture: Option<String>,
}

/// 获取用户信息
pub async fn fetch_user_info(access_token: &str) -> Result<UserInfo> {
    let client = Client::builder()
        .connect_timeout(std::time::Duration::from_secs(15))
        .timeout(std::time::Duration::from_secs(30))
        .build()?;

    let response = client
        .get(OAUTH_USERINFO_URL)
        .header("Authorization", format!("Bearer {}", access_token))
        .send()
        .await?;

    if response.status().is_success() {
        let user_info: UserInfo = response.json().await?;
        Ok(user_info)
    } else {
        anyhow::bail!("获取用户信息失败: {}", response.status())
    }
}

/// 检查 Token 是否有效（本地检查）
pub fn is_token_valid(expiry_date: Option<i64>) -> bool {
    if let Some(expiry) = expiry_date {
        let now = Utc::now().timestamp_millis();
        // Token 有效期需要超过 5 分钟
        expiry > now + 300_000
    } else {
        false
    }
}

/// 检查 Token 是否即将过期（1 小时内）
pub fn is_token_expiring_soon(expiry_date: Option<i64>) -> bool {
    if let Some(expiry) = expiry_date {
        let now = Utc::now().timestamp_millis();
        let threshold = now + 3600_000; // 1 小时
        expiry < threshold
    } else {
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_pkce() {
        let pkce = generate_pkce();
        assert!(!pkce.code_verifier.is_empty());
        assert!(!pkce.code_challenge.is_empty());
        // code_verifier 应该是 64 字符
        assert_eq!(pkce.code_verifier.len(), 64);
    }

    #[test]
    fn test_generate_auth_url() {
        let pkce = generate_pkce();
        let url = generate_auth_url("test-state", &pkce.code_challenge);
        assert!(url.starts_with(OAUTH_AUTH_URL));
        assert!(url.contains("client_id="));
        assert!(url.contains("code_challenge="));
        assert!(url.contains("state=test-state"));
    }

    #[test]
    fn test_is_token_valid() {
        // 有效 token
        let valid_expiry = Utc::now().timestamp_millis() + 3600_000;
        assert!(is_token_valid(Some(valid_expiry)));

        // 即将过期 token（5 分钟内）
        let expiring_expiry = Utc::now().timestamp_millis() + 60_000;
        assert!(!is_token_valid(Some(expiring_expiry)));

        // 已过期 token
        let expired_expiry = Utc::now().timestamp_millis() - 60_000;
        assert!(!is_token_valid(Some(expired_expiry)));

        // 无过期时间
        assert!(!is_token_valid(None));
    }
}
