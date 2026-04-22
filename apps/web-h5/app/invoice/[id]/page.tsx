import Header from "@/app/components/Header";
import Invoice from "@/app/components/Invoice";
import { httpClient } from "@/lib/http";
import BackButton from "./BackButton";

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = await params;
  let detail = null;
    
  try {
    const data = await httpClient.get(`/go-tech/platform/packageOrder/detail/${id}`)
    detail = data.data
    if (detail.platformPackageDto?.packageItemList) {
    detail.platformPackageDto.packageItemList = detail.platformPackageDto.packageItemList.filter((item: any) => {
      return item.level <= 1;
    })
  }
  } catch (error) {
    detail = null
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
  )
}
