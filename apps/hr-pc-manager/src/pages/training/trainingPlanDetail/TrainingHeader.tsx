import { ArrowLeft, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { statusColors, typeColors } from './constants';

const TrainingHeader = ({ plan }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/training/plans')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{plan.name}</h1>
            <Badge variant="outline" className={typeColors[plan.type]}>
              {plan.type}
            </Badge>
            <Badge variant="outline" className={statusColors[plan.status]}>
              {plan.status}
            </Badge>
            {plan.mandatory && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                必修
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">{plan.description}</p>
        </div>
      </div>
      <div className="flex gap-2">
        {plan.status === '草稿' && (
          <Button className="gap-2" onClick={() => toast.success('培訓計劃已發佈')}>
            <Send className="h-4 w-4" /> 發佈計劃
          </Button>
        )}
      </div>
    </div>
  );
};

export default TrainingHeader;
