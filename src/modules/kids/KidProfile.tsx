import Link from "next/link";
import {
  AlertIcon,
  ChevronLeftIcon,
  PlusIcon,
  SunIcon,
} from "@/src/components/Icons";
import { CHILD_COLOR_STYLES, type Child, type Parent } from "./kids";

const PARENT_AVATAR_COLORS = ["bg-[#C9B6E8]", "bg-[#A9C7E8]"];

function parentStatusLabel(parent: Parent) {
  if (parent.status === "pending") {
    return "invitación enviada";
  }

  return parent.relation === "Mamá" ? "activa" : "activo";
}

function DataRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 px-[18px] py-[15px] ${
        last ? "" : "border-b border-line-soft"
      }`}
    >
      <span className="text-[14.5px] text-muted">{label}</span>
      <span className="text-[14.5px] font-extrabold text-ink">{value}</span>
    </div>
  );
}

export function KidProfile({ child }: { child: Child }) {
  return (
    <div className="mx-auto w-full max-w-[820px] px-5 pb-28 pt-6 md:px-10 md:pb-20 md:pt-[34px]">
      <Link
        href="/kids"
        className="mb-5 flex items-center gap-1.5 text-sm font-bold text-muted"
      >
        <ChevronLeftIcon />
        Volver a Niños
      </Link>

      <div className="flex flex-col gap-[18px] lg:flex-row lg:items-start lg:gap-[26px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[18px]">
          <div className="flex items-center gap-4 md:gap-[18px]">
            <div
              className={`flex h-16 w-16 flex-none items-center justify-center rounded-full font-display text-[26px] font-semibold md:h-[84px] md:w-[84px] md:text-[34px] ${CHILD_COLOR_STYLES[child.color]}`}
            >
              {child.initial}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[22px] font-semibold text-ink md:text-[28px]">
                {child.name}
              </h1>
              <p className="mt-0.5 text-sm text-muted md:text-[15px]">
                {child.ageYears} años · Sala {child.room}
              </p>
            </div>
            <span className="flex-none rounded-xl border-[1.5px] border-line bg-card px-3 py-2 text-[13px] font-bold text-[#6E6359] md:px-4 md:py-2.5 md:text-sm">
              Editar
            </span>
          </div>

          {child.allergyTags.length > 0 || child.allergyNote ? (
            <div className="flex gap-3.5 rounded-2xl bg-[#FBDAD6] p-4 md:px-[18px]">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0] text-white">
                <AlertIcon />
              </div>
              <div>
                <div className="mb-0.5 text-[15px] font-extrabold text-[#C5413A]">
                  Alergias y notas
                </div>
                {child.allergyTags.length > 0 ? (
                  <p className="text-[14px] font-extrabold leading-[1.5] text-[#B25249] md:text-[14.5px]">
                    {child.allergyTags.join(" · ")}
                  </p>
                ) : null}
                {child.allergyNote ? (
                  <p className="text-[14px] leading-[1.5] text-[#B25249] md:text-[14.5px]">
                    {child.allergyNote}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-line bg-card">
            <DataRow label="Fecha de nacimiento" value={child.birthDate} />
            <DataRow label="Sala" value={child.room} />
            <DataRow label="Ingreso" value={child.joinedAt} last />
          </div>
        </div>

        <div className="flex w-full flex-col gap-3.5 lg:w-[300px] lg:flex-none">
          <span className="flex items-center justify-center gap-[9px] rounded-[14px] bg-ink p-[13px] text-[15px] font-extrabold text-white">
            <SunIcon size={18} />
            Resumen del día
          </span>

          <div className="rounded-2xl border border-line bg-card px-4 py-4 md:px-[18px]">
            <div className="mb-3.5 text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D]">
              PADRES VINCULADOS
            </div>
            <div className="flex flex-col gap-3.5">
              {child.parents.map((parent, index) => (
                <div key={parent.name} className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 flex-none items-center justify-center rounded-full font-display text-base font-semibold text-white ${
                      PARENT_AVATAR_COLORS[index % PARENT_AVATAR_COLORS.length]
                    }`}
                  >
                    {parent.initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] font-extrabold text-ink">
                      {parent.name}
                    </div>
                    <div className="text-[12.5px] text-muted-2">
                      {parent.relation} · {parentStatusLabel(parent)}
                    </div>
                  </div>
                  <span
                    className={`flex-none rounded-full px-[9px] py-1 text-[10.5px] font-extrabold ${
                      parent.status === "active"
                        ? "bg-[#CFEBD8] text-[#3E9B6C]"
                        : "bg-[#F7E7A6] text-[#9A7B1E]"
                    }`}
                  >
                    {parent.status === "active" ? "ACTIVA" : "PENDIENTE"}
                  </span>
                </div>
              ))}

              <div className="flex items-center gap-3 pt-0.5">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]">
                  <PlusIcon size={18} />
                </span>
                <span className="text-[14.5px] font-extrabold text-coral-deep">
                  Vincular otro padre
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
