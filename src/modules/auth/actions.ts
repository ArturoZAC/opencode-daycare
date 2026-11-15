"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData): Promise<never> {
  const supabase = createClient(await cookies());

  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  // redirect() lanza NEXT_REDIRECT: nunca llamarlo dentro de un try/catch.
  if (error) {
    redirect("/login?error=1");
  }

  redirect("/");
}

export async function logout(): Promise<never> {
  const supabase = createClient(await cookies());

  await supabase.auth.signOut();

  redirect("/login");
}
