"use client";

import { useState } from "react";
import { ModuleHeader, ModuleContainer } from "@/components/layout/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, CheckSquare, ListTodo } from "lucide-react";
import { storage } from "@/lib/storage";
import type { TodoItem, TodoCategory } from "@/lib/types";
import { uid, todayISO } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TodoListModuleProps {
  onBack: () => void;
}

const CATEGORY_LABEL: Record<TodoCategory, string> = {
  work: "工作",
  study: "备考",
  life: "生活",
};

const CATEGORY_COLOR: Record<TodoCategory, string> = {
  work: "bg-amber-100 text-amber-700",
  study: "bg-primary/15 text-primary",
  life: "bg-emerald-100 text-emerald-700",
};

export function TodoListModule({ onBack }: TodoListModuleProps) {
  const [todos, setTodos] = useState<TodoItem[]>(() =>
    storage
      .getTodos()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  );
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<TodoCategory>("study");
  const [filter, setFilter] = useState<"all" | TodoCategory>("all");
  const { toast } = useToast();

  const notify = () => window.dispatchEvent(new Event("keke:data-updated"));

  const handleAdd = () => {
    const text = content.trim();
    if (!text) {
      toast({ title: "请输入待办内容", variant: "destructive" });
      return;
    }
    const item: TodoItem = {
      id: uid("todo-"),
      content: text,
      category,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const next = [item, ...todos];
    setTodos(next);
    storage.setTodos(next);
    setContent("");
    notify();
  };

  const handleToggle = (id: string) => {
    const next = todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t,
    );
    setTodos(next);
    storage.setTodos(next);
    notify();
  };

  const handleDelete = (id: string) => {
    const next = todos.filter((t) => t.id !== id);
    setTodos(next);
    storage.setTodos(next);
    notify();
  };

  const handleClearCompleted = () => {
    if (!confirm("确定清除所有已完成的待办吗？")) return;
    const next = todos.filter((t) => !t.completed);
    setTodos(next);
    storage.setTodos(next);
    notify();
    toast({ title: "已清除完成项" });
  };

  const filtered = todos.filter((t) =>
    filter === "all" ? true : t.category === filter,
  );
  const pending = todos.filter((t) => !t.completed).length;
  const completed = todos.filter((t) => t.completed).length;

  return (
    <>
      <ModuleHeader
        title="待办清单"
        emoji="✅"
        description={`${pending} 项待办 · ${completed} 项已完成`}
        onBack={onBack}
        right={
          completed > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCompleted}
              className="text-destructive"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              清除完成
            </Button>
          ) : undefined
        }
      />

      <ModuleContainer className="space-y-4">
        {/* 添加输入框 */}
        <div className="rounded-2xl p-3 bg-card border border-border/50 space-y-2">
          <div className="flex gap-2">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="添加一项待办..."
              className="flex-1"
            />
            <Button onClick={handleAdd} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">分类：</span>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as TodoCategory)}
            >
              <SelectTrigger size="sm" className="h-7 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="work">工作</SelectItem>
                <SelectItem value="study">备考</SelectItem>
                <SelectItem value="life">生活</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 筛选 */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="work">工作</TabsTrigger>
            <TabsTrigger value="study">备考</TabsTrigger>
            <TabsTrigger value="life">生活</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 列表 */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl p-8 bg-card border border-border/50 text-center">
            <ListTodo className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {todos.length === 0
                ? "还没有待办事项，开始添加吧"
                : "该分类下暂无待办"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all",
                  t.completed
                    ? "bg-muted/30 border-border/30 opacity-60"
                    : "bg-card border-border/50",
                )}
              >
                <Checkbox
                  checked={t.completed}
                  onCheckedChange={() => handleToggle(t.id)}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm",
                      t.completed && "line-through text-muted-foreground",
                    )}
                  >
                    {t.content}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded",
                        CATEGORY_COLOR[t.category],
                      )}
                    >
                      {CATEGORY_LABEL[t.category]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(t.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="shrink-0 p-1.5 rounded-md hover:bg-destructive/10 text-destructive"
                  aria-label="删除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 统计 */}
        {todos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl p-2 bg-card border border-border/50">
              <div className="text-lg font-bold tabular-nums">{todos.length}</div>
              <div className="text-[10px] text-muted-foreground">总计</div>
            </div>
            <div className="rounded-xl p-2 bg-card border border-border/50">
              <div className="text-lg font-bold tabular-nums text-primary">
                {pending}
              </div>
              <div className="text-[10px] text-muted-foreground">待办</div>
            </div>
            <div className="rounded-xl p-2 bg-card border border-border/50">
              <div className="text-lg font-bold tabular-nums text-emerald-600">
                {completed}
              </div>
              <div className="text-[10px] text-muted-foreground">完成</div>
            </div>
          </div>
        )}
      </ModuleContainer>
    </>
  );
}
