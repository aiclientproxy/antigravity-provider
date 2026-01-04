/**
 * CardActions 组件
 * 显示操作按钮
 */

import {
  Power,
  PowerOff,
  Settings,
  Activity,
  RefreshCw,
  RotateCcw,
  Trash2,
  cn,
} from "@proxycast/plugin-components";
import type { CardActionsProps } from "./types";

export function CardActions({
  credential,
  isOAuth,
  checkingHealth,
  refreshingToken,
  deleting,
  onToggle,
  onEdit,
  onCheckHealth,
  onRefreshToken,
  onReset,
  onDelete,
}: CardActionsProps) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* 启用/禁用 */}
      <button
        onClick={onToggle}
        className={cn(
          "rounded-lg p-2.5 text-xs font-medium transition-colors",
          credential.is_disabled
            ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
        )}
        title={credential.is_disabled ? "启用" : "禁用"}
      >
        {credential.is_disabled ? (
          <Power className="h-4 w-4" />
        ) : (
          <PowerOff className="h-4 w-4" />
        )}
      </button>

      {/* 编辑 */}
      <button
        onClick={onEdit}
        className="rounded-lg bg-blue-100 p-2.5 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 transition-colors"
        title="编辑"
      >
        <Settings className="h-4 w-4" />
      </button>

      {/* 检测健康 */}
      <button
        onClick={onCheckHealth}
        disabled={checkingHealth}
        className="rounded-lg bg-emerald-100 p-2.5 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 dark:bg-emerald-900/30 dark:text-emerald-400 transition-colors"
        title="检测"
      >
        <Activity className={cn("h-4 w-4", checkingHealth && "animate-pulse")} />
      </button>

      {/* 刷新 Token - OAuth 凭证 */}
      {isOAuth && (
        <button
          onClick={onRefreshToken}
          disabled={refreshingToken}
          className="rounded-lg bg-purple-100 p-2.5 text-purple-700 hover:bg-purple-200 disabled:opacity-50 dark:bg-purple-900/30 dark:text-purple-400 transition-colors"
          title="刷新 Token"
        >
          <RefreshCw className={cn("h-4 w-4", refreshingToken && "animate-spin")} />
        </button>
      )}

      {/* 重置 */}
      <button
        onClick={onReset}
        className="rounded-lg bg-orange-100 p-2.5 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 transition-colors"
        title="重置"
      >
        <RotateCcw className="h-4 w-4" />
      </button>

      {/* 删除 */}
      <button
        onClick={onDelete}
        disabled={deleting}
        className="rounded-lg bg-red-100 p-2.5 text-red-700 hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400 transition-colors"
        title="删除"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
