"use client";

import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleHeaderProps {
  title: string;
  emoji: string;
  description?: string;
  onBack: () => void;
  right?: React.ReactNode;
}

/**
 * 模块详情页头部 - 含返回按钮、标题、副标题
 */
export function ModuleHeader({
  title,
  emoji,
  description,
  onBack,
  right,
}: ModuleHeaderProps) {
  return (
    <div className="sticky top-[68px] z-20 bg-background/85 backdrop-blur-md border-b border-border/40">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="shrink-0 p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="返回"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold flex items-center gap-1.5">
            <span>{emoji}</span>
            <span className="truncate">{title}</span>
          </h2>
          {description && (
            <p className="text-xs text-muted-foreground truncate">
              {description}
            </p>
          )}
        </div>
        {right}
      </div>
    </div>
  );
}

/**
 * 模块容器 - 统一最大宽度和 padding
 */
export function ModuleContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl mx-auto px-4 py-4", className)}>{children}</div>
  );
}
