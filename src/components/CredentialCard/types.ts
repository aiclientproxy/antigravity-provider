/**
 * CredentialCard 组件类型定义
 */

import type { CredentialDisplay } from "@proxycast/plugin-components";

/**
 * CardHeader Props
 */
export interface CardHeaderProps {
  credential: CredentialDisplay;
  isHealthy: boolean;
}

/**
 * CardActions Props
 */
export interface CardActionsProps {
  credential: CredentialDisplay;
  isOAuth: boolean;
  checkingHealth: boolean;
  refreshingToken: boolean;
  deleting: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onCheckHealth: () => void;
  onRefreshToken: () => void;
  onReset: () => void;
  onDelete: () => void;
}

/**
 * CardStats Props
 */
export interface CardStatsProps {
  credential: CredentialDisplay;
  isOAuth: boolean;
}

/**
 * CredentialCard Props
 */
export interface CredentialCardProps {
  credential: CredentialDisplay;
  onToggle: () => void;
  onDelete: () => void;
  onReset: () => void;
  onCheckHealth: () => void;
  onRefreshToken: () => void;
  onEdit: () => void;
  deleting: boolean;
  checkingHealth: boolean;
  refreshingToken: boolean;
}
