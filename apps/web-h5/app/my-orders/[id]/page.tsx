import PageClient from "./_page";

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = await params;
  return <PageClient id={id} />;
}
