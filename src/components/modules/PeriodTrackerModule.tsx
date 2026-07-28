"use client";

import { useMemo, useState } from "react";
import { ModuleHeader, ModuleContainer } from "@/components/layout/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Trash2, Settings, Heart, Calendar as CalIcon } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import type { PeriodRecord, PeriodSettings } from "@/lib/types";
import {
  todayISO,
  daysBetween,
  addDays,
  formatChineseDate,
  cn,
} from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PeriodTrackerModuleProps {
  onBack: () => void;
}

export function PeriodTrackerModule({ onBack }: PeriodTrackerModuleProps) {
  const { data, update } = useAppData();
  const records = useMemo(
    () =>
      [...data.periodRecords].sort((a, b) =>
        a.startDate < b.startDate ? -1 : 1,
      ),
    [data.periodRecords],
  );
  const settings = data.periodSettings;

  const [adding, setAdding] = useState(false);
  const [editingSettings, setEditingSettings] = useState(false);
  const [newDate, setNewDate] = useState(todayISO());
  const [newDuration, setNewDuration] = useState(5);
  const [newNote, setNewNote] = useState("");
  // 设置编辑临时字段
  const [editCycle, setEditCycle] = useState(settings.defaultCycle);
  const [editReminders, setEditReminders] = useState(settings.reminders.join("\n"));
  const { toast } = useToast();

  const today = todayISO();

  /** 计算平均周期 */
  const avgCycle = useMemo(() => {
    if (records.length < 2) return settings.defaultCycle;
    const gaps: number[] = [];
    for (let i = 1; i < records.length; i++) {
      gaps.push(daysBetween(records[i - 1].startDate, records[i].startDate));
    }
    return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  }, [records, settings.defaultCycle]);

  /** 预测下次经期 */
  const nextPrediction = useMemo(() => {
    if (records.length === 0) return null;
    const last = records[records.length - 1];
    const next = addDays(last.startDate, avgCycle);
    const inDays = daysBetween(today, next);
    return {
      nextDate: next,
      inDays,
      lastStart: last.startDate,
      lastDuration: last.duration,
    };
  }, [records, avgCycle, today]);

  /** 是否在经期中 */
  const isMenstruating = useMemo(() => {
    if (!nextPrediction) return false;
    const lastEnd = addDays(
      nextPrediction.lastStart,
      nextPrediction.lastDuration,
    );
    return today >= nextPrediction.lastStart && today < lastEnd;
  }, [nextPrediction, today]);

  /** 是否需要预警（前 2 天） */
  const shouldWarn = useMemo(() => {
    if (!nextPrediction) return false;
    return (
      !isMenstruating &&
      nextPrediction.inDays >= 0 &&
      nextPrediction.inDays <= 2
    );
  }, [nextPrediction, isMenstruating]);

  /** 今日温馨提醒文案 */
  const todayReminder = useMemo(() => {
    if (records.length === 0) return null;
    if (isMenstruating) {
      return settings.reminders[
        Math.floor(Math.random() * settings.reminders.length)
      ];
    }
    if (shouldWarn && nextPrediction) {
      return `预计 ${formatChineseDate(nextPrediction.nextDate)} 来月经，记得提前备好卫生用品哦~`;
    }
    return null;
  }, [isMenstruating, shouldWarn, nextPrediction, settings.reminders, records.length]);

  const handleAdd = async () => {
    if (!newDate) {
      toast({ title: "请选择日期", variant: "destructive" });
      return;
    }
    const next: PeriodRecord = {
      startDate: newDate,
      duration: newDuration,
      note: newNote.trim() || undefined,
    };
    const merged = [...records, next].sort((a, b) =>
      a.startDate < b.startDate ? -1 : 1,
    );
    await update("periodRecords", merged);
    setAdding(false);
    setNewDate(todayISO());
    setNewDuration(5);
    setNewNote("");
    toast({ title: "已记录 ✅" });
  };

  const handleDelete = async (date: string) => {
    if (!confirm("确定删除这条记录吗？")) return;
    const next = records.filter((r) => r.startDate !== date);
    await update("periodRecords", next);
    toast({ title: "已删除" });
  };

  const openSettings = () => {
    setEditCycle(settings.defaultCycle);
    setEditReminders(settings.reminders.join("\n"));
    setEditingSettings(true);
  };

  const handleSaveSettings = async () => {
    const next: PeriodSettings = {
      defaultCycle: Math.max(20, Math.min(45, editCycle)),
      reminders: editReminders
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    await update("periodSettings", next);
    setEditingSettings(false);
    toast({ title: "设置已保存 ✅" });
  };

  return (
    <>
      <ModuleHeader
        title="经期记录"
        emoji="🌸"
        description="记录月经周期 · 预测下次经期"
        onBack={onBack}
        right={
          <>
            <Dialog open={editingSettings} onOpenChange={setEditingSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" onClick={openSettings}>
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>经期设置</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>默认周期天数</Label>
                    <Input
                      type="number"
                      min={20}
                      max={45}
                      value={editCycle}
                      onChange={(e) =>
                        setEditCycle(parseInt(e.target.value) || 28)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>温馨提醒文案（每行一条，随机展示）</Label>
                    <Textarea
                      value={editReminders}
                      onChange={(e) => setEditReminders(e.target.value)}
                      rows={6}
                      placeholder="记得吃点羊肉暖暖身体哦~"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">取消</Button>
                  </DialogClose>
                  <Button onClick={handleSaveSettings}>保存</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={adding} onOpenChange={setAdding}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  记录
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>记录经期</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>开始日期</Label>
                    <Input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      max={today}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>持续天数</Label>
                    <Input
                      type="number"
                      min={1}
                      max={15}
                      value={newDuration}
                      onChange={(e) =>
                        setNewDuration(parseInt(e.target.value) || 5)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>备注（可选）</Label>
                    <Textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="例如：痛经严重 / 量正常"
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">取消</Button>
                  </DialogClose>
                  <Button onClick={handleAdd}>保存</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <ModuleContainer className="space-y-4">
        {/* 状态卡 */}
        <section
          className={cn(
            "rounded-3xl p-5 border text-center",
            isMenstruating
              ? "bg-gradient-to-br from-pink-100 to-rose-100 border-pink-200"
              : shouldWarn
                ? "bg-gradient-to-br from-amber-100 to-orange-100 border-amber-200"
                : "bg-gradient-to-br from-secondary/40 to-accent/30 border-border/50",
          )}
        >
          <div className="text-4xl mb-2">
            {isMenstruating ? "🌸" : shouldWarn ? "💛" : "🌷"}
          </div>
          {records.length === 0 ? (
            <>
              <h3 className="font-semibold text-foreground">还未记录过经期</h3>
              <p className="text-sm text-muted-foreground mt-1">
                点击右上角「记录」开始第一次记录吧
              </p>
            </>
          ) : isMenstruating ? (
            <>
              <h3 className="font-semibold text-pink-700">经期中</h3>
              <p className="text-sm text-pink-600 mt-1 italic">
                {todayReminder}
              </p>
            </>
          ) : shouldWarn ? (
            <>
              <h3 className="font-semibold text-amber-700">经期将至</h3>
              <p className="text-sm text-amber-600 mt-1">
                预计 {formatChineseDate(nextPrediction!.nextDate)}（
                {nextPrediction!.inDays === 0
                  ? "今天"
                  : `${nextPrediction!.inDays} 天后`}
                ）
              </p>
              <p className="text-xs text-amber-600 mt-2 italic">
                {todayReminder}
              </p>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-foreground">预计下次经期</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {formatChineseDate(nextPrediction!.nextDate)}
              </p>
              <p className="text-2xl font-bold text-primary mt-2 tabular-nums">
                {nextPrediction!.inDays}
                <span className="text-sm font-normal ml-1">天后</span>
              </p>
            </>
          )}
        </section>

        {/* 统计数据 */}
        <div className="grid grid-cols-3 gap-3">
          <StatBox
            label="已记录"
            value={records.length}
            unit="次"
            emoji="📅"
          />
          <StatBox
            label="平均周期"
            value={records.length >= 2 ? avgCycle : settings.defaultCycle}
            unit="天"
            emoji="🔄"
          />
          <StatBox
            label="上次持续"
            value={records.length > 0 ? records[records.length - 1].duration : 0}
            unit="天"
            emoji="💧"
          />
        </div>

        {/* 历史记录 */}
        <section className="rounded-2xl p-4 bg-card border border-border/50">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CalIcon className="w-4 h-4" />
            历史记录
          </h3>
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              暂无记录
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {[...records].reverse().map((r) => (
                <div
                  key={r.startDate}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/40"
                >
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 shrink-0">
                    <Heart className="w-4 h-4" fill="currentColor" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {r.startDate}
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        {r.duration} 天
                      </Badge>
                    </div>
                    {r.note && (
                      <div className="text-xs text-muted-foreground truncate">
                        {r.note}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(r.startDate)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"
                    aria-label="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 温馨提示 */}
        <section className="rounded-2xl p-4 bg-pink-50 border border-pink-200">
          <div className="flex items-start gap-2">
            <span className="text-lg">💖</span>
            <div className="text-sm text-pink-800 leading-relaxed">
              <p className="font-medium mb-2">温馨提示</p>
              <ul className="space-y-1 text-xs">
                {settings.reminders.map((r, i) => (
                  <li key={i}>· {r}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </ModuleContainer>
    </>
  );
}

function StatBox({
  label,
  value,
  unit,
  emoji,
}: {
  label: string;
  value: number;
  unit: string;
  emoji: string;
}) {
  return (
    <div className="rounded-2xl p-3 bg-card border border-border/50 text-center">
      <div className="text-lg mb-1">{emoji}</div>
      <div className="text-xl font-bold tabular-nums">
        {value}
        <span className="text-xs font-normal ml-0.5 text-muted-foreground">
          {unit}
        </span>
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
