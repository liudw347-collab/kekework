/**
 * 可可的工作台 - 本地存储工具
 * 基于 localStorage 的数据持久化，带默认值与版本管理
 */
import type {
  AppAllData,
  Bookmark,
  ExamCountdownState,
  PeriodRecord,
  PeriodSettings,
  Question,
  QuizStats,
  TodoItem,
  WaterState,
} from "./types";

const STORAGE_PREFIX = "keke_workbench_";
const DATA_VERSION = "v1";

// 各模块的存储 key
const KEYS = {
  examCountdown: `${STORAGE_PREFIX}exam_countdown_${DATA_VERSION}`,
  quizQuestions: `${STORAGE_PREFIX}quiz_questions_${DATA_VERSION}`,
  quizStats: `${STORAGE_PREFIX}quiz_stats_${DATA_VERSION}`,
  periodRecords: `${STORAGE_PREFIX}period_records_${DATA_VERSION}`,
  periodSettings: `${STORAGE_PREFIX}period_settings_${DATA_VERSION}`,
  todos: `${STORAGE_PREFIX}todos_${DATA_VERSION}`,
  waterState: `${STORAGE_PREFIX}water_state_${DATA_VERSION}`,
  bookmarks: `${STORAGE_PREFIX}bookmarks_${DATA_VERSION}`,
  studyCheckin: `${STORAGE_PREFIX}study_checkin_${DATA_VERSION}`,
  quoteState: `${STORAGE_PREFIX}quote_state_${DATA_VERSION}`,
} as const;

// ============ 通用读取/写入 ============
function read<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("写入 localStorage 失败：", e);
  }
}

// ============ 默认值 ============
const todayISO = () => new Date().toISOString().slice(0, 10);

export const DEFAULT_EXAM_COUNTDOWN: ExamCountdownState = {
  examName: "河北教师编考试",
  // 默认目标日期：当前日期 + 60 天
  targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10),
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
    title: "河北省教育厅",
    url: "http://jyt.hebei.gov.cn/",
    icon: "🏫",
    category: "官方机构",
  },
  {
    id: "bm-2",
    title: "河北人事考试网",
    url: "https://www.hebpta.com.cn/",
    icon: "📋",
    category: "考试信息",
  },
  {
    id: "bm-3",
    title: "中国教育考试网",
    url: "http://www.neea.edu.cn/",
    icon: "📚",
    category: "考试信息",
  },
  {
    id: "bm-4",
    title: "国家中小学智慧教育平台",
    url: "https://www.zxx.edu.cn/",
    icon: "💻",
    category: "备考资料",
  },
  {
    id: "bm-5",
    title: "学习强国",
    url: "https://www.xuexi.cn/",
    icon: "⭐",
    category: "备考资料",
  },
  {
    id: "bm-6",
    title: "百度网盘",
    url: "https://pan.baidu.com/",
    icon: "☁️",
    category: "常用工具",
  },
];

// ============ 各模块 API ============
export const storage = {
  // 备考倒计时
  getExamCountdown: () => read(KEYS.examCountdown, DEFAULT_EXAM_COUNTDOWN),
  setExamCountdown: (v: ExamCountdownState) => write(KEYS.examCountdown, v),

  // 刷题 - 题库
  getQuizQuestions: () => read<Question[]>(KEYS.quizQuestions, []),
  setQuizQuestions: (v: Question[]) => write(KEYS.quizQuestions, v),

  // 刷题 - 统计
  getQuizStats: () => read(KEYS.quizStats, DEFAULT_QUIZ_STATS),
  setQuizStats: (v: QuizStats) => write(KEYS.quizStats, v),

  // 经期记录
  getPeriodRecords: () => read<PeriodRecord[]>(KEYS.periodRecords, []),
  setPeriodRecords: (v: PeriodRecord[]) => write(KEYS.periodRecords, v),

  // 经期设置
  getPeriodSettings: () => read(KEYS.periodSettings, DEFAULT_PERIOD_SETTINGS),
  setPeriodSettings: (v: PeriodSettings) => write(KEYS.periodSettings, v),

  // 待办
  getTodos: () => read<TodoItem[]>(KEYS.todos, []),
  setTodos: (v: TodoItem[]) => write(KEYS.todos, v),

  // 喝水
  getWaterState: () => read(KEYS.waterState, DEFAULT_WATER_STATE),
  setWaterState: (v: WaterState) => write(KEYS.waterState, v),

  // 书签
  getBookmarks: () => read(KEYS.bookmarks, DEFAULT_BOOKMARKS),
  setBookmarks: (v: Bookmark[]) => write(KEYS.bookmarks, v),

  // 学习打卡
  getStudyCheckin: () => read<string[]>(KEYS.studyCheckin, []),
  setStudyCheckin: (v: string[]) => write(KEYS.studyCheckin, v),

  // 每日一言
  getQuoteState: () =>
    read<{ date: string; index: number }>(KEYS.quoteState, {
      date: "",
      index: 0,
    }),
  setQuoteState: (v: { date: string; index: number }) =>
    write(KEYS.quoteState, v),

  // ============ 导出 / 导入 全部数据 ============
  exportAll: (): AppAllData => {
    const todayCheckin = storage.getStudyCheckin();
    const quoteState = storage.getQuoteState();
    return {
      examCountdown: storage.getExamCountdown(),
      quizQuestions: storage.getQuizQuestions(),
      quizStats: storage.getQuizStats(),
      periodRecords: storage.getPeriodRecords(),
      periodSettings: storage.getPeriodSettings(),
      todos: storage.getTodos(),
      waterState: storage.getWaterState(),
      bookmarks: storage.getBookmarks(),
      studyCheckinDates: todayCheckin,
      lastQuoteDate: quoteState.date,
      lastQuoteIndex: quoteState.index,
    };
  },

  importAll: (data: Partial<AppAllData>): void => {
    if (data.examCountdown) storage.setExamCountdown(data.examCountdown);
    if (data.quizQuestions) storage.setQuizQuestions(data.quizQuestions);
    if (data.quizStats) storage.setQuizStats(data.quizStats);
    if (data.periodRecords) storage.setPeriodRecords(data.periodRecords);
    if (data.periodSettings) storage.setPeriodSettings(data.periodSettings);
    if (data.todos) storage.setTodos(data.todos);
    if (data.waterState) storage.setWaterState(data.waterState);
    if (data.bookmarks) storage.setBookmarks(data.bookmarks);
    if (data.studyCheckinDates) storage.setStudyCheckin(data.studyCheckinDates);
    if (data.lastQuoteDate !== undefined || data.lastQuoteIndex !== undefined) {
      const current = storage.getQuoteState();
      storage.setQuoteState({
        date: data.lastQuoteDate ?? current.date,
        index: data.lastQuoteIndex ?? current.index,
      });
    }
  },

  clearAll: (): void => {
    Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
  },
};
