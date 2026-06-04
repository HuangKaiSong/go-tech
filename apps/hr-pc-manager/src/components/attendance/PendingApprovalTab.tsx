import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock, CheckCircle2, XCircle, ChevronRight, AlertTriangle,
  CalendarDays, DollarSign, MapPin, FileText, Timer
} from "lucide-react";
import { toast } from "sonner";

interface PendingRecord {
  id: string;
  code: string;
  applicant: string;
  department: string;
  type: string;
  subType?: string;
  submitTime: string;
  summary: string;
  currentNode: string;
  urgency: "normal" | "urgent" | "overdue";
  waitingHours: number;
}

const urgencyConfig = {
  normal: { label: "正常", color: "bg-muted text-muted-foreground" },
  urgent: { label: "緊急", color: "bg-warning/10 text-warning border-warning/20" },
  overdue: { label: "超時", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

const typeIcons: Record<string, React.ElementType> = {
  "請假申請": CalendarDays,
  "加班申請": Clock,
  "報銷申請": DollarSign,
  "出差申請": MapPin,
  "離職申請": FileText,
};

const mockPending: PendingRecord[] = [
  { id: "1", code: "AP-2026-0301", applicant: "張小明", department: "技術部", type: "請假申請", subType: "年假", submitTime: "2026-03-01 09:30", summary: "年假 3 天 (03/05-03/07)", currentNode: "部門主管審批", urgency: "normal", waitingHours: 6 },
  { id: "2", code: "AP-2026-0298", applicant: "李文華", department: "銷售部", type: "報銷申請", subType: "差旅費", submitTime: "2026-02-28 14:20", summary: "出差報銷 NT$12,500", currentNode: "財務審核", urgency: "urgent", waitingHours: 26 },
  { id: "7", code: "AP-2026-0310", applicant: "趙志強", department: "技術部", type: "加班申請", submitTime: "2026-03-02 18:00", summary: "加班 3 小時 (03/02)", currentNode: "部門主管審批", urgency: "normal", waitingHours: 2 },
  { id: "8", code: "AP-2026-0312", applicant: "周雅婷", department: "市場部", type: "出差申請", submitTime: "2026-02-25 09:00", summary: "北京出差 5 天 (03/15-03/19)", currentNode: "總經理審批", urgency: "overdue", waitingHours: 72 },
  { id: "9", code: "AP-2026-0315", applicant: "吳建國", department: "人事部", type: "請假申請", subType: "事假", submitTime: "2026-03-03 08:00", summary: "事假 1 天 (03/04)", currentNode: "部門主管審批", urgency: "urgent", waitingHours: 18 },
];

export default function PendingApprovalTab() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("urgency");
  const [batchAction, setBatchAction] = useState<"approve" | "reject" | null>(null);
  const [batchComment, setBatchComment] = useState("");

  const sorted = [...mockPending].sort((a, b) => {
    if (sortBy === "urgency") {
      const order = { overdue: 0, urgent: 1, normal: 2 };
      return order[a.urgency] - order[b.urgency];
    }
    if (sortBy === "time") return a.waitingHours > b.waitingHours ? -1 : 1;
    return 0;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelected(selected.length === sorted.length ? [] : sorted.map((r) => r.id));
  };

  const handleBatchSubmit = () => {
    const action = batchAction === "approve" ? "批量核准" : "批量駁回";
    toast.success(`${action} ${selected.length} 筆申請成功`);
    setSelected([]);
    setBatchAction(null);
    setBatchComment("");
  };

  const urgencyCounts = {
    overdue: mockPending.filter((r) => r.urgency === "overdue").length,
    urgent: mockPending.filter((r) => r.urgency === "urgent").length,
    normal: mockPending.filter((r) => r.urgency === "normal").length,
  };

  return (
    <div className="space-y-4">
      {/* Urgency summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{urgencyCounts.overdue}</p>
              <p className="text-xs text-muted-foreground">超時待審（&gt;48h）</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Timer className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{urgencyCounts.urgent}</p>
              <p className="text-xs text-muted-foreground">緊急待審（24-48h）</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{urgencyCounts.normal}</p>
              <p className="text-xs text-muted-foreground">正常待審（&lt;24h）</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground">已選 {selected.length} 項</span>
              <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => setBatchAction("approve")}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />批量核准
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setBatchAction("reject")}>
                <XCircle className="h-3.5 w-3.5 mr-1" />批量駁回
              </Button>
            </>
          )}
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="urgency">按緊急程度</SelectItem>
            <SelectItem value="time">按等待時間</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox checked={selected.length === sorted.length && sorted.length > 0} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead>緊急度</TableHead>
                <TableHead>申請編號</TableHead>
                <TableHead>申請人</TableHead>
                <TableHead>部門</TableHead>
                <TableHead>申請類型</TableHead>
                <TableHead>摘要</TableHead>
                <TableHead>等待時間</TableHead>
                <TableHead>當前節點</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((r) => {
                const uc = urgencyConfig[r.urgency];
                const TypeIcon = typeIcons[r.type] || FileText;
                return (
                  <TableRow
                    key={r.id}
                    className={`cursor-pointer hover:bg-muted/50 ${r.urgency === "overdue" ? "bg-destructive/5" : ""}`}
                    onClick={() => navigate(`/attendance/approval/${r.code}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.includes(r.id)} onCheckedChange={() => toggleSelect(r.id)} />
                    </TableCell>
                    <TableCell>
                      <Badge className={`${uc.color} border`}>
                        {r.urgency === "overdue" && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {uc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{r.code}</TableCell>
                    <TableCell className="font-medium">{r.applicant}</TableCell>
                    <TableCell>{r.department}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal gap-1">
                        <TypeIcon className="h-3 w-3" />{r.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-48 truncate">{r.summary}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${r.waitingHours > 48 ? "text-destructive" : r.waitingHours > 24 ? "text-warning" : "text-muted-foreground"}`}>
                        {r.waitingHours}h
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{r.currentNode}</TableCell>
                    <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                  </TableRow>
                );
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-success" />
                    <p>目前沒有待審批的申請 🎉</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Batch action dialog */}
      <Dialog open={!!batchAction} onOpenChange={() => setBatchAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{batchAction === "approve" ? "批量核准" : "批量駁回"}</DialogTitle>
            <DialogDescription>
              即將{batchAction === "approve" ? "核准" : "駁回"} {selected.length} 筆申請
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-medium text-foreground mb-2">選中的申請：</p>
              <div className="space-y-1">
                {sorted.filter((r) => selected.includes(r.id)).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{r.code}</span>
                    <span>{r.applicant} - {r.summary}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">審批意見（選填）</p>
              <Textarea
                placeholder="請輸入審批意見..."
                value={batchComment}
                onChange={(e) => setBatchComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchAction(null)}>取消</Button>
            <Button
              className={batchAction === "approve" ? "bg-success hover:bg-success/90 text-success-foreground" : ""}
              variant={batchAction === "reject" ? "destructive" : "default"}
              onClick={handleBatchSubmit}
            >
              確認{batchAction === "approve" ? "核准" : "駁回"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
