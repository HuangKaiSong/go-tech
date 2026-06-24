import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@go-tech-frontend/ui';
import { Plus, Shield } from 'lucide-react';

const mockRoles = [
  {
    id: '1',
    name: '超級管理員',
    description: '擁有所有系統權限',
    userCount: 2,
    permissions: ['全部權限']
  },
  {
    id: '2',
    name: '營運管理員',
    description: '管理訂單與客戶相關功能',
    userCount: 5,
    permissions: ['訂單管理', '客戶管理', '優惠管理']
  },
  {
    id: '3',
    name: '客服人員',
    description: '查看訂單與客戶資訊',
    userCount: 8,
    permissions: ['訂單查看', '客戶查看']
  }
];

const RolesPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">角色管理</h1>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          新增角色
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>角色名稱</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>權限</TableHead>
              <TableHead className="text-center">用戶數</TableHead>
              <TableHead className="text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockRoles.map(role => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell className="text-muted-foreground">{role.description}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map(permission => (
                      <Badge key={permission} variant="secondary">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center">{role.userCount}</TableCell>
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

export default RolesPage;
