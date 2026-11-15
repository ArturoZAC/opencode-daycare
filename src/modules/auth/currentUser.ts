import { cookies } from "next/headers";
import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";

const roleLabels = {
  admin: "Admin",
  parent: "Familia",
  staff: "Staff",
} as const;

export type CurrentUser = {
  fullName: string;
  roleLabel: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  // Fuerza render por request: sin esto, el prerender del shell ejecuta auth-js y `Date.now()`
  // revienta con blocking-prerender-current-time.
  await connection();

  const supabase = createClient(await cookies());

  const { data: authData } = await supabase.auth.getClaims();
  const claims = authData?.claims;
  if (!claims?.sub) {
    return null;
  }

  // RLS `users_read` deja leer solo la fila propia (auth.uid() = id).
  const { data: user } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", claims.sub)
    .single();

  return {
    fullName: user?.full_name ?? claims.email ?? "Usuario",
    roleLabel: roleLabels[user?.role as keyof typeof roleLabels] ?? "",
  };
}
