import { type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

// Next 16: middleware.ts se llama ahora proxy.ts (debe quedar a la par de app/).
export async function proxy(request: NextRequest) {
  return createClient(request);
}

export const config = {
  // Corre solo en rutas de la app, no en assets estáticos.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
