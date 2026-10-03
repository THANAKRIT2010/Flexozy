import type { Metadata } from "next";
import AdminPanel from "@/components/AdminPanel";

export const metadata: Metadata = { title: "แอดมิน" };
export default function AdminPage() {
  return <AdminPanel />;
}
