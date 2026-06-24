import { BookOpen, Clock, GraduationCap, Target, Users } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

const TrainingInfoCards = ({ modules, participants, plan }) => {
  const totalMinutes = modules.reduce((s, m) => s + m.duration, 0);

  const completionRate =
    plan.participantCount > 0 ? Math.round((plan.completedCount / plan.participantCount) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-xs text-muted-foreground">課程模組</p>
          <p className="text-lg font-bold">{modules.length} 個</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <Clock className="h-5 w-5 mx-auto mb-1 text-warning" />
          <p className="text-xs text-muted-foreground">預計時數</p>
          <p className="text-lg font-bold">{Math.round((totalMinutes / 60) * 10) / 10} 小時</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <Users className="h-5 w-5 mx-auto mb-1 text-success" />
          <p className="text-xs text-muted-foreground">參訓人數</p>
          <p className="text-lg font-bold">{participants.length} 人</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <GraduationCap className="h-5 w-5 mx-auto mb-1 text-accent-foreground" />
          <p className="text-xs text-muted-foreground">完成率</p>
          <p className="text-lg font-bold">{completionRate}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <Target className="h-5 w-5 mx-auto mb-1 text-destructive" />
          <p className="text-xs text-muted-foreground">適用對象</p>
          <p className="text-sm font-bold truncate">{plan.targetScope}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingInfoCards;
