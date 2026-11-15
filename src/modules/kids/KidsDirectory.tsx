"use client";

import { useEffect, useState } from "react";
import { SearchIcon } from "@/src/components/Icons";
import { AddChildDialog } from "./AddChildDialog";
import { KidCard } from "./KidCard";
import type { KidSection } from "./queries";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function KidsDirectory({ sections }: { sections: KidSection[] }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timeout);
  }, [query]);

  const normalizedQuery = normalizeText(debouncedQuery.trim());
  const totalKids = sections.reduce(
    (total, section) => total + section.kids.length,
    0,
  );
  const visibleSections = sections
    .map((section) => ({
      ...section,
      kids: normalizedQuery
        ? section.kids.filter((kid) =>
            normalizeText(kid.name).includes(normalizedQuery),
          )
        : section.kids,
    }))
    .filter((section) => section.kids.length > 0);

  return (
    <>
      <div className="mb-[22px] flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-[#D9583C]">
            GESTIÓN
          </div>
          <h1 className="font-display text-[30px] font-semibold text-ink">
            Niños
          </h1>
        </div>
        <AddChildDialog rooms={sections.map((section) => section.name)} />
      </div>

      <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-line bg-card px-4 py-3">
        <span className="flex-none text-[#B0A290]">
          <SearchIcon />
        </span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar niño…"
          aria-label="Buscar niño"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-[#B6A99B]"
        />
      </div>

      {totalKids === 0 ? (
        <p className="py-8 text-center text-[14.5px] text-muted-2">
          Todavía no hay niños. Agregá el primero.
        </p>
      ) : visibleSections.length === 0 ? (
        <p className="py-8 text-center text-[14.5px] text-muted-2">
          No encontramos niños con ese nombre.
        </p>
      ) : (
        visibleSections.map((section) => (
          <section key={section.id} className="mb-6 last:mb-0">
            <div className="mb-3.5 flex items-center gap-3">
              <span className="text-[12.5px] font-extrabold tracking-[.8px] text-ink">
                SALA {section.name.toUpperCase()}
              </span>
              <span aria-live="polite" className="text-[13px] text-muted-2">
                {section.kids.length}{" "}
                {section.kids.length === 1 ? "niño" : "niños"}
              </span>
              <span className="h-px flex-1 bg-[#E7DAC8]" />
            </div>

            <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
              {section.kids.map((child) => (
                <KidCard key={child.slug} child={child} />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
