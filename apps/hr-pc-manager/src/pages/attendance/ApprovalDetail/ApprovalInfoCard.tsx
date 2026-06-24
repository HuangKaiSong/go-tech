import { Building2, Paperclip, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ApprovalData } from './types';

const BOLD_KEYWORDS = ['天數', '時數', '金額', '費用'];
const BADGE_KEYWORDS = ['類別', '假別', '類型'];

const matchesAny = (key: string, list: string[]) => list.some(k => key.includes(k));

interface DetailFieldProps {
  fieldKey: string;
  value: string;
}

const DetailField = ({ fieldKey, value }: DetailFieldProps) => {
  const isBold = matchesAny(fieldKey, BOLD_KEYWORDS);
  const isBadge = !isBold && matchesAny(fieldKey, BADGE_KEYWORDS);
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{fieldKey}</p>
      {isBold && <p className="text-sm font-bold text-primary">{value}</p>}
      {isBadge && <Badge variant="outline">{value}</Badge>}
      {!isBold && !isBadge && <p className="text-sm font-medium text-foreground">{value}</p>}
    </div>
  );
};

interface ApprovalInfoCardProps {
  data: ApprovalData;
  TypeIcon: React.ElementType;
}

export const ApprovalInfoCard = ({ data, TypeIcon }: ApprovalInfoCardProps) => {
  const detailEntries = Object.entries(data.details);
  const reasonEntry = detailEntries.find(([k]) => k.includes('事由'));
  const infoEntries = detailEntries.filter(([k]) => !k.includes('事由'));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TypeIcon className="h-4 w-4 text-primary" />
          {data.type}資訊
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">申請人</p>
            <p className="text-sm font-medium text-foreground flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              {data.applicant}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">部門</p>
            <p className="text-sm font-medium text-foreground flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              {data.department}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">職位</p>
            <p className="text-sm font-medium text-foreground">{data.position}</p>
          </div>
          {infoEntries.map(([key, value]) => (
            <DetailField key={key} fieldKey={key} value={value} />
          ))}
        </div>

        {reasonEntry && (
          <>
            <Separator className="my-4" />
            <div>
              <p className="text-xs text-muted-foreground mb-1">{reasonEntry[0]}</p>
              <p className="text-sm text-foreground leading-relaxed">{reasonEntry[1]}</p>
            </div>
          </>
        )}

        {data.attachments.length > 0 && (
          <>
            <Separator className="my-4" />
            <div>
              <p className="text-xs text-muted-foreground mb-2">附件</p>
              <div className="space-y-1">
                {data.attachments.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline">
                    <Paperclip className="h-3.5 w-3.5" />
                    {file}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
