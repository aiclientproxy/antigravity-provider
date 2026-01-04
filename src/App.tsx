/**
 * Antigravity Provider 插件主入口
 *
 * 使用主应用的组件库实现完整的 Antigravity 凭证管理功能
 */

import React, { useState, useCallback } from "react";
import {
  // UI 组件
  Button,
  Modal,
  // Antigravity 专用组件
  AntigravityFormStandalone,
  EditCredentialModal,
  // 图标
  Plus,
  RefreshCw,
  Zap,
  Loader2,
  AlertCircle,
  Sparkles,
  // 工具
  toast,
  // Provider Pool API
  providerPoolApi,
  type CredentialDisplay,
  type UpdateCredentialRequest,
  // 类型
  type PluginSDK,
} from "@proxycast/plugin-components";
import { CredentialCard } from "./components/CredentialCard";

/**
 * 插件组件 Props
 */
interface AntigravityProviderAppProps {
  sdk: PluginSDK;
  pluginId: string;
}

/**
 * Antigravity Provider 插件主组件
 */
export function AntigravityProviderApp(_props: AntigravityProviderAppProps) {
  const [credentials, setCredentials] = useState<CredentialDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [validatingAll, setValidatingAll] = useState(false);

  // 编辑状态
  const [editingCredential, setEditingCredential] = useState<CredentialDisplay | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 操作状态 - 按凭证 UUID 跟踪
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [checkingHealthIds, setCheckingHealthIds] = useState<Set<string>>(new Set());
  const [refreshingTokenIds, setRefreshingTokenIds] = useState<Set<string>>(new Set());

  // 加载凭证列表
  const loadCredentials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await providerPoolApi.getCredentials("antigravity");
      setCredentials(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载凭证失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载
  React.useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  // 添加凭证成功回调
  const handleAddSuccess = useCallback(() => {
    setIsAddModalOpen(false);
    loadCredentials();
    toast.success("凭证添加成功");
  }, [loadCredentials]);

  // 删除凭证
  const handleDelete = useCallback(
    async (uuid: string) => {
      if (!confirm("确定要删除这个凭证吗？")) return;
      try {
        setDeletingIds((prev) => new Set(prev).add(uuid));
        await providerPoolApi.deleteCredential(uuid, "antigravity");
        toast.success("凭证已删除");
        loadCredentials();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "删除失败");
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(uuid);
          return next;
        });
      }
    },
    [loadCredentials]
  );

  // 切换启用/禁用
  const handleToggle = useCallback(
    async (uuid: string, isDisabled: boolean) => {
      try {
        await providerPoolApi.toggleCredential(uuid, !isDisabled);
        toast.success(isDisabled ? "凭证已启用" : "凭证已禁用");
        loadCredentials();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "操作失败");
      }
    },
    [loadCredentials]
  );

  // 重置凭证
  const handleReset = useCallback(
    async (uuid: string) => {
      try {
        await providerPoolApi.resetCredential(uuid);
        toast.success("凭证已重置");
        loadCredentials();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "重置失败");
      }
    },
    [loadCredentials]
  );

  // 检测健康
  const handleCheckHealth = useCallback(
    async (uuid: string) => {
      try {
        setCheckingHealthIds((prev) => new Set(prev).add(uuid));
        const result = await providerPoolApi.checkCredentialHealth(uuid);
        if (result.success) {
          toast.success("凭证验证通过");
        } else {
          toast.error(result.message || "凭证验证失败");
        }
        loadCredentials();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "验证失败");
      } finally {
        setCheckingHealthIds((prev) => {
          const next = new Set(prev);
          next.delete(uuid);
          return next;
        });
      }
    },
    [loadCredentials]
  );

  // 刷新 Token
  const handleRefreshToken = useCallback(
    async (uuid: string) => {
      try {
        setRefreshingTokenIds((prev) => new Set(prev).add(uuid));
        await providerPoolApi.refreshCredentialToken(uuid);
        toast.success("Token 刷新成功");
        loadCredentials();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "刷新失败");
      } finally {
        setRefreshingTokenIds((prev) => {
          const next = new Set(prev);
          next.delete(uuid);
          return next;
        });
      }
    },
    [loadCredentials]
  );

  // 编辑凭证
  const handleEdit = useCallback((credential: CredentialDisplay) => {
    setEditingCredential(credential);
    setIsEditModalOpen(true);
  }, []);

  // 编辑凭证提交
  const handleEditSubmit = useCallback(
    async (uuid: string, request: UpdateCredentialRequest) => {
      try {
        await providerPoolApi.updateCredential(uuid, request);
        toast.success("凭证已更新");
        loadCredentials();
      } catch (e) {
        throw new Error(
          `编辑失败: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    },
    [loadCredentials]
  );

  // 关闭编辑模态框
  const handleEditClose = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingCredential(null);
  }, []);

  // 刷新所有
  const handleRefreshAll = useCallback(async () => {
    setRefreshingAll(true);
    try {
      for (const cred of credentials) {
        await providerPoolApi.refreshCredentialToken(cred.uuid);
      }
      toast.success("所有凭证已刷新");
      loadCredentials();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "刷新失败");
    } finally {
      setRefreshingAll(false);
    }
  }, [credentials, loadCredentials]);

  // 验证所有
  const handleValidateAll = useCallback(async () => {
    setValidatingAll(true);
    try {
      let validCount = 0;
      let invalidCount = 0;
      for (const cred of credentials) {
        const result = await providerPoolApi.checkCredentialHealth(cred.uuid);
        if (result.success) validCount++;
        else invalidCount++;
      }
      toast.info(`验证完成: ${validCount} 个有效, ${invalidCount} 个无效`);
      loadCredentials();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "验证失败");
    } finally {
      setValidatingAll(false);
    }
  }, [credentials, loadCredentials]);

  // 加载中
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">加载凭证...</span>
      </div>
    );
  }

  // 错误
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="outline" onClick={loadCredentials}>
          <RefreshCw className="h-4 w-4 mr-2" />
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold">Antigravity 凭证管理</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleValidateAll}
            disabled={validatingAll || credentials.length === 0}
          >
            {validatingAll ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-1" />
            )}
            检测全部
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={refreshingAll || credentials.length === 0}
          >
            {refreshingAll ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            刷新全部
          </Button>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            添加凭证
          </Button>
        </div>
      </div>

      {/* 动态协议说明 */}
      <div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-950/30 dark:to-pink-950/30 p-4">
        <p className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-2">
          动态协议选择
        </p>
        <ul className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
          <li>• <strong>gemini-*</strong> 模型 → Gemini 协议输出</li>
          <li>• <strong>claude-*</strong> 模型 → Anthropic 协议输出</li>
        </ul>
      </div>

      {/* 凭证列表 */}
      {credentials.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl text-muted-foreground">
          <Sparkles className="h-12 w-12 mb-4 opacity-50 text-purple-400" />
          <p className="text-lg font-medium mb-1">暂无凭证</p>
          <p className="text-sm mb-4">点击"添加凭证"开始配置</p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            添加第一个凭证
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {credentials.map((credential) => (
            <CredentialCard
              key={credential.uuid}
              credential={credential}
              onToggle={() => handleToggle(credential.uuid, credential.is_disabled)}
              onDelete={() => handleDelete(credential.uuid)}
              onReset={() => handleReset(credential.uuid)}
              onCheckHealth={() => handleCheckHealth(credential.uuid)}
              onRefreshToken={() => handleRefreshToken(credential.uuid)}
              onEdit={() => handleEdit(credential)}
              deleting={deletingIds.has(credential.uuid)}
              checkingHealth={checkingHealthIds.has(credential.uuid)}
              refreshingToken={refreshingTokenIds.has(credential.uuid)}
            />
          ))}
        </div>
      )}

      {/* 添加凭证模态框 */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} maxWidth="max-w-lg">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            添加 Antigravity 凭证
          </h3>
          <AntigravityFormStandalone
            onSuccess={handleAddSuccess}
            onCancel={() => setIsAddModalOpen(false)}
          />
        </div>
      </Modal>

      {/* 编辑凭证模态框 */}
      <EditCredentialModal
        credential={editingCredential}
        isOpen={isEditModalOpen}
        onClose={handleEditClose}
        onEdit={handleEditSubmit}
      />
    </div>
  );
}

export default AntigravityProviderApp;
