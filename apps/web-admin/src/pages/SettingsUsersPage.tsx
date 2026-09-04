import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast
} from '@go-tech-frontend/ui';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToggle } from 'ahooks';
import { Eye, EyeOff, Plus, Users } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

interface User {
  email: string;
  id?: number;
  nickName: string;
  password: string;
  personalPhone: string;
  username: string;
}

/** 重置密码弹窗 */
const ResetPasswordDialog = ({
  open,
  refetch,
  setOpen,
  userId
}: {
  open: boolean;
  refetch?: () => void;
  setOpen: (open: boolean) => void;
  userId: number;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!password) {
        throw new Error('請填寫所有欄位');
      }
      if (password.length < 6) {
        throw new Error('密碼長度至少6位');
      }
      const response = await fetch(
        `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformAdmin/resetPwd?id=${userId}&password=${password}`,
        {
          method: 'POST'
        }
      );
      return response.json();
    },
    onSuccess: () => {
      setOpen(false);
      toast.success('重置密碼成功');
      refetch?.();
      setPassword('');
    },
    onError: error => {
      toast.error(error.message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center">重置密碼</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="請輸入密碼"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="h-10 text-base border-border pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <DialogFooter className="flex justify-between items-center">
          <Button variant="outline" onClick={() => setOpen(false)}>
            <span>取消</span>
          </Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutateAsync()}>
            <span>重置</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const EditUserDialog = ({
  open,
  refetch,
  setOpen,
  user
}: {
  open: boolean;
  refetch?: () => void;
  setOpen: (open: boolean) => void;
  user: User;
}) => {
  // oxlint-disable-next-line react/hook-use-state
  const [userFormData, setUser] = useState<User>(JSON.parse(JSON.stringify(user)));

  const mutation = useMutation({
    mutationFn: async () => {
      const filteredData = Object.fromEntries(
        Object.entries(userFormData).filter(([_key, value]) => {
          return value !== null && value !== undefined && value !== '';
        })
      );
      let url = `${import.meta.env.VITE_PROXY_PREFIX}`;
      if (filteredData.id) {
        url += `/go-tech/platform/platformAdmin/update`;
      } else {
        url += `/go-tech/platform/platformAdmin/add`;
      }

      filteredData.roleIds = [1];

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filteredData)
      });
      return response.json();
    },
    onSuccess: result => {
      if (result && result.code !== 200) {
        toast.error(result.message);
        return;
      }
      toast.success('操作成功');
      refetch?.();
      setOpen(false);
    },
    onError: error => {
      console.log(error);
      toast.error(error.message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-medium text-foreground">
            {user.id ? '修改用戶' : '新增用戶'}
          </DialogTitle>
        </DialogHeader>

        {!user.id && (
          <div className="relative">
            <Label className="block text-lg font-medium text-foreground mb-2">用戶名稱</Label>
            <Input
              value={userFormData.username}
              onChange={e => {
                setUser({ ...userFormData, username: e.target.value });
              }}
              className="h-10 text-base border-border pr-12"
            />
          </div>
        )}
        <div className="relative">
          <Label className="block text-lg font-medium text-foreground mb-2">暱稱</Label>
          <Input
            value={userFormData.nickName}
            onChange={e => {
              setUser({ ...userFormData, nickName: e.target.value });
            }}
            className="h-10 text-base border-border pr-12"
          />
        </div>
        {userFormData.id ? null : (
          <>
            <div className="relative">
              <Label className="block text-lg font-medium text-foreground mb-2">郵箱</Label>
              <Input
                value={userFormData.email}
                onChange={e => {
                  setUser({ ...userFormData, email: e.target.value });
                }}
                className="h-10 text-base border-border pr-12"
              />
            </div>
            <div className="relative">
              <Label className="block text-lg font-medium text-foreground mb-2">個人電話</Label>
              <Input
                value={userFormData.personalPhone}
                onChange={e => {
                  setUser({ ...userFormData, personalPhone: e.target.value });
                }}
                className="h-10 text-base border-border pr-12"
              />
            </div>
            <div className="relative">
              <Label className="block text-lg font-medium text-foreground mb-2">密碼</Label>
              <Input
                value={userFormData.password}
                onChange={e => {
                  setUser({ ...userFormData, password: e.target.value });
                }}
                className="h-10 text-base border-border pr-12"
              />
            </div>
          </>
        )}
        <DialogFooter className="flex justify-between items-center">
          <Button variant="outline" onClick={() => setOpen(false)}>
            <span>取消</span>
          </Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutateAsync()}>
            <span>保存</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
const SettingsUsersPage = () => {
  const [resetPwdModel, { toggle: toggleResetPwdModel }] = useToggle(false);
  const [editModel, { toggle: toggleEditModel }] = useToggle(false);
  const currentUser = useRef<User>(null);

  const query = useQuery({
    queryKey: ['platform/admin/list'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformAdmin/list`);
      return res.json();
    }
  });

  const statusMutation = useMutation({
    mutationFn: async (data: { id: string; status: number }) => {
      const { id, status } = data;
      const res = await fetch(
        `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformAdmin/updateStatus/${id}?status=${status}`,
        {
          method: 'POST'
        }
      );
      return res.json();
    },
    onSuccess: () => {
      query.refetch();
      toast.success('更新成功');
    },
    onError: () => {
      toast.error('更新失败');
    }
  });

  const handleResetPwd = (user: User) => {
    currentUser.current = user;
    toggleResetPwdModel();
  };

  const handleEdit = (user: User) => {
    currentUser.current = user;
    toggleEditModel();
  };

  const list = useMemo(() => {
    if (query.data) {
      return query.data.data?.records || [];
    }
    return [];
  }, [query.data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">用戶管理</h1>
        </div>
        <Button
          onClick={() => {
            currentUser.current = {
              username: '',
              nickName: '',
              email: '',
              password: '',
              personalPhone: ''
            };
            toggleEditModel();
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          新增用戶
        </Button>
      </div>

      {/* 重置密码弹框 */}
      {resetPwdModel && currentUser.current && currentUser.current.id && (
        <ResetPasswordDialog
          open={resetPwdModel}
          setOpen={() => toggleResetPwdModel()}
          userId={currentUser.current.id}
          refetch={query.refetch}
        />
      )}

      {/* 用户弹框 */}
      {editModel && currentUser.current && (
        <EditUserDialog
          open={editModel}
          setOpen={() => toggleEditModel()}
          user={currentUser.current}
          refetch={query.refetch}
        />
      )}

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
            {list.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell />
                <TableCell className="text-center flex items-center justify-center gap-1">
                  <Switch
                    checked={user.status === 1}
                    onCheckedChange={() => {
                      statusMutation.mutateAsync({
                        id: user.id,
                        status: user.status === 1 ? 0 : 1
                      });
                    }}
                  />
                  <div className={user.status === 1 ? 'text-primary' : 'text-gray-800'}>{user.statusText}</div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.loginTime}</TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="sm" onClick={() => handleResetPwd(user)}>
                    重置密碼
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
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
