"use client";

import { useEffect, useState, useMemo } from "react";
import { ModuleHeader, ModuleContainer } from "@/components/layout/ModuleHeader";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { storage } from "@/lib/storage";
import { todayISO, formatChineseDate, daysBetween, addDays } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface QuickCalendarModuleProps {
  onBack: () => void;
}

interface DayInfo {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  marks: { type: "period" | "exam" | "anniversary"; label: string }[];
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export function QuickCalendarModule({ onBack }: QuickCalendarModuleProps) {
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [, setTick] = useState(0);

  const today = todayISO();

  // 从各模块读取重要日期
  const examDate = useMemo(() => storage.getExamCountdown().targetDate, []);
  const periodRecords = useMemo(() => storage.getPeriodRecords(), []);
  const periodSettings = useMemo(() => storage.getPeriodSettings(), []);

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener("keke:data-updated", handler);
    return () => window.removeEventListener("keke:data-updated", handler);
  }, []);

  /** 计算日历网格 */
  const days: DayInfo[] = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startWeekday = firstDay.getDay();
    const totalDays = lastDay.getDate();

    // 上月填充
    const prevLastDay = new Date(viewYear, viewMonth, 0).getDate();
    const result: DayInfo[] = [];

    // 预测经期范围
    const periodRanges: { start: string; end: string }[] = [];
    const sorted = [...periodRecords].sort((a, b) =>
      a.startDate < b.startDate ? -1 : 1,
    );
    sorted.forEach((r, i) => {
      const start = r.startDate;
      const end = addDays(start, r.duration - 1);
      periodRanges.push({ start, end });
      // 预测下次
      const nextStart = addDays(start, periodSettings.defaultCycle);
      const nextEnd = addDays(nextStart, r.duration - 1);
      if (new Date(nextStart) <= new Date(viewYear, viewMonth + 1, 0)) {
        periodRanges.push({ start: nextStart, end: nextEnd });
      }
    });

    // 上月填充
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = prevLastDay - i;
      const dateStr = new Date(viewYear, viewMonth - 1, d)
        .toISOString()
        .slice(0, 10);
      result.push({
        date: dateStr,
        isCurrentMonth: false,
        isToday: dateStr === today,
        marks: getMarks(dateStr),
      });
    }

    // 本月
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = new Date(viewYear, viewMonth, d)
        .toISOString()
        .slice(0, 10);
      result.push({
        date: dateStr,
        isCurrentMonth: true,
        isToday: dateStr === today,
        marks: getMarks(dateStr),
      });
    }

    // 下月填充
    const remaining = 42 - result.length; // 6 行 × 7 列
    for (let d = 1; d <= remaining; d++) {
      const dateStr = new Date(viewYear, viewMonth + 1, d)
        .toISOString()
        .slice(0, 10);
      result.push({
        date: dateStr,
        isCurrentMonth: false,
        isToday: dateStr === today,
        marks: getMarks(dateStr),
      });
    }

    function getMarks(dateStr: string) {
      const marks: DayInfo["marks"] = [];
      // 经期
      if (
        periodRanges.some(
          (r) => dateStr >= r.start && dateStr <= r.end,
        )
      ) {
        marks.push({ type: "period", label: "经期" });
      }
      // 考试
      if (dateStr === examDate) {
        marks.push({ type: "exam", label: "考试" });
      }
      return marks;
    }

    return result;
  }, [viewYear, viewMonth, today, examDate, periodRecords, periodSettings]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const examDaysLeft = daysBetween(today, examDate);

  return (
    <>
      <ModuleHeader
        title="快捷日历"
        emoji="📅"
        description="本月日历 · 重要日期标注"
        onBack={onBack}
      />

      <ModuleContainer className="space-y-4">
        {/* 月份切换 */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={goPrevMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <div className="text-lg font-semibold">
              {viewYear} 年 {viewMonth + 1} 月
            </div>
            <button
              onClick={goToday}
              className="text-xs text-primary hover:underline"
            >
              回到今天
            </button>
          </div>
          <Button variant="ghost" size="icon" onClick={goNextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* 日历主体 */}
        <div className="rounded-2xl p-3 bg-card border border-border/50">
          {/* 星期表头 */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={cn(
                  "text-center text-xs font-medium py-1",
                  i === 0 || i === 6
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {w}
              </div>
            ))}
          </div>

          {/* 日期格 */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => (
              <div
                key={i}
                className={cn(
                  "aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative",
                  !d.isCurrentMonth && "opacity-30",
                  d.isToday
                    ? "bg-primary text-primary-foreground font-bold"
                    : d.marks.length > 0
                      ? "bg-muted/50"
                      : "hover:bg-muted/30",
                )}
              >
                <span>{parseInt(d.date.slice(8), 10)}</span>
                {d.marks.length > 0 && (
                  <div className="absolute bottom-0.5 flex gap-0.5">
                    {d.marks.map((m, mi) => (
                      <span
                        key={mi}
                        className={cn(
                          "w-1 h-1 rounded-full",
                          m.type === "period"
                            ? "bg-pink-500"
                            : m.type === "exam"
                              ? "bg-destructive"
                              : "bg-amber-500",
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 图例 */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            <span>经期</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-destructive" />
            <span>考试日</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>今天</span>
          </div>
        </div>

        {/* 重要日期提示 */}
        <section className="rounded-2xl p-4 bg-card border border-border/50 space-y-2">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
            <CalendarDays className="w-4 h-4" />
            近期重要日期
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/5">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive" />
                {storage.getExamCountdown().examName}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatChineseDate(examDate)} ·{" "}
                {examDaysLeft > 0 ? `还有 ${examDaysLeft} 天` : "已到"}
              </span>
            </div>
            {periodRecords.length > 0 && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-pink-50">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  预计下次经期
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatChineseDate(
                    addDays(
                      [...periodRecords].sort((a, b) =>
                        a.startDate < b.startDate ? 1 : -1,
                      )[0].startDate,
                      periodSettings.defaultCycle,
                    ),
                  )}
                </span>
              </div>
            )}
          </div>
        </section>
      </ModuleContainer>
    </>
  );
}
