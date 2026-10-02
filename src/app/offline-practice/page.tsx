import type { Metadata } from "next";
import { OfflinePractice } from "@/components/offline-practice";

export const metadata: Metadata = {
  title: "Offline Practice",
  description: "Practice a quick set of Irish theory test questions without an internet connection.",
};

export default function OfflinePracticePage() {
  return <OfflinePractice />;
}
