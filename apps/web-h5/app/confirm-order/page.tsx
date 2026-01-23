import PageClient from "./_page";

export default async function SelectPlanPage({
  params,
}: {
  params: { plan: string };
}) {
  const { plan } = await params;

  return <PageClient />;
}
