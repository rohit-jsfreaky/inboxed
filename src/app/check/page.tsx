import type { Metadata } from "next";
import { Postroom } from "@/components/Postroom";

export const metadata: Metadata = { title: "Check a domain · Inboxed" };

export default function CheckPage() {
  return <Postroom />;
}
