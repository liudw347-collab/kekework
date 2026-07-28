"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AppAllData } from "@/lib/types";
import { getDefaultData } from "@/lib/storage";
import {
  fetchAllFromCloud,
  saveToCloud,
  saveAllToCloud,
  clearAllFromCloud,
  hasAccessToken,
} from "@/lib/cloud-api";

/**
 * AppData 上下文
 *
 * 提供全局数据 + 同步方法：
 * - data: 内存中的所有数据（已与云端合并默认值）
 * - loading: 首次加载中
 * - error: 错误信息（未授权、网络错误等）
 * - needToken: 是否需要输入访问令牌
 * - update(key, value): 更新某项数据（同时更新内存 + 推送到云端）
 * - reload(): 重新从云端拉取
 * - importAll(data): 批量导入（覆盖式）
 * - clearAll(): 清空所有数据
 */

interface AppDataContextValue {
  data: AppAllData;
  loading: boolean;
  error: Error | null;
  needToken: boolean;
  /** 更新某项数据，乐观更新 + 异步推送云端 */
  update: <K extends keyof AppAllData>(
    key: K,
    value: AppAllData[K],
  ) => Promise<void>;
  /** 重新从云端拉取 */
  reload: () => Promise<void>;
  /** 批量导入数据（覆盖式） */
  importAll: (data: Partial<AppAllData>) => Promise<void>;
  /** 清空所有数据 */
  clearAll: () => Promise<void>;
  /** 导出全部数据 */
  exportAll: () => AppAllData;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData 必须在 <AppDataProvider> 内部使用");
  }
  return ctx;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppAllData>(() => getDefaultData());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [needToken, setNeedToken] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cloudData = await fetchAllFromCloud();
      // 合并默认值与云端数据
      const merged = { ...getDefaultData(), ...cloudData };
      setData(merged);
      setNeedToken(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "UNAUTHORIZED") {
        setNeedToken(true);
        setError(new Error("访问令牌无效，请重新输入"));
      } else {
        setError(e as Error);
        // 网络错误时仍然显示默认数据，让用户可继续使用
        setNeedToken(!hasAccessToken());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const update = useCallback(
    async <K extends keyof AppAllData>(
      key: K,
      value: AppAllData[K],
    ) => {
      // 乐观更新：立即更新内存
      setData((prev) => ({ ...prev, [key]: value }));
      // 异步推送云端
      try {
        await saveToCloud(key, value);
        setError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg === "UNAUTHORIZED") {
          setNeedToken(true);
          setError(new Error("访问令牌无效，请重新输入"));
        } else {
          setError(e as Error);
        }
      }
    },
    [],
  );

  const importAll = useCallback(async (newData: Partial<AppAllData>) => {
    setData((prev) => ({ ...prev, ...newData }));
    try {
      await saveAllToCloud(newData);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "UNAUTHORIZED") {
        setNeedToken(true);
        setError(new Error("访问令牌无效"));
      } else {
        setError(e as Error);
      }
    }
  }, []);

  const clearAll = useCallback(async () => {
    const empty = getDefaultData();
    setData(empty);
    try {
      await clearAllFromCloud();
      setError(null);
    } catch (e) {
      setError(e as Error);
    }
  }, []);

  const exportAll = useCallback(() => data, [data]);

  const value: AppDataContextValue = {
    data,
    loading,
    error,
    needToken,
    update,
    reload,
    importAll,
    clearAll,
    exportAll,
  };

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}
