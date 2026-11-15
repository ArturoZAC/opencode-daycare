export type ChildColor = "sky" | "rose" | "sage" | "honey" | "lilac";

export type ParentStatus = "active" | "pending";

export type Parent = {
  name: string;
  initial: string;
  relation: string;
  status: ParentStatus;
};

export type Child = {
  slug: string;
  name: string;
  initial: string;
  color: ChildColor;
  ageYears: number;
  birthDate: string;
  room: string;
  joinedAt: string;
  allergyTags: string[];
  allergyNote: string | null;
  parents: Parent[];
};

export const CHILD_COLOR_ORDER: ChildColor[] = [
  "sky",
  "rose",
  "sage",
  "honey",
  "lilac",
];

export const MONTHS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export const CHILD_COLOR_STYLES: Record<ChildColor, string> = {
  sky: "bg-[#A9D9E8] text-[#1F7A93]",
  rose: "bg-[#F4B8CC] text-[#C44A7A]",
  sage: "bg-[#B9DEC4] text-[#3E8B62]",
  honey: "bg-[#F4DC8E] text-[#9A7B1E]",
  lilac: "bg-[#C9B6E8] text-[#7B5FC0]",
};

export function parseAllergyTags(raw: string): string[] {
  const parts = raw.split(/[,;/]|\s+(?:y|e|i)\s+/i);
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const part of parts) {
    const tag = part.trim();

    if (!tag || seen.has(tag.toLowerCase())) {
      continue;
    }

    seen.add(tag.toLowerCase());
    tags.push(tag);
  }

  return tags;
}

export function formatBirthDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${Number(day)} ${MONTHS_ES[Number(month) - 1]} ${year}`;
}

export function ageFromIso(iso: string, today: Date): number {
  const [year, month, day] = iso.split("-").map(Number);
  const age = today.getFullYear() - year;
  const hadBirthday =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);

  return hadBirthday ? age : age - 1;
}

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

export function kidColorFromSlug(slug: string): ChildColor {
  const hash = [...slug].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );

  return CHILD_COLOR_ORDER[hash % CHILD_COLOR_ORDER.length];
}

export function monthYearFromIso(iso: string): string {
  const [year, month] = iso.split("-");
  return `${MONTHS_ES[Number(month) - 1]} ${year}`;
}

export function isoFromTypedDate(typed: string): string | null {
  const digits = typed.replace(/\D/g, "");

  if (digits.length !== 8) {
    return null;
  }

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const date = new Date(year, month - 1, day);
  const exists =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  if (!exists) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
