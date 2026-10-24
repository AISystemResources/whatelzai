import type { Metadata } from "next";
import SettingsPanel from "@/components/admin/SettingsPanel";
export const metadata: Metadata = { title: "Settings — Admin" };
export default function SettingsPage() {
  return <SettingsPanel />;
}
