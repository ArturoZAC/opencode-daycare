import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

// Next 16: middleware.ts se llama ahora proxy.ts (debe quedar a la par de app/).
// Optimistic check: solo lee cookies/claims vía getClaims(), nunca consulta la BD (RLS es la defensa real).
const publicRoutes = ["/login", "/activate-account"];

export async function proxy(request: NextRequest) {
  const { supabaseResponse, isAnonymous } = await createClient(request);

  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

  if (isAnonymous && !isPublicRoute) {
    return withRefreshedCookies(
      NextResponse.redirect(new URL("/login", request.url)),
      supabaseResponse,
    );
  }

  if (!isAnonymous && isPublicRoute) {
    return withRefreshedCookies(
      NextResponse.redirect(new URL("/", request.url)),
      supabaseResponse,
    );
  }

  return supabaseResponse;
}

// Un redirect sin las cookies refrescadas invalida el refresh token en el browser: logout fantasma.
function withRefreshedCookies(redirect: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  // Corre solo en rutas de la app, no en assets estáticos.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
