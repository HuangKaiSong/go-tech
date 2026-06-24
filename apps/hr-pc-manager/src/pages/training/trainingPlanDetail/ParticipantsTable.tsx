import { User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CardContent } from '@/components/ui/card';
import { CollapsibleContent } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { participantStatusColors } from './constants';

const ParticipantsTable = ({ completionRate: _, participants }) => {
  return (
    <CollapsibleContent>
      <CardContent className="p-0 pt-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>員工</TableHead>
              <TableHead>部門</TableHead>
              <TableHead>職位</TableHead>
              <TableHead>入職日期</TableHead>
              <TableHead>培訓進度</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>完成日期</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map(p => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.employeeId}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{p.department}</TableCell>
                <TableCell className="text-sm">{p.position}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.joinDate}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={p.progress} className="w-20 h-1.5" />
                    <span className="text-xs text-muted-foreground">
                      {p.completedModules}/{p.totalModules}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${participantStatusColors[p.status]}`}>
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.completedAt || '-'}</TableCell>
              </TableRow>
            ))}
            {participants.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  尚無參訓人員
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </CollapsibleContent>
  );
};

export default ParticipantsTable;
