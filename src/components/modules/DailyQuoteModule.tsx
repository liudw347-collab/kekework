"use client";

import { useState } from "react";
import { ModuleHeader, ModuleContainer } from "@/components/layout/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Heart, Share2 } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { QUOTES } from "./DailyQuoteCard";
import { todayISO } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface DailyQuoteModuleProps {
  onBack: () => void;
}

export function DailyQuoteModule({ onBack }: DailyQuoteModuleProps) {
  const { data, update } = useAppData();
  const today = todayISO();

  // 计算当前 index（与首页保持一致）
  const [index, setIndex] = useState(() => {
    if (data.lastQuoteDate === today) {
      return data.lastQuoteIndex % QUOTES.length;
    }
    const seed = today
      .split("-")
      .reduce((acc, s) => acc * 31 + parseInt(s, 10), 0);
    const idx = seed % QUOTES.length;
    void update("lastQuoteDate", today);
    void update("lastQuoteIndex", idx);
    return idx;
  });
  const [category, setCategory] = useState<string>("全部");
  const { toast } = useToast();

  const categories = ["全部", "备考", "教师", "生活"];
  const filteredQuotes =
    category === "全部"
      ? QUOTES
      : QUOTES.filter((q) => q.category === category);

  const currentQuote = QUOTES[index];

  const handleRefresh = () => {
    const pool = filteredQuotes;
    if (pool.length === 0) return;
    let next = index;
    while (next === index && pool.length > 1) {
      next = QUOTES.indexOf(pool[Math.floor(Math.random() * pool.length)]);
    }
    setIndex(next);
    void update("lastQuoteIndex", next);
  };

  const handleShare = async () => {
    const text = `${currentQuote.text}\n\n— 可可的工作台`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        toast({ title: "已复制到剪贴板 📋" });
      }
    } catch {
      // 用户取消分享，不做处理
    }
  };

  return (
    <>
      <ModuleHeader
        title="每日一言"
        emoji="✨"
        description="温暖治愈 · 励志前行"
        onBack={onBack}
      />

      <ModuleContainer className="space-y-4">
        {/* 主卡片 */}
        <section className="rounded-3xl p-8 bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100 border border-amber-200 text-center min-h-[280px] flex flex-col items-center justify-center">
          <div className="text-5xl mb-4">✨</div>
          <p className="text-xl font-medium text-foreground leading-relaxed px-4">
            {currentQuote.text}
          </p>
          <Badge
            variant="secondary"
            className="mt-4 bg-amber-200/60 text-amber-800"
          >
            {currentQuote.category}
          </Badge>
        </section>

        {/* 操作 */}
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex-1 rounded-full"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            换一句
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex-1 rounded-full"
          >
            <Share2 className="w-4 h-4 mr-1" />
            分享
          </Button>
        </div>

        {/* 分类筛选 */}
        <section className="rounded-2xl p-4 bg-card border border-border/50">
          <h3 className="font-semibold mb-3 text-sm">分类浏览</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${
                  category === c
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredQuotes.map((q, i) => {
              const realIndex = QUOTES.indexOf(q);
              return (
                <button
                  key={i}
                  onClick={() => {
                    setIndex(realIndex);
                    void update("lastQuoteIndex", realIndex);
                  }}
                  className={`w-full text-left p-3 rounded-xl text-sm transition-all ${
                    realIndex === index
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Heart className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                    <div className="flex-1">
                      <p className="text-foreground leading-relaxed">
                        {q.text}
                      </p>
                      <span className="text-[10px] text-muted-foreground mt-1 inline-block">
                        {q.category}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </ModuleContainer>
    </>
  );
}
