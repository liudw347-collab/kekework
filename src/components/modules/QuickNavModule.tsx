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
import {
  Plus,
  Trash2,
  ExternalLink,
  Pencil,
  Compass,
} from "lucide-react";
import { storage } from "@/lib/storage";
import type { Bookmark } from "@/lib/types";
import { uid } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface QuickNavModuleProps {
  onBack: () => void;
}

const EMOJI_OPTIONS = ["📚", "🏫", "📋", "💻", "⭐", "☁️", "🔗", "📖", "🎓", "📝", "🌐", "📌"];

export function QuickNavModule({ onBack }: QuickNavModuleProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() =>
    storage.getBookmarks(),
  );
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("🔗");
  const [category, setCategory] = useState("常用");
  const { toast } = useToast();

  const notify = () => window.dispatchEvent(new Event("keke:data-updated"));

  const handleSave = () => {
    if (!title.trim() || !url.trim()) {
      toast({ title: "请填写名称和网址", variant: "destructive" });
      return;
    }
    let finalUrl = url.trim();
    if (!/^https?:\/\//.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }

    if (editing) {
      const next = bookmarks.map((b) =>
        b.id === editing.id
          ? { ...b, title: title.trim(), url: finalUrl, icon, category }
          : b,
      );
      setBookmarks(next);
      storage.setBookmarks(next);
      toast({ title: "已更新 ✅" });
    } else {
      const bm: Bookmark = {
        id: uid("bm-"),
        title: title.trim(),
        url: finalUrl,
        icon,
        category,
      };
      const next = [...bookmarks, bm];
      setBookmarks(next);
      storage.setBookmarks(next);
      toast({ title: "已添加 ✅" });
    }
    closeDialog();
  };

  const closeDialog = () => {
    setEditing(null);
    setAdding(false);
    setTitle("");
    setUrl("");
    setIcon("🔗");
    setCategory("常用");
  };

  const handleEdit = (bm: Bookmark) => {
    setEditing(bm);
    setTitle(bm.title);
    setUrl(bm.url);
    setIcon(bm.icon || "🔗");
    setCategory(bm.category);
  };

  const handleDelete = (id: string) => {
    if (!confirm("确定删除此书签吗？")) return;
    const next = bookmarks.filter((b) => b.id !== id);
    setBookmarks(next);
    storage.setBookmarks(next);
    toast({ title: "已删除" });
  };

  const handleOpen = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // 按分类分组
  const grouped = bookmarks.reduce(
    (acc, bm) => {
      if (!acc[bm.category]) acc[bm.category] = [];
      acc[bm.category].push(bm);
      return acc;
    },
    {} as Record<string, Bookmark[]>,
  );

  return (
    <>
      <ModuleHeader
        title="快捷导航"
        emoji="📖"
        description={`${bookmarks.length} 个书签`}
        onBack={onBack}
        right={
          <Dialog
            open={adding || !!editing}
            onOpenChange={(o) => !o && closeDialog()}
          >
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => {
                  setAdding(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                添加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "编辑书签" : "添加书签"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-2">
                  <Label>名称</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例如：河北省教育厅"
                  />
                </div>
                <div className="space-y-2">
                  <Label>网址</Label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>分类</Label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="例如：官方机构 / 备考资料"
                  />
                </div>
                <div className="space-y-2">
                  <Label>图标</Label>
                  <div className="flex flex-wrap gap-1">
                    {EMOJI_OPTIONS.map((e) => (
                      <button
                        key={e}
                        onClick={() => setIcon(e)}
                        className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                          icon === e
                            ? "bg-primary/15 ring-2 ring-primary"
                            : "bg-muted/50 hover:bg-muted"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
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

      <ModuleContainer className="space-y-4">
        {bookmarks.length === 0 ? (
          <div className="rounded-2xl p-8 bg-card border border-border/50 text-center">
            <Compass className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              还没有书签，点击右上角添加
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, list]) => (
            <section key={cat}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
                {cat}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {list.map((bm) => (
                  <div
                    key={bm.id}
                    className="card-hover group relative rounded-2xl p-3 bg-card border border-border/50 flex flex-col items-center text-center"
                  >
                    <button
                      onClick={() => handleOpen(bm.url)}
                      className="flex flex-col items-center w-full"
                    >
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-accent/20 flex items-center justify-center text-2xl mb-1.5">
                        {bm.icon || "🔗"}
                      </div>
                      <div className="text-xs font-medium line-clamp-1 w-full">
                        {bm.title}
                      </div>
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                    </button>
                    {/* 操作按钮 */}
                    <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(bm)}
                        className="p-1 rounded bg-background/80 backdrop-blur hover:bg-muted"
                        aria-label="编辑"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(bm.id)}
                        className="p-1 rounded bg-background/80 backdrop-blur hover:bg-destructive/10 text-destructive"
                        aria-label="删除"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}

        {/* 推荐网站 */}
        <section className="rounded-2xl p-4 bg-secondary/40 border border-border/30">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            💡 推荐添加
          </h3>
          <div className="text-xs text-secondary-foreground space-y-1">
            <p>· 学信网：https://www.chsi.com.cn/</p>
            <p>· 中国教师研修网：https://www.teacherclub.com.cn/</p>
            <p>· 一起考教师：可下载 APP</p>
          </div>
        </section>
      </ModuleContainer>
    </>
  );
}
