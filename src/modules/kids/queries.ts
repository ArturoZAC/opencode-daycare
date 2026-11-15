import { cookies } from "next/headers";
import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  ageFromIso,
  formatBirthDate,
  kidColorFromSlug,
  monthYearFromIso,
  type Child,
} from "./kids";

type RoomNameRow = { name: string };

type ChildRow = {
  slug: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  allergy_tags: string[];
  medical_notes: string | null;
  rooms: RoomNameRow | RoomNameRow[] | null;
};

type RoomRow = { id: string; name: string; children: ChildRow[] };

export type KidSection = { id: string; name: string; kids: Child[] };

const CHILD_COLUMNS =
  "slug, full_name, birth_date, enrolled_at, allergy_tags, medical_notes, rooms(name)";

function roomName(rooms: ChildRow["rooms"]): string {
  const room = Array.isArray(rooms) ? rooms[0] : rooms;
  return room?.name ?? "";
}

function toChild(row: ChildRow): Child {
  return {
    slug: row.slug,
    name: row.full_name,
    initial: row.full_name.charAt(0).toUpperCase(),
    color: kidColorFromSlug(row.slug),
    ageYears: ageFromIso(row.birth_date, new Date()),
    birthDate: formatBirthDate(row.birth_date),
    room: roomName(row.rooms),
    joinedAt: monthYearFromIso(row.enrolled_at),
    allergyTags: row.allergy_tags.map((tag) => tag.toUpperCase()),
    allergyNote: row.medical_notes,
    parents: [],
  };
}

export async function listSections(): Promise<KidSection[]> {
  await connection();

  const supabase = createClient(await cookies());
  const { data } = await supabase
    .from("rooms")
    .select(`id, name, children(${CHILD_COLUMNS})`)
    .order("created_at")
    .order("full_name", { referencedTable: "children" });

  const rooms = (data ?? []) as unknown as RoomRow[];

  return rooms.map((room) => ({
    id: room.id,
    name: room.name,
    kids: (room.children ?? []).map(toChild),
  }));
}

export async function getChildBySlug(slug: string): Promise<Child | null> {
  await connection();

  const supabase = createClient(await cookies());
  const { data } = await supabase
    .from("children")
    .select(CHILD_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  return data ? toChild(data as unknown as ChildRow) : null;
}
