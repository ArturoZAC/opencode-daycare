import type { Metadata } from "next";
import { AppShell } from "@/src/layouts/components/AppShell";
import { KidsDirectory } from "@/src/modules/kids/KidsDirectory";

export const metadata: Metadata = {
  title: "Niños",
};

export default function KidsPage() {
  return (
    <AppShell activeItem="kids">
      <div className="mx-auto w-full max-w-[880px] px-5 pb-28 pt-6 md:px-10 md:pb-20 md:pt-[34px]">
        <KidsDirectory />
      </div>
    </AppShell>
  );
}
