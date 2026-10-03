import type { Metadata } from "next";
import VaultHome from "@/components/VaultHome";

export const metadata: Metadata = { title: "Vault" };
export default function VaultPage() {
  return <VaultHome />;
}
