"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import GiveUdhaarClient from "../components/GiveUdhaarClient";

function UdhaarContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  return <GiveUdhaarClient customerId={id} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading...</div>}>
      <UdhaarContent />
    </Suspense>
  );
}
