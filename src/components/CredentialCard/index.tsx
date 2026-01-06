/**
 * CredentialCard 主组件
 * 组合所有子组件显示完整的凭证卡片
 */

import { cn } from "@proxycast/plugin-components";
import { CardHeader } from "./CardHeader";
import { CardActions } from "./CardActions";
import { CardStats } from "./CardStats";
import type { CredentialCardProps } from "./types";

export function CredentialCard({
  credential,
  onToggle,
  onDelete,
  onReset,
  onCheckHealth,
  onRefreshToken,
  onEdit,
  deleting,
  checkingHealth,
  refreshingToken,
}: CredentialCardProps) {
  const isHealthy = (credential.is_healthy ?? false) && !credential.is_disabled;
  const isOAuth = (credential.credential_type ?? "").includes("oauth");

  return (
    <div
      className={cn(
        "rounded-xl border-2 transition-all hover:shadow-md",
        credential.is_disabled
          ? "border-gray-200 bg-gray-50/80 opacity-70 dark:border-gray-700 dark:bg-gray-900/60"
          : isHealthy
            ? "border-purple-200 bg-gradient-to-r from-purple-50/80 to-pink-50/80 dark:border-purple-800 dark:bg-gradient-to-r dark:from-purple-950/40 dark:to-pink-950/40"
            : "border-red-200 bg-gradient-to-r from-red-50/80 to-white dark:border-red-800 dark:bg-gradient-to-r dark:from-red-950/40 dark:to-transparent"
      )}
    >
      {/* 第一行：状态图标 + 名称 + 标签 + 操作按钮 */}
      <div className="flex items-center gap-4 p-4 pb-3">
        <CardHeader credential={credential} isHealthy={isHealthy} />

        <CardActions
          credential={credential}
          isOAuth={isOAuth}
          checkingHealth={checkingHealth}
          refreshingToken={refreshingToken}
          deleting={deleting}
          onToggle={onToggle}
          onEdit={onEdit}
          onCheckHealth={onCheckHealth}
          onRefreshToken={onRefreshToken}
          onReset={onReset}
          onDelete={onDelete}
        />
      </div>

      {/* 第二行：统计信息 */}
      <CardStats credential={credential} isOAuth={isOAuth} />

      {/* 第三行：UUID */}
      <div className="px-4 py-2 border-t border-border/30">
        <p className="text-xs text-muted-foreground font-mono">
          {credential.uuid}
        </p>
      </div>

      {/* 错误信息 */}
      {credential.last_error_message && (
        <div className="mx-4 mb-3 rounded-lg bg-red-100 p-3 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {credential.last_error_message.slice(0, 150)}
          {credential.last_error_message.length > 150 && "..."}
        </div>
      )}

      {/* 支持的模型提示 */}
      <div className="mx-4 mb-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 p-3 text-xs text-purple-700 dark:text-purple-300">
        <div className="font-medium mb-1">支持的模型：</div>
        <div className="flex flex-wrap gap-1">
          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 rounded">Gemini 3 Pro</span>
          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 rounded">Gemini 2.5 Flash</span>
          <span className="px-2 py-0.5 bg-pink-100 dark:bg-pink-900/50 rounded">Claude Sonnet 4.5</span>
          <span className="px-2 py-0.5 bg-pink-100 dark:bg-pink-900/50 rounded">Claude Opus 4.5</span>
        </div>
      </div>
    </div>
  );
}
