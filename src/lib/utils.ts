/**
 * 可可的工作台 - 工具函数
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 生成唯一 ID */
export function uid(prefix = ""): string {
  return `${prefix}${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/** 获取今日日期 YYYY-MM-DD */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 计算两个日期相差天数（不含时间） */
export function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00");
  const b = new Date(to + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/** 添加天数到日期 */
export function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 根据时间获取问候语 */
export function getGreeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 6) return "夜深了，可可老师";
  if (h < 11) return "早上好，可可老师";
  if (h < 13) return "中午好，可可老师";
  if (h < 18) return "下午好，可可老师";
  if (h < 22) return "晚上好，可可老师";
  return "夜深了，可可老师";
}

/** 根据时间获取对应 emoji */
export function getGreetingEmoji(date = new Date()): string {
  const h = date.getHours();
  if (h < 6) return "🌙";
  if (h < 11) return "🌅";
  if (h < 13) return "☀️";
  if (h < 18) return "☀️";
  if (h < 22) return "🌆";
  return "🌙";
}

/** 格式化日期为中文显示 */
export function formatChineseDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 触发文件下载 */
export function downloadFile(content: string, filename: string, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
