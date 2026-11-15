# SPEC 09 — Login real y protección de rutas

> **Status:** Approved
> **Depends on:** SPEC 03, SPEC 08
> **Date:** 2026-11-15
> **Objective:** Conectar `/login` y el logout del sidebar a la autenticación real de Supabase con la cuenta staff sembrada en SPEC 08, y proteger las rutas de la app en `proxy.ts` para que un anónimo no pueda entrar y un autenticado no quede en las pantallas de auth.

## Scope

**In:**

- `src/modules/auth/actions.ts` (`'use server'`) con dos server actions: `login(formData)` → `signInWithPassword` con `utils/supabase/server.ts`; éxito → `redirect("/")`, error → `redirect("/login?error=1")`. `logout()` → `signOut()` + `redirect("/login")`.
- `src/modules/auth/LoginForm.tsx`: envolver en `<form action={login}>`, `name="email"` / `name="password"` en los `Field`, CTA pasa a `type="submit"`.
- `app/(auth)/login/page.tsx`: leer `searchParams` (`PageProps<"/login">`) y mostrar "Email o contraseña incorrectos." cuando `error=1`.
- `proxy.ts`: lógica de redirect sobre el resultado de `getClaims()` que ya se obtiene en `utils/supabase/middleware.ts` (optimistic check, sin queries a la BD, patrón de la guía de authentication de Next 16).
- `src/layouts/components/Sidebar.tsx`: el `<span>` de "Cerrar sesión" pasa a `<button type="submit">` dentro de `<form action={logout}>`.
- `src/modules/auth/currentUser.ts` (`getCurrentUser()`) + `src/layouts/components/SidebarUser.tsx`: el bloque de usuario del sidebar deja de ser mock y muestra nombre, inicial y rol del usuario autenticado, leyendo `public.users` (policy `users_read`). El bloque va bajo `<Suspense>` porque lee `cookies()` y con `cacheComponents` eso no puede bloquear el prerender del shell.

**Out of scope (for future specs):**

- Roles y permisos en la UI (gating por rol, `/familia`), avatar real (URL) y foto de perfil.
- Datos reales: feed, kids y posts siguen mock; no se lee `public.users` ni se aplica RLS desde la app.
- Recuperación de contraseña, registro, activación real de invitaciones.
- `utils/supabase/client.ts` (browser client): queda intacto, sin consumidor.
- Logout en `MobileNav`, sesión expirada custom, `cookieOptions`, multi-tenancy por `daycare_id`.

## Data model

Esta feature no introduce estructuras de datos nuevas ni persistencia propia; la sesión vive en las cookies `sb-<ref>-auth-token*` que gestiona `@supabase/ssr` (no tocar a mano, no hardcodear sus nombres). Superficies concretas:

```ts
// src/modules/auth/actions.ts — firma pública
async function login(formData: FormData): Promise<never> // lee formData.get("email" | "password")
async function logout(): Promise<never>

// proxy.ts — constantes de rutas
const publicRoutes = ["/login", "/activate-account"]; // exact match
// protegido = todo lo que matchea el matcher y no es publicRoute (/, /kids, /kids/*)
// isAnonymous = !(await supabase.auth.getClaims()).data.claims
```

Copy exacto del banner de error en `/login?error=1`: `Email o contraseña incorrectos.` (texto `text-[13.5px]` en coral oscuro, sobre el `h1`).

## Implementation plan

Cada paso deja la app funcionando en `pnpm dev` (http://localhost:3000).

1. **`src/modules/auth/actions.ts`** — `'use server'` + `login`: crear client con `createClient(await cookies())`, `signInWithPassword`, y según `error` hacer `redirect("/login?error=1")` o `redirect("/")`. Los `redirect()` van FUERA del `try/catch` (lanzan `NEXT_REDIRECT` y tragarlos es el bug clásico). Verificar: sin UI todavía, no hay cambio observable.
2. **`LoginForm.tsx`** — `<form action={login}>` envolviendo todo el bloque actual, `name` en los dos `Field`, botón `type="submit"`. Verificar: credenciales malas → URL `/login?error=1` (sin mensaje todavía); buenas → `/` con el feed.
3. **Banner de error en `/login`** — page pasa a `async` con `{ searchParams }: PageProps<"/login">`; si `(await searchParams).error === "1"`, renderizar el copy exacto. Sin `'use client'`. Verificar: credenciales malas muestran el mensaje en `/login`; el resto de la pantalla no cambia.
4. **Protección en `proxy.ts`** — `createClient` de `utils/supabase/middleware.ts` devuelve `supabaseResponse` con las cookies refrescadas y además el resultado de `getClaims()`; reescribir la firma para exponer `isAnonymous`. En `proxy.ts`: anónimo en ruta no-public → `NextResponse.redirect("/login")`; autenticado en `publicRoutes` → redirect `/`. En ambos casos copiar las cookies de `supabaseResponse` a la respuesta del redirect (si no, se pierde el refresh y la sesión se cae). Verificar: en ventana sin sesión, `/` y `/kids` responden 307 a `/login`; `/login` con sesión responde 307 a `/`.
5. **Logout del Sidebar** — agregar `logout()` a `actions.ts`; en `src/layouts/components/Sidebar.tsx` envolver el botón en `<form action={logout}>` y cambiar el `<span>` por `<button type="submit">` (mismas clases). Verificar: click → `/login`, y `/kids` vuelve a estar bloqueado.
6. **Usuario real en el sidebar** — `src/modules/auth/currentUser.ts` con `getCurrentUser()`: `createClient(await cookies())` + `getClaims()` → si no hay claims devuelve `null`; si hay, `.from("users").select("full_name, role").eq("id", claims.sub).single()` y mapea el rol a label. `src/layouts/components/SidebarUser.tsx` reemplaza el bloque mock de `Sidebar.tsx` (inicial, nombre, rol, botón de logout) y queda envuelto en `<Suspense fallback={skeleton}>`. Verificar: logueado, el sidebar muestra "Arturo" + "Staff"; sin `blocking-prerender` en consola; `/` y `/kids` siguen instantáneos.

## Acceptance criteria

- [ ] `/login` con contraseña incorrecta queda en `/login` y muestra "Email o contraseña incorrectos.".
- [ ] `/login` con `arturoyz2105@gmail.com` y la contraseña del seed redirige a `/` y muestra el feed.
- [ ] Sin sesión, `/`, `/kids` y `/kids/[slug]` redirigen a `/login`.
- [ ] Con sesión, `/login` y `/activate-account` redirigen a `/`.
- [ ] El botón "Cerrar sesión" del sidebar redirige a `/login` y borra las cookies de sesión; tras eso `/` vuelve a redirigir.
- [ ] La sesión sobrevive un reload duro (F5) en `/kids` estando logueado.
- [ ] Sin sesión siguen sirviendo `_next/static`, imágenes y `favicon` (matcher intacto).
- [ ] Ningún archivo nuevo usa `'use client'`; `LoginForm`, la page y `Sidebar` siguen server components.
- [ ] `package.json` y `.env*` no cambian: las deps y las keys ya existen.
- [ ] `/` y `/kids` se ven idénticos a SPEC 01/02 salvo el botón de logout ahora funcional.
- [ ] El sidebar muestra el nombre real del usuario autenticado (`Arturo`) y su rol (`Staff`), no el mock "Caro Giménez".
- [ ] Ningún nombre de cookie de Supabase ni secrets hardcoded en el código de la app.

## Decisions

- **Sí:** server actions + `<form action>`. Patrón oficial de Supabase para App Router y respeta la convención server-only de SPEC 03. **No:** browser client (`utils/supabase/client.ts` queda muerto): partiría el estado de sesión client/server.
- **Sí:** protección centralizada en `proxy.ts`. Docs de Next 16 (guía de authentication): el proxy hace _optimistic checks_ leyendo solo cookies/claims, nunca queries; la defensa real de los datos es RLS (SPEC 08).
- **Sí:** reutilizar el `getClaims()` que `utils/supabase/middleware.ts` ya ejecuta, en vez de un `getUser()` extra: valida el JWT localmente y evita una ida a GoTrue por request/prefetch.
- **Sí:** copiar cookies refrescadas a toda respuesta de redirect en el proxy. Documentado en el design doc de `@supabase/ssr`: si ocurre un refresh y la respuesta es un redirect sin esas cookies, el refresh token queda invalidado del lado del browser.
- **Sí:** error de login vía `?error=1`. Cero client JS; `/login` ya es dinámica al leer `searchParams`, igual que `/kids/[slug]` con `params`. **No:** `useActionState`: requiere `'use client'` por una sola línea de feedback.
- **No:** redirección por rol (staff → feed, parent → `/familia`): los roles no se consumen en UI todavía; sale con los datos reales.
- **Sí:** nombre y rol reales en el sidebar leyendo `public.users` (nombre, no avatar por URL): es una query de una fila cubierta por `users_read`, y completa el "quién soy" del shell sin abrir la puerta a datos de otras personas. **No:** leer toda la tabla ni permisos por rol.
- **Sí:** el bloque de usuario va bajo `<Suspense>`: lee `cookies()`, y con `cacheComponents` una lectura de request sin boundary tumba el prerender del shell (`blocking-prerender-runtime`), igual que ya resuelve `/kids/[slug]` con `instant = false`. **No:** `instant = false` en el layout — apagaría la instantaneidad de todas las rutas.
- **No:** borrar el `try/catch` con comentario de `server.ts`: cubre exactamente el caso "server component lee y el client quiere setear cookies".

## Risks

| Risk                                                                                                                | Mitigation                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `redirect()` dentro del `try/catch` del action y la sesión funciona pero la página nunca navega.                     | Paso 1 lo llama fuera del `try` y el criterio de éxito es la navegación observable, no el 200.                                                          |
| El proxy redirige y descarta las cookies refrescadas → logout fantasma cada vez que vence el access token.           | Decisión explícita: copiar cookies en toda respuesta de redirect; se prueba con F5 (criterio 6).                                                        |
| `getClaims()` corre en cada prefetch de `Link` (partialPrefetching on).                                             | Es verificación local del JWT, sin fetch a GoTrue; el matcher actual ya excluía assets.                                                                 |
| El banner en `/login` obliga a la page a ser dinámica bajo `cacheComponents`.                                        | Mismo patrón aceptado en `/kids/[slug]` (`params` awaited); sin `blocking-route` porque el acceso a `searchParams` está en la page, no en un layout estático. |
| Credenciales de prueba conocidas + login real = cualquiera con la URL entra.                                        | Aceptado: proyecto de curso con una cuenta seed; se retira al tener usuarios reales por guardería.                                                      |

## What is **not** in this spec

- Permisos por rol, `/familia`, avatar real por URL.
- Datos reales desde Supabase (feed, posts, children) y policies más allá de SPEC 08.
- Recuperación de contraseña, signup, activación real de invitaciones.
- Logout en `MobileNav` y gestión avanzada de sesiones (revocación, expiración custom).

Cada uno, si llega, va en su propio spec.
