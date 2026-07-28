"use client";

import { useState } from "react";
import { ModuleHeader, ModuleContainer } from "@/components/layout/ModuleHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Download,
  Upload,
  Trash2,
  Info,
  Heart,
  Database,
  FileJson,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import {
  serializeAllData,
  parseImportedData,
} from "@/lib/storage";
import { downloadFile, todayISO } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { TokenDialog } from "@/components/TokenDialog";

interface ProfileModuleProps {
  onBack: () => void;
}

export function ProfileModule({ onBack }: ProfileModuleProps) {
  const { data, exportAll, importAll, clearAll, reload } = useAppData();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const { toast } = useToast();

  const stats = {
    questions: data.quizQuestions.length,
    todos: data.todos.length,
    bookmarks: data.bookmarks.length,
    periodRecords: data.periodRecords.length,
    studyDays: data.studyCheckinDates.length,
    quizAnswered: data.quizStats.totalAnswered,
  };

  /** 导出全部数据 */
  const handleExport = () => {
    const allData = exportAll();
    const json = serializeAllData(allData);
    downloadFile(
      json,
      `可可工作台_备份_${todayISO()}.json`,
    );
    toast({
      title: "数据已导出 ✅",
      description: "请妥善保存 JSON 文件",
    });
  };

  /** 导入数据 */
  const handleImport = async () => {
    try {
      const parsed = parseImportedData(importText);
      await importAll(parsed);
      setImportDialogOpen(false);
      setImportText("");
      toast({
        title: "导入成功 ✅",
        description: "数据已同步到云端",
      });
    } catch (e) {
      toast({
        title: "导入失败",
        description: e instanceof Error ? e.message : "JSON 格式错误",
        variant: "destructive",
      });
    }
  };

  /** 清空所有数据 */
  const handleClearAll = async () => {
    if (
      !confirm(
        "⚠️ 警告：此操作将清空云端和本地的所有数据，包括题库、待办、经期记录、书签等。\n\n建议先导出备份。\n\n确定继续吗？",
      )
    ) {
      return;
    }
    if (!confirm("再次确认：真的要清空所有数据吗？此操作不可恢复！")) {
      return;
    }
    await clearAll();
    toast({ title: "已清空所有数据" });
  };

  return (
    <>
      <ModuleHeader
        title="我的"
        emoji="👤"
        description="数据管理 · 云端同步 · 关于"
        onBack={onBack}
        right={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTokenDialogOpen(true)}
          >
            <KeyRound className="w-4 h-4" />
          </Button>
        }
      />

      <ModuleContainer className="space-y-4">
        {/* 头像卡 */}
        <section className="rounded-3xl p-5 bg-gradient-to-br from-primary/15 via-accent/20 to-secondary/25 border border-primary/20 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl mx-auto mb-3 shadow-md">
            🌸
          </div>
          <h2 className="text-lg font-semibold">可可老师</h2>
          <p className="text-xs text-muted-foreground mt-1">
            河北教师编备考中 · 加油上岸！
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-2 text-[10px] text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>云端同步已启用</span>
          </div>
        </section>

        {/* 数据统计 */}
        <section className="rounded-2xl p-4 bg-card border border-border/50">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <Database className="w-4 h-4" />
            我的数据
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <DataStat label="题库" value={stats.questions} emoji="📚" />
            <DataStat label="待办" value={stats.todos} emoji="✅" />
            <DataStat label="书签" value={stats.bookmarks} emoji="📖" />
            <DataStat label="经期记录" value={stats.periodRecords} emoji="🌸" />
            <DataStat label="学习打卡" value={stats.studyDays} emoji="🔥" />
            <DataStat
              label="已做题数"
              value={stats.quizAnswered}
              emoji="📝"
            />
          </div>
        </section>

        {/* 云端同步 */}
        <section className="rounded-2xl p-4 bg-card border border-border/50 space-y-2">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
            <RefreshCw className="w-4 h-4" />
            云端同步
          </h3>
          <Button
            onClick={() => {
              reload();
              toast({ title: "已重新同步云端数据" });
            }}
            variant="outline"
            className="w-full rounded-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            手动同步
          </Button>
          <Button
            onClick={() => setTokenDialogOpen(true)}
            variant="outline"
            className="w-full rounded-full"
          >
            <KeyRound className="w-4 h-4 mr-2" />
            设置访问令牌
          </Button>
        </section>

        {/* 数据备份 */}
        <section className="rounded-2xl p-4 bg-card border border-border/50 space-y-2">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
            <FileJson className="w-4 h-4" />
            数据备份
          </h3>
          <Button
            onClick={handleExport}
            className="w-full rounded-full"
            variant="default"
          >
            <Download className="w-4 h-4 mr-2" />
            导出全部数据（JSON）
          </Button>

          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full rounded-full">
                <Upload className="w-4 h-4 mr-2" />
                导入数据
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>导入数据（JSON）</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <p className="text-xs text-muted-foreground">
                  粘贴之前导出的 JSON 数据。注意：导入会覆盖现有同名数据，并同步到云端。
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder='粘贴 JSON，例如：{"data":{...}}'
                  className="w-full min-h-[200px] p-2 rounded-md border border-input bg-background text-xs font-mono"
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">取消</Button>
                </DialogClose>
                <Button onClick={handleImport}>导入</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleClearAll}
            variant="outline"
            className="w-full rounded-full text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            清空所有数据
          </Button>
        </section>

        {/* 功能模块列表（快捷进入） */}
        <section className="rounded-2xl p-4 bg-card border border-border/50">
          <h3 className="font-semibold text-sm mb-3">全部功能</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { name: "备考倒计时", emoji: "📚" },
              { name: "刷题练习", emoji: "📝" },
              { name: "经期记录", emoji: "🌸" },
              { name: "我的工具箱", emoji: "🔧" },
              { name: "待办清单", emoji: "✅" },
              { name: "喝水提醒", emoji: "💧" },
              { name: "每日一言", emoji: "✨" },
              { name: "快捷日历", emoji: "📅" },
              { name: "快捷导航", emoji: "📖" },
            ].map((m) => (
              <div
                key={m.name}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
              >
                <span className="text-base">{m.emoji}</span>
                <span className="text-xs">{m.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 关于 */}
        <section className="rounded-2xl p-4 bg-secondary/40 border border-border/30">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 text-secondary-foreground shrink-0" />
            <div className="text-xs text-secondary-foreground leading-relaxed space-y-1">
              <p className="font-medium text-sm mb-1">关于可可的工作台</p>
              <p>· 个人工具网站，专为教师编备考设计</p>
              <p>· 数据通过 Cloudflare D1 数据库云端同步</p>
              <p>· 不同手机登录相同访问令牌即可看到相同数据</p>
              <p>· 建议定期导出数据做备份</p>
              <p>· 部署在 Cloudflare Pages，全球加速</p>
              <p className="pt-2 flex items-center gap-1">
                <Heart className="w-3 h-3 text-primary" fill="currentColor" />
                Made with love for 可可老师
              </p>
            </div>
          </div>
        </section>
      </ModuleContainer>

      <TokenDialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen} />
    </>
  );
}

function DataStat({
  label,
  value,
  emoji,
}: {
  label: string;
  value: number;
  emoji: string;
}) {
  return (
    <div className="rounded-xl p-2 bg-muted/30 text-center">
      <div className="text-base mb-0.5">{emoji}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
