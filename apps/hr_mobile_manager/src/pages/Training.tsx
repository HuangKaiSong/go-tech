import MobileLayout from "@/components/MobileLayout";
import LearningPage from "@/components/training/LearningPage";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleCheck,
  Clock,
  FileText,
  GraduationCap,
  Lock,
  PlayCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type CourseStatus = "completed" | "in_progress" | "locked";

interface Course {
  id: string;
  title: string;
  duration: string;
  status: CourseStatus;
  progress: number;
  description: string;
  modules: { name: string; completed: boolean; duration: string }[];
}

interface TrainingCategory {
  id: string;
  title: string;
  icon: typeof GraduationCap;
  color: string;
  description: string;
  totalCourses: number;
  completedCourses: number;
  courses: Course[];
}

const trainingData: TrainingCategory[] = [
  {
    id: "onboarding",
    title: "入職培訓",
    icon: BookOpen,
    color: "bg-primary",
    description: "新員工必修課程，了解公司文化與制度",
    totalCourses: 4,
    completedCourses: 2,
    courses: [
      {
        id: "o1",
        title: "公司文化與價值觀",
        duration: "45分鐘",
        status: "completed",
        progress: 100,
        description: "了解公司的使命、願景和核心價值觀，以及我們的企業文化。",
        modules: [
          { name: "公司歷史與發展", completed: true, duration: "15分鐘" },
          { name: "使命與願景", completed: true, duration: "10分鐘" },
          { name: "核心價值觀", completed: true, duration: "10分鐘" },
          { name: "文化體驗測驗", completed: true, duration: "10分鐘" },
        ],
      },
      {
        id: "o2",
        title: "員工守則與規章制度",
        duration: "60分鐘",
        status: "completed",
        progress: 100,
        description: "詳細了解公司的各項規章制度、行為準則及紀律要求。",
        modules: [
          { name: "考勤制度", completed: true, duration: "15分鐘" },
          { name: "假期管理", completed: true, duration: "15分鐘" },
          { name: "行為準則", completed: true, duration: "15分鐘" },
          { name: "規章測驗", completed: true, duration: "15分鐘" },
        ],
      },
      {
        id: "o3",
        title: "資訊安全意識",
        duration: "30分鐘",
        status: "in_progress",
        progress: 60,
        description: "學習基本的資訊安全知識，保護公司和個人資料安全。",
        modules: [
          { name: "資料分類與保密", completed: true, duration: "10分鐘" },
          { name: "密碼安全", completed: true, duration: "8分鐘" },
          { name: "網路釣魚防範", completed: false, duration: "7分鐘" },
          { name: "安全測驗", completed: false, duration: "5分鐘" },
        ],
      },
      {
        id: "o4",
        title: "辦公系統操作指南",
        duration: "40分鐘",
        status: "locked",
        progress: 0,
        description: "學習使用公司的辦公系統，包括考勤、請假、報銷等功能。",
        modules: [
          { name: "HR系統導覽", completed: false, duration: "10分鐘" },
          { name: "考勤打卡操作", completed: false, duration: "10分鐘" },
          { name: "申請流程說明", completed: false, duration: "10分鐘" },
          { name: "操作練習", completed: false, duration: "10分鐘" },
        ],
      },
    ],
  },
  {
    id: "skills",
    title: "職能培訓",
    icon: Award,
    color: "bg-accent",
    description: "提升專業技能與崗位勝任力",
    totalCourses: 3,
    completedCourses: 0,
    courses: [
      {
        id: "s1",
        title: "項目管理基礎",
        duration: "90分鐘",
        status: "in_progress",
        progress: 33,
        description: "學習項目管理的基本方法論，掌握敏捷與瀑布流程。",
        modules: [
          { name: "項目管理概述", completed: true, duration: "20分鐘" },
          { name: "敏捷方法論", completed: false, duration: "25分鐘" },
          { name: "項目計劃編制", completed: false, duration: "25分鐘" },
          { name: "項目管理測驗", completed: false, duration: "20分鐘" },
        ],
      },
      {
        id: "s2",
        title: "溝通技巧與團隊協作",
        duration: "60分鐘",
        status: "locked",
        progress: 0,
        description: "提升職場溝通能力，學習高效團隊協作的方法。",
        modules: [
          { name: "有效溝通原則", completed: false, duration: "15分鐘" },
          { name: "跨部門協作", completed: false, duration: "15分鐘" },
          { name: "會議管理", completed: false, duration: "15分鐘" },
          { name: "情境演練", completed: false, duration: "15分鐘" },
        ],
      },
      {
        id: "s3",
        title: "數據分析入門",
        duration: "75分鐘",
        status: "locked",
        progress: 0,
        description: "學習基礎數據分析技巧，提升數據驅動決策的能力。",
        modules: [
          { name: "數據思維導入", completed: false, duration: "15分鐘" },
          { name: "Excel 進階技巧", completed: false, duration: "20分鐘" },
          { name: "數據可視化", completed: false, duration: "20分鐘" },
          { name: "分析實戰練習", completed: false, duration: "20分鐘" },
        ],
      },
    ],
  },
];

const getStatusConfig = (status: CourseStatus) => {
  switch (status) {
    case "completed":
      return {
        label: "已完成",
        color: "text-[hsl(var(--success))]",
        bg: "bg-[hsl(var(--success))]/10",
        icon: CheckCircle2,
      };
    case "in_progress":
      return {
        label: "進行中",
        color: "text-primary",
        bg: "bg-primary/10",
        icon: Clock,
      };
    case "locked":
      return {
        label: "未解鎖",
        color: "text-muted-foreground",
        bg: "bg-muted",
        icon: Lock,
      };
  }
};

type ViewMode = "list" | "category" | "detail" | "learning";

const Training = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewMode>("list");
  const [selectedCategory, setSelectedCategory] =
    useState<TrainingCategory | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [learningModuleIndex, setLearningModuleIndex] = useState<number>(0);
  const [courses, setCourses] = useState(trainingData);

  const totalCourses = courses.reduce((sum, c) => sum + c.totalCourses, 0);
  const totalCompleted = courses.reduce(
    (sum, c) => sum + c.completedCourses,
    0,
  );
  const overallProgress =
    totalCourses > 0 ? Math.round((totalCompleted / totalCourses) * 100) : 0;

  const handleModuleComplete = (
    categoryId: string,
    courseId: string,
    moduleIndex: number,
  ) => {
    setCourses((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        const updatedCourses = cat.courses.map((course) => {
          if (course.id !== courseId) return course;
          const updatedModules = course.modules.map((m, i) =>
            i === moduleIndex ? { ...m, completed: true } : m,
          );
          const completedCount = updatedModules.filter(
            (m) => m.completed,
          ).length;
          const newProgress = Math.round(
            (completedCount / updatedModules.length) * 100,
          );
          const allDone = completedCount === updatedModules.length;
          const newStatus: CourseStatus = allDone ? "completed" : "in_progress";
          return {
            ...course,
            modules: updatedModules,
            progress: newProgress,
            status: newStatus,
          };
        });

        // Unlock next locked course if current is completed
        const justCompleted = updatedCourses.find((c) => c.id === courseId);
        if (justCompleted?.status === "completed") {
          const lockedIndex = updatedCourses.findIndex(
            (c) => c.status === "locked",
          );
          if (lockedIndex !== -1) {
            updatedCourses[lockedIndex] = {
              ...updatedCourses[lockedIndex],
              status: "in_progress",
            };
          }
        }

        const newCompletedCourses = updatedCourses.filter(
          (c) => c.status === "completed",
        ).length;
        return {
          ...cat,
          courses: updatedCourses,
          completedCourses: newCompletedCourses,
        };
      }),
    );

    // Update selected course for detail view
    setSelectedCourse((prev) => {
      if (!prev || prev.id !== courseId) return prev;
      const updatedModules = prev.modules.map((m, i) =>
        i === moduleIndex ? { ...m, completed: true } : m,
      );
      const completedCount = updatedModules.filter((m) => m.completed).length;
      const newProgress = Math.round(
        (completedCount / updatedModules.length) * 100,
      );
      const allDone = completedCount === updatedModules.length;
      return {
        ...prev,
        modules: updatedModules,
        progress: newProgress,
        status: allDone ? "completed" : "in_progress",
      };
    });
  };

  const openCategory = (cat: TrainingCategory) => {
    // refresh category from state
    const fresh = courses.find((c) => c.id === cat.id)!;
    setSelectedCategory(fresh);
    setView("category");
  };

  const openDetail = (course: Course) => {
    setSelectedCourse(course);
    setView("detail");
  };

  // ===== LEARNING VIEW =====
  if (view === "learning" && selectedCourse && selectedCategory) {
    return (
      <LearningPage
        moduleIndex={learningModuleIndex}
        moduleName={selectedCourse.modules[learningModuleIndex].name}
        moduleDuration={selectedCourse.modules[learningModuleIndex].duration}
        courseTitle={selectedCourse.title}
        totalModules={selectedCourse.modules.length}
        onComplete={() => {
          handleModuleComplete(
            selectedCategory.id,
            selectedCourse.id,
            learningModuleIndex,
          );
          setView("detail");
        }}
        onBack={() => setView("detail")}
      />
    );
  }

  // ===== DETAIL VIEW =====
  if (view === "detail" && selectedCourse && selectedCategory) {
    const statusCfg = getStatusConfig(selectedCourse.status);
    return (
      <MobileLayout title="課程詳情">
        <div className="px-5 pt-4 pb-6">
          <button
            onClick={() => {
              openCategory(selectedCategory);
            }}
            className="flex items-center gap-1 text-sm text-primary mb-4"
          >
            <ArrowLeft className="w-5 h-5" /> 返回
          </button>

          {/* Course header */}
          <div className="bg-card rounded-2xl border border-border p-5 mb-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground">
                  {selectedCourse.title}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedCourse.description}
                </p>
              </div>
              <span
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.color}`}
              >
                {statusCfg.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {selectedCourse.duration}
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {selectedCourse.modules.length} 個模塊
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Progress
                value={selectedCourse.progress}
                className="h-2 flex-1"
              />
              <span className="text-xs font-semibold text-foreground">
                {selectedCourse.progress}%
              </span>
            </div>
          </div>

          {/* Modules */}
          <h3 className="text-sm font-semibold text-foreground mb-3">
            課程模塊
          </h3>
          <div className="space-y-2.5">
            {selectedCourse.modules.map((mod, i) => {
              const canStart =
                !mod.completed &&
                (i === 0 || selectedCourse.modules[i - 1].completed) &&
                selectedCourse.status !== "locked";
              return (
                <div
                  key={i}
                  className={`bg-card rounded-xl border p-4 flex items-center gap-3 ${mod.completed ? "border-[hsl(var(--success))]/30" : "border-border"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${mod.completed ? "bg-[hsl(var(--success))]/10" : canStart ? "bg-primary/10" : "bg-muted"}`}
                  >
                    {mod.completed ? (
                      <CircleCheck className="w-5 h-5 text-[hsl(var(--success))]" />
                    ) : canStart ? (
                      <PlayCircle className="w-5 h-5 text-primary" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${mod.completed ? "text-muted-foreground line-through" : "text-foreground"}`}
                    >
                      {mod.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {mod.duration}
                    </p>
                  </div>
                  {canStart && (
                    <button
                      onClick={() => {
                        setLearningModuleIndex(i);
                        setView("learning");
                      }}
                      className="text-xs font-medium text-primary-foreground bg-primary px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                    >
                      開始學習
                    </button>
                  )}
                  {mod.completed && (
                    <span className="text-xs text-[hsl(var(--success))] font-medium">
                      ✓ 完成
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </MobileLayout>
    );
  }

  // ===== CATEGORY VIEW =====
  if (view === "category" && selectedCategory) {
    const freshCat = courses.find((c) => c.id === selectedCategory.id)!;
    const catProgress =
      freshCat.totalCourses > 0
        ? Math.round((freshCat.completedCourses / freshCat.totalCourses) * 100)
        : 0;
    return (
      <MobileLayout title={freshCat.title}>
        <div className="px-5 pt-4 pb-6">
          <button
            onClick={() => setView("list")}
            className="flex items-center gap-1 text-sm text-primary mb-4"
          >
            <ArrowLeft className="w-5 h-5" /> 返回
          </button>

          {/* Category summary */}
          <div className={`rounded-2xl p-5 mb-5 ${freshCat.color}`}>
            <div className="flex items-center gap-3 mb-3">
              <freshCat.icon className="w-8 h-8 text-primary-foreground" />
              <div>
                <h2 className="text-lg font-bold text-primary-foreground">
                  {freshCat.title}
                </h2>
                <p className="text-xs text-primary-foreground/70">
                  {freshCat.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Progress
                value={catProgress}
                className="h-2 flex-1 bg-primary-foreground/20"
              />
              <span className="text-xs font-semibold text-primary-foreground">
                {freshCat.completedCourses}/{freshCat.totalCourses}
              </span>
            </div>
          </div>

          {/* Course list */}
          <div className="space-y-3">
            {freshCat.courses.map((course) => {
              const cfg = getStatusConfig(course.status);
              const StatusIcon = cfg.icon;
              return (
                <button
                  key={course.id}
                  onClick={() =>
                    course.status !== "locked" && openDetail(course)
                  }
                  disabled={course.status === "locked"}
                  className={`w-full bg-card rounded-xl border p-4 flex items-center gap-3 text-left transition-colors ${course.status === "locked" ? "border-border opacity-60" : "border-border active:bg-muted/50"}`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}
                  >
                    <StatusIcon className={`w-5.5 h-5.5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {course.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {course.duration}
                      </span>
                      {course.status !== "locked" && (
                        <>
                          <span className="text-xs text-muted-foreground">
                            ·
                          </span>
                          <span className={`text-xs ${cfg.color}`}>
                            {course.progress}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {course.status !== "locked" && (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </MobileLayout>
    );
  }

  // ===== LIST VIEW =====
  return (
    <MobileLayout title="培訓中心">
      <div className="px-5 pt-4 pb-6">
        {/* Overall progress */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
            <div>
              <h2 className="text-lg font-bold text-primary-foreground">
                我的培訓進度
              </h2>
              <p className="text-xs text-primary-foreground/70">
                已完成 {totalCompleted}/{totalCourses} 門課程
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress
              value={overallProgress}
              className="h-2.5 flex-1 bg-primary-foreground/20"
            />
            <span className="text-sm font-bold text-primary-foreground">
              {overallProgress}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "總課程", value: totalCourses, color: "text-primary" },
            {
              label: "已完成",
              value: totalCompleted,
              color: "text-[hsl(var(--success))]",
            },
            {
              label: "進行中",
              value: courses.reduce(
                (s, c) =>
                  s +
                  c.courses.filter((x) => x.status === "in_progress").length,
                0,
              ),
              color: "text-[hsl(var(--warning))]",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card rounded-xl border border-border p-3 text-center"
            >
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Categories */}
        <h3 className="text-sm font-semibold text-foreground mb-3">培訓類別</h3>
        <div className="space-y-3">
          {courses.map((cat) => {
            const catProgress =
              cat.totalCourses > 0
                ? Math.round((cat.completedCourses / cat.totalCourses) * 100)
                : 0;
            return (
              <button
                key={cat.id}
                onClick={() => openCategory(cat)}
                className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-4 text-left active:bg-muted/50 transition-colors"
              >
                <div
                  className={`w-14 h-14 rounded-xl ${cat.color} flex items-center justify-center shrink-0`}
                >
                  <cat.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {cat.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cat.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={catProgress} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {cat.completedCourses}/{cat.totalCourses}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Training;

