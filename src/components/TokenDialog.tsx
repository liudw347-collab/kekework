"use client";

import { useState } from "react";
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
import { AlertCircle, KeyRound, Loader2 } from "lucide-react";
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
  const { reload } = useAppData();

  const handleSave = async () => {
    setSaving(true);
    setLocalError(null);
    setAccessToken(token);
    try {
      // reload 成功意味着令牌有效；失败会抛错
      await reload();
      onOpenChange(false);
    } catch {
      // reload 内部已经设置了 error 状态，这里只需提示用户
      setLocalError("令牌验证失败，请检查后重试");
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
            为保护个人数据安全，请输入访问令牌。令牌需与 Cloudflare Pages
            环境变量中配置的 <code className="bg-muted px-1 rounded">ACCESS_TOKEN</code> 一致。
            设置后将保存在本机浏览器中，后续打开自动登录。
          </p>
          <div className="space-y-2">
            <Label>访问令牌</Label>
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="请输入访问令牌"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          {localError && (
            <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{localError}</span>
            </div>
          )}
          <div className="rounded-md bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800">
            <p className="font-medium mb-1">💡 提示</p>
            <p>
              首次部署后，在 Cloudflare Pages 项目设置 → Environment Variables 中添加
              <code className="bg-amber-100 px-1 rounded mx-0.5">ACCESS_TOKEN</code>
              变量，值自定义（如 <code className="bg-amber-100 px-1 rounded">keke-secret-2024</code>）。
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
          <Button onClick={handleSave} disabled={saving || !token.trim()}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                验证中
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
