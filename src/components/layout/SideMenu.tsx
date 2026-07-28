"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  KeyRound,
  Download,
  Upload,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { cn, daysBetween, todayISO } from "@/lib/utils";
import { useAppData } from "@/context/AppDataContext";

interface SideMenuProps {
  onOpenModule: (m: ModuleView) => void;
  onOpenTokenSettings: () => void;
  onOpenDataExport: () => void;
  onOpenDataImport: () => void;
}

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

interface MenuItem {
  key: ModuleView | string;
  label: string;
  emoji: string;
  icon: LucideIcon;
  desc: string;
  onClick: () => void;
}

export function SideMenu({
  onOpenModule,
  onOpenTokenSettings,
  onOpenDataExport,
  onOpenDataImport,
}: SideMenuProps) {
  const [open, setOpen] = useState(false);
  const { data } = useAppData();

  const today = todayISO();
  const daysLeft = daysBetween(today, data.examCountdown.targetDate);
  const eventName = data.examCountdown.examName || "我的目标";
  const eventIcon = data.examCountdown.icon || "🎯";

  const goTo = (m: ModuleView) => {
    setOpen(false);
    // 延迟一帧让 Sheet 关闭动画先开始
    setTimeout(() => onOpenModule(m), 50);
  };

  const doAction = (action: () => void) => {
    setOpen(false);
    setTimeout(action, 50);
  };

  // 功能模块
  const modules: MenuItem[] = [
    {
      key: "countdown",
      label: "倒数日",
      emoji: eventIcon,
      icon: CalendarClock,
      desc:
        daysLeft > 0
          ? `距${eventName}还有 ${daysLeft} 天`
          : daysLeft === 0
            ? `${eventName}就在今天`
            : `${eventName}已到`,
      onClick: () => goTo("countdown"),
    },
    {
      key: "quiz",
      label: "刷题练习",
      emoji: "📝",
      icon: BookOpen,
      desc: `已做 ${data.quizStats.totalAnswered} 题`,
      onClick: () => goTo("quiz"),
    },
    {
      key: "todo",
      label: "待办清单",
      emoji: "✅",
      icon: CheckSquare,
      desc: `${data.todos.filter((t) => !t.completed).length} 项待办`,
      onClick: () => goTo("todo"),
    },
    {
      key: "period",
      label: "经期记录",
      emoji: "🌸",
      icon: Flower2,
      desc: data.periodRecords.length > 0 ? "已记录" : "未记录",
      onClick: () => goTo("period"),
    },
    {
      key: "water",
      label: "喝水提醒",
      emoji: "💧",
      icon: Droplets,
      desc: `今日 ${
        data.waterState.todayDate === today ? data.waterState.todayCount : 0
      }/${data.waterState.dailyGoal} 杯`,
      onClick: () => goTo("water"),
    },
    {
      key: "calendar",
      label: "快捷日历",
      emoji: "📅",
      icon: Calendar,
      desc: "查看本月",
      onClick: () => goTo("calendar"),
    },
    {
      key: "nav",
      label: "快捷导航",
      emoji: "📖",
      icon: Compass,
      desc: `${data.bookmarks.length} 个书签`,
      onClick: () => goTo("nav"),
    },
    {
      key: "quote",
      label: "每日一言",
      emoji: "✨",
      icon: Sparkles,
      desc: "今日寄语",
      onClick: () => goTo("quote"),
    },
    {
      key: "toolbox",
      label: "我的工具箱",
      emoji: "🔧",
      icon: Wrench,
      desc: "实用工具集合",
      onClick: () => goTo("toolbox"),
    },
  ];

  // 设置项
  const settings: MenuItem[] = [
    {
      key: "token",
      label: "访问令牌",
      emoji: "🔑",
      icon: KeyRound,
      desc: "设置同步令牌",
      onClick: () => doAction(onOpenTokenSettings),
    },
    {
      key: "export",
      label: "导出数据",
      emoji: "📤",
      icon: Download,
      desc: "备份为文件",
      onClick: () => doAction(onOpenDataExport),
    },
    {
      key: "import",
      label: "导入数据",
      emoji: "📥",
      icon: Upload,
      desc: "从文件恢复",
      onClick: () => doAction(onOpenDataImport),
    },
    {
      key: "profile",
      label: "我的",
      emoji: "👤",
      icon: Settings,
      desc: "全部设置",
      onClick: () => goTo("profile"),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="打开菜单"
          className="p-2 -ml-2 rounded-xl hover:bg-muted/60 active:scale-95 transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[280px] sm:w-[320px] p-0 flex flex-col"
      >
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border/40">
          <SheetTitle className="text-left">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl shadow-md">
                🌸
              </div>
              <div className="min-w-0">
                <div className="text-base font-semibold">可可的工作台</div>
                <div className="text-xs text-muted-foreground font-normal mt-0.5">
                  {eventName}
                </div>
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* 倒数日卡片 */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-primary/15 via-accent/20 to-secondary/20 border border-primary/20 text-center">
            <div className="text-3xl mb-1">{eventIcon}</div>
            <div className="text-xs text-muted-foreground truncate">
              {eventName}
            </div>
            <div
              className={cn(
                "text-3xl font-bold tabular-nums mt-1",
                daysLeft > 30
                  ? "text-primary"
                  : daysLeft > 7
                    ? "text-orange-500"
                    : "text-destructive",
              )}
            >
              {daysLeft > 0 ? daysLeft : 0}
              <span className="text-sm font-normal ml-1">天</span>
            </div>
          </div>

          {/* 功能模块 */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground px-2 mb-2">
              功能
            </div>
            <div className="space-y-1">
              {modules.map((m) => (
                <button
                  key={m.key}
                  onClick={m.onClick}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/60 active:scale-[0.98] transition-all text-left min-h-[48px]"
                >
                  <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center text-lg shrink-0">
                    {m.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{m.label}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {m.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 设置 */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground px-2 mb-2">
              设置
            </div>
            <div className="space-y-1">
              {settings.map((m) => (
                <button
                  key={m.key}
                  onClick={m.onClick}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/60 active:scale-[0.98] transition-all text-left min-h-[48px]"
                >
                  <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center text-lg shrink-0">
                    {m.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{m.label}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {m.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-border/40 text-center">
          <p className="text-[10px] text-muted-foreground">
            数据云端同步 · 多设备查看一致
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
