/**
 * 可可的工作台 - 类型定义
 * 统一管理所有数据模块的类型
 */

// ============ 备考倒计时 ============
export interface ExamCountdownState {
  /** 目标考试日期 YYYY-MM-DD */
  targetDate: string;
  /** 开始备考日期 YYYY-MM-DD，用于计算坚持天数 */
  startDate: string;
  /** 考试名称 */
  examName: string;
}

// ============ 刷题模块 ============
export type QuestionType = "single" | "multiple" | "judge";

export interface Question {
  id: string;
  type: QuestionType;
  /** 知识点分类 */
  category: string;
  /** 题干 */
  stem: string;
  /** 选项（判断题为 ["正确", "错误"]） */
  options: string[];
  /** 正确答案：单选为索引 number，多选为索引数组 number[]，判断为 0/1 */
  answer: number | number[];
  /** 解析 */
  analysis: string;
}

export interface QuizRecord {
  /** 题目 id */
  questionId: string;
  /** 是否答对 */
  correct: boolean;
  /** 用户选择 */
  userAnswer: number | number[];
  /** 答题时间 ISO */
  answeredAt: string;
}

export interface QuizStats {
  totalAnswered: number;
  correctCount: number;
  wrongQuestionIds: string[];
  records: QuizRecord[];
}

// ============ 经期记录 ============
export interface PeriodRecord {
  /** 经期开始日期 YYYY-MM-DD */
  startDate: string;
  /** 持续天数（默认 5） */
  duration: number;
  /** 备注 */
  note?: string;
}

export interface PeriodSettings {
  /** 自定义提醒文案 */
  reminders: string[];
  /** 默认周期天数 */
  defaultCycle: number;
}

// ============ 待办清单 ============
export type TodoCategory = "work" | "study" | "life";

export interface TodoItem {
  id: string;
  content: string;
  category: TodoCategory;
  completed: boolean;
  createdAt: string;
  /** 截止日期 YYYY-MM-DD（可选） */
  dueDate?: string;
}

// ============ 喝水提醒 ============
export interface WaterState {
  /** 每日目标杯数 */
  dailyGoal: number;
  /** 今日已喝杯数 */
  todayCount: number;
  /** 今日日期 YYYY-MM-DD，用于判断是否重置 */
  todayDate: string;
  /** 历史记录（最近 30 天） */
  history: Record<string, number>;
}

// ============ 快捷导航 ============
export interface Bookmark {
  id: string;
  title: string;
  url: string;
  icon?: string;
  category: string;
}

// ============ 工具箱 ============
export interface ToolItem {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  color: string;
}

// ============ 全部数据 ============
export interface AppAllData {
  examCountdown: ExamCountdownState;
  quizQuestions: Question[];
  quizStats: QuizStats;
  periodRecords: PeriodRecord[];
  periodSettings: PeriodSettings;
  todos: TodoItem[];
  waterState: WaterState;
  bookmarks: Bookmark[];
  /** 学习打卡记录日期数组 YYYY-MM-DD */
  studyCheckinDates: string[];
  /** 上次显示的每日一言日期 */
  lastQuoteDate: string;
  /** 上次显示的每日一言索引 */
  lastQuoteIndex: number;
}
