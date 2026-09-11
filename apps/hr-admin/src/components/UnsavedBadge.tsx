import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/** 「未儲存變更」提示徽章。show 為 true 時顯示。 */
export function UnsavedBadge({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }
  return (
    <Badge variant="outline" className="gap-1 bg-warning/10 text-warning border-warning/20">
      <AlertCircle className="h-3 w-3" />
      未儲存變更
    </Badge>
  );
}
