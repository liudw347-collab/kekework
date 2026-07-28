"use client";

import { useEffect, useState } from "react";
import { getGreeting, getGreetingEmoji, todayISO, daysBetween } from "@/lib/utils";
import { storage } from "@/lib/storage";
import { cn } from "@/lib/utils";

/**
 * 顶部栏 - 显示问候语 + 备考倒计时小标 + 当前日期
 */
export function TopBar() {
  const [greeting, setGreeting] = useState("");
  const [emoji, setEmoji] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [examName, setExamName] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setGreeting(getGreeting(now));
      setEmoji(getGreetingEmoji(now));
      const exam = storage.getExamCountdown();
      setExamName(exam.examName);
      const today = todayISO();
      const days = daysBetween(today, exam.targetDate);
      setCountdown(days);
    };
    update();
    const handler = () => update();
    window.addEventListener("storage", handler);
    window.addEventListener("keke:data-updated", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("keke:data-updated", handler);
    };
  }, []);

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
              {new Date().toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </p>
          </div>

          {countdown !== null && (
            <div className="shrink-0 bg-card/80 backdrop-blur rounded-2xl px-3 py-2 shadow-sm border border-border/50 text-center">
              <div className="text-[10px] text-muted-foreground truncate max-w-[90px]">
                {examName || "考试"}
              </div>
              <div
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  countdown > 30
                    ? "text-primary"
                    : countdown > 7
                      ? "text-orange-500"
                      : "text-destructive animate-pulse-soft",
                )}
              >
                {countdown > 0 ? countdown : 0}
              </div>
              <div className="text-[10px] text-muted-foreground">天</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
