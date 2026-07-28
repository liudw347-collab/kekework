"use client";

import {
  CalendarClock,
  BookOpen,
  Flower2,
  Wrench,
  CheckSquare,
  Droplets,
  Sparkles,
  Calendar,
  Compass,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { daysBetween, todayISO, formatChineseDate, cn } from "@/lib/utils";
import { useAppData } from "@/context/AppDataContext";
import { DailyQuoteCard } from "./DailyQuoteCard";

interface HomeDashboardProps {
  onOpenModule: (
    m:
      | "countdown"
      | "quiz"
      | "period"
      | "toolbox"
      | "todo"
      | "water"
      | "quote"
      | "calendar"
      | "nav"
      | "profile",
  ) => void;
}

interface ModuleCard {
  key: string;
  title: string;
  emoji: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
  badge?: string;
}

export function HomeDashboard({ onOpenModule }: HomeDashboardProps) {
  const { data, update } = useAppData();

  const summary = useMemo(() => {
    const today = todayISO();
    const cd = daysBetween(today, data.examCountdown.targetDate);
    const studyDays = data.studyCheckinDates.length;
    const accuracy =
      data.quizStats.totalAnswered > 0
        ? Math.round(
            (data.quizStats.correctCount / data.quizStats.totalAnswered) * 100,
          )
        : 0;

    let periodNext = "";
    let periodInDays = 0;
    let inPeriod = false;
    if (data.periodRecords.length > 0) {
      const sorted = [...data.periodRecords].sort((a, b) =>
        a.startDate < b.startDate ? -1 : 1,
      );
      const last = sorted[sorted.length - 1];
      const next = new Date(last.startDate + "T00:00:00");
      next.setDate(next.getDate() + data.periodSettings.defaultCycle);
      periodNext = next.toISOString().slice(0, 10);
      periodInDays = daysBetween(today, periodNext);

      // 判断是否在经期内
      const lastEnd = new Date(last.startDate + "T00:00:00");
      lastEnd.setDate(lastEnd.getDate() + last.duration);
      inPeriod = today >= last.startDate && today < lastEnd.toISOString().slice(0, 10);
    }

    const todoPending = data.todos.filter((t) => !t.completed).length;
    const todayCount =
      data.waterState.todayDate === today ? data.waterState.todayCount : 0;

    return {
      countdown: cd,
      studyDays,
      quizCount: data.quizStats.totalAnswered,
      quizAccuracy: accuracy,
      periodNext,
      periodInDays,
      inPeriod,
      todoPending,
      waterToday: todayCount,
      waterGoal: data.waterState.dailyGoal,
    };
  }, [data]);

  const cards: ModuleCard[] = [
    {
      key: "countdown",
      title: "备考倒计时",
      emoji: "📚",
      desc: "距考试还有",
      icon: CalendarClock,
      color: "bg-primary/15",
      onClick: () => onOpenModule("countdown"),
      badge: `${summary.countdown} 天`,
    },
    {
      key: "quiz",
      title: "刷题练习",
      emoji: "📝",
      desc: `已做 ${summary.quizCount} 题 · 正确率 ${summary.quizAccuracy}%`,
      icon: BookOpen,
      color: "bg-secondary",
      onClick: () => onOpenModule("quiz"),
    },
    {
      key: "period",
      title: "经期记录",
      emoji: "🌸",
      desc: summary.periodNext
        ? summary.inPeriod
          ? "经期中"
          : `预计 ${formatChineseDate(summary.periodNext)}（${summary.periodInDays}天后）`
        : "点击记录",
      icon: Flower2,
      color: "bg-pink-100/70",
      onClick: () => onOpenModule("period"),
    },
    {
      key: "todo",
      title: "待办清单",
      emoji: "✅",
      desc: `${summary.todoPending} 项待办`,
      icon: CheckSquare,
      color: "bg-accent/60",
      onClick: () => onOpenModule("todo"),
    },
    {
      key: "water",
      title: "喝水提醒",
      emoji: "💧",
      desc: `今日 ${summary.waterToday}/${summary.waterGoal} 杯`,
      icon: Droplets,
      color: "bg-sky-100/70",
      onClick: () => onOpenModule("water"),
    },
    {
      key: "calendar",
      title: "快捷日历",
      emoji: "📅",
      desc: "查看本月",
      icon: Calendar,
      color: "bg-purple-100/60",
      onClick: () => onOpenModule("calendar"),
    },
    {
      key: "toolbox",
      title: "我的工具箱",
      emoji: "🔧",
      desc: "5 个实用工具",
      icon: Wrench,
      color: "bg-amber-100/70",
      onClick: () => onOpenModule("toolbox"),
    },
    {
      key: "nav",
      title: "快捷导航",
      emoji: "📖",
      desc: "常用书签",
      icon: Compass,
      color: "bg-emerald-100/70",
      onClick: () => onOpenModule("nav"),
    },
    {
      key: "quote",
      title: "每日一言",
      emoji: "✨",
      desc: "今日寄语",
      icon: Sparkles,
      color: "bg-orange-100/60",
      onClick: () => onOpenModule("quote"),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-5">
      {/* 学习打卡快览 */}
      <section
        className={cn(
          "rounded-3xl p-5 bg-gradient-to-br from-primary/20 via-accent/25 to-secondary/25",
          "border border-primary/20 shadow-sm",
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">已坚持学习</p>
            <p className="text-3xl font-bold text-primary tabular-nums mt-1">
              {summary.studyDays}
              <span className="text-base font-normal ml-1">天</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">距考试还有</p>
            <p
              className={cn(
                "text-3xl font-bold tabular-nums mt-1",
                summary.countdown > 30
                  ? "text-foreground"
                  : "text-destructive animate-pulse-soft",
              )}
            >
              {summary.countdown}
              <span className="text-base font-normal ml-1">天</span>
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 italic">
          “每一道题、每一页书，都是通往讲台的台阶。”
        </p>
      </section>

      {/* 每日一言卡片 */}
      <DailyQuoteCard
        onClick={() => onOpenModule("quote")}
        quoteState={{
          date: data.lastQuoteDate,
          index: data.lastQuoteIndex,
        }}
        onUpdate={(s) => {
          // 并行更新两个字段（比串行 .then 更快）
          void Promise.all([
            update("lastQuoteDate", s.date),
            update("lastQuoteIndex", s.index),
          ]);
        }}
      />

      {/* 功能宫格 */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
          我的功能
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {cards.map((c) => (
            <button
              key={c.key}
              onClick={c.onClick}
              className={cn(
                "card-hover group relative overflow-hidden rounded-2xl p-4 bg-card border border-border/50 shadow-sm",
                "flex flex-col items-start text-left",
              )}
            >
              {c.badge && (
                <span className="absolute top-2 right-2 text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                  {c.badge}
                </span>
              )}
              <div
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-2",
                  c.color,
                )}
              >
                <span>{c.emoji}</span>
              </div>
              <div className="font-semibold text-sm text-foreground">
                {c.title}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                {c.desc}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 工具箱快速入口（独立突出） */}
      <section
        onClick={() => onOpenModule("toolbox")}
        className="cursor-pointer card-hover rounded-2xl p-4 bg-gradient-to-r from-amber-100/60 to-orange-100/40 border border-amber-200/50 flex items-center gap-3"
      >
        <div className="text-3xl">🔧</div>
        <div className="flex-1">
          <div className="font-semibold text-sm">我的工具箱</div>
          <div className="text-xs text-muted-foreground">
            成绩转换 · 奖状生成 · 排名分析 · 考号分配 · 成绩计算
          </div>
        </div>
        <div className="text-amber-700 text-sm font-medium">进入 ›</div>
      </section>
    </div>
  );
}
