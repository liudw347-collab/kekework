"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Home as HomeIcon, BookOpen, User } from "lucide-react";

import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { HomeDashboard } from "@/components/modules/HomeDashboard";
import { ExamCountdownModule } from "@/components/modules/ExamCountdownModule";
import { QuizModule } from "@/components/modules/QuizModule";
import { PeriodTrackerModule } from "@/components/modules/PeriodTrackerModule";
import { ToolboxModule } from "@/components/modules/ToolboxModule";
import { TodoListModule } from "@/components/modules/TodoListModule";
import { WaterReminderModule } from "@/components/modules/WaterReminderModule";
import { DailyQuoteModule } from "@/components/modules/DailyQuoteModule";
import { QuickCalendarModule } from "@/components/modules/QuickCalendarModule";
import { QuickNavModule } from "@/components/modules/QuickNavModule";
import { ProfileModule } from "@/components/modules/ProfileModule";
import { cn } from "@/lib/utils";

/**
 * 主视图类型
 * - tab: 底部导航三个主标签
 * - module: 从首页点进去的具体模块详情
 */
type Tab = "home" | "quiz" | "profile";
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

export default function Home() {
  // 当前底部导航标签
  const [tab, setTab] = useState<Tab>("home");
  // 当前打开的模块详情（null 表示在主标签页）
  const [activeModule, setActiveModule] = useState<ModuleView | null>(null);

  // 顶部状态栏时间（每分钟刷新一次，影响问候语）
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  /** 打开某个模块详情 */
  const openModule = useCallback((m: ModuleView) => {
    setActiveModule(m);
    // 同步底部导航高亮
    if (m === "quiz") setTab("quiz");
    else if (m === "profile") setTab("profile");
    else setTab("home");
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /** 切换底部导航 */
  const switchTab = useCallback(
    (t: Tab) => {
      setTab(t);
      setActiveModule(t === "quiz" ? "quiz" : t === "profile" ? "profile" : null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [],
  );

  /** 返回上一级（从模块详情返回） */
  const goBack = useCallback(() => {
    setActiveModule(null);
    setTab("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // 决定当前展示的内容
  const renderContent = () => {
    if (activeModule) {
      switch (activeModule) {
        case "countdown":
          return <ExamCountdownModule onBack={goBack} />;
        case "quiz":
          return <QuizModule onBack={goBack} />;
        case "period":
          return <PeriodTrackerModule onBack={goBack} />;
        case "toolbox":
          return <ToolboxModule onBack={goBack} />;
        case "todo":
          return <TodoListModule onBack={goBack} />;
        case "water":
          return <WaterReminderModule onBack={goBack} />;
        case "quote":
          return <DailyQuoteModule onBack={goBack} />;
        case "calendar":
          return <QuickCalendarModule onBack={goBack} />;
        case "nav":
          return <QuickNavModule onBack={goBack} />;
        case "profile":
          return <ProfileModule onBack={goBack} />;
      }
    }
    if (tab === "home") return <HomeDashboard onOpenModule={openModule} />;
    if (tab === "profile") return <ProfileModule onBack={goBack} />;
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />

      <main className="flex-1 pb-24 pt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule ?? tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav tab={tab} onSwitch={switchTab} />
    </div>
  );
}
