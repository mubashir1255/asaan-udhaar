"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import CustomerDetailsClient from "../[id]/CustomerDetailsClient";

function DetailsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  return <CustomerDetailsClient customerId={id} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading...</div>}>
      <DetailsContent />
    </Suspense>
  );
}
