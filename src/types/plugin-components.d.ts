/**
 * @proxycast/plugin-components 类型声明
 *
 * Antigravity Provider 插件使用的组件和工具类型
 */

declare module "@proxycast/plugin-components" {
  import type { ComponentType, ReactNode } from "react";

  // ============================================================================
  // UI 组件
  // ============================================================================

  export interface ButtonProps {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
    children?: ReactNode;
    title?: string;
  }
  export const Button: ComponentType<ButtonProps>;

  export interface CardProps {
    className?: string;
    children?: ReactNode;
  }
  export const Card: ComponentType<CardProps>;
  export const CardHeader: ComponentType<CardProps>;
  export const CardTitle: ComponentType<CardProps>;
  export const CardDescription: ComponentType<CardProps>;
  export const CardContent: ComponentType<CardProps>;
  export const CardFooter: ComponentType<CardProps>;

  export interface BadgeProps {
    variant?: "default" | "secondary" | "destructive" | "outline";
    className?: string;
    children?: ReactNode;
  }
  export const Badge: ComponentType<BadgeProps>;

  export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    maxWidth?: string;
    children?: ReactNode;
  }
  export const Modal: ComponentType<ModalProps>;

  export interface InputProps {
    type?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
  }
  export const Input: ComponentType<InputProps>;

  export interface TabsProps {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    className?: string;
    children?: ReactNode;
  }
  export const Tabs: ComponentType<TabsProps>;
  export const TabsList: ComponentType<{ className?: string; children?: ReactNode }>;
  export const TabsTrigger: ComponentType<{ value: string; className?: string; children?: ReactNode }>;
  export const TabsContent: ComponentType<{ value: string; className?: string; children?: ReactNode }>;

  // ============================================================================
  // Antigravity 专用组件
  // ============================================================================

  export interface AntigravityFormStandaloneProps {
    onSuccess: () => void;
    onCancel?: () => void;
    initialName?: string;
  }
  export const AntigravityFormStandalone: ComponentType<AntigravityFormStandaloneProps>;

  // 文件导入表单
  export interface FileImportFormProps {
    onSuccess: () => void;
    onCancel?: () => void;
    providerType: string;
    defaultPath?: string;
  }
  export const FileImportForm: ComponentType<FileImportFormProps>;

  // ============================================================================
  // 图标
  // ============================================================================

  export interface IconProps {
    className?: string;
    fill?: string;
  }

  export const Plus: ComponentType<IconProps>;
  export const Minus: ComponentType<IconProps>;
  export const Check: ComponentType<IconProps>;
  export const X: ComponentType<IconProps>;
  export const Edit: ComponentType<IconProps>;
  export const Trash2: ComponentType<IconProps>;
  export const Copy: ComponentType<IconProps>;
  export const Download: ComponentType<IconProps>;
  export const Upload: ComponentType<IconProps>;
  export const RefreshCw: ComponentType<IconProps>;
  export const Search: ComponentType<IconProps>;
  export const Settings: ComponentType<IconProps>;
  export const Settings2: ComponentType<IconProps>;
  export const RotateCcw: ComponentType<IconProps>;
  export const Loader2: ComponentType<IconProps>;
  export const AlertCircle: ComponentType<IconProps>;
  export const AlertTriangle: ComponentType<IconProps>;
  export const CheckCircle: ComponentType<IconProps>;
  export const Info: ComponentType<IconProps>;
  export const Heart: ComponentType<IconProps>;
  export const HeartOff: ComponentType<IconProps>;
  export const ChevronDown: ComponentType<IconProps>;
  export const ChevronUp: ComponentType<IconProps>;
  export const ChevronLeft: ComponentType<IconProps>;
  export const ChevronRight: ComponentType<IconProps>;
  export const ArrowLeft: ComponentType<IconProps>;
  export const ArrowRight: ComponentType<IconProps>;
  export const ExternalLink: ComponentType<IconProps>;
  export const Key: ComponentType<IconProps>;
  export const Lock: ComponentType<IconProps>;
  export const Unlock: ComponentType<IconProps>;
  export const Shield: ComponentType<IconProps>;
  export const ShieldCheck: ComponentType<IconProps>;
  export const Fingerprint: ComponentType<IconProps>;
  export const File: ComponentType<IconProps>;
  export const FileText: ComponentType<IconProps>;
  export const Folder: ComponentType<IconProps>;
  export const FolderOpen: ComponentType<IconProps>;
  export const User: ComponentType<IconProps>;
  export const Users: ComponentType<IconProps>;
  export const Star: ComponentType<IconProps>;
  export const Clock: ComponentType<IconProps>;
  export const Calendar: ComponentType<IconProps>;
  export const Activity: ComponentType<IconProps>;
  export const Zap: ComponentType<IconProps>;
  export const Power: ComponentType<IconProps>;
  export const PowerOff: ComponentType<IconProps>;
  export const Globe: ComponentType<IconProps>;
  export const LogIn: ComponentType<IconProps>;
  export const LogOut: ComponentType<IconProps>;
  export const Timer: ComponentType<IconProps>;
  export const BarChart3: ComponentType<IconProps>;
  export const MonitorDown: ComponentType<IconProps>;
  export const Sparkles: ComponentType<IconProps>;
  export const Mail: ComponentType<IconProps>;

  // ============================================================================
  // 工具函数
  // ============================================================================

  export function cn(...inputs: (string | undefined | null | boolean)[]): string;

  export const toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
  };

  // ============================================================================
  // 类型定义
  // ============================================================================

  export interface CredentialInfo {
    id: string;
    displayName?: string;
    status: "active" | "inactive" | "expired" | "error";
    usageCount?: number;
    errorCount?: number;
    lastUsedAt?: string;
    expireAt?: string;
    createdAt?: string;
    metadata?: Record<string, unknown>;
  }

  export interface PluginSDK {
    credential: {
      list: () => Promise<CredentialInfo[]>;
      get: (id: string) => Promise<CredentialInfo | null>;
      add: (data: Record<string, unknown>) => Promise<CredentialInfo>;
      update: (id: string, data: Record<string, unknown>) => Promise<CredentialInfo>;
      delete: (id: string) => Promise<void>;
      refresh: (id: string) => Promise<void>;
      validate: (id: string) => Promise<{ valid: boolean; message?: string }>;
    };
    config: {
      get: <T = unknown>(key: string) => Promise<T | null>;
      set: <T = unknown>(key: string, value: T) => Promise<void>;
      getAll: () => Promise<Record<string, unknown>>;
    };
    notify: {
      success: (message: string) => void;
      error: (message: string) => void;
      info: (message: string) => void;
      warning: (message: string) => void;
    };
  }

  // ============================================================================
  // Provider Pool API
  // ============================================================================

  export type PoolProviderType =
    | "kiro"
    | "gemini"
    | "qwen"
    | "antigravity"
    | "openai"
    | "claude"
    | "codex"
    | "claude_oauth"
    | "iflow"
    | "gemini_api_key";

  export type CredentialSource = "manual" | "imported" | "private";

  export interface TokenCacheStatus {
    is_valid: boolean;
    is_expiring_soon: boolean;
    expiry_time?: string;
  }

  export interface CredentialDisplay {
    uuid: string;
    provider_type: PoolProviderType;
    credential_type: string;
    name?: string;
    is_healthy: boolean;
    is_disabled: boolean;
    usage_count: number;
    error_count: number;
    last_used?: string;
    last_error_message?: string;
    last_health_check_time?: string;
    source?: CredentialSource;
    proxy_url?: string;
    token_cache_status?: TokenCacheStatus;
    check_health: boolean;
    check_model_name?: string;
    not_supported_models?: string[];
    display_credential: string;
    base_url?: string;
    api_key?: string;
  }

  export interface ProviderCredential {
    uuid: string;
    provider_type: PoolProviderType;
    name?: string;
    is_healthy: boolean;
    is_disabled: boolean;
  }

  export interface HealthCheckResult {
    uuid: string;
    success: boolean;
    model?: string;
    message?: string;
    duration_ms: number;
  }

  export const providerPoolApi: {
    getCredentials: (providerType: PoolProviderType) => Promise<CredentialDisplay[]>;
    deleteCredential: (uuid: string, providerType?: PoolProviderType) => Promise<boolean>;
    toggleCredential: (uuid: string, isDisabled: boolean) => Promise<ProviderCredential>;
    resetCredential: (uuid: string) => Promise<void>;
    refreshCredentialToken: (uuid: string) => Promise<string>;
    checkCredentialHealth: (uuid: string) => Promise<HealthCheckResult>;
    updateCredential: (uuid: string, request: UpdateCredentialRequest) => Promise<ProviderCredential>;
  };

  // ============================================================================
  // 更新凭证请求
  // ============================================================================

  export interface UpdateCredentialRequest {
    name?: string;
    is_disabled?: boolean;
    check_health?: boolean;
    check_model_name?: string;
    not_supported_models?: string[];
    new_creds_file_path?: string;
    new_project_id?: string;
    new_base_url?: string;
    new_api_key?: string;
    new_proxy_url?: string;
  }

  // ============================================================================
  // 编辑凭证模态框
  // ============================================================================

  export interface EditCredentialModalProps {
    credential: CredentialDisplay | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: (uuid: string, request: UpdateCredentialRequest) => Promise<void>;
  }
  export const EditCredentialModal: ComponentType<EditCredentialModalProps>;
}
