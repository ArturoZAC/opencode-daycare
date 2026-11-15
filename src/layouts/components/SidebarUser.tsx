import { Suspense } from "react";
import { LogoutIcon } from "@/src/components/Icons";
import { logout } from "@/src/modules/auth/actions";
import { getCurrentUser } from "@/src/modules/auth/currentUser";

export function SidebarUser() {
  return (
    <Suspense
      fallback={<div className="mx-2 h-[50px] animate-pulse rounded-xl bg-cream" />}
    >
      <SidebarUserContent />
    </Suspense>
  );
}

// Lee cookies() (sesión): va bajo Suspense para no bloquear el prerender del shell.
async function SidebarUserContent() {
  const user = await getCurrentUser();

  return (
    <div className="flex items-center gap-[11px] px-2 py-1.5">
      <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-[#F2937A] font-display text-base font-semibold text-white">
        {user?.fullName.charAt(0).toUpperCase() ?? "?"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-extrabold text-ink">
          {user?.fullName ?? "Mi cuenta"}
        </div>
        {user?.roleLabel ? (
          <div className="text-xs text-muted-2">{user.roleLabel}</div>
        ) : null}
      </div>
      <form action={logout}>
        <button
          type="submit"
          title="Cerrar sesión"
          className="flex h-8 w-8 cursor-pointer flex-none items-center justify-center rounded-[10px] bg-cream text-muted"
        >
          <LogoutIcon />
        </button>
      </form>
    </div>
  );
}
