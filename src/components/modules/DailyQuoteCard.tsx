"use client";

import { useState } from "react";
import { storage } from "@/lib/storage";
import { todayISO } from "@/lib/utils";

/** 每日一言语录库 */
export const QUOTES: { text: string; category: string }[] = [
  // 备考鼓励
  { text: "每一道题都是通往讲台的台阶，加油，未来的可可老师！", category: "备考" },
  { text: "今天比昨天进步一点点，就是了不起的成就。", category: "备考" },
  { text: "坚持不是因为没有困难，而是因为心中有光。", category: "备考" },
  { text: "你背过的每一个知识点，都会在考场上回响。", category: "备考" },
  { text: "慢慢来，比较快。理解一道题胜过死记十道题。", category: "备考" },
  // 教师寄语
  { text: "教育不是注满一桶水，而是点燃一把火。", category: "教师" },
  { text: "学高为师，身正为范。愿你不负这份神圣。", category: "教师" },
  { text: "教师的影响是永恒的，连他自己都无法估量。", category: "教师" },
  { text: "教育的本质意味着：一棵树摇动另一棵树，一朵云推动另一朵云。", category: "教师" },
  // 生活小确幸
  { text: "今天也要好好吃饭，好好睡觉，好好爱自己。", category: "生活" },
  { text: "阳光正好，微风不燥，是适合学习的好日子。", category: "生活" },
  { text: "记得喝水，记得深呼吸，记得你正成为更好的自己。", category: "生活" },
  { text: "生活不会亏待每一个努力的人，慢慢来。", category: "生活" },
  { text: "今天也要笑一笑，烦恼都被风吹走啦~", category: "生活" },
  { text: "你不是一个人在战斗，云朵和星星都在为你加油。", category: "生活" },
];

interface DailyQuoteCardProps {
  onClick?: () => void;
}

/**
 * 首页内嵌的每日一言卡片
 * - 每天自动换一句
 * - 点击进入完整模块
 */
export function DailyQuoteCard({ onClick }: DailyQuoteCardProps) {
  // 懒加载初始值，避免在 effect 中调用 setState
  const [quote] = useState<{ text: string; category: string }>(() => {
    const today = todayISO();
    const state = storage.getQuoteState();
    let index: number;
    if (state.date === today) {
      index = state.index % QUOTES.length;
    } else {
      // 按日期生成稳定索引，每天不同
      const seed = today
        .split("-")
        .reduce((acc, s) => acc * 31 + parseInt(s, 10), 0);
      index = seed % QUOTES.length;
      storage.setQuoteState({ date: today, index });
    }
    return QUOTES[index];
  });

  return (
    <section
      onClick={onClick}
      className="cursor-pointer card-hover rounded-2xl p-4 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border border-amber-200/50"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0">✨</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
              {quote.category}
            </span>
            <span className="text-[10px] text-muted-foreground">每日一言</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed font-medium">
            {quote.text}
          </p>
        </div>
      </div>
    </section>
  );
}
