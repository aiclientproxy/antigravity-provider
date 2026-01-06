/**
 * CardStats 组件
 * 显示凭证统计信息
 */

import {
  Activity,
  AlertTriangle,
  Clock,
  Timer,
  cn,
} from "@proxycast/plugin-components";
import type { CardStatsProps } from "./types";

/**
 * 格式化日期
 */
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "从未";
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CardStats({ credential, isOAuth }: CardStatsProps) {
  const hasError = (credential.error_count || 0) > 0;

  return (
    <>
      {/* 桌面端统计 */}
      <div className="hidden sm:block px-4 py-3 bg-muted/30 border-t border-border/30">
        <div className="grid grid-cols-4 gap-4">
          {/* 使用次数 */}
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-blue-500 shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">使用次数</div>
              <div className="font-bold text-xl tabular-nums">
                {credential.usage_count}
              </div>
            </div>
          </div>

          {/* 错误次数 */}
          <div className="flex items-center gap-3">
            <AlertTriangle
              className={cn(
                "h-5 w-5 shrink-0",
                hasError ? "text-yellow-500" : "text-green-500"
              )}
            />
            <div>
              <div className="text-xs text-muted-foreground">错误次数</div>
              <div className="font-bold text-xl tabular-nums">
                {credential.error_count}
              </div>
            </div>
          </div>

          {/* 最后使用 */}
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">最后使用</div>
              <div className="font-medium text-sm">
                {formatDate(credential.last_used)}
              </div>
            </div>
          </div>

          {/* Token 有效期 - OAuth 凭证显示 */}
          {isOAuth && credential.token_cache_status?.expiry_time ? (
            <div className="flex items-center gap-3">
              <Timer
                className={cn(
                  "h-5 w-5 shrink-0",
                  credential.token_cache_status.is_expiring_soon
                    ? "text-yellow-500"
                    : credential.token_cache_status.is_valid
                      ? "text-green-500"
                      : "text-red-500"
                )}
              />
              <div>
                <div className="text-xs text-muted-foreground">Token 有效期</div>
                <div
                  className={cn(
                    "font-medium text-sm",
                    credential.token_cache_status.is_expiring_soon
                      ? "text-yellow-600 dark:text-yellow-400"
                      : credential.token_cache_status.is_valid
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                  )}
                >
                  {formatDate(credential.token_cache_status.expiry_time)}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">健康检查</div>
                <div className="font-medium text-sm">
                  {formatDate(credential.last_health_check_time)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 移动端统计 */}
      <div className="sm:hidden px-4 py-3 bg-muted/30 border-t border-border/30">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">使用:</span>
            <span className="font-semibold">{credential.usage_count}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={cn(
                "h-4 w-4",
                hasError ? "text-yellow-500" : "text-green-500"
              )}
            />
            <span className="text-xs text-muted-foreground">错误:</span>
            <span className="font-semibold">{credential.error_count}</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">最后使用:</span>
            <span className="text-sm">{formatDate(credential.last_used)}</span>
          </div>
        </div>
      </div>
    </>
  );
}
