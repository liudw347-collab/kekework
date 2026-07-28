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
 * 这里集中管理，避免在组件渲染时触发副作用
 */
const SAMPLE_QUESTIONS: Question[] = [
  {
    id: "q-sample-1",
    type: "single",
    category: "教育学",
    stem: "“学而不思则罔，思而不学则殆”出自哪部典籍？",
    options: ["《大学》", "《论语》", "《中庸》", "《孟子》"],
    answer: 1,
    analysis: "此句出自《论语·为政》，强调学思结合的重要性。",
  },
  {
    id: "q-sample-2",
    type: "judge",
    category: "心理学",
    stem: "皮亚杰认为儿童认知发展经历了四个阶段，其中前运算阶段的儿童已具备守恒概念。",
    options: ["正确", "错误"],
    answer: 1,
    analysis:
      "错误。前运算阶段（2-7岁）的儿童尚未具备守恒概念，具体运算阶段（7-11岁）才逐步形成。",
  },
  {
    id: "q-sample-3",
    type: "multiple",
    category: "教育学",
    stem: "下列属于建构主义学习理论核心观点的有？",
    options: [
      "知识是客观的、确定的",
      "学习是学习者主动建构意义的过程",
      "教学是教师传递知识的过程",
      "学习应处于真实情境中",
    ],
    answer: [1, 3],
    analysis:
      "建构主义认为知识不是客观确定的，而是学习者主动建构的；学习应在真实情境中发生。",
  },
  {
    id: "q-sample-4",
    type: "single",
    category: "教育法规",
    stem: "《中华人民共和国义务教育法》规定，义务教育阶段免收的是？",
    options: ["学费", "杂费", "学费和杂费", "书本费"],
    answer: 2,
    analysis:
      "《义务教育法》第二条规定：国家实施义务教育，不收学费、杂费。",
  },
  {
    id: "q-sample-5",
    type: "judge",
    category: "心理学",
    stem: "动机强度与学习效率之间呈线性关系，动机越强效率越高。",
    options: ["正确", "错误"],
    answer: 1,
    analysis:
      "错误。根据耶克斯-多德森定律，动机强度与学习效率呈倒U型曲线，中等强度的动机最有利于学习。",
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
