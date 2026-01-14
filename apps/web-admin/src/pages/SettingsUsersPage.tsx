import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const mockUsers = [
  {
    id: "1",
    name: "張三",
    email: "zhangsan@example.com",
    role: "超級管理員",
    status: "啟用",
    lastLogin: "2024-01-10 14:30",
  },
  {
    id: "2",
    name: "李四",
    email: "lisi@example.com",
    role: "營運管理員",
    status: "啟用",
    lastLogin: "2024-01-10 10:15",
  },
  {
    id: "3",
    name: "王五",
    email: "wangwu@example.com",
    role: "客服人員",
    status: "停用",
    lastLogin: "2024-01-05 09:00",
  },
];

const SettingsUsersPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">用戶管理</h1>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          新增用戶
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用戶名稱</TableHead>
              <TableHead>電子郵件</TableHead>
              <TableHead>角色</TableHead>
              <TableHead className="text-center">狀態</TableHead>
              <TableHead>最後登入</TableHead>
              <TableHead className="text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {user.email}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{user.role}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={user.status === "啟用" ? "default" : "secondary"}
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.lastLogin}
                </TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="sm">
                    編輯
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SettingsUsersPage;
