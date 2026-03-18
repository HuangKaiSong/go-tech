import { httpClient } from "@/lib/http";
import PageClient from "./_page";

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = await params;
  let detail = null;
    
  try {
    const data = await httpClient.get(`/go-tech/platform/packageOrder/detail/${id}`)
    detail = data.data    
  } catch (error) {
    detail = null
  }

  return <PageClient id={id} detail={detail} />;
}
