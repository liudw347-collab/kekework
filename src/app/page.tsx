"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { AppLoadingGate } from "@/components/AppLoadingGate";
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
import { TokenDialog } from "@/components/TokenDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/AppDataContext";
import { serializeAllData, parseImportedData } from "@/lib/storage";
import { downloadFile, todayISO } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  const [tab, setTab] = useState<Tab>("home");
  const [activeModule, setActiveModule] = useState<ModuleView | null>(null);

  // 全局对话框状态（由侧边菜单触发）
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState("");

  const { exportAll, importAll } = useAppData();
  const { toast } = useToast();

  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  const openModule = useCallback((m: ModuleView) => {
    setActiveModule(m);
    if (m === "quiz") setTab("quiz");
    else if (m === "profile") setTab("profile");
    else setTab("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const switchTab = useCallback((t: Tab) => {
    setTab(t);
    setActiveModule(t === "quiz" ? "quiz" : t === "profile" ? "profile" : null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goBack = useCallback(() => {
    setActiveModule(null);
    setTab("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /** 触发导出数据 */
  const handleExport = useCallback(() => {
    const allData = exportAll();
    const json = serializeAllData(allData);
    downloadFile(json, `可可工作台_备份_${todayISO()}.json`);
    toast({ title: "数据已导出 ✅" });
  }, [exportAll, toast]);

  /** 触发导入数据 */
  const handleImport = useCallback(async () => {
    try {
      const parsed = parseImportedData(importText);
      await importAll(parsed);
      setImportDialogOpen(false);
      setImportText("");
      toast({ title: "导入成功 ✅", description: "数据已同步到云端" });
    } catch (e) {
      toast({
        title: "导入失败",
        description: e instanceof Error ? e.message : "数据格式错误",
        variant: "destructive",
      });
    }
  }, [importAll, importText, toast]);

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
          return <ProfileModule onBack={goBack} onOpenModule={openModule} />;
      }
    }
    if (tab === "home") return <HomeDashboard onOpenModule={openModule} />;
    if (tab === "profile")
      return <ProfileModule onBack={goBack} onOpenModule={openModule} />;
    return null;
  };

  return (
    <AppLoadingGate onTokenDialogOpen={() => setTokenDialogOpen(true)}>
      <div className="min-h-screen flex flex-col bg-background">
        <TopBar
          onOpenModule={openModule}
          onOpenTokenSettings={() => setTokenDialogOpen(true)}
          onOpenDataExport={handleExport}
          onOpenDataImport={() => setImportDialogOpen(true)}
        />

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

        {/* 全局对话框 - 由侧边菜单触发 */}
        <TokenDialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen} />

        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>导入数据</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-xs text-muted-foreground">
                粘贴之前导出的数据，导入后会同步到云端，覆盖现有同名数据。
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="粘贴之前导出的数据内容"
                className="w-full min-h-[200px] p-2 rounded-md border border-input bg-background text-xs font-mono"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">取消</Button>
              </DialogClose>
              <Button onClick={handleImport} disabled={!importText.trim()}>
                导入
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLoadingGate>
  );
}
