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

export const KIDS: Child[] = [
  {
    slug: "mateo-fernandez",
    name: "Mateo Fernández",
    initial: "M",
    color: "sky",
    ageYears: 3,
    birthDate: "12 mar 2022",
    room: "Soles",
    joinedAt: "feb 2025",
    allergyTags: ["MANÍ"],
    allergyNote:
      "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    parents: [
      {
        name: "Lucía Fernández",
        initial: "L",
        relation: "Mamá",
        status: "active",
      },
      {
        name: "Diego Fernández",
        initial: "D",
        relation: "Papá",
        status: "pending",
      },
    ],
  },
  {
    slug: "sofia-mendez",
    name: "Sofía Méndez",
    initial: "S",
    color: "rose",
    ageYears: 2,
    birthDate: "8 jul 2023",
    room: "Soles",
    joinedAt: "mar 2025",
    allergyTags: [],
    allergyNote: null,
    parents: [
      {
        name: "Camila Méndez",
        initial: "C",
        relation: "Mamá",
        status: "active",
      },
    ],
  },
  {
    slug: "benjamin-ruiz",
    name: "Benjamín Ruiz",
    initial: "B",
    color: "sage",
    ageYears: 3,
    birthDate: "27 nov 2022",
    room: "Soles",
    joinedAt: "ene 2025",
    allergyTags: [],
    allergyNote: null,
    parents: [
      {
        name: "Andrés Ruiz",
        initial: "A",
        relation: "Papá",
        status: "active",
      },
      {
        name: "Paula Ruiz",
        initial: "P",
        relation: "Mamá",
        status: "active",
      },
    ],
  },
  {
    slug: "valentina-soto",
    name: "Valentina Soto",
    initial: "V",
    color: "honey",
    ageYears: 2,
    birthDate: "3 may 2023",
    room: "Soles",
    joinedAt: "abr 2025",
    allergyTags: [],
    allergyNote: null,
    parents: [],
  },
  {
    slug: "tomas-diaz",
    name: "Tomás Díaz",
    initial: "T",
    color: "lilac",
    ageYears: 3,
    birthDate: "19 sep 2022",
    room: "Soles",
    joinedAt: "feb 2025",
    allergyTags: ["LACTOSA"],
    allergyNote:
      "Intolerancia a la lactosa. Sin lácteos en la merienda.",
    parents: [
      {
        name: "Mariano Díaz",
        initial: "M",
        relation: "Papá",
        status: "active",
      },
    ],
  },
  {
    slug: "emma-castro",
    name: "Emma Castro",
    initial: "E",
    color: "rose",
    ageYears: 2,
    birthDate: "14 feb 2023",
    room: "Soles",
    joinedAt: "mar 2025",
    allergyTags: [],
    allergyNote: null,
    parents: [
      {
        name: "Julieta Castro",
        initial: "J",
        relation: "Mamá",
        status: "active",
      },
    ],
  },
  {
    slug: "lucas-romero",
    name: "Lucas Romero",
    initial: "L",
    color: "sky",
    ageYears: 3,
    birthDate: "30 abr 2022",
    room: "Soles",
    joinedAt: "feb 2025",
    allergyTags: [],
    allergyNote: null,
    parents: [
      {
        name: "Nicolás Romero",
        initial: "N",
        relation: "Papá",
        status: "active",
      },
    ],
  },
  {
    slug: "olivia-vega",
    name: "Olivia Vega",
    initial: "O",
    color: "sage",
    ageYears: 2,
    birthDate: "21 oct 2023",
    room: "Soles",
    joinedAt: "may 2025",
    allergyTags: [],
    allergyNote: null,
    parents: [
      {
        name: "Florencia Vega",
        initial: "F",
        relation: "Mamá",
        status: "pending",
      },
    ],
  },
];

export function getKid(slug: string) {
  return KIDS.find((kid) => kid.slug === slug);
}

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

export function monthYear(date: Date): string {
  return `${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`;
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
