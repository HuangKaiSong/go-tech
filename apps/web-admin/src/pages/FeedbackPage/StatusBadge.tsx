import { Badge } from '@go-tech-frontend/ui';
import { statusOptions, statusStyle } from './contrans';
import type { FeedbackStatus } from './types';

const StatusBadge = ({ status }: { status: FeedbackStatus }) => (
  <Badge variant="secondary" className={statusStyle[status]}>
    {statusOptions.find(s => s.value === status)?.label}
  </Badge>
);

export default StatusBadge;
