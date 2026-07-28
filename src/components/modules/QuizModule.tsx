"use client";

import { useMemo, useState, useRef } from "react";
import { ModuleHeader, ModuleContainer } from "@/components/layout/ModuleHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  FileText,
  Upload,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Download,
  BookOpen,
} from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import type { Question, QuizStats, QuizRecord, QuestionType } from "@/lib/types";
import { uid, downloadFile, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface QuizModuleProps {
  onBack: () => void;
}

/** 示例题库 - 用户首次导入参考 */
const SAMPLE_QUESTIONS: Question[] = [
  {
    id: "q-sample-1",
    type: "single",
    category: "教育学",
    stem: "“学而不思则罔，思而不学则殆”出自哪部典籍？",
    options: ["《大学》", "《论语》", "《中庸》", "《孟子》"],
    answer: 1,
    analysis: "此句出自《论语·为政》，强调学思结合的重要性。",
  },
  {
    id: "q-sample-2",
    type: "judge",
    category: "心理学",
    stem: "皮亚杰认为儿童认知发展经历了四个阶段，其中前运算阶段的儿童已具备守恒概念。",
    options: ["正确", "错误"],
    answer: 1,
    analysis:
      "错误。前运算阶段（2-7岁）的儿童尚未具备守恒概念，具体运算阶段（7-11岁）才逐步形成。",
  },
  {
    id: "q-sample-3",
    type: "multiple",
    category: "教育学",
    stem: "下列属于建构主义学习理论核心观点的有？",
    options: [
      "知识是客观的、确定的",
      "学习是学习者主动建构意义的过程",
      "教学是教师传递知识的过程",
      "学习应处于真实情境中",
    ],
    answer: [1, 3],
    analysis:
      "建构主义认为知识不是客观确定的，而是学习者主动建构的；学习应在真实情境中发生。",
  },
  {
    id: "q-sample-4",
    type: "single",
    category: "教育法规",
    stem: "《中华人民共和国义务教育法》规定，义务教育阶段免收的是？",
    options: ["学费", "杂费", "学费和杂费", "书本费"],
    answer: 2,
    analysis:
      "《义务教育法》第二条规定：国家实施义务教育，不收学费、杂费。",
  },
  {
    id: "q-sample-5",
    type: "judge",
    category: "心理学",
    stem: "动机强度与学习效率之间呈线性关系，动机越强效率越高。",
    options: ["正确", "错误"],
    answer: 1,
    analysis:
      "错误。根据耶克斯-多德森定律，动机强度与学习效率呈倒U型曲线，中等强度的动机最有利于学习。",
  },
];

type Mode = "sequence" | "random" | "wrong";

export function QuizModule({ onBack }: QuizModuleProps) {
  const { data, update } = useAppData();
  const questions = data.quizQuestions;
  const stats = data.quizStats;

  const [activeTab, setActiveTab] = useState<"practice" | "stats" | "manage">(
    "practice",
  );

  // 刷题状态
  const [mode, setMode] = useState<Mode>("sequence");
  const [category, setCategory] = useState<string>("all");
  const [quizList, setQuizList] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | number[] | null>(
    null,
  );
  const [submitted, setSubmitted] = useState(false);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // 首次使用：加载示例题库
  const loadedRef = useRef(false);
  if (!loadedRef.current && questions.length === 0) {
    loadedRef.current = true;
    // 异步加载示例题库（不影响首次渲染）
    setTimeout(() => {
      void update("quizQuestions", SAMPLE_QUESTIONS);
    }, 0);
  }

  // 知识点分类列表
  const categories = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => set.add(q.category));
    return ["all", ...Array.from(set)];
  }, [questions]);

  /** 根据模式 + 分类筛选题目 */
  const startQuiz = () => {
    let pool = questions;
    if (category !== "all") {
      pool = questions.filter((q) => q.category === category);
    }
    if (pool.length === 0) {
      toast({
        title: "暂无题目",
        description: "请先导入题库或在管理页添加题目",
        variant: "destructive",
      });
      return;
    }

    let list = [...pool];
    if (mode === "random") {
      list = list.sort(() => Math.random() - 0.5);
    } else if (mode === "wrong") {
      list = pool.filter((q) => stats.wrongQuestionIds.includes(q.id));
      if (list.length === 0) {
        toast({
          title: "暂无错题",
          description: "继续努力，错题本会自动记录",
        });
        return;
      }
    }
    setQuizList(list);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setSubmitted(false);
    setActiveTab("practice");
  };

  const currentQuestion = quizList[currentIndex];

  /** 提交当前题 */
  const submitAnswer = async () => {
    if (selectedAnswer === null) {
      toast({ title: "请先选择答案", variant: "destructive" });
      return;
    }
    setSubmitted(true);

    const correct = isAnswerCorrect(currentQuestion, selectedAnswer);
    // 记录到 stats
    const record: QuizRecord = {
      questionId: currentQuestion.id,
      correct,
      userAnswer: selectedAnswer,
      answeredAt: new Date().toISOString(),
    };
    const newStats: QuizStats = {
      totalAnswered: stats.totalAnswered + 1,
      correctCount: stats.correctCount + (correct ? 1 : 0),
      wrongQuestionIds: correct
        ? stats.wrongQuestionIds.filter((id) => id !== currentQuestion.id)
        : Array.from(new Set([...stats.wrongQuestionIds, currentQuestion.id])),
      records: [...stats.records, record],
    };
    await update("quizStats", newStats);

    toast({
      title: correct ? "答对啦 🎉" : "答错了 😢",
      description: correct ? "继续保持！" : "查看解析，下次不再错",
      variant: correct ? "default" : "destructive",
    });
  };

  const nextQuestion = () => {
    if (currentIndex < quizList.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setSubmitted(false);
    } else {
      toast({ title: "已完成本组练习 🎊" });
      setQuizList([]);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setSelectedAnswer(null);
      setSubmitted(false);
    }
  };

  /** 导入 JSON 题库 */
  const handleImport = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        throw new Error("题库必须是数组");
      }
      const validQuestions: Question[] = parsed
        .filter((q: unknown): q is Question => {
          const item = q as Record<string, unknown>;
          return (
            typeof item.stem === "string" &&
            Array.isArray(item.options) &&
            (typeof item.answer === "number" || Array.isArray(item.answer))
          );
        })
        .map((q, idx) => ({
          id: (q as Question).id || `q-imported-${Date.now()}-${idx}`,
          type: ((q as Question).type as QuestionType) || "single",
          category: (q as Question).category || "未分类",
          stem: (q as Question).stem,
          options: (q as Question).options,
          answer: (q as Question).answer,
          analysis: (q as Question).analysis || "",
        }));

      if (validQuestions.length === 0) {
        throw new Error("未找到有效题目");
      }

      // 合并到现有题库（按 stem 去重）
      const existingStems = new Set(questions.map((q) => q.stem));
      const merged = [
        ...questions,
        ...validQuestions.filter((q) => !existingStems.has(q.stem)),
      ];
      await update("quizQuestions", merged);
      setImportDialogOpen(false);
      setJsonInput("");
      toast({
        title: "导入成功 ✅",
        description: `共导入 ${validQuestions.length} 道题`,
      });
    } catch (e) {
      toast({
        title: "导入失败",
        description: e instanceof Error ? e.message : "JSON 格式错误",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setJsonInput((ev.target?.result as string) || "");
    };
    reader.readAsText(file);
  };

  /** 清空错题本 */
  const clearWrongQuestions = async () => {
    const newStats: QuizStats = {
      ...stats,
      wrongQuestionIds: [],
    };
    await update("quizStats", newStats);
    toast({ title: "错题本已清空" });
  };

  /** 重置统计 */
  const resetStats = async () => {
    const empty: QuizStats = {
      totalAnswered: 0,
      correctCount: 0,
      wrongQuestionIds: [],
      records: [],
    };
    await update("quizStats", empty);
    toast({ title: "统计已重置" });
  };

  /** 导出题库为 JSON */
  const exportQuestions = () => {
    downloadFile(
      JSON.stringify(questions, null, 2),
      `题库_${new Date().toISOString().slice(0, 10)}.json`,
    );
    toast({ title: "题库已导出" });
  };

  const accuracy =
    stats.totalAnswered > 0
      ? Math.round((stats.correctCount / stats.totalAnswered) * 100)
      : 0;

  return (
    <>
      <ModuleHeader
        title="刷题练习"
        emoji="📝"
        description={`题库 ${questions.length} 题 · 已做 ${stats.totalAnswered} 题 · 正确率 ${accuracy}%`}
        onBack={onBack}
        right={
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Upload className="w-4 h-4 mr-1" />
                导入
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>导入题库（JSON 格式）</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    选择文件
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadFile(
                        JSON.stringify(SAMPLE_QUESTIONS, null, 2),
                        "题库模板.json",
                      )
                    }
                  >
                    <Download className="w-4 h-4 mr-1" />
                    下载模板
                  </Button>
                </div>
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`粘贴 JSON 数组，例如：\n${JSON.stringify(
                    [
                      {
                        type: "single",
                        category: "教育学",
                        stem: "题目内容",
                        options: ["A", "B", "C", "D"],
                        answer: 0,
                        analysis: "解析",
                      },
                    ],
                    null,
                    2,
                  )}`}
                  className="font-mono text-xs min-h-[200px]"
                />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <strong>题型字段 type：</strong>single 单选 / multiple 多选 / judge 判断
                  </p>
                  <p>
                    <strong>答案字段 answer：</strong>单选为数字索引，多选为索引数组，判断为 0（正确）/1（错误）
                  </p>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">取消</Button>
                </DialogClose>
                <Button onClick={handleImport}>导入</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <ModuleContainer>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="practice">练习</TabsTrigger>
            <TabsTrigger value="stats">统计</TabsTrigger>
            <TabsTrigger value="manage">管理</TabsTrigger>
          </TabsList>

          {/* 练习 Tab */}
          <TabsContent value="practice" className="space-y-4 mt-4">
            {quizList.length === 0 || !currentQuestion ? (
              <div className="space-y-4">
                <div className="rounded-2xl p-4 bg-card border border-border/50 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    选择练习模式
                  </h3>

                  <div className="space-y-2">
                    <Label>练习模式</Label>
                    <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sequence">顺序练习</SelectItem>
                        <SelectItem value="random">随机练习</SelectItem>
                        <SelectItem value="wrong">
                          错题重练（{stats.wrongQuestionIds.length}）
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>知识点分类</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c === "all" ? "全部分类" : c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={startQuiz} className="w-full rounded-full">
                    开始练习
                  </Button>
                </div>

                {questions.length === 0 && (
                  <div className="rounded-2xl p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    题库为空，请先点击右上角「导入」添加题目
                  </div>
                )}
              </div>
            ) : (
              <QuestionCard
                question={currentQuestion}
                index={currentIndex}
                total={quizList.length}
                selectedAnswer={selectedAnswer}
                submitted={submitted}
                onSelect={setSelectedAnswer}
                onSubmit={submitAnswer}
                onPrev={prevQuestion}
                onNext={nextQuestion}
              />
            )}
          </TabsContent>

          {/* 统计 Tab */}
          <TabsContent value="stats" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="已做题数"
                value={stats.totalAnswered}
                emoji="📚"
              />
              <StatCard label="正确率" value={`${accuracy}%`} emoji="🎯" />
              <StatCard
                label="错题数"
                value={stats.wrongQuestionIds.length}
                emoji="❌"
              />
            </div>

            <div className="rounded-2xl p-4 bg-card border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">正确率趋势</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetStats}
                  className="text-destructive"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  重置
                </Button>
              </div>
              <Progress value={accuracy} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2">
                {accuracy >= 80
                  ? "优秀！保持这个水平，考试稳了 💪"
                  : accuracy >= 60
                    ? "及格啦，再接再厉"
                    : "继续努力，多看错题解析"}
              </p>
            </div>

            {/* 错题本 */}
            <div className="rounded-2xl p-4 bg-card border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  错题本
                </span>
                {stats.wrongQuestionIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearWrongQuestions}
                    className="text-destructive"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    清空
                  </Button>
                )}
              </div>
              {stats.wrongQuestionIds.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  暂无错题，继续保持~ 🎉
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {stats.wrongQuestionIds.map((id) => {
                    const q = questions.find((x) => x.id === id);
                    if (!q) return null;
                    return (
                      <div
                        key={id}
                        className="p-2 rounded-lg bg-destructive/5 border border-destructive/20 text-xs"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">
                            {q.category}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {q.type === "single"
                              ? "单选"
                              : q.type === "multiple"
                                ? "多选"
                                : "判断"}
                          </Badge>
                        </div>
                        <p className="text-foreground line-clamp-2">{q.stem}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* 管理 Tab */}
          <TabsContent value="manage" className="space-y-4 mt-4">
            <div className="rounded-2xl p-4 bg-card border border-border/50 space-y-3">
              <h3 className="font-semibold">题库管理</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-muted-foreground text-xs">题目总数</div>
                  <div className="text-2xl font-bold tabular-nums">
                    {questions.length}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-muted-foreground text-xs">分类数</div>
                  <div className="text-2xl font-bold tabular-nums">
                    {categories.length - 1}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={exportQuestions}
              >
                <Download className="w-4 h-4 mr-2" />
                导出题库（JSON）
              </Button>

              <Button
                variant="outline"
                className="w-full text-destructive"
                onClick={async () => {
                  if (confirm("确定清空所有题目吗？此操作不可恢复")) {
                    await update("quizQuestions", []);
                    toast({ title: "题库已清空" });
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                清空题库
              </Button>
            </div>

            <div className="rounded-2xl p-4 bg-card border border-border/50">
              <h3 className="font-semibold mb-3">题目预览</h3>
              {questions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  题库为空
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {questions.slice(0, 50).map((q, i) => (
                    <div
                      key={q.id}
                      className="p-2 rounded-lg bg-muted/30 text-xs"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-muted-foreground">#{i + 1}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {q.category}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {q.type === "single"
                            ? "单选"
                            : q.type === "multiple"
                              ? "多选"
                              : "判断"}
                        </Badge>
                      </div>
                      <p className="text-foreground line-clamp-2">{q.stem}</p>
                    </div>
                  ))}
                  {questions.length > 50 && (
                    <p className="text-center text-xs text-muted-foreground py-2">
                      仅显示前 50 题，共 {questions.length} 题
                    </p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </ModuleContainer>
    </>
  );
}

// ============ 子组件 ============

function StatCard({
  label,
  value,
  emoji,
}: {
  label: string;
  value: string | number;
  emoji: string;
}) {
  return (
    <div className="rounded-2xl p-3 bg-card border border-border/50 text-center">
      <div className="text-xl mb-1">{emoji}</div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function QuestionCard({
  question,
  index,
  total,
  selectedAnswer,
  submitted,
  onSelect,
  onSubmit,
  onPrev,
  onNext,
}: {
  question: Question;
  index: number;
  total: number;
  selectedAnswer: number | number[] | null;
  submitted: boolean;
  onSelect: (a: number | number[]) => void;
  onSubmit: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const correctAnswer = question.answer;
  const isCorrect = submitted && isAnswerCorrect(question, selectedAnswer);

  const handleSelect = (i: number) => {
    if (submitted) return;
    if (question.type === "multiple") {
      const cur = Array.isArray(selectedAnswer) ? selectedAnswer : [];
      const next = cur.includes(i)
        ? cur.filter((x) => x !== i)
        : [...cur, i].sort();
      onSelect(next);
    } else {
      onSelect(i);
    }
  };

  return (
    <div className="space-y-4">
      {/* 进度 */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          第 {index + 1} / {total} 题
        </span>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{question.category}</Badge>
          <Badge variant="secondary">
            {question.type === "single"
              ? "单选题"
              : question.type === "multiple"
                ? "多选题"
                : "判断题"}
          </Badge>
        </div>
      </div>
      <Progress value={((index + 1) / total) * 100} className="h-1.5" />

      {/* 题干 */}
      <div className="rounded-2xl p-4 bg-card border border-border/50">
        <p className="text-base font-medium text-foreground leading-relaxed">
          {question.stem}
        </p>
      </div>

      {/* 选项 */}
      <div className="space-y-2">
        {question.options.map((opt, i) => {
          const isSelected = Array.isArray(selectedAnswer)
            ? selectedAnswer.includes(i)
            : selectedAnswer === i;
          const isAnswer = Array.isArray(correctAnswer)
            ? correctAnswer.includes(i)
            : correctAnswer === i;

          let style = "border-border bg-card";
          if (submitted) {
            if (isAnswer) {
              style = "border-green-400 bg-green-50";
            } else if (isSelected && !isAnswer) {
              style = "border-red-400 bg-red-50";
            }
          } else if (isSelected) {
            style = "border-primary bg-primary/10";
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={submitted}
              className={cn(
                "w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3",
                style,
                !submitted && "hover:border-primary/50 active:scale-[0.99]",
              )}
            >
              <span
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                  isSelected || (submitted && isAnswer)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {question.type === "judge"
                  ? i === 0
                    ? "✓"
                    : "✗"
                  : String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 text-sm">{opt}</span>
              {submitted && isAnswer && (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              )}
              {submitted && isSelected && !isAnswer && (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* 解析 */}
      {submitted && (
        <div
          className={cn(
            "rounded-2xl p-4 border animate-fade-in-up",
            isCorrect
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200",
          )}
        >
          <div className="flex items-center gap-2 mb-2 font-semibold">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-green-700">回答正确</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-red-700">回答错误</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-1">
            正确答案：
            <span className="font-semibold text-foreground">
              {Array.isArray(correctAnswer)
                ? correctAnswer
                    .map((i) => String.fromCharCode(65 + i))
                    .join("、")
                : question.type === "judge"
                  ? correctAnswer === 0
                    ? "正确"
                    : "错误"
                  : String.fromCharCode(65 + correctAnswer)}
            </span>
          </p>
          <p className="text-sm text-foreground mt-2 leading-relaxed">
            <strong>解析：</strong>
            {question.analysis || "暂无解析"}
          </p>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={index === 0}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4" />
          上一题
        </Button>
        {!submitted ? (
          <Button onClick={onSubmit} className="flex-1">
            提交答案
          </Button>
        ) : (
          <Button onClick={onNext} className="flex-1">
            下一题
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/** 判断答案是否正确 */
function isAnswerCorrect(
  q: Question,
  selected: number | number[] | null,
): boolean {
  if (selected === null) return false;
  if (q.type === "multiple") {
    if (!Array.isArray(selected) || !Array.isArray(q.answer)) return false;
    const a = [...selected].sort();
    const b = [...q.answer].sort();
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
  return selected === q.answer;
}
