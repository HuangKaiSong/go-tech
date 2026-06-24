import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@go-tech-frontend/ui';
import { ArrowLeft, ExternalLink, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

// Mock customer data
const mockCustomerDetail = {
  id: 'TC000001',
  name: '张大龍',
  phone: '98253973',
  idNumber: '**********',
  type: '個人/公司'
};

// Mock orders data
const mockCustomerOrders = [
  {
    id: 'TC000001',
    packageType: '黃金套餐',
    addons: '租務系統；會計系統',
    amount: '$1080',
    paymentMethod: '轉賬',
    paymentTime: '12/08/2025 10:00',
    status: '已支付'
  },
  {
    id: 'TC000002',
    packageType: '白金套餐',
    addons: '場務系統；增加單位*10',
    amount: '$3280',
    paymentMethod: '網銀',
    paymentTime: '12/08/2025 10:00',
    status: '已支付'
  },
  {
    id: 'TC000003',
    packageType: '鑽石套餐',
    addons: '租務系統；會計系統',
    amount: '$12080',
    paymentMethod: '',
    paymentTime: '',
    status: '未支付'
  },
  {
    id: 'TC000004',
    packageType: '白金套餐',
    addons: '場務系統；增加單位*10',
    amount: '$3280',
    paymentMethod: '網銀',
    paymentTime: '12/08/2025 10:00',
    status: '已支付'
  }
];

const getStatusClass = (status: string) => {
  if (status === '已支付') {
    return 'text-success';
  }
  return 'text-primary';
};

const CustomerDetailPage = () => {
  const navigate = useNavigate();
  const { id: _id } = useParams();

  const handleBack = () => {
    navigate('/customers');
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Breadcrumb */}
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">
          會員列表/<span className="text-muted-foreground">客戶詳情</span>
        </h1>
      </div>

      {/* Customer Info Card */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <Button variant="link" className="text-muted-foreground gap-2 p-0 h-auto" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium">客戶資料</span>
            <Button variant="ghost" size="icon" className="text-primary h-8 w-8">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        {/* Customer Info */}
        <div className="px-6 py-4 flex flex-wrap items-center gap-x-12 gap-y-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">客戶編號：</span>
            <span className="font-medium">{mockCustomerDetail.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">客人名稱：</span>
            <span className="font-medium">{mockCustomerDetail.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">聯絡電話：</span>
            <span className="font-medium">{mockCustomerDetail.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">證件號碼：</span>
            <span className="font-medium">{mockCustomerDetail.idNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">客戶類型：</span>
            <span className="font-medium">{mockCustomerDetail.type}</span>
          </div>
        </div>

        {/* Orders Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              <TableHead className="text-center font-medium">訂單編號</TableHead>
              <TableHead className="text-center font-medium">套餐類型</TableHead>
              <TableHead className="text-center font-medium">附加內容</TableHead>
              <TableHead className="text-center font-medium">訂單金額</TableHead>
              <TableHead className="text-center font-medium">支付方式</TableHead>
              <TableHead className="text-center font-medium">支付時間</TableHead>
              <TableHead className="text-center font-medium">訂單狀態</TableHead>
              <TableHead className="text-center font-medium">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCustomerOrders.map((order, index) => (
              <TableRow key={index} className="hover:bg-table-hover">
                <TableCell className="text-center">{order.id}</TableCell>
                <TableCell className="text-center">{order.packageType}</TableCell>
                <TableCell className="text-center">{order.addons}</TableCell>
                <TableCell className="text-center">{order.amount}</TableCell>
                <TableCell className="text-center">{order.paymentMethod}</TableCell>
                <TableCell className="text-center">{order.paymentTime}</TableCell>
                <TableCell className={`text-center ${getStatusClass(order.status)}`}>{order.status}</TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="link"
                    className="text-primary p-0 h-auto"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    查看
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

export default CustomerDetailPage;
