import type { Metadata } from "next";
import { Suspense } from "react";
import VerifyForm from "@/components/VerifyForm";

export const metadata: Metadata = { title: "ยืนยันตัวตน" };

export default function VerifyPage() {
  return (
    <div className="vwrap">
      <Suspense fallback={null}><VerifyForm /></Suspense>
    </div>
  );
}
