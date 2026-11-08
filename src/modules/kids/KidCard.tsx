import Link from "next/link";
import { ChevronRightIcon } from "@/src/components/Icons";
import { CHILD_COLOR_STYLES, type Child } from "./kids";

function parentsLabel(parentsCount: number) {
  if (parentsCount === 0) {
    return "sin padres vinculados";
  }

  return parentsCount === 1 ? "1 padre vinculado" : `${parentsCount} padres vinculados`;
}

export function KidCard({ child }: { child: Child }) {
  return (
    <Link
      href={`/kids/${child.slug}`}
      className="flex items-center gap-3.5 rounded-[18px] border border-line bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:border-[#F2A78E]"
    >
      <div
        className={`flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold ${CHILD_COLOR_STYLES[child.color]}`}
      >
        {child.initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-semibold text-ink">
          {child.name}
        </div>
        <div className="text-[13px] text-muted-2">
          {child.ageYears} años · {parentsLabel(child.parents.length)}
        </div>
      </div>
      {child.allergyTags.length > 0 ? (
        <span className="flex-none rounded-full bg-[#FBD8CC] px-[9px] py-[5px] text-[11px] font-extrabold text-[#D9684A]">
          {child.allergyTags[0].toUpperCase()}
        </span>
      ) : child.parents.length === 0 ? (
        <span className="flex-none rounded-full bg-[#F9D2DE] px-[9px] py-[5px] text-[11px] font-extrabold text-[#C56486]">
          VINCULAR
        </span>
      ) : (
        <span className="flex-none text-[#CBB89F]">
          <ChevronRightIcon />
        </span>
      )}
    </Link>
  );
}
