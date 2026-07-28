"use client";

import { useEffect, useState } from "react";
import { getGreeting, getGreetingEmoji, todayISO } from "@/lib/utils";
import { useAppData } from "@/context/AppDataContext";
import { SideMenu } from "./SideMenu";

type ModuleView =
  | "countdown"
  | "quiz"
  | "period"
  | "toolbox"
  | "todo"
  | "water"
  | "quote"
  | "calendar"
  | "nav"
  | "profile";

interface TopBarProps {
  onOpenModule: (m: ModuleView) => void;
  onOpenTokenSettings: () => void;
  onOpenDataExport: () => void;
  onOpenDataImport: () => void;
}

/**
 * 顶部栏 - 左侧汉堡菜单 + 问候语 + 日期
 */
export function TopBar({
  onOpenModule,
  onOpenTokenSettings,
  onOpenDataExport,
  onOpenDataImport,
}: TopBarProps) {
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

  return (
    <header className="sticky top-0 z-30 safe-top bg-gradient-to-br from-primary/15 via-accent/20 to-secondary/20 backdrop-blur-md border-b border-border/40">
      <div className="max-w-3xl mx-auto px-3 py-2.5 flex items-center gap-2">
        {/* 左侧汉堡菜单 */}
        <SideMenu
          onOpenModule={onOpenModule}
          onOpenTokenSettings={onOpenTokenSettings}
          onOpenDataExport={onOpenDataExport}
          onOpenDataImport={onOpenDataImport}
        />

        {/* 中间问候语 */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
            {greeting}
            <span className="ml-1">{emoji}</span>
          </h1>
          <p className="text-[11px] text-muted-foreground truncate">
            {now.toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </p>
        </div>
      </div>
    </header>
  );
}
