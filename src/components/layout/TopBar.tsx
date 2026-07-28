"use client";

import { useEffect, useState } from "react";
import { getGreeting, getGreetingEmoji, todayISO, daysBetween, cn } from "@/lib/utils";
import { useAppData } from "@/context/AppDataContext";

/**
 * 顶部栏 - 显示问候语 + 备考倒计时小标 + 当前日期
 */
export function TopBar() {
  const { data } = useAppData();
  const [, setTick] = useState(0);

  // 每分钟刷新一次问候语
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  const now = new Date();
  const greeting = getGreeting(now);
  const emoji = getGreetingEmoji(now);

  const today = todayISO();
  const days = daysBetween(today, data.examCountdown.targetDate);
  const examName = data.examCountdown.examName;

  return (
    <header className="sticky top-0 z-30 safe-top bg-gradient-to-br from-primary/15 via-accent/20 to-secondary/20 backdrop-blur-md border-b border-border/40">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
              {greeting}
              <span className="ml-1.5">{emoji}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {now.toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </p>
          </div>

          <div className="shrink-0 bg-card/80 backdrop-blur rounded-2xl px-3 py-2 shadow-sm border border-border/50 text-center">
            <div className="text-[10px] text-muted-foreground truncate max-w-[90px]">
              {examName || "考试"}
            </div>
            <div
              className={cn(
                "text-2xl font-bold tabular-nums",
                days > 30
                  ? "text-primary"
                  : days > 7
                    ? "text-orange-500"
                    : "text-destructive animate-pulse-soft",
              )}
            >
              {days > 0 ? days : 0}
            </div>
            <div className="text-[10px] text-muted-foreground">天</div>
          </div>
        </div>
      </div>
    </header>
  );
}
