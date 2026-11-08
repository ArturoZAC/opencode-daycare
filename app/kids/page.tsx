import type { Metadata } from "next";
import { PlusIcon } from "@/src/components/Icons";
import { AppShell } from "@/src/layouts/components/AppShell";
import { KidsDirectory } from "@/src/modules/kids/KidsDirectory";

export const metadata: Metadata = {
  title: "Niños",
};

export default function KidsPage() {
  return (
    <AppShell activeItem="kids">
      <div className="mx-auto w-full max-w-[880px] px-5 pb-28 pt-6 md:px-10 md:pb-20 md:pt-[34px]">
        <div className="mb-[22px] flex items-end justify-between gap-4">
          <div>
            <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-[#D9583C]">
              GESTIÓN
            </div>
            <h1 className="font-display text-[30px] font-semibold text-ink">
              Niños
            </h1>
          </div>
          <span className="flex flex-none items-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-cta">
            <PlusIcon size={17} />
            Agregar niño
          </span>
        </div>

        <KidsDirectory />
      </div>
    </AppShell>
  );
}
