"use client";

import { useState } from "react";
import { ModuleHeader, ModuleContainer } from "@/components/layout/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Minus, Settings, Droplets } from "lucide-react";
import { storage } from "@/lib/storage";
import type { WaterState } from "@/lib/types";
import { todayISO } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface WaterReminderModuleProps {
  onBack: () => void;
}

export function WaterReminderModule({ onBack }: WaterReminderModuleProps) {
  // 懒加载初始状态，并处理跨天重置
  const [state, setState] = useState<WaterState>(() => {
    const stored = storage.getWaterState();
    const today = todayISO();
    if (stored.todayDate !== today) {
      const next: WaterState = {
        ...stored,
        todayDate: today,
        todayCount: 0,
        history: {
          ...stored.history,
          [stored.todayDate]: stored.todayCount,
        },
      };
      storage.setWaterState(next);
      return next;
    }
    return stored;
  });
  const [settingOpen, setSettingOpen] = useState(false);
  const [goalInput, setGoalInput] = useState(state.dailyGoal);
  const { toast } = useToast();

  const notify = () => window.dispatchEvent(new Event("keke:data-updated"));

  const handleAdd = () => {
    const next: WaterState = {
      ...state,
      todayCount: Math.min(state.todayCount + 1, 50),
    };
    setState(next);
    storage.setWaterState(next);
    notify();
    if (next.todayCount === state.dailyGoal) {
      toast({
        title: "达成今日目标！🎉",
        description: "你真棒，记得保持~",
      });
    }
  };

  const handleSubtract = () => {
    if (state.todayCount === 0) return;
    const next: WaterState = {
      ...state,
      todayCount: state.todayCount - 1,
    };
    setState(next);
    storage.setWaterState(next);
    notify();
  };

  const handleSaveGoal = () => {
    const next: WaterState = {
      ...state,
      dailyGoal: Math.max(1, Math.min(30, goalInput)),
    };
    setState(next);
    storage.setWaterState(next);
    setSettingOpen(false);
    notify();
    toast({ title: "已更新目标 ✅" });
  };

  const progressPct = Math.min(
    100,
    Math.round((state.todayCount / state.dailyGoal) * 100),
  );
  const remaining = Math.max(0, state.dailyGoal - state.todayCount);

  return (
    <>
      <ModuleHeader
        title="喝水提醒"
        emoji="💧"
        description="今日水分摄入记录"
        onBack={onBack}
        right={
          <Dialog open={settingOpen} onOpenChange={setSettingOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>设置每日目标</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <Label>每日喝水目标（杯）</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={goalInput}
                  onChange={(e) =>
                    setGoalInput(parseInt(e.target.value) || 8)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  一般建议每天 8 杯水（约 2000ml），可根据体重和运动量调整
                </p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">取消</Button>
                </DialogClose>
                <Button onClick={handleSaveGoal}>保存</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <ModuleContainer className="space-y-5">
        {/* 主进度环 */}
        <section className="rounded-3xl p-6 bg-gradient-to-br from-sky-100 via-cyan-100 to-blue-100 border border-sky-200 text-center">
          <div className="text-6xl mb-2">
            {progressPct >= 100 ? "🎯" : "💧"}
          </div>
          <div className="text-5xl font-bold tabular-nums text-sky-700">
            {state.todayCount}
            <span className="text-2xl text-sky-500">/{state.dailyGoal}</span>
          </div>
          <p className="text-sm text-sky-600 mt-1">杯</p>

          <div className="mt-4 max-w-xs mx-auto">
            <Progress
              value={progressPct}
              className="h-3 bg-white/60"
            />
            <p className="text-xs text-sky-600 mt-2">
              {progressPct >= 100
                ? "今日目标已达成 💪"
                : `还差 ${remaining} 杯达成目标`}
            </p>
          </div>
        </section>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <Button
            onClick={handleSubtract}
            disabled={state.todayCount === 0}
            variant="outline"
            size="lg"
            className="flex-1 rounded-full h-14"
          >
            <Minus className="w-5 h-5 mr-1" />
            撤一杯
          </Button>
          <Button
            onClick={handleAdd}
            size="lg"
            className="flex-1 rounded-full h-14 bg-sky-500 hover:bg-sky-600"
          >
            <Plus className="w-5 h-5 mr-1" />
            喝一杯
          </Button>
        </div>

        {/* 杯子可视化 */}
        <section className="rounded-2xl p-4 bg-card border border-border/50">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-sky-500" />
            今日记录
          </h3>
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
            {Array.from({ length: state.dailyGoal }).map((_, i) => {
              const filled = i < state.todayCount;
              return (
                <div
                  key={i}
                  className={cn(
                    "aspect-[3/4] rounded-md border-2 flex items-end justify-center pb-1 transition-all",
                    filled
                      ? "bg-gradient-to-t from-sky-400 to-sky-300 border-sky-500"
                      : "bg-muted/30 border-border",
                  )}
                >
                  <span className="text-[10px] text-center">
                    {filled ? "💧" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 小贴士 */}
        <section className="rounded-2xl p-4 bg-secondary/40 border border-border/30">
          <div className="flex items-start gap-2">
            <span className="text-lg">💡</span>
            <div className="text-xs text-secondary-foreground leading-relaxed">
              <p className="font-medium mb-1">喝水小贴士</p>
              <ul className="space-y-0.5">
                <li>· 起床后喝一杯温水，唤醒身体</li>
                <li>· 每隔 1-2 小时喝一杯，不要等到口渴</li>
                <li>· 经期多喝热水，少喝冷饮</li>
                <li>· 运动前后及时补水</li>
              </ul>
            </div>
          </div>
        </section>
      </ModuleContainer>
    </>
  );
}
