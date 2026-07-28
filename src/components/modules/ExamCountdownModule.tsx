"use client";

import { useState } from "react";
import { ModuleHeader, ModuleContainer } from "@/components/layout/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Flame, Target, Trophy } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { daysBetween, todayISO, addDays, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ExamCountdownModuleProps {
  onBack: () => void;
}

export function ExamCountdownModule({ onBack }: ExamCountdownModuleProps) {
  const { data, update } = useAppData();
  const state = data.examCountdown;
  const checkins = data.studyCheckinDates;

  const [editing, setEditing] = useState(false);
  const [examName, setExamName] = useState(state.examName);
  const [targetDate, setTargetDate] = useState(state.targetDate);
  const [startDate, setStartDate] = useState(state.startDate);
  const { toast } = useToast();

  const today = todayISO();
  const daysLeft = daysBetween(today, state.targetDate);
  const studyDays = checkins.length;
  const totalDays = Math.max(1, daysBetween(state.startDate, state.targetDate));
  const passedDays = Math.max(0, daysBetween(state.startDate, today));
  const progressPct = Math.min(
    100,
    Math.round((passedDays / totalDays) * 100),
  );
  const checkedToday = checkins.includes(today);

  // 同步编辑字段（打开对话框时）
  const openEdit = () => {
    setExamName(state.examName);
    setTargetDate(state.targetDate);
    setStartDate(state.startDate);
    setEditing(true);
  };

  const handleSave = async () => {
    const next = {
      examName: examName.trim() || "考试",
      targetDate,
      startDate,
    };
    await update("examCountdown", next);
    setEditing(false);
    toast({ title: "已保存设置 ✅" });
  };

  const handleCheckin = async () => {
    if (checkedToday) {
      toast({ title: "今天已经打过卡啦~", description: "明天继续加油！" });
      return;
    }
    const next = [...checkins, today].sort();
    await update("studyCheckinDates", next);
    toast({
      title: "打卡成功！🎉",
      description: `已坚持学习 ${next.length} 天，继续加油！`,
    });
  };

  // 最近 14 天的打卡热力图
  const last14Days = Array.from({ length: 14 }, (_, i) =>
    addDays(today, -13 + i),
  );

  return (
    <>
      <ModuleHeader
        title="备考倒计时"
        emoji="📚"
        description="距考试还有多少天 · 学习打卡"
        onBack={onBack}
        right={
          <Dialog open={editing} onOpenChange={setEditing}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" onClick={openEdit}>
                设置
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>编辑考试信息</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>考试名称</Label>
                  <Input
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="例如：河北教师编考试"
                  />
                </div>
                <div className="space-y-2">
                  <Label>目标考试日期</Label>
                  <Input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>开始备考日期（用于计算坚持天数）</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">取消</Button>
                </DialogClose>
                <Button onClick={handleSave}>保存</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <ModuleContainer className="space-y-5">
        {/* 主倒计时大卡片 */}
        <section className="rounded-3xl p-6 bg-gradient-to-br from-primary/15 via-accent/20 to-secondary/25 border border-primary/20 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <Target className="w-4 h-4" />
            <span>{state.examName}</span>
          </div>
          <div
            className={`text-7xl font-bold tabular-nums ${
              daysLeft > 30
                ? "text-primary"
                : daysLeft > 7
                  ? "text-orange-500"
                  : "text-destructive"
            } ${daysLeft <= 7 ? "animate-pulse-soft" : ""}`}
          >
            {daysLeft > 0 ? daysLeft : 0}
          </div>
          <div className="text-base text-muted-foreground mt-1">天</div>
          {daysLeft <= 0 && (
            <p className="text-sm text-destructive mt-3 font-medium">
              考试日已到，加油上岸！💪
            </p>
          )}
          <div className="text-xs text-muted-foreground mt-3">
            目标日期：{state.targetDate}
          </div>
        </section>

        {/* 学习打卡 */}
        <section className="rounded-2xl p-4 bg-card border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">已坚持学习</span>
              <span className="text-2xl font-bold tabular-nums text-primary">
                {studyDays}
              </span>
              <span className="text-sm text-muted-foreground">天</span>
            </div>
            <Button
              onClick={handleCheckin}
              disabled={checkedToday}
              variant={checkedToday ? "secondary" : "default"}
              size="sm"
              className="rounded-full"
            >
              {checkedToday ? "已打卡 ✓" : "今日打卡"}
            </Button>
          </div>

          {/* 14 天热力图 */}
          <div
            className="grid gap-1 mt-3"
            style={{ gridTemplateColumns: "repeat(14, 1fr)" }}
          >
            {last14Days.map((d) => {
              const checked = checkins.includes(d);
              const isToday = d === today;
              return (
                <div
                  key={d}
                  title={`${d}${checked ? " · 已打卡" : ""}`}
                  className={cn(
                    "aspect-square rounded-sm transition-all",
                    checked ? "bg-primary" : "bg-muted",
                    isToday && "ring-2 ring-primary ring-offset-1",
                  )}
                />
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            最近 14 天打卡记录 · 高亮为今天
          </p>
        </section>

        {/* 进度条 */}
        <section className="rounded-2xl p-4 bg-card border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="font-semibold">备考进度</span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              已坚持 {passedDays} / {totalDays} 天
            </span>
            <span className="text-sm font-bold text-primary tabular-nums">
              {progressPct}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </section>

        {/* 小贴士 */}
        <section className="rounded-2xl p-4 bg-secondary/40 border border-border/30">
          <div className="flex items-start gap-2">
            <CalendarIcon className="w-4 h-4 mt-0.5 text-secondary-foreground shrink-0" />
            <div className="text-sm text-secondary-foreground leading-relaxed">
              <p className="font-medium mb-1">💡 备考小贴士</p>
              <ul className="space-y-1 text-xs">
                <li>· 制定每日学习计划，量化目标</li>
                <li>· 教育学、心理学是重点，结合真题理解</li>
                <li>· 每周回顾错题本，避免重复犯错</li>
                <li>· 保持规律作息，劳逸结合</li>
              </ul>
            </div>
          </div>
        </section>
      </ModuleContainer>
    </>
  );
}
