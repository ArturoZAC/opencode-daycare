import Link from "next/link";
import { PlusIcon, SunIcon } from "@/src/components/Icons";
import { CreatePostDialog } from "@/src/modules/feed/CreatePostDialog";
import { NAV_ITEMS, type NavItem } from "../nav";

export function MobileNav({ activeItem }: { activeItem: NavItem }) {
  return (
    <>
      <header className="flex items-center justify-between border-b border-line bg-card px-4 py-3 md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)]">
            <SunIcon size={18} />
          </div>
          <span className="font-display text-[15px] font-semibold text-ink">
            OpenDayCare
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <CreatePostDialog ariaLabel="Nueva publicación" className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[linear-gradient(180deg,#F4977E,#EE8164)] text-white">
            <PlusIcon size={17} />
          </CreatePostDialog>
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#F2937A] font-display text-sm font-semibold text-white">
            C
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV_ITEMS.map(({ id, label, icon: Icon, href }) => {
          const className = `flex flex-col items-center gap-1 py-2 text-[11px] ${
            id === activeItem
              ? "font-extrabold text-coral"
              : "font-semibold text-[#6E6359]"
          }`;

          return href ? (
            <Link key={id} href={href} className={className}>
              <Icon size={20} />
              {label}
            </Link>
          ) : (
            <span key={id} className={className}>
              <Icon size={20} />
              {label}
            </span>
          );
        })}
      </nav>
    </>
  );
}
