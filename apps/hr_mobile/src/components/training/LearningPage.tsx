import { useState } from "react";
import MobileLayout from "@/components/MobileLayout";
import {
  AlertCircle, ArrowLeft, Award, BookOpen, Bookmark, BookmarkCheck,
  CheckCircle2, ChevronDown, ChevronUp, CircleCheck, Clock, FileText,
  Lightbulb, Maximize, MessageSquare, PlayCircle, SkipForward, ThumbsUp, Volume2, VolumeX
} from "lucide-react";

interface LearningPageProps {
  courseTitle: string;
  moduleDuration: string;
  moduleIndex: number;
  moduleName: string;
  onBack: () => void;
  onComplete: () => void;
  totalModules: number;
}

// Simulated learning content per module
const learningContent = {
  sections: [
    {
      type: "video" as const,
      title: "課程影片",
      thumbnailText: "📹 點擊播放課程影片",
      duration: "8:32",
    },
    {
      type: "text" as const,
      title: "課程重點",
      content: [
        "理解本單元的核心概念與應用場景",
        "掌握關鍵流程步驟與注意事項",
        "了解常見問題與解決方案",
        "學會運用所學知識進行實際操作",
      ],
    },
    {
      type: "tips" as const,
      title: "學習小提示",
      items: [
        { icon: "💡", text: "建議搭配筆記一起學習，加深記憶" },
        { icon: "📝", text: "完成每個章節後可回顧重點整理" },
        { icon: "🔁", text: "如有不清楚的地方，可重複觀看影片" },
      ],
    },
  ],
  quiz: [
    {
      question: "根據本課程內容，以下哪項描述是正確的？",
      options: ["選項 A：僅適用於特定場景", "選項 B：需要遵循標準流程執行", "選項 C：可以跳過審核步驟", "選項 D：與其他部門無關"],
      correctIndex: 1,
    },
    {
      question: "完成本單元後，應優先採取哪個步驟？",
      options: ["直接跳過後續課程", "記錄學習心得並回顧重點", "不需要進行任何操作", "等待系統自動完成"],
      correctIndex: 1,
    },
  ],
};

const LearningPage = ({
  courseTitle,
  moduleDuration,
  moduleIndex,
  moduleName,
  onBack,
  onComplete,
  totalModules,
}: LearningPageProps) => {
  const [currentStep, setCurrentStep] = useState(0); // 0=content, 1=quiz, 2=completed
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(0);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>(learningContent.quiz.map(() => null));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [note, setNote] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    const allCorrect = quizAnswers.every((a, i) => a === learningContent.quiz[i].correctIndex);
    if (allCorrect) {
      setTimeout(() => setCurrentStep(2), 800);
    }
  };

  const quizScore = quizAnswers.filter((a, i) => a === learningContent.quiz[i].correctIndex).length;
  const allQuizCorrect = quizScore === learningContent.quiz.length;

  return (
    <MobileLayout title="學習中">
      <div className="px-5 pt-4 pb-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-primary">
            <ArrowLeft className="w-5 h-5" /> 返回課程
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsBookmarked(!isBookmarked)} className="p-1.5 rounded-lg bg-card border border-border">
              {isBookmarked ? <BookmarkCheck className="w-5 h-5 text-primary" /> : <Bookmark className="w-5 h-5 text-muted-foreground" />}
            </button>
            <button onClick={() => setShowNotes(!showNotes)} className="p-1.5 rounded-lg bg-card border border-border">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Module info header */}
        <div className="bg-card rounded-2xl border border-border p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-1">{courseTitle}</p>
          <h2 className="text-base font-bold text-foreground mb-2">{moduleName}</h2>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{moduleDuration}</span>
            <span className="flex items-center gap-1"><FileText className="w-4 h-4" />模塊 {moduleIndex + 1}/{totalModules}</span>
          </div>
          {/* Step progress */}
          <div className="flex items-center gap-2">
            {["課程內容", "隨堂測驗", "完成學習"].map((label, i) => (
              <div key={i} className="flex-1">
                <div className={`h-1.5 rounded-full mb-1 transition-colors ${i <= currentStep ? "bg-primary" : "bg-muted"}`} />
                <p className={`text-[10px] text-center ${i <= currentStep ? "text-primary font-medium" : "text-muted-foreground"}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Notes panel */}
        {showNotes && (
          <div className="bg-card rounded-2xl border border-border p-4 mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <MessageSquare className="w-4.5 h-4.5 text-primary" /> 學習筆記
            </h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="在這裡記錄你的學習心得..."
              className="w-full h-24 bg-muted/50 rounded-xl border border-border p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">筆記將自動保存至本地</p>
          </div>
        )}

        {/* STEP 0: Content */}
        {currentStep === 0 && (
          <div className="space-y-4">
            {/* Video player area */}
            <div className="bg-foreground/95 rounded-2xl overflow-hidden relative">
              <div className="aspect-video flex items-center justify-center relative">
                {!videoPlaying ? (
                  <button
                    onClick={() => { setVideoPlaying(true); setVideoProgress(0); }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center shadow-lg">
                      <PlayCircle className="w-9 h-9 text-primary-foreground" />
                    </div>
                    <span className="text-primary-foreground/80 text-sm">點擊播放課程影片</span>
                  </button>
                ) : (
                  <div className="w-full h-full flex flex-col">
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <BookOpen className="w-12 h-12 text-primary-foreground/60 mx-auto mb-2" />
                        <p className="text-primary-foreground/70 text-sm">影片播放中...</p>
                        <p className="text-primary-foreground/40 text-xs mt-1">{learningContent.sections[0].duration}</p>
                      </div>
                    </div>
                    {/* Video controls */}
                    <div className="px-4 pb-3">
                      <div className="h-1 bg-primary-foreground/20 rounded-full mb-2 cursor-pointer" onClick={() => setVideoProgress(Math.min(100, videoProgress + 25))}>
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${videoProgress}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button onClick={() => setVideoPlaying(false)} className="text-primary-foreground/70">
                            <PlayCircle className="w-5 h-5" />
                          </button>
                          <button onClick={() => setIsMuted(!isMuted)} className="text-primary-foreground/70">
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                          </button>
                          <span className="text-xs text-primary-foreground/50">0:00 / {learningContent.sections[0].duration}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button className="text-primary-foreground/70"><SkipForward className="w-5 h-5" /></button>
                          <button className="text-primary-foreground/70"><Maximize className="w-5 h-5" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Expandable content sections */}
            {learningContent.sections.slice(1).map((section, idx) => (
              <div key={idx} className="bg-card rounded-2xl border border-border overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    {section.type === "text" ? (
                      <Lightbulb className="w-5 h-5 text-primary" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-[hsl(var(--warning))]" />
                    )}
                    <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                  </div>
                  {expandedSection === idx ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </button>
                {expandedSection === idx && (
                  <div className="px-4 pb-4">
                    {section.type === "text" && (
                      <ul className="space-y-2.5">
                        {section.content?.map((point, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
                            <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))] mt-0.5 shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}
                    {section.type === "tips" && (
                      <div className="space-y-2.5">
                        {section.items?.map((item, i) => (
                          <div key={i} className="flex items-start gap-2.5 bg-muted/50 rounded-xl p-3">
                            <span className="text-lg">{item.icon}</span>
                            <p className="text-sm text-foreground/80">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Next: go to quiz */}
            <button
              onClick={() => setCurrentStep(1)}
              className="w-full bg-primary text-primary-foreground font-semibold text-sm py-3.5 rounded-xl active:scale-[0.98] transition-transform"
            >
              進入隨堂測驗
            </button>
          </div>
        )}

        {/* STEP 1: Quiz */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2.5 mb-4">
                <Award className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">隨堂測驗</h3>
                  <p className="text-xs text-muted-foreground">答對全部題目即可完成本模塊</p>
                </div>
              </div>

              <div className="space-y-5">
                {learningContent.quiz.map((q, qi) => (
                  <div key={qi}>
                    <p className="text-sm font-medium text-foreground mb-3">
                      <span className="text-primary font-bold mr-1.5">Q{qi + 1}.</span>
                      {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => {
                        const selected = quizAnswers[qi] === oi;
                        const isCorrect = oi === q.correctIndex;
                        let optionStyle = "border-border bg-card";
                        if (quizSubmitted && selected && isCorrect) optionStyle = "border-[hsl(var(--success))] bg-[hsl(var(--success))]/10";
                        else if (quizSubmitted && selected && !isCorrect) optionStyle = "border-destructive bg-destructive/10";
                        else if (quizSubmitted && isCorrect) optionStyle = "border-[hsl(var(--success))]/50 bg-[hsl(var(--success))]/5";
                        else if (selected) optionStyle = "border-primary bg-primary/10";

                        return (
                          <button
                            key={oi}
                            disabled={quizSubmitted}
                            onClick={() => {
                              const newAnswers = [...quizAnswers];
                              newAnswers[qi] = oi;
                              setQuizAnswers(newAnswers);
                            }}
                            className={`w-full text-left p-3 rounded-xl border text-sm transition-colors ${optionStyle}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? "border-primary" : "border-muted-foreground/30"}`}>
                                {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                              </div>
                              <span className="text-foreground/80">{opt}</span>
                            </div>
                            {quizSubmitted && selected && !isCorrect && (
                              <p className="text-xs text-destructive mt-1.5 ml-7.5">答案不正確</p>
                            )}
                            {quizSubmitted && isCorrect && (
                              <p className="text-xs text-[hsl(var(--success))] mt-1.5 ml-7.5 flex items-center gap-1">
                                <CircleCheck className="w-3.5 h-3.5" /> 正確答案
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {quizSubmitted && !allQuizCorrect && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3.5 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">部分題目回答錯誤</p>
                  <p className="text-xs text-destructive/70 mt-0.5">你答對了 {quizScore}/{learningContent.quiz.length} 題，請重新作答。</p>
                  <button
                    onClick={() => { setQuizSubmitted(false); setQuizAnswers(learningContent.quiz.map(() => null)); }}
                    className="text-xs font-medium text-primary mt-2 underline"
                  >
                    重新作答
                  </button>
                </div>
              </div>
            )}

            {quizSubmitted && allQuizCorrect && (
              <div className="bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/30 rounded-xl p-3.5 flex items-start gap-2.5">
                <ThumbsUp className="w-5 h-5 text-[hsl(var(--success))] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--success))]">全部答對！🎉</p>
                  <p className="text-xs text-[hsl(var(--success))]/70 mt-0.5">正在進入完成頁面...</p>
                </div>
              </div>
            )}

            {!quizSubmitted && (
              <button
                onClick={handleQuizSubmit}
                disabled={quizAnswers.some((a) => a === null)}
                className="w-full bg-primary text-primary-foreground font-semibold text-sm py-3.5 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                提交答案
              </button>
            )}
          </div>
        )}

        {/* STEP 2: Completed */}
        {currentStep === 2 && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-[hsl(var(--success))]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-[hsl(var(--success))]" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">模塊學習完成！</h3>
            <p className="text-sm text-muted-foreground mb-2">你已完成「{moduleName}」</p>
            <div className="flex items-center justify-center gap-1.5 mb-6">
              <CircleCheck className="w-4 h-4 text-[hsl(var(--success))]" />
              <span className="text-xs text-[hsl(var(--success))] font-medium">測驗成績：{quizScore}/{learningContent.quiz.length} 全部通過</span>
            </div>

            <div className="bg-card rounded-2xl border border-border p-4 mb-6 text-left">
              <h4 className="text-sm font-semibold text-foreground mb-3">學習成果</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-primary">{moduleDuration}</p>
                  <p className="text-xs text-muted-foreground">學習時長</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-[hsl(var(--success))]">100%</p>
                  <p className="text-xs text-muted-foreground">完成度</p>
                </div>
              </div>
            </div>

            <button
              onClick={onComplete}
              className="w-full bg-primary text-primary-foreground font-semibold text-sm py-3.5 rounded-xl active:scale-[0.98] transition-transform"
            >
              完成並返回課程
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default LearningPage;
