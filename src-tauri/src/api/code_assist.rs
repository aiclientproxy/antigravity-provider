//! Code Assist API 模块

#![allow(dead_code)]

use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tracing::{debug, info};

/// Code Assist API 端点
pub const CODE_ASSIST_ENDPOINT: &str = "https://cloudcode-pa.googleapis.com";
pub const CODE_ASSIST_API_VERSION: &str = "v1internal";

/// Load Code Assist 响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoadCodeAssistResponse {
    #[serde(rename = "cloudaicompanionProject")]
    pub cloud_ai_companion_project: Option<String>,
    #[serde(rename = "currentTier")]
    pub current_tier: Option<serde_json::Value>,
    #[serde(rename = "allowedTiers")]
    pub allowed_tiers: Option<serde_json::Value>,
}

/// 用户层级
#[derive(Debug, Clone, PartialEq)]
pub enum UserTier {
    Legacy,
    Free,
    Pro,
}

impl UserTier {
    pub fn as_str(&self) -> &str {
        match self {
            UserTier::Legacy => "LEGACY",
            UserTier::Free => "FREE",
            UserTier::Pro => "PRO",
        }
    }
}

/// 调用 loadCodeAssist 获取用户配置和 Project ID
pub async fn load_code_assist(
    access_token: &str,
    project_id: Option<&str>,
) -> Result<LoadCodeAssistResponse> {
    let client = Client::builder()
        .connect_timeout(std::time::Duration::from_secs(30))
        .timeout(std::time::Duration::from_secs(60))
        .build()?;

    // 对于个人账户（无 projectId），先调用 tokeninfo/userinfo
    // 帮助 Google 获取临时 projectId
    if project_id.is_none() {
        // 验证 token
        let _ = client
            .post("https://oauth2.googleapis.com/tokeninfo")
            .header("Authorization", format!("Bearer {}", access_token))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .form(&[("access_token", access_token)])
            .send()
            .await;

        // 获取用户信息
        let _ = client
            .get("https://www.googleapis.com/oauth2/v2/userinfo")
            .header("Authorization", format!("Bearer {}", access_token))
            .send()
            .await;
    }

    // 构建请求
    let mut request = json!({
        "metadata": {
            "ideType": "IDE_UNSPECIFIED",
            "platform": "PLATFORM_UNSPECIFIED",
            "pluginType": "GEMINI"
        }
    });

    if let Some(pid) = project_id {
        request["cloudaicompanionProject"] = json!(pid);
        request["metadata"]["duetProject"] = json!(pid);
    }

    let url = format!(
        "{}/{}:loadCodeAssist",
        CODE_ASSIST_ENDPOINT, CODE_ASSIST_API_VERSION
    );

    debug!("调用 loadCodeAssist: {}", url);

    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", access_token))
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        anyhow::bail!("loadCodeAssist 失败: {} - {}", status, body);
    }

    let data: LoadCodeAssistResponse = response.json().await?;
    info!("loadCodeAssist 成功");

    Ok(data)
}

/// 获取 onboard 层级
pub fn get_onboard_tier(load_res: &LoadCodeAssistResponse) -> UserTier {
    if let Some(current) = &load_res.current_tier {
        return match current["id"].as_str() {
            Some("PRO") => UserTier::Pro,
            Some("FREE") => UserTier::Free,
            _ => UserTier::Legacy,
        };
    }

    if let Some(tiers) = &load_res.allowed_tiers {
        if let Some(arr) = tiers.as_array() {
            for tier in arr {
                if tier["isDefault"].as_bool().unwrap_or(false) {
                    return match tier["id"].as_str() {
                        Some("PRO") => UserTier::Pro,
                        Some("FREE") => UserTier::Free,
                        _ => UserTier::Legacy,
                    };
                }
            }
        }
    }

    UserTier::Legacy
}

/// Onboard 响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OnboardResponse {
    #[serde(default)]
    pub done: bool,
    #[serde(default)]
    pub response: Option<serde_json::Value>,
}

/// 调用 onboardUser（包含轮询逻辑）
pub async fn onboard_user(
    access_token: &str,
    tier_id: &str,
    project_id: Option<&str>,
) -> Result<OnboardResponse> {
    let client = Client::builder()
        .connect_timeout(std::time::Duration::from_secs(30))
        .timeout(std::time::Duration::from_secs(60))
        .build()?;

    let mut request = json!({
        "tierId": tier_id,
        "metadata": {
            "ideType": "IDE_UNSPECIFIED",
            "platform": "PLATFORM_UNSPECIFIED",
            "pluginType": "GEMINI"
        }
    });

    if let Some(pid) = project_id {
        request["cloudaicompanionProject"] = json!(pid);
    }

    let url = format!(
        "{}/{}:onboardUser",
        CODE_ASSIST_ENDPOINT, CODE_ASSIST_API_VERSION
    );

    info!("开始 onboardUser API 调用");

    // 轮询直到长运行操作完成
    let mut attempts = 0;
    const MAX_ATTEMPTS: u32 = 12; // 最多等待 1 分钟

    loop {
        let response = client
            .post(&url)
            .header("Authorization", format!("Bearer {}", access_token))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await?;

        let status = response.status();
        if !status.is_success() {
            let body = response.text().await.unwrap_or_default();
            anyhow::bail!("onboardUser 失败: {} - {}", status, body);
        }

        let lro_res: OnboardResponse = response.json().await?;

        if lro_res.done {
            info!("onboardUser 完成");
            return Ok(lro_res);
        }

        attempts += 1;
        if attempts >= MAX_ATTEMPTS {
            anyhow::bail!("onboardUser 操作超时");
        }

        info!("等待 onboardUser 完成... ({}/{})", attempts, MAX_ATTEMPTS);
        tokio::time::sleep(std::time::Duration::from_secs(5)).await;
    }
}

/// 设置用户结果
#[derive(Debug, Clone)]
pub struct SetupUserResult {
    pub project_id: String,
    pub user_tier: UserTier,
}

/// 完整的用户设置流程
pub async fn setup_user(
    access_token: &str,
    initial_project_id: Option<&str>,
) -> Result<SetupUserResult> {
    info!("开始 setupUser 流程");

    let project_id = initial_project_id.map(String::from);

    // 调用 loadCodeAssist
    let load_res = load_code_assist(access_token, project_id.as_deref()).await?;

    // 如果没有 projectId，尝试从 loadRes 获取
    let project_id = project_id.or_else(|| load_res.cloud_ai_companion_project.clone());

    let tier = get_onboard_tier(&load_res);
    info!("用户层级: {:?}", tier);

    // 调用 onboardUser
    let lro_res = onboard_user(access_token, tier.as_str(), project_id.as_deref()).await?;

    // 从响应中获取 project_id
    let final_project_id = lro_res
        .response
        .as_ref()
        .and_then(|r| r["cloudaicompanionProject"]["id"].as_str())
        .map(String::from)
        .or(project_id)
        .unwrap_or_default();

    info!("setupUser 完成，project_id: {}", final_project_id);

    Ok(SetupUserResult {
        project_id: final_project_id,
        user_tier: tier,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_tier() {
        assert_eq!(UserTier::Pro.as_str(), "PRO");
        assert_eq!(UserTier::Free.as_str(), "FREE");
        assert_eq!(UserTier::Legacy.as_str(), "LEGACY");
    }

    #[test]
    fn test_get_onboard_tier() {
        let load_res = LoadCodeAssistResponse {
            cloud_ai_companion_project: None,
            current_tier: Some(json!({"id": "PRO"})),
            allowed_tiers: None,
        };
        assert_eq!(get_onboard_tier(&load_res), UserTier::Pro);

        let load_res = LoadCodeAssistResponse {
            cloud_ai_companion_project: None,
            current_tier: None,
            allowed_tiers: Some(json!([{"id": "FREE", "isDefault": true}])),
        };
        assert_eq!(get_onboard_tier(&load_res), UserTier::Free);
    }
}
