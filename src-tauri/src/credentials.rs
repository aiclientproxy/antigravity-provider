//! Antigravity Provider 凭证数据结构

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// 认证类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AuthType {
    /// Google OAuth 2.0 + PKCE
    OAuth,
}

impl Default for AuthType {
    fn default() -> Self {
        Self::OAuth
    }
}

/// Antigravity 凭证
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AntigravityCredentials {
    /// 凭证 ID
    pub id: String,
    /// 凭证名称
    #[serde(default)]
    pub name: Option<String>,
    /// 认证类型
    #[serde(default)]
    pub auth_type: AuthType,
    /// Access Token (OAuth)
    #[serde(default)]
    pub access_token: Option<String>,
    /// Refresh Token (OAuth)
    #[serde(default)]
    pub refresh_token: Option<String>,
    /// 过期时间戳（毫秒）
    #[serde(default)]
    pub expiry_date: Option<i64>,
    /// 过期时间（RFC3339）
    #[serde(default)]
    pub expire: Option<String>,
    /// OAuth Scope
    #[serde(default)]
    pub scope: Option<String>,
    /// 用户邮箱
    #[serde(default)]
    pub email: Option<String>,
    /// Google Cloud Project ID
    #[serde(default)]
    pub project_id: Option<String>,
    /// 临时 Project ID（Code Assist 分配）
    #[serde(default)]
    pub temp_project_id: Option<String>,
    /// 是否禁用
    #[serde(default)]
    pub disabled: bool,
    /// 是否健康
    #[serde(default = "default_true")]
    pub is_healthy: bool,
    /// 最后刷新时间
    #[serde(default)]
    pub last_refresh: Option<String>,
    /// 最后错误
    #[serde(default)]
    pub last_error: Option<String>,
    /// 限流状态
    #[serde(default)]
    pub rate_limit_status: Option<String>,
    /// 限流时间
    #[serde(default)]
    pub rate_limited_at: Option<String>,
    /// 创建时间
    #[serde(default)]
    pub created_at: Option<String>,
    /// 更新时间
    #[serde(default)]
    pub updated_at: Option<String>,
}

fn default_true() -> bool {
    true
}

impl Default for AntigravityCredentials {
    fn default() -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: None,
            auth_type: AuthType::OAuth,
            access_token: None,
            refresh_token: None,
            expiry_date: None,
            expire: None,
            scope: None,
            email: None,
            project_id: None,
            temp_project_id: None,
            disabled: false,
            is_healthy: true,
            last_refresh: None,
            last_error: None,
            rate_limit_status: None,
            rate_limited_at: None,
            created_at: Some(Utc::now().to_rfc3339()),
            updated_at: Some(Utc::now().to_rfc3339()),
        }
    }
}

/// 获取的凭证（用于 API 请求）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AcquiredCredential {
    /// 凭证 ID
    pub credential_id: String,
    /// 认证类型
    pub auth_type: AuthType,
    /// Access Token
    pub token: String,
    /// 用户邮箱
    #[serde(default)]
    pub email: Option<String>,
    /// Project ID
    #[serde(default)]
    pub project_id: Option<String>,
    /// 过期时间
    #[serde(default)]
    pub expires_at: Option<DateTime<Utc>>,
}

/// Token 响应
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TokenResponse {
    pub access_token: String,
    #[serde(default)]
    pub refresh_token: Option<String>,
    #[serde(default)]
    pub token_type: String,
    #[serde(default)]
    pub expiry_date: Option<i64>,
    #[serde(default)]
    pub scope: Option<String>,
}

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
