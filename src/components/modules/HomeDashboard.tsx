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
import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";
import { daysBetween, todayISO, formatChineseDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
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
  color: string; // tailwind class for background
  textColor: string;
  onClick: () => void;
  badge?: string;
}

export function HomeDashboard({ onOpenModule }: HomeDashboardProps) {
  // 各模块的简要数据，显示在卡片角标
  const [summary, setSummary] = useState({
    countdown: 0,
    studyDays: 0,
    quizCount: 0,
    quizAccuracy: 0,
    periodNext: "",
    periodInDays: 0,
    todoPending: 0,
    waterToday: 0,
    waterGoal: 8,
  });

  useEffect(() => {
    const load = () => {
      const exam = storage.getExamCountdown();
      const today = todayISO();
      const cd = daysBetween(today, exam.targetDate);

      const checkins = storage.getStudyCheckin();
      const studyDays = checkins.length;

      const stats = storage.getQuizStats();
      const accuracy =
        stats.totalAnswered > 0
          ? Math.round((stats.correctCount / stats.totalAnswered) * 100)
          : 0;

      const periods = storage.getPeriodRecords().sort((a, b) =>
        a.startDate < b.startDate ? -1 : 1,
      );
      let periodNext = "";
      let periodInDays = 0;
      if (periods.length > 0) {
        const last = periods[periods.length - 1];
        const settings = storage.getPeriodSettings();
        const next = new Date(last.startDate + "T00:00:00");
        next.setDate(next.getDate() + settings.defaultCycle);
        periodNext = next.toISOString().slice(0, 10);
        periodInDays = daysBetween(today, periodNext);
      }

      const todos = storage.getTodos();
      const todoPending = todos.filter((t) => !t.completed).length;

      const water = storage.getWaterState();
      const todayCount = water.todayDate === today ? water.todayCount : 0;

      setSummary({
        countdown: cd,
        studyDays,
        quizCount: stats.totalAnswered,
        quizAccuracy: accuracy,
        periodNext,
        periodInDays,
        todoPending,
        waterToday: todayCount,
        waterGoal: water.dailyGoal,
      });
    };
    load();
    const handler = () => load();
    window.addEventListener("keke:data-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("keke:data-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  /** 派发数据更新事件，通知其他组件刷新 */
  const notifyUpdate = () => {
    window.dispatchEvent(new Event("keke:data-updated"));
  };

  const cards: ModuleCard[] = [
    {
      key: "countdown",
      title: "备考倒计时",
      emoji: "📚",
      desc: "距考试还有",
      icon: CalendarClock,
      color: "bg-primary/15",
      textColor: "text-primary",
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
      textColor: "text-secondary-foreground",
      onClick: () => onOpenModule("quiz"),
    },
    {
      key: "period",
      title: "经期记录",
      emoji: "🌸",
      desc: summary.periodNext
        ? summary.periodInDays > 0
          ? `预计 ${formatChineseDate(summary.periodNext)}（${summary.periodInDays}天后）`
          : "经期中"
        : "点击记录",
      icon: Flower2,
      color: "bg-pink-100/70",
      textColor: "text-pink-700",
      onClick: () => onOpenModule("period"),
    },
    {
      key: "todo",
      title: "待办清单",
      emoji: "✅",
      desc: `${summary.todoPending} 项待办`,
      icon: CheckSquare,
      color: "bg-accent/60",
      textColor: "text-accent-foreground",
      onClick: () => onOpenModule("todo"),
    },
    {
      key: "water",
      title: "喝水提醒",
      emoji: "💧",
      desc: `今日 ${summary.waterToday}/${summary.waterGoal} 杯`,
      icon: Droplets,
      color: "bg-sky-100/70",
      textColor: "text-sky-700",
      onClick: () => onOpenModule("water"),
    },
    {
      key: "calendar",
      title: "快捷日历",
      emoji: "📅",
      desc: "查看本月",
      icon: Calendar,
      color: "bg-purple-100/60",
      textColor: "text-purple-700",
      onClick: () => onOpenModule("calendar"),
    },
    {
      key: "toolbox",
      title: "我的工具箱",
      emoji: "🔧",
      desc: "5 个实用工具",
      icon: Wrench,
      color: "bg-amber-100/70",
      textColor: "text-amber-700",
      onClick: () => onOpenModule("toolbox"),
    },
    {
      key: "nav",
      title: "快捷导航",
      emoji: "📖",
      desc: "常用书签",
      icon: Compass,
      color: "bg-emerald-100/70",
      textColor: "text-emerald-700",
      onClick: () => onOpenModule("nav"),
    },
    {
      key: "quote",
      title: "每日一言",
      emoji: "✨",
      desc: "今日寄语",
      icon: Sparkles,
      color: "bg-orange-100/60",
      textColor: "text-orange-700",
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
      <DailyQuoteCard onClick={() => onOpenModule("quote")} />

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
