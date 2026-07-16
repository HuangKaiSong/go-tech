import { ChevronRight, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import { Progress } from '@/components/ui/progress';
import { useTraining } from './TrainingProvider';

// ===== LIST VIEW（培訓中心）=====
const ListPage = () => {
  const navigate = useNavigate();
  const { courses, totals } = useTraining();
  const { totalCourses, totalCompleted, overallProgress, inProgress } = totals;

  return (
    <MobileLayout title="培訓中心">
      <div className="px-5 pt-4 pb-6">
        {/* Overall progress */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
            <div>
              <h2 className="text-lg font-bold text-primary-foreground">我的培訓進度</h2>
              <p className="text-xs text-primary-foreground/70">
                已完成 {totalCompleted}/{totalCourses} 門課程
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={overallProgress} className="h-2.5 flex-1 bg-primary-foreground/20" />
            <span className="text-sm font-bold text-primary-foreground">{overallProgress}%</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: '總課程', value: totalCourses, color: 'text-primary' },
            { label: '已完成', value: totalCompleted, color: 'text-[hsl(var(--success))]' },
            { label: '進行中', value: inProgress, color: 'text-[hsl(var(--warning))]' }
          ].map(stat => (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-3 text-center">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Categories */}
        <h3 className="text-sm font-semibold text-foreground mb-3">培訓類別</h3>
        <div className="space-y-3">
          {courses.map(cat => {
            const catProgress = cat.totalCourses > 0 ? Math.round((cat.completedCourses / cat.totalCourses) * 100) : 0;
            return (
              <button
                key={cat.id}
                onClick={() => navigate(`/training/${cat.id}`)}
                className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-4 text-left active:bg-muted/50 transition-colors"
              >
                <div className={`w-14 h-14 rounded-xl ${cat.color} flex items-center justify-center shrink-0`}>
                  <cat.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{cat.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
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

export default ListPage;
