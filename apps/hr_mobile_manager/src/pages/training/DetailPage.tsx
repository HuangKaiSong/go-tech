import { ArrowLeft, Clock, FileText } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import { Progress } from '@/components/ui/progress';
import { useTraining } from './TrainingProvider';
import { getModuleIcon, getModuleIconBg, getStatusConfig } from './utils';

// ===== DETAIL VIEW（課程詳情與模塊列表）=====
const DetailPage = () => {
  const navigate = useNavigate();
  const { categoryId, courseId } = useParams();
  const { getCourse } = useTraining();
  const course = getCourse(categoryId, courseId);

  if (!course) {
    return <Navigate to={categoryId ? `/training/${categoryId}` : '/training'} replace />;
  }

  const statusCfg = getStatusConfig(course.status);

  return (
    <MobileLayout title="課程詳情">
      <div className="px-5 pt-4 pb-6">
        <button
          onClick={() => navigate(`/training/${categoryId}`)}
          className="flex items-center gap-1 text-sm text-primary mb-4"
        >
          <ArrowLeft className="w-5 h-5" /> 返回
        </button>

        {/* Course header */}
        <div className="bg-card rounded-2xl border border-border p-5 mb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">{course.title}</h2>
              <p className="text-xs text-muted-foreground mt-1">{course.description}</p>
            </div>
            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {course.duration}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {course.modules.length} 個模塊
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={course.progress} className="h-2 flex-1" />
            <span className="text-xs font-semibold text-foreground">{course.progress}%</span>
          </div>
        </div>

        {/* Modules */}
        <h3 className="text-sm font-semibold text-foreground mb-3">課程模塊</h3>
        <div className="space-y-2.5">
          {course.modules.map((mod, i) => {
            const canStart =
              !mod.completed && (i === 0 || course.modules[i - 1].completed) && course.status !== 'locked';
            return (
              <div
                key={i}
                className={`bg-card rounded-xl border p-4 flex items-center gap-3 ${mod.completed ? 'border-[hsl(var(--success))]/30' : 'border-border'}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getModuleIconBg(mod.completed, canStart)}`}
                >
                  {getModuleIcon(mod.completed, canStart)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${mod.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                  >
                    {mod.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{mod.duration}</p>
                </div>
                {canStart && (
                  <button
                    onClick={() => navigate(`/training/${categoryId}/${courseId}/${i}`)}
                    className="text-xs font-medium text-primary-foreground bg-primary px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                  >
                    開始學習
                  </button>
                )}
                {mod.completed && <span className="text-xs text-[hsl(var(--success))] font-medium">✓ 完成</span>}
              </div>
            );
          })}
        </div>
      </div>
    </MobileLayout>
  );
};

export default DetailPage;
