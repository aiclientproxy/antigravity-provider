//! Antigravity Provider CLI 入口

#![allow(dead_code)]

mod api;
mod auth;
mod credentials;
mod token_refresh;

use anyhow::Result;
use clap::{Parser, Subcommand};
use credentials::{AcquiredCredential, AuthType, AntigravityCredentials};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::io::{self, BufRead, Write};
use tracing::{error, info};
use tracing_subscriber::EnvFilter;

/// Antigravity Provider CLI
#[derive(Parser)]
#[command(name = "antigravity-provider-cli")]
#[command(about = "Antigravity Provider - Google Gemini CLI OAuth credential provider")]
#[command(version)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// 启动 JSON-RPC 服务
    Serve,
    /// 获取版本信息
    Version,
}

/// JSON-RPC 请求
#[derive(Debug, Deserialize)]
struct JsonRpcRequest {
    #[allow(dead_code)]
    jsonrpc: String,
    method: String,
    params: Option<serde_json::Value>,
    id: serde_json::Value,
}

/// JSON-RPC 响应
#[derive(Debug, Serialize)]
struct JsonRpcResponse {
    jsonrpc: String,
    result: Option<serde_json::Value>,
    error: Option<JsonRpcError>,
    id: serde_json::Value,
}

/// JSON-RPC 错误
#[derive(Debug, Serialize)]
struct JsonRpcError {
    code: i32,
    message: String,
    #[allow(dead_code)]
    data: Option<serde_json::Value>,
}

impl JsonRpcResponse {
    fn success(id: serde_json::Value, result: serde_json::Value) -> Self {
        Self {
            jsonrpc: "2.0".to_string(),
            result: Some(result),
            error: None,
            id,
        }
    }

    fn error(id: serde_json::Value, code: i32, message: String) -> Self {
        Self {
            jsonrpc: "2.0".to_string(),
            result: None,
            error: Some(JsonRpcError {
                code,
                message,
                data: None,
            }),
            id,
        }
    }
}

/// 处理 JSON-RPC 请求
async fn handle_request(request: JsonRpcRequest) -> JsonRpcResponse {
    let id = request.id.clone();

    match request.method.as_str() {
        "initialize" => handle_initialize(id, request.params).await,
        "acquire_credential" => handle_acquire_credential(id, request.params).await,
        "release_credential" => handle_release_credential(id, request.params).await,
        "list_credentials" => handle_list_credentials(id, request.params).await,
        "add_credential" => handle_add_credential(id, request.params).await,
        "remove_credential" => handle_remove_credential(id, request.params).await,
        "refresh_token" => handle_refresh_token(id, request.params).await,
        "validate_credential" => handle_validate_credential(id, request.params).await,
        "get_auth_url" => handle_get_auth_url(id, request.params).await,
        "exchange_code" => handle_exchange_code(id, request.params).await,
        "health_check" => handle_health_check(id).await,
        "shutdown" => handle_shutdown(id).await,
        _ => JsonRpcResponse::error(id, -32601, format!("Method not found: {}", request.method)),
    }
}

/// 初始化
async fn handle_initialize(
    id: serde_json::Value,
    _params: Option<serde_json::Value>,
) -> JsonRpcResponse {
    info!("初始化 Antigravity Provider");

    JsonRpcResponse::success(
        id,
        json!({
            "provider_id": "antigravity",
            "display_name": "Antigravity (Gemini CLI)",
            "version": env!("CARGO_PKG_VERSION"),
            "supported_auth_types": ["oauth"],
            "capabilities": {
                "token_refresh": true,
                "pkce": true,
                "code_assist": true
            }
        }),
    )
}

/// 获取凭证
async fn handle_acquire_credential(
    id: serde_json::Value,
    params: Option<serde_json::Value>,
) -> JsonRpcResponse {
    let params = match params {
        Some(p) => p,
        None => return JsonRpcResponse::error(id, -32602, "Missing params".to_string()),
    };

    // 解析凭证
    let credential: AntigravityCredentials = match serde_json::from_value(params) {
        Ok(c) => c,
        Err(e) => return JsonRpcResponse::error(id, -32602, format!("Invalid params: {}", e)),
    };

    let token = match &credential.access_token {
        Some(t) => t.clone(),
        None => {
            return JsonRpcResponse::error(id, -32602, "Missing access_token".to_string())
        }
    };

    let acquired = AcquiredCredential {
        credential_id: credential.id.clone(),
        auth_type: AuthType::OAuth,
        token,
        email: credential.email.clone(),
        project_id: credential.project_id.or(credential.temp_project_id),
        expires_at: credential.expiry_date.and_then(|ms| {
            chrono::DateTime::from_timestamp_millis(ms)
        }),
    };

    JsonRpcResponse::success(id, serde_json::to_value(acquired).unwrap())
}

/// 释放凭证
async fn handle_release_credential(
    id: serde_json::Value,
    _params: Option<serde_json::Value>,
) -> JsonRpcResponse {
    JsonRpcResponse::success(id, json!({"success": true}))
}

/// 列出凭证
async fn handle_list_credentials(
    id: serde_json::Value,
    _params: Option<serde_json::Value>,
) -> JsonRpcResponse {
    JsonRpcResponse::success(id, json!({"credentials": []}))
}

/// 添加凭证
async fn handle_add_credential(
    id: serde_json::Value,
    params: Option<serde_json::Value>,
) -> JsonRpcResponse {
    let params = match params {
        Some(p) => p,
        None => return JsonRpcResponse::error(id, -32602, "Missing params".to_string()),
    };

    let credential: AntigravityCredentials = match serde_json::from_value(params) {
        Ok(c) => c,
        Err(e) => return JsonRpcResponse::error(id, -32602, format!("Invalid params: {}", e)),
    };

    JsonRpcResponse::success(
        id,
        json!({
            "success": true,
            "credential_id": credential.id
        }),
    )
}

/// 删除凭证
async fn handle_remove_credential(
    id: serde_json::Value,
    _params: Option<serde_json::Value>,
) -> JsonRpcResponse {
    JsonRpcResponse::success(id, json!({"success": true}))
}

/// 刷新 Token
async fn handle_refresh_token(
    id: serde_json::Value,
    params: Option<serde_json::Value>,
) -> JsonRpcResponse {
    let params = match params {
        Some(p) => p,
        None => return JsonRpcResponse::error(id, -32602, "Missing params".to_string()),
    };

    let refresh_token = match params.get("refresh_token").and_then(|v| v.as_str()) {
        Some(t) => t,
        None => return JsonRpcResponse::error(id, -32602, "Missing refresh_token".to_string()),
    };

    match auth::oauth::refresh_access_token(refresh_token).await {
        Ok(result) => JsonRpcResponse::success(
            id,
            json!({
                "access_token": result.access_token,
                "refresh_token": result.refresh_token,
                "expiry_date": result.expiry_date,
                "token_type": result.token_type
            }),
        ),
        Err(e) => JsonRpcResponse::error(id, -32000, format!("Token refresh failed: {}", e)),
    }
}

/// 验证凭证
async fn handle_validate_credential(
    id: serde_json::Value,
    params: Option<serde_json::Value>,
) -> JsonRpcResponse {
    let params = match params {
        Some(p) => p,
        None => return JsonRpcResponse::error(id, -32602, "Missing params".to_string()),
    };

    let access_token = match params.get("access_token").and_then(|v| v.as_str()) {
        Some(t) => t,
        None => {
            return JsonRpcResponse::error(id, -32602, "Missing access_token".to_string())
        }
    };

    // 尝试获取用户信息来验证 token
    let is_valid = auth::oauth::fetch_user_info(access_token).await.is_ok();

    JsonRpcResponse::success(id, json!({"valid": is_valid}))
}

/// 获取授权 URL
async fn handle_get_auth_url(
    id: serde_json::Value,
    params: Option<serde_json::Value>,
) -> JsonRpcResponse {
    let state = params
        .as_ref()
        .and_then(|p| p.get("state"))
        .and_then(|v| v.as_str())
        .unwrap_or(&uuid::Uuid::new_v4().to_string())
        .to_string();

    let pkce = auth::oauth::generate_pkce();
    let auth_url = auth::oauth::generate_auth_url(&state, &pkce.code_challenge);

    JsonRpcResponse::success(
        id,
        json!({
            "auth_url": auth_url,
            "state": state,
            "code_verifier": pkce.code_verifier,
            "code_challenge": pkce.code_challenge
        }),
    )
}

/// 交换授权码
async fn handle_exchange_code(
    id: serde_json::Value,
    params: Option<serde_json::Value>,
) -> JsonRpcResponse {
    let params = match params {
        Some(p) => p,
        None => return JsonRpcResponse::error(id, -32602, "Missing params".to_string()),
    };

    let code = match params.get("code").and_then(|v| v.as_str()) {
        Some(c) => c,
        None => return JsonRpcResponse::error(id, -32602, "Missing code".to_string()),
    };

    let code_verifier = match params.get("code_verifier").and_then(|v| v.as_str()) {
        Some(v) => v,
        None => return JsonRpcResponse::error(id, -32602, "Missing code_verifier".to_string()),
    };

    let redirect_uri = params
        .get("redirect_uri")
        .and_then(|v| v.as_str())
        .unwrap_or(auth::oauth::OAUTH_REDIRECT_URI);

    match auth::oauth::exchange_code_for_tokens(code, redirect_uri, code_verifier).await {
        Ok(result) => {
            // 尝试获取用户信息
            let user_info = auth::oauth::fetch_user_info(&result.access_token)
                .await
                .ok();

            JsonRpcResponse::success(
                id,
                json!({
                    "access_token": result.access_token,
                    "refresh_token": result.refresh_token,
                    "expiry_date": result.expiry_date,
                    "token_type": result.token_type,
                    "scope": result.scope,
                    "email": user_info.as_ref().and_then(|u| u.email.clone()),
                    "user_id": user_info.as_ref().and_then(|u| u.id.clone())
                }),
            )
        }
        Err(e) => JsonRpcResponse::error(id, -32000, format!("Code exchange failed: {}", e)),
    }
}

/// 健康检查
async fn handle_health_check(id: serde_json::Value) -> JsonRpcResponse {
    JsonRpcResponse::success(
        id,
        json!({
            "status": "healthy",
            "provider": "antigravity",
            "version": env!("CARGO_PKG_VERSION")
        }),
    )
}

/// 关闭
async fn handle_shutdown(id: serde_json::Value) -> JsonRpcResponse {
    info!("收到关闭请求");
    JsonRpcResponse::success(id, json!({"success": true}))
}

/// 运行 JSON-RPC 服务
async fn run_jsonrpc_server() -> Result<()> {
    let stdin = io::stdin();
    let mut stdout = io::stdout();

    info!("Antigravity Provider CLI 已启动，等待 JSON-RPC 请求...");

    for line in stdin.lock().lines() {
        let line = match line {
            Ok(l) => l,
            Err(e) => {
                error!("读取输入失败: {}", e);
                continue;
            }
        };

        if line.trim().is_empty() {
            continue;
        }

        let request: JsonRpcRequest = match serde_json::from_str(&line) {
            Ok(r) => r,
            Err(e) => {
                let response = JsonRpcResponse::error(
                    serde_json::Value::Null,
                    -32700,
                    format!("Parse error: {}", e),
                );
                let output = serde_json::to_string(&response)?;
                writeln!(stdout, "{}", output)?;
                stdout.flush()?;
                continue;
            }
        };

        let response = handle_request(request).await;
        let output = serde_json::to_string(&response)?;
        writeln!(stdout, "{}", output)?;
        stdout.flush()?;
    }

    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    // 初始化日志
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::from_default_env().add_directive("antigravity_provider_cli=info".parse()?),
        )
        .with_writer(std::io::stderr)
        .init();

    let cli = Cli::parse();

    match cli.command {
        Some(Commands::Version) => {
            println!("antigravity-provider-cli {}", env!("CARGO_PKG_VERSION"));
        }
        Some(Commands::Serve) | None => {
            run_jsonrpc_server().await?;
        }
    }

    Ok(())
}
