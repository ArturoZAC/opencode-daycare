import type { ReactNode } from "react";
import type { NavItem } from "../nav";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";

export function AppShell({
  activeItem,
  children,
}: {
  activeItem: NavItem;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-cream md:h-dvh md:overflow-hidden">
      <Sidebar activeItem={activeItem} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav activeItem={activeItem} />
        <main className="min-h-0 flex-1 md:h-dvh md:overflow-y-auto [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb]:border-[3px] [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-[#E4D6C4] [&::-webkit-scrollbar-thumb]:bg-clip-content">
          {children}
        </main>
      </div>
    </div>
  );
}
