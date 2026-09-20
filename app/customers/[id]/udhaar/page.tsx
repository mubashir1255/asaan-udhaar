import GiveUdhaarClient from "./GiveUdhaarClient";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GiveUdhaarClient customerId={id} />;
}