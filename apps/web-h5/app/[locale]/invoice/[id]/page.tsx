import Invoice from '@/app/components/Invoice';
import Header from '@/app/components/v2/Header';
import { httpClient } from '@/lib/http';
import BackButton from './BackButton';

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = await params;
  let detail = null;

  try {
    const data = await httpClient.get(`/go-tech/platform/packageOrder/detail/${id}`);
    if (data && data.code && data.code !== 200) {
      throw new Error(data.data);
    }
    detail = data.data;
    if (detail.packageDetail?.detail) {
      detail.packageDetail.detail.menu = detail.packageDetail.detail.menu.filter((item: any) => {
        return item.level <= 1;
      });
    }
  } catch (error) {
    console.error(error);
    detail = null;
  }

  if (!detail) {
    return (
      <main className="min-h-screen bg-muted/30 py-8 px-4 min-w-191.5">
        <article className="mx-auto max-w-3xl bg-background shadow-sm border border-border p-8">
          <h1 className="text-lg font-bold mb-2">INVOICE</h1>
          <p className="text-sm text-foreground/80">Invoice data is unavailable.</p>
        </article>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="relative py-6 bg-[#FFF8F5]">
        <div className="container mx-auto px-4">
          <BackButton />
        </div>
        <Invoice invoice={detail} />
      </section>
    </div>
  );
}
