"use client";

import { Home as HomeIcon, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "home" | "quiz" | "profile";

interface BottomNavProps {
  tab: Tab;
  onSwitch: (t: Tab) => void;
}

const items: {
  key: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "home", label: "首页", icon: HomeIcon },
  { key: "quiz", label: "刷题", icon: BookOpen },
  { key: "profile", label: "我的", icon: User },
];

/**
 * 底部固定导航栏 - 首页 | 刷题 | 我的
 * 适配 iOS 安全区
 */
export function BottomNav({ tab, onSwitch }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur-lg safe-bottom">
      <div className="max-w-3xl mx-auto px-2 grid grid-cols-3 gap-1">
        {items.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => onSwitch(key)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-2xl transition-all duration-200",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={label}
              aria-current={active ? "page" : undefined}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  active && "bg-primary/15 scale-110",
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  active && "font-semibold",
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
