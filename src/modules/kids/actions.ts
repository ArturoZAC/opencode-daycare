"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { slugify, type Child } from "./kids";
import { listSections } from "./queries";

export type CreateChildInput = {
  fullName: string;
  birthDate: string; // ISO yyyy-mm-dd
  roomName: string;
  allergyTags: string[];
  medicalNotes: string;
};

type CreateChildResult = { ok: true } | { ok: false; message: string };

const GENERIC_ERROR = "No pudimos guardar el niño. Intentá de nuevo.";
const VALIDATION_ERROR = "Revisá los datos del niño.";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_ATTEMPTS = 5;

function isFutureDate(iso: string): boolean {
  return iso > new Date().toISOString().slice(0, 10);
}

export async function listKidsForAudience(): Promise<Child[]> {
  const sections = await listSections();
  return sections.flatMap((section) => section.kids);
}

export async function createChild(
  input: CreateChildInput,
): Promise<CreateChildResult> {
  const fullName = input.fullName.trim();

  if (
    !fullName ||
    !ISO_DATE.test(input.birthDate) ||
    isFutureDate(input.birthDate)
  ) {
    return { ok: false, message: VALIDATION_ERROR };
  }

  const supabase = createClient(await cookies());

  const { data: user } = await supabase
    .from("users")
    .select("daycare_id")
    .single();

  if (!user) {
    return { ok: false, message: GENERIC_ERROR };
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("id")
    .eq("name", input.roomName)
    .eq("daycare_id", user.daycare_id)
    .maybeSingle();

  if (!room) {
    return { ok: false, message: GENERIC_ERROR };
  }

  const baseSlug = slugify(fullName);

  for (let attempt = 1; attempt <= SLUG_ATTEMPTS; attempt += 1) {
    const slug = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`;

    const { error } = await supabase.from("children").insert({
      room_id: room.id,
      slug,
      full_name: fullName,
      birth_date: input.birthDate,
      allergy_tags: input.allergyTags,
      medical_notes: input.medicalNotes.trim() || null,
    });

    if (!error) {
      revalidatePath("/kids");
      return { ok: true };
    }

    // 23505 = unique violation: el slug ya existe, se reintenta con sufijo.
    if (error.code !== "23505") {
      return { ok: false, message: GENERIC_ERROR };
    }
  }

  return { ok: false, message: GENERIC_ERROR };
}
