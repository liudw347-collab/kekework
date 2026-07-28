"use client";

import { ModuleHeader, ModuleContainer } from "@/components/layout/ModuleHeader";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import type { ToolItem } from "@/lib/types";

interface ToolboxModuleProps {
  onBack: () => void;
}

/** 5 个已有工具项目 */
const TOOLS: ToolItem[] = [
  {
    id: "grade-table",
    name: "手写成绩转 Excel",
    description: "拍照识别手写成绩，自动生成 Excel 表格",
    url: "https://grade-table-digitalizer.pages.dev/",
    icon: "📊",
    color: "from-blue-100 to-cyan-100",
  },
  {
    id: "certificate",
    name: "奖状批量生成",
    description: "上传名单批量生成学生奖状 PDF",
    url: "https://certificate-generator-2w1.pages.dev/",
    icon: "🏆",
    color: "from-amber-100 to-yellow-100",
  },
  {
    id: "rank-analysis",
    name: "考试排名进步分析",
    description: "对比多次考试排名变化，可视化进步趋势",
    url: "https://analys-4ib.pages.dev/",
    icon: "📈",
    color: "from-emerald-100 to-green-100",
  },
  {
    id: "score-analysis",
    name: "考试成绩计算",
    description: "快速计算总分、平均分、各科成绩统计",
    url: "https://score-analysis-ay4.pages.dev/",
    icon: "🧮",
    color: "from-pink-100 to-rose-100",
  },
  {
    id: "exam-seat",
    name: "考号分配系统",
    description: "自动分配考场座位号，支持导出打印",
    url: "https://exam-seat-system.pages.dev/",
    icon: "🪑",
    color: "from-purple-100 to-violet-100",
  },
];

export function ToolboxModule({ onBack }: ToolboxModuleProps) {
  /** 在新窗口打开工具 */
  const openTool = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <ModuleHeader
        title="我的工具箱"
        emoji="🔧"
        description="集成已有项目 · 点击跳转"
        onBack={onBack}
      />

      <ModuleContainer className="space-y-4">
        <p className="text-sm text-muted-foreground px-1">
          以下是可可老师已部署的教学工具，点击卡片在新窗口打开。每个工具页面右上角有「返回工作台」按钮，可一键回到这里。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => openTool(tool.url)}
              className="card-hover group relative overflow-hidden rounded-2xl p-5 bg-card border border-border/50 shadow-sm text-left"
            >
              {/* 返回工作台徽章 - 右上角 */}
              <div className="absolute top-2 right-2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-background/80 backdrop-blur px-1.5 py-0.5 rounded-full">
                <span>返回工作台</span>
                <ArrowUpRight className="w-2.5 h-2.5" />
              </div>

              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-2xl mb-3`}
              >
                {tool.icon}
              </div>
              <h3 className="font-semibold text-base text-foreground mb-1 flex items-center gap-1">
                {tool.name}
                <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tool.description}
              </p>
              <div className="mt-3 text-[10px] text-muted-foreground truncate">
                {tool.url.replace("https://", "").replace(/\/$/, "")}
              </div>
            </button>
          ))}
        </div>

        {/* 提示 */}
        <section className="rounded-2xl p-4 bg-accent/30 border border-accent/30">
          <div className="flex items-start gap-2 text-sm text-accent-foreground">
            <span className="text-lg">💡</span>
            <div className="leading-relaxed">
              <p className="font-medium mb-1">关于返回工作台</p>
              <p className="text-xs">
                这些工具在独立页面运行。如需在工具页面添加「返回工作台」按钮，可在对应项目中加入指向本站的链接。
              </p>
            </div>
          </div>
        </section>
      </ModuleContainer>
    </>
  );
}
