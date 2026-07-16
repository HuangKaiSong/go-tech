import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import { Progress } from '@/components/ui/progress';
import { useTraining } from './TrainingProvider';
import { getStatusConfig } from './utils';

// ===== CATEGORY VIEW（培訓類別下的課程列表）=====
const CategoryPage = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const { getCategory } = useTraining();
  const category = getCategory(categoryId);

  if (!category) {
    return <Navigate to="/training" replace />;
  }

  const catProgress =
    category.totalCourses > 0 ? Math.round((category.completedCourses / category.totalCourses) * 100) : 0;

  return (
    <MobileLayout title={category.title}>
      <div className="px-5 pt-4 pb-6">
        <button onClick={() => navigate('/training')} className="flex items-center gap-1 text-sm text-primary mb-4">
          <ArrowLeft className="w-5 h-5" /> 返回
        </button>

        {/* Category summary */}
        <div className={`rounded-2xl p-5 mb-5 ${category.color}`}>
          <div className="flex items-center gap-3 mb-3">
            <category.icon className="w-8 h-8 text-primary-foreground" />
            <div>
              <h2 className="text-lg font-bold text-primary-foreground">{category.title}</h2>
              <p className="text-xs text-primary-foreground/70">{category.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={catProgress} className="h-2 flex-1 bg-primary-foreground/20" />
            <span className="text-xs font-semibold text-primary-foreground">
              {category.completedCourses}/{category.totalCourses}
            </span>
          </div>
        </div>

        {/* Course list */}
        <div className="space-y-3">
          {category.courses.map(course => {
            const cfg = getStatusConfig(course.status);
            const StatusIcon = cfg.icon;
            return (
              <button
                key={course.id}
                onClick={() => course.status !== 'locked' && navigate(`/training/${category.id}/${course.id}`)}
                disabled={course.status === 'locked'}
                className={`w-full bg-card rounded-xl border p-4 flex items-center gap-3 text-left transition-colors ${course.status === 'locked' ? 'border-border opacity-60' : 'border-border active:bg-muted/50'}`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <StatusIcon className={`w-5.5 h-5.5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{course.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{course.duration}</span>
                    {course.status !== 'locked' && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className={`text-xs ${cfg.color}`}>{course.progress}%</span>
                      </>
                    )}
                  </div>
                </div>
                {course.status !== 'locked' && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
              </button>
            );
          })}
        </div>
      </div>
    </MobileLayout>
  );
};

export default CategoryPage;
