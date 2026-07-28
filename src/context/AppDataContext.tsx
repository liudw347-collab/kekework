"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppAllData, Question } from "@/lib/types";
import { getDefaultData } from "@/lib/storage";
import {
  fetchAllFromCloud,
  saveToCloud,
  saveAllToCloud,
  clearAllFromCloud,
  hasAccessToken,
} from "@/lib/cloud-api";

/**
 * 示例题库 - 仅在云端题库为空且用户从未导入过时使用
 * 通用知识题，不绑定特定考试方向
 */
const SAMPLE_QUESTIONS: Question[] = [
  {
    id: "q-sample-1",
    type: "single",
    category: "文学",
    stem: "“学而不思则罔，思而不学则殆”出自哪部典籍？",
    options: ["《大学》", "《论语》", "《中庸》", "《孟子》"],
    answer: 1,
    analysis: "此句出自《论语·为政》，强调学思结合的重要性。",
  },
  {
    id: "q-sample-2",
    type: "judge",
    category: "常识",
    stem: "地球是太阳系中距离太阳最近的行星。",
    options: ["正确", "错误"],
    answer: 1,
    analysis:
      "错误。距离太阳最近的行星是水星，地球是第三近的行星。",
  },
  {
    id: "q-sample-3",
    type: "multiple",
    category: "健康",
    stem: "下列哪些是保持健康的好习惯？",
    options: [
      "每天喝足够的水",
      "熬夜学习到凌晨",
      "规律运动",
      "多吃蔬菜水果",
    ],
    answer: [0, 2, 3],
    analysis:
      "充足饮水、规律运动、均衡饮食都是健康习惯；熬夜会损害身体，不应提倡。",
  },
  {
    id: "q-sample-4",
    type: "single",
    category: "历史",
    stem: "中国古代四大发明不包括以下哪一项？",
    options: ["造纸术", "印刷术", "蒸汽机", "火药"],
    answer: 2,
    analysis:
      "中国古代四大发明是造纸术、印刷术、火药、指南针。蒸汽机是工业革命时期瓦特改良的。",
  },
  {
    id: "q-sample-5",
    type: "judge",
    category: "常识",
    stem: "动机强度越高，工作效率就越高。",
    options: ["正确", "错误"],
    answer: 1,
    analysis:
      "错误。根据耶克斯-多德森定律，动机强度与效率呈倒U型曲线，中等强度的动机最有利于工作。",
  },
];

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

  // 请求队列：防止同一 key 的并发写入产生竞态
  // 每个 key 维护一个正在进行的 PUT 请求 Promise
  const pendingWrites = useRef<Map<keyof AppAllData, Promise<void>>>(new Map());

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cloudData = await fetchAllFromCloud();
      // 合并默认值与云端数据
      const merged: AppAllData = { ...getDefaultData(), ...cloudData };

      // 首次使用：如果云端没有题库，初始化示例题库
      // 注意：只在 cloudData 中确实没有 quizQuestions 字段时才初始化
      // （而不是 quizQuestions 为空数组时，避免覆盖用户主动清空的操作）
      if (cloudData.quizQuestions === undefined) {
        merged.quizQuestions = SAMPLE_QUESTIONS;
        // 异步推送到云端，不阻塞 UI
        void saveToCloud("quizQuestions", SAMPLE_QUESTIONS).catch((e) => {
          console.warn("初始化示例题库失败：", e);
        });
      }

      setData(merged);
      setNeedToken(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "UNAUTHORIZED") {
        setNeedToken(true);
        setError(new Error("访问令牌无效，请重新输入"));
        // 重新抛出，让调用方（如 TokenDialog）能感知失败
        throw e;
      } else {
        setError(e as Error);
        // 网络错误时仍然显示默认数据，让用户可继续使用
        setNeedToken(!hasAccessToken());
        // 网络错误不抛出，让 TokenDialog 不会因网络问题而显示"令牌无效"
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // reload 内部已处理错误（设置 error 状态），
    // 这里 catch 是为了消除 "Unhandled Promise Rejection" 警告
    void reload().catch(() => {});
  }, [reload]);

  /**
   * 更新某项数据
   * - 乐观更新：立即更新内存
   * - 串行化云端写入：同一 key 的写入会排队执行，避免竞态
   */
  const update = useCallback(
    async <K extends keyof AppAllData>(
      key: K,
      value: AppAllData[K],
    ) => {
      // 乐观更新：立即更新内存
      setData((prev) => ({ ...prev, [key]: value }));

      // 串行化云端写入：等待该 key 上一个请求完成后再发起新请求
      const previous = pendingWrites.current.get(key) || Promise.resolve();
      const next = previous.then(async () => {
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
      });
      pendingWrites.current.set(key, next);
      // 完成后清理引用
      next.finally(() => {
        if (pendingWrites.current.get(key) === next) {
          pendingWrites.current.delete(key);
        }
      });
      return next;
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
