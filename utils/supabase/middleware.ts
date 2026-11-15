import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = async (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresca el token si venció y escribe las cookies en la respuesta.
  // Sin este getClaims() la sesión nunca se renueva y el usuario se desconecta.
  // getClaims() valida el JWT localmente: sirve también como optimistic check en proxy.ts.
  // Sin sesión (o JWT inválido) Supabase devuelve data: null, no claims: null.
  const { data } = await supabase.auth.getClaims();

  return { supabaseResponse, isAnonymous: !data?.claims };
};
