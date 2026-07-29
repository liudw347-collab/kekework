"use client";

import { useState, useEffect } from "react";
import { Share, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * iOS 添加到主屏幕引导
 *
 * 检测条件：
 * 1. iOS Safari 浏览器（非 standalone 模式）
 * 2. 用户访问超过 1 次（避免首次就弹）
 * 3. 7 天内不重复提示
 *
 * 引导内容：
 * - 点击底部分享按钮
 * - 选择"添加到主屏幕"
 */
const STORAGE_KEY = "keke_ios_pwa_guide";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 天

export function IosPwaGuide() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 检测是否 iOS Safari 且非 standalone 模式
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android|crios|fxios).)*\/safari/i.test(
      navigator.userAgent,
    );
    // 检测是否已经添加到主屏幕（standalone 模式）
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (!isIOS || !isSafari || isStandalone) {
      return;
    }

    // 检查是否在 7 天内关闭过
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const dismissTime = parseInt(dismissed, 10);
      if (Date.now() - dismissTime < DISMISS_DURATION) {
        return;
      }
    }

    // 检查访问次数（第 2 次访问才提示）
    const visitCount = parseInt(
      localStorage.getItem("keke_visit_count") || "0",
      "10",
    );
    localStorage.setItem("keke_visit_count", String(visitCount + 1));
    if (visitCount < 1) {
      return;
    }

    // 延迟 3 秒显示，避免打断用户
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto animate-fade-in-up">
      <div className="bg-card border border-border/50 rounded-2xl shadow-xl p-4 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
          aria-label="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl shrink-0">
            📱
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">
              添加到主屏幕
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              像原生 App 一样使用，无需每次打开浏览器
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
                  1
                </span>
                <span>点击底部</span>
                <Share className="w-3.5 h-3.5 inline text-primary" />
                <span>分享按钮</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
                  2
                </span>
                <span>选择「添加到主屏幕」</span>
                <Plus className="w-3.5 h-3.5 inline text-primary" />
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-xs h-7"
              >
                稍后再说
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
