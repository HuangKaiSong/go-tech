import { Button } from '@go-tech/web-ui';
import { Package } from 'lucide-react';
import { DynamicText } from '@/app/components/DynamicI18nText';
import Footer from '@/app/components/Footer';
import Link from '@/app/components/Link';
import Header from '@/app/components/v2/Header';
import type { MyOrder } from '@/app/constants/order-response';
import { isOrderId } from '@/app/lib/order-id';
import { httpClient } from '@/lib/http';
import PageClient from './_page';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let detail: MyOrder | null = null;

  if (isOrderId(id)) {
    try {
      const response = await httpClient.get<MyOrder | string | null>(`/go-tech/platform/packageOrder/detail/${id}`);
      const order = response.data;
      // HTTP 客户端会返回错误响应体，业务失败不能只靠 catch 或 data 的真假判断。
      if (
        response.code === 200 &&
        order !== null &&
        typeof order === 'object' &&
        !Array.isArray(order) &&
        typeof order.id === 'number' &&
        typeof order.orderNo === 'string' &&
        Array.isArray(order.orderItems)
      ) {
        detail = order;
        const menu = order.packageDetail?.detail?.menu;
        if (menu && order.packageDetail) {
          detail = {
            ...order,
            packageDetail: {
              ...order.packageDetail,
              detail: { ...order.packageDetail.detail, menu: menu.filter(item => item.level <= 1) }
            }
          };
        }
      }
    } catch (error) {
      console.error(error);
      detail = null;
    }
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="pt-32 pb-16">
          <div className="container mx-auto px-4 text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">
              <DynamicText text="訂單詳情" />
            </h1>
            <p className="text-muted-foreground mb-6">
              <DynamicText text="該訂單不存在或已被刪除" />
            </p>
            <Link href="/my-orders">
              <Button>
                <DynamicText text="返回我的訂單" />
              </Button>
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return <PageClient id={id} detail={detail} />;
}
