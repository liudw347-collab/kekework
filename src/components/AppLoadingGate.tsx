"use client";

import { Loader2, CloudOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/AppDataContext";
import { TokenDialog } from "@/components/TokenDialog";
import { useState } from "react";

/**
 * 全局加载/错误状态
 * - loading: 显示加载动画
 * - needToken: 显示输入令牌提示条
 * - error: 显示错误信息（但允许继续使用，数据会降级到默认值）
 */
export function AppLoadingGate({ children }: { children: React.ReactNode }) {
  const { loading, needToken, error } = useAppData();
  const [tokenOpen, setTokenOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-accent/15 to-secondary/15">
        <div className="text-5xl mb-4 animate-pulse-soft">🌸</div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">正在同步云端数据...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {(needToken || error) && (
        <div className="bg-amber-100 border-b border-amber-200 text-amber-800 text-xs px-4 py-2 flex items-center gap-2 safe-top">
          {needToken ? (
            <>
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span>请设置访问令牌以启用数据同步</span>
              <Button
                size="sm"
                variant="outline"
                className="h-6 ml-auto text-xs"
                onClick={() => setTokenOpen(true)}
              >
                设置令牌
              </Button>
            </>
          ) : (
            <>
              <CloudOff className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {error?.message || "网络同步异常"}，请检查网络后重试
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-6 ml-auto text-xs shrink-0"
                onClick={() => window.location.reload()}
              >
                重试
              </Button>
            </>
          )}
        </div>
      )}
      {children}
      <TokenDialog open={tokenOpen} onOpenChange={setTokenOpen} />
    </>
  );
}
