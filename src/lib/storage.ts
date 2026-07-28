/**
 * 可可的工作台 - 默认值与类型常量
 *
 * 注意：本文件不再包含 localStorage 读写函数。
 * 所有数据通过 AppDataContext 在内存中维护，由 cloud-api.ts 与云端同步。
 *
 * 兼容性：仍保留 exportAll/importAll 函数，但基于外部传入的 data 进行操作。
 */
import type {
  AppAllData,
  Bookmark,
  ExamCountdownState,
  PeriodSettings,
  QuizStats,
  WaterState,
} from "./types";

// ============ 默认值 ============
/** 本地时区今日日期 */
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const DEFAULT_EXAM_COUNTDOWN: ExamCountdownState = {
  examName: "我的目标",
  icon: "🎯",
  // 默认目标日期：当前日期 + 60 天（本地时区）
  targetDate: (() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })(),
  startDate: todayISO(),
};

export const DEFAULT_QUIZ_STATS: QuizStats = {
  totalAnswered: 0,
  correctCount: 0,
  wrongQuestionIds: [],
  records: [],
};

export const DEFAULT_PERIOD_SETTINGS: PeriodSettings = {
  reminders: [
    "记得吃点羊肉暖暖身体哦~",
    "多喝热水，别着凉",
    "今天辛苦了，早点休息",
    "抱抱自己，你已经很棒了 💕",
    "记得备好卫生用品，别临时慌张",
  ],
  defaultCycle: 28,
};

export const DEFAULT_WATER_STATE: WaterState = {
  dailyGoal: 8,
  todayCount: 0,
  todayDate: todayISO(),
  history: {},
};

export const DEFAULT_BOOKMARKS: Bookmark[] = [
  {
    id: "bm-1",
    title: "百度",
    url: "https://www.baidu.com/",
    icon: "🔍",
    category: "常用网站",
  },
  {
    id: "bm-2",
    title: "知乎",
    url: "https://www.zhihu.com/",
    icon: "💬",
    category: "常用网站",
  },
  {
    id: "bm-3",
    title: "微博",
    url: "https://weibo.com/",
    icon: "📱",
    category: "常用网站",
  },
  {
    id: "bm-4",
    title: "Bilibili",
    url: "https://www.bilibili.com/",
    icon: "📺",
    category: "娱乐",
  },
  {
    id: "bm-5",
    title: "百度网盘",
    url: "https://pan.baidu.com/",
    icon: "☁️",
    category: "工具",
  },
  {
    id: "bm-6",
    title: "GitHub",
    url: "https://github.com/",
    icon: "💻",
    category: "工具",
  },
];

/** 获取完整默认数据（用于初始化） */
export function getDefaultData(): AppAllData {
  return {
    examCountdown: { ...DEFAULT_EXAM_COUNTDOWN },
    quizQuestions: [],
    quizStats: { ...DEFAULT_QUIZ_STATS },
    periodRecords: [],
    periodSettings: { ...DEFAULT_PERIOD_SETTINGS, reminders: [...DEFAULT_PERIOD_SETTINGS.reminders] },
    todos: [],
    waterState: { ...DEFAULT_WATER_STATE },
    bookmarks: [...DEFAULT_BOOKMARKS],
    studyCheckinDates: [],
    lastQuoteDate: "",
    lastQuoteIndex: 0,
  };
}

// ============ localStorage 兼容层（仅用于访问令牌 + 数据降级备份） ============
const TOKEN_KEY = "keke_access_token";

export const tokenStorage = {
  get(): string {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(TOKEN_KEY) || "";
  },
  set(token: string): void {
    if (typeof window === "undefined") return;
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  },
};

// ============ 数据导出/导入工具函数 ============
/** 将 AppAllData 序列化为可导出的 JSON 字符串 */
export function serializeAllData(data: AppAllData): string {
  return JSON.stringify(
    {
      _meta: {
        app: "可可的工作台",
        version: "v1",
        exportedAt: new Date().toISOString(),
      },
      data,
    },
    null,
    2,
  );
}

/** 解析导入的 JSON 数据 */
export function parseImportedData(json: string): Partial<AppAllData> {
  const parsed = JSON.parse(json);
  // 兼容两种格式：直接 data 或带 _meta 包装
  return (parsed.data || parsed) as Partial<AppAllData>;
}
