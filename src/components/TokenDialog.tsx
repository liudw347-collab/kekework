"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  KeyRound,
  Loader2,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import {
  hasAccessToken,
  setAccessToken,
  clearAccessToken,
} from "@/lib/cloud-api";
import { useAppData } from "@/context/AppDataContext";

interface TokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 访问令牌设置对话框
 *
 * 用户首次使用时输入访问令牌，令牌保存到 localStorage
 * 令牌会作为 X-Access-Token 头发送到后端进行鉴权
 */
export function TokenDialog({ open, onOpenChange }: TokenDialogProps) {
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { reload } = useAppData();

  // 对话框打开时自动聚焦输入框，并清空之前的状态
  useEffect(() => {
    if (open) {
      setToken("");
      setLocalError(null);
      setSaving(false);
      // 延迟聚焦，等动画完成
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const canSubmit = token.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setLocalError(null);
    setAccessToken(token.trim());
    try {
      // reload 成功意味着令牌有效；失败会抛错
      await reload();
      onOpenChange(false);
    } catch {
      // reload 内部已经设置了 error 状态，这里只需提示用户
      setLocalError("令牌验证失败，请检查输入是否正确");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    clearAccessToken();
    await reload();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            设置访问令牌
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            输入你设置的访问令牌，凭此令牌可在不同设备同步数据。令牌保存在本机，下次打开自动登录。
          </p>
          <div className="space-y-2">
            <Label htmlFor="token-input">访问令牌</Label>
            <div className="relative">
              <Input
                id="token-input"
                ref={inputRef}
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (localError) setLocalError(null);
                }}
                placeholder="请输入访问令牌"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSubmit) {
                    handleSave();
                  }
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted text-muted-foreground"
                aria-label={showToken ? "隐藏令牌" : "显示令牌"}
              >
                {showToken ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {/* 输入状态指示 */}
            {token.trim().length > 0 && !localError && (
              <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3" />
                已输入 {token.trim().length} 个字符，可点击下方按钮验证
              </p>
            )}
          </div>
          {localError && (
            <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{localError}</span>
            </div>
          )}
          <div className="rounded-md bg-secondary/40 border border-border/30 p-2 text-xs text-muted-foreground">
            <p className="font-medium mb-1 text-foreground">💡 忘记令牌？</p>
            <p>
              令牌由你首次部署网站时设置。如遗忘，可重新设置一个新令牌，所有设备重新登录即可。
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          {hasAccessToken() && (
            <Button
              variant="ghost"
              onClick={handleClear}
              className="text-destructive mr-auto"
            >
              清除令牌
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="outline" disabled={saving}>
              取消
            </Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={!canSubmit}
            className={
              canSubmit
                ? "bg-primary shadow-md"
                : ""
            }
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                验证中...
              </>
            ) : (
              "保存并验证"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
