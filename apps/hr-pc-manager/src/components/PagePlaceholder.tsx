import { Download, Filter, type LucideIcon, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Column {
  key: string;
  label: string;
}

interface PagePlaceholderProps {
  addLabel?: string;
  columns: Column[];
  data: Record<string, string | number>[];
  description: string;
  icon: LucideIcon;
  statusColors?: Record<string, string>;
  statusKey?: string;
  title: string;
}

export function PagePlaceholder({
  addLabel = '新增',
  columns,
  data,
  description,
  icon: Icon,
  statusColors = {},
  statusKey,
  title
}: PagePlaceholderProps) {
  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Icon className="h-6 w-6 text-primary" />
            {title}
          </h1>
          <p className="page-description">{description}</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {addLabel}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜尋..." className="pl-9 h-9" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                篩選
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                匯出
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(col => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i}>
                  {columns.map(col => (
                    <TableCell key={col.key}>
                      {statusKey && col.key === statusKey ? (
                        <Badge variant="secondary" className={statusColors[String(row[col.key])] || ''}>
                          {row[col.key]}
                        </Badge>
                      ) : (
                        row[col.key]
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
