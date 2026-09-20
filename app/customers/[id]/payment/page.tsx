import RecordPaymentClient from "./RecordPaymentClient";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RecordPaymentClient customerId={id} />;
}