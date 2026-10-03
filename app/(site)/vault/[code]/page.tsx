import type { Metadata } from "next";
import VaultView from "@/components/VaultView";

export const metadata: Metadata = { title: "Vault" };
export default async function VaultCodePage({ params }: { params: Promise<{ code: string }> }) {
  return <VaultView code={(await params).code} />;
}
