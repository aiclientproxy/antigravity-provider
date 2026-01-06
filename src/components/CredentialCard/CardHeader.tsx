/**
 * CardHeader 组件
 * 显示凭证状态图标、名称和标签
 */

import {
  Heart,
  HeartOff,
  PowerOff,
  User,
  Upload,
  Lock,
  Globe,
  Sparkles,
  cn,
} from "@proxycast/plugin-components";
import type { CardHeaderProps } from "./types";

interface SourceConfig {
  text: string;
  color: string;
}

/**
 * 获取凭证类型标签
 */
function getCredentialTypeLabel(type: string | undefined): string {
  if (!type) return "未知";
  const labels: Record<string, string> = {
    antigravity_oauth: "Google OAuth",
    kiro_oauth: "OAuth",
    gemini_oauth: "OAuth",
    qwen_oauth: "OAuth",
    openai_key: "API Key",
    claude_key: "API Key",
  };
  return labels[type] || type;
}

/**
 * 获取来源标签配置
 */
function getSourceConfig(source: string | undefined): SourceConfig {
  const configs: Record<string, SourceConfig> = {
    manual: {
      text: "手动添加",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    imported: {
      text: "导入",
      color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    private: {
      text: "私有",
      color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
    local: {
      text: "本地",
      color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    },
    remote: {
      text: "远程",
      color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    },
  };
  return configs[source || "manual"] || configs.manual;
}

/**
 * 获取来源图标
 */
function getSourceIcon(source: string | undefined) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    manual: User,
    imported: Upload,
    private: Lock,
    local: User,
    remote: Globe,
  };
  return icons[source || "manual"] || User;
}

export function CardHeader({ credential, isHealthy }: CardHeaderProps) {
  const sourceConfig = getSourceConfig(credential.source || "manual");
  const SourceIcon = getSourceIcon(credential.source || "manual");

  return (
    <div className="flex items-center gap-4">
      {/* 状态图标 */}
      <div
        className={cn(
          "shrink-0 rounded-full p-3",
          credential.is_disabled
            ? "bg-gray-100 dark:bg-gray-800"
            : isHealthy
              ? "bg-green-100 dark:bg-green-900/30"
              : "bg-red-100 dark:bg-red-900/30"
        )}
      >
        {credential.is_disabled ? (
          <PowerOff className="h-6 w-6 text-gray-400" />
        ) : isHealthy ? (
          <Heart className="h-6 w-6 text-green-600 dark:text-green-400" />
        ) : (
          <HeartOff className="h-6 w-6 text-red-600 dark:text-red-400" />
        )}
      </div>

      {/* 名称和标签 */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-lg truncate">
          {credential.name || `凭证 #${credential.uuid.slice(0, 8)}`}
        </h4>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          {/* Antigravity 标识 */}
          <span className="rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-2.5 py-1 text-xs font-medium text-purple-700 dark:text-purple-400 inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Antigravity
          </span>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            {getCredentialTypeLabel(credential.credential_type)}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap",
              sourceConfig.color
            )}
          >
            <SourceIcon className="h-3 w-3 shrink-0" />
            {sourceConfig.text}
          </span>
          {credential.proxy_url && (
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
              title={`代理: ${credential.proxy_url}`}
            >
              <Globe className="h-3 w-3 shrink-0" />
              代理
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
