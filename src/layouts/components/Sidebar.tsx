import Link from "next/link";
import { LogoutIcon, PlusIcon, SunIcon } from "@/src/components/Icons";
import { NAV_ITEMS, type NavItem } from "../nav";

export function Sidebar({ activeItem }: { activeItem: NavItem }) {
  return (
    <aside className="hidden w-[248px] flex-none flex-col border-r border-line bg-card px-4 py-6 md:flex">
      <div className="flex items-center gap-[11px] px-2 pb-[22px] pt-1">
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-[linear-gradient(155deg,#F8C3A8,#F2937A)]">
          <SunIcon />
        </div>
        <div>
          <div className="font-display text-[17px] font-semibold leading-none text-ink">
            OpenDayCare
          </div>
          <div className="mt-0.5 text-[11.5px] text-muted-2">Sala Soles</div>
        </div>
      </div>

      <div className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] p-3 text-[14.5px] font-extrabold text-white shadow-cta">
        <PlusIcon size={17} />
        Nueva publicación
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon, href }) => {
          const className = `flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] ${
            id === activeItem
              ? "bg-coral-soft font-extrabold text-[#D9583C]"
              : "font-semibold text-[#6E6359]"
          }`;

          return href ? (
            <Link key={id} href={href} className={className}>
              <Icon />
              {label}
            </Link>
          ) : (
            <span key={id} className={className}>
              <Icon />
              {label}
            </span>
          );
        })}
      </nav>

      <div className="mt-2.5 border-t border-line pt-3.5">
        <div className="flex items-center gap-[11px] px-2 py-1.5">
          <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-[#F2937A] font-display text-base font-semibold text-white">
            C
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-ink">Caro Giménez</div>
            <div className="text-xs text-muted-2">Maestra · Soles</div>
          </div>
          <span
            title="Cerrar sesión"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-cream text-muted"
          >
            <LogoutIcon />
          </span>
        </div>
      </div>
    </aside>
  );
}
