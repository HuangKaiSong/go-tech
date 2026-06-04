import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Pencil, Power, Trash2, DollarSign,
  Users, Shield, Gift, Briefcase, CalendarDays, FileText, CheckCircle2
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { mockPlans } from "./PayrollStructure";

const statusColors: Record<string, string> = {
  "啟用": "bg-success/10 text-success border-success/20",
  "停用": "bg-muted text-muted-foreground border-border",
};

const earningsItems = [
  { name: "交通補助", type: "固定", value: "HK$2,000/月" },
  { name: "伙食津貼", type: "固定", value: "HK$2,400/月" },
  { name: "技術津貼", type: "固定", value: "HK$3,000/月" },
];

const deductionItems = [
  { name: "勞保", type: "比例", value: "11%" },
  { name: "健保", type: "比例", value: "5.17%" },
  { name: "勞退提撥", type: "比例", value: "6%" },
];

const applicableEmployees = [
  { name: "張小明", department: "技術部", position: "前端工程師", salary: "HK$65,000" },
  { name: "黃志偉", department: "技術部", position: "後端工程師", salary: "HK$60,000" },
  { name: "周建國", department: "技術部", position: "資深後端工程師", salary: "HK$75,000" },
];

export default function PayrollPlanDetail() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [showDisable, setShowDisable] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const plan = planId ? mockPlans.find(p => p.id === planId) : null;

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">找不到該薪資方案</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/payroll/structure")}>
          <ArrowLeft className="h-4 w-4 mr-2" />返回薪資結構
        </Button>
      </div>
    );
  }

  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/payroll/structure")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              {plan.name}
              <Badge className={`${statusColors[plan.status]} border text-xs ml-2`}>{plan.status}</Badge>
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm font-mono">{plan.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDisable(true)}>
            <Power className="h-4 w-4 mr-2" />{plan.status === "啟用" ? "停用" : "啟用"}
          </Button>
          <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-4 w-4 mr-2" />刪除
          </Button>
          <Button onClick={() => navigate(`/payroll/structure/${plan.id}/edit`)}>
            <Pencil className="h-4 w-4 mr-2" />編輯方案
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />基本資訊
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">方案名稱</p>
                  <p className="text-sm font-medium text-foreground">{plan.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">方案代碼</p>
                  <p className="text-sm font-mono text-foreground">{plan.code}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">適用對象</p>
                  <p className="text-sm font-medium text-foreground">{plan.applicable}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">適用人數</p>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{plan.applicableCount} 人</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">建立日期</p>
                  <p className="text-sm text-foreground flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />{plan.createdAt}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">最後更新</p>
                  <p className="text-sm text-foreground flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />{plan.updatedAt}
                  </p>
                </div>
              </div>
              <Separator className="my-4" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">方案說明</p>
                <p className="text-sm text-foreground leading-relaxed">{plan.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Salary Range */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />薪資範圍
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                  <p className="text-xs text-muted-foreground mb-1">最低基本薪資</p>
                  <p className="text-lg font-bold text-primary">HK${fmt(plan.baseSalaryMin)}</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                  <p className="text-xs text-muted-foreground mb-1">最高基本薪資</p>
                  <p className="text-lg font-bold text-primary">HK${fmt(plan.baseSalaryMax)}</p>
                </div>
                <div className="p-4 rounded-lg bg-success/5 border border-success/10 text-center">
                  <p className="text-xs text-muted-foreground mb-1">津貼合計</p>
                  <p className="text-lg font-bold text-success">HK${fmt(plan.allowance)}</p>
                </div>
                <div className="p-4 rounded-lg bg-warning/5 border border-warning/10 text-center">
                  <p className="text-xs text-muted-foreground mb-1">保險扣除</p>
                  <p className="text-lg font-bold text-warning">HK${fmt(plan.insurance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Earnings & Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="h-4 w-4 text-success" />加項明細
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {earningsItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/10">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.type}</p>
                      </div>
                      <p className="text-sm font-bold text-success">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-warning" />減項明細
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deductionItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/10">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.type}</p>
                      </div>
                      <p className="text-sm font-bold text-warning">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Applicable Employees */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />適用員工
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {applicableEmployees.map((emp, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                      {emp.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.department} · {emp.position}</p>
                    </div>
                    <p className="text-xs font-medium text-foreground">{emp.salary}</p>
                  </div>
                ))}
              </div>
              {plan.applicableCount > 3 && (
                <Button variant="ghost" className="w-full mt-3 text-sm text-muted-foreground">
                  查看全部 {plan.applicableCount} 名員工
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">方案摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "試用期薪資", value: "80%" },
                { label: "加班費基準", value: "時薪制" },
                { label: "含年終獎金", value: "是" },
                { label: "適用勞退提撥", value: "6%" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />{item.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Disable Dialog */}
      <AlertDialog open={showDisable} onOpenChange={setShowDisable}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{plan.status === "啟用" ? "確認停用方案" : "確認啟用方案"}</AlertDialogTitle>
            <AlertDialogDescription>
              {plan.status === "啟用"
                ? `停用「${plan.name}」後，該方案將不再適用於新的薪資計算。目前適用 ${plan.applicableCount} 名員工。`
                : `確認要重新啟用「${plan.name}」嗎？`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => { toast.success(`已${plan.status === "啟用" ? "停用" : "啟用"}方案`); setShowDisable(false); }}>
              確認
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除方案</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除「{plan.name}」嗎？此操作無法復原。{plan.applicableCount > 0 && `目前仍有 ${plan.applicableCount} 名員工適用此方案。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { toast.success("已刪除方案"); navigate("/payroll/structure"); }}>
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
