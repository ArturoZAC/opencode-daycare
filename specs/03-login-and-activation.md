# SPEC 03 — Login y activación de cuenta

> **Status:** Implemented
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-11-08
> **Objective:** Implementar `references/pantallas/login.dc.html` en `/login` y `references/pantallas/activar-cuenta.dc.html` en `/activate-account`, agrupadas en `app/(auth)` con layout propio y sin shell de la app.

## Scope

**In:**

- `app/(auth)/layout.tsx`: layout propio del grupo, sin `Sidebar`, `MobileNav` ni `AppShell`; solo `min-h-dvh` y el fondo `#FBF4EC` de las dos referencias.
- `/login`: dos columnas `1.05fr / 1fr` (`lg+`). Izquierda, panel coral con logo, titular, párrafo y "🌿 Guardería Sala Soles". Derecha, formulario de 392px: `h1` "Iniciar sesión", subtítulo, `EMAIL`, `CONTRASEÑA`, "¿Olvidaste tu contraseña?", CTA "Iniciar sesión" y pie "¿Te invitó la guardería? Activá tu cuenta".
- `/activate-account`: columna centrada de 440px con ícono de sol, `h1` "Bienvenida a OpenDayCare", subtítulo, tarjeta de invitación (avatar "M", "Mateo · Sala Soles"), `CÓDIGO DE INVITACIÓN`, `EMAIL`, `CREAR CONTRASEÑA`, consentimiento tildado, CTA "Activar mi cuenta" y pie "¿Ya tenés cuenta? Iniciar sesión".
- `src/modules/auth/`: `LoginBrandPanel.tsx`, `LoginForm.tsx`, `ActivateAccountForm.tsx` y `Field.tsx` (par label + input compartido por los 5 campos).
- `CheckIcon` nuevo en `src/components/Icons.tsx` (15px, stroke 3) para el consentimiento.
- Links reales solo entre las dos pantallas de auth: `/login` ↔ `/activate-account`.
- Metadata por ruta con el `template` existente del root layout.
- Responsive propio: el panel de marca se oculta bajo `lg` y el formulario queda centrado.

**Out of scope (for future specs):**

- El bloque "INGRESO COMO" (Personal / Familia) del mockup: no se implementa. Decisión del usuario.
- Autenticación real, sesión, cookies, `middleware`, protección de `/` y `/kids`, roles y permisos.
- Registro, recuperación de contraseña funcional, validación, errores de formulario, mostrar/ocultar contraseña.
- Feed de familia (`/familia`), `/avisos`, `/mi-cuenta` y el resto de `references/pantallas/`.
- Conectar el logout del sidebar con `/login`.
- Persistencia, API, server actions, dark mode.

## Data model

Esta feature no introduce estructuras de datos nuevas. No hay modelo ni persistencia: los valores de los campos y el copy de la tarjeta de invitación son literales dentro de los componentes.

Valores fijos que sí deben respetarse (vienen del mockup y se verifican en los criterios):

| Pantalla | Campo | Valor inicial |
| --- | --- | --- |
| `/login` | email | vacío |
| `/login` | contraseña | vacío, `placeholder="••••••••"` |
| `/activate-account` | código | `7K4P9` |
| `/activate-account` | email | `lucia.fernandez@gmail.com` |
| `/activate-account` | contraseña | `contraseña` |
| `/activate-account` | consentimiento | tildado (`defaultChecked`) |

Los inputs son uncontrolled (`defaultValue` / `defaultChecked`). No hay estado de cliente.

## Implementation plan

Cada paso deja la app funcionando en `pnpm dev` (http://localhost:3000).

1. **`src/components/Icons.tsx`** — agregar `CheckIcon` (`size = 15`, `strokeWidth={3}`, `polyline points="20 6 9 17 4 12"`) con el mismo patrón que los iconos existentes. Verificar: no cambia ningún SVG previo.
2. **`app/(auth)/layout.tsx`** — `export default function AuthLayout({ children }: { children: ReactNode })` que devuelve `<div className="min-h-dvh bg-[#FBF4EC]">{children}</div>`. Tipar `children` a mano: no usar `LayoutProps<>` en este archivo, porque convive con el root layout en el mismo nivel de URL. Verificar: la app sigue funcionando y no hay ruta nueva todavía.
3. **`src/modules/auth/LoginBrandPanel.tsx` + `app/(auth)/login/page.tsx`** — panel coral (`hidden lg:flex`, `flex-col justify-between`, dos círculos `rgba(255,255,255,.12)`), logo + "OpenDayCare", titular "El día de cada niño, compartido con su familia.", párrafo y "🌿 Guardería Sala Soles". La page arma `grid min-h-dvh lg:grid-cols-[1.05fr_1fr]`, monta el panel y deja la columna derecha centrada. Metadata `title: "Iniciar sesión"`. Verificar: `/login` responde 200 con el panel; la columna derecha todavía vacía.
4. **`src/modules/auth/Field.tsx`** — `Field({ label, id, className, ...inputProps })`: `label htmlFor={id}` en `text-[12px] font-extrabold tracking-[.7px] text-muted` y `<input id={id}>` con `w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-ink placeholder:text-[#B6A99B] focus:border-[#F2A78E] focus:outline-none`. `className` se concatena para las variantes del código (Fredoka, `tracking-[3px]`, `text-[18px]`). Verificar: el `id` asociado hace que click en el label enfoque el input.
5. **`src/modules/auth/LoginForm.tsx` + montarlo en `/login`** — `h1` "Iniciar sesión", subtítulo "Ingresá para ver el día de hoy.", `Field` email (`type="email" autoComplete="email"`) y contraseña (`type="password" autoComplete="current-password" placeholder="••••••••"`), "¿Olvidaste tu contraseña?" como `<span>` inerte, CTA `<button type="button">` con el degradado y `shadow-cta`, y `<Link href="/activate-account">Activá tu cuenta</Link>`. Sin `<form>`: no hay acción y se evita el GET al enviar. Verificar: la pantalla coincide con el mockup a 1440px.
6. **`src/modules/auth/ActivateAccountForm.tsx` + `app/(auth)/activate-account/page.tsx`** — ícono de sol 58px, `h1` "Bienvenida a OpenDayCare", subtítulo, tarjeta de invitación (`border-[#EADFD0]`, avatar 44px `bg-[#A9D9E8] text-[#1F7A93]`, "Te invitaron a seguir a" / "Mateo · Sala Soles"), los tres `Field` precargados, consentimiento sobre `bg-[#FBF1D6]` con `checkbox` real + `CheckIcon` (`peer` + `peer-checked`), CTA "Activar mi cuenta" inerte y `<Link href="/login">Iniciar sesión</Link>`. Page centrada con `max-w-[440px]` y metadata `title: "Activar cuenta"`. Verificar: `/activate-account` responde 200 y el checkbox se destilda con click y con Espacio.
7. **Pasada responsive** — panel de marca oculto bajo `lg`; titular a `text-[36px]` y padding `p-10` de `lg` a `xl`, volviendo a `42px` / `56px 60px` en `xl`. Formulario centrado con `p-6 md:p-10` y `max-w-[392px]`. Activar con `px-5 py-10 md:p-10`. Verificar con Playwright a 390, 768, 1024 y 1440 px: sin scroll horizontal y sin el panel coral bajo 1024.

## Acceptance criteria

- [x] `/login` responde 200 y muestra el panel coral y el formulario.
- [x] `/activate-account` responde 200 y muestra la tarjeta centrada de 440px.
- [x] Las dos rutas viven en `app/(auth)/` y la URL no incluye `(auth)`.
- [x] `/login` y `/activate-account` no renderizan sidebar, top bar ni barra inferior.
- [x] El fondo de las dos pantallas es `#FBF4EC`.
- [x] `/login` no muestra el bloque "INGRESO COMO" ni los botones Personal / Familia.
- [x] `/login` arranca con email y contraseña vacíos.
- [x] `h1` de `/login` es "Iniciar sesión"; el titular del panel de marca no es `h1`.
- [x] `h1` de `/activate-account` es "Bienvenida a OpenDayCare".
- [x] Click en cada label enfoca su input; los 5 campos tienen `id` y `htmlFor`.
- [x] Los inputs muestran borde `#F2A78E` al enfocar.
- [x] "Iniciar sesión" y "Activar mi cuenta" no navegan ni recargan la página.
- [x] "Activá tu cuenta" navega a `/activate-account`.
- [x] "Iniciar sesión" del pie de activar cuenta navega a `/login`.
- [x] Activar cuenta precarga `7K4P9`, `lucia.fernandez@gmail.com` y `contraseña`.
- [x] La tarjeta de invitación muestra "M", "Te invitaron a seguir a" y "Mateo · Sala Soles".
- [x] El consentimiento arranca tildado y se puede destildar con click y con Espacio.
- [x] Los títulos son "Iniciar sesión — OpenDayCare" y "Activar cuenta — OpenDayCare".
- [x] A 390 px: sin panel coral, formulario a ancho completo con padding, sin scroll horizontal.
- [x] A 768 px: panel coral oculto y formulario centrado.
- [x] A 1024 y 1440 px: dos columnas `1.05fr / 1fr` y el titular no desborda.
- [x] `globals.css` no cambia: sigue solo con `@import` y `@theme`.
- [x] Ningún archivo nuevo usa `"use client"`.
- [x] `package.json` no suma dependencias y no se usa `next/image`.
- [x] `/`, `/kids` y `/kids/[slug]` se ven igual que antes.

## Decisions

- **Sí:** grupo `(auth)` con layout propio que solo aporta fondo y altura. Las dos pantallas no comparten sidebar ni estructura, pero sí el punto único de entrada al área de acceso.
- **Sí:** rutas en inglés (`/login`, `/activate-account`) y copy visible en español, siguiendo SPEC 02.
- **Sí:** sin bloque "INGRESO COMO". Decisión explícita del usuario: el rol no se elige acá.
- **Sí:** Server Components puros. Al quitar el selector desaparece el único estado; los formularios son uncontrolled y se prerenderizan completos.
- **Sí:** `Field` compartido. El par label + input se repite 5 veces con el mismo estilo; duplicarlo garantiza que las dos pantallas deriven.
- **Sí:** `<button type="button">` para los CTA inertes en vez de `<a>` o `<span>`. Es el elemento correcto y no navega.
- **Sí:** sin elemento `<form>`. No hay acción, y un `<form>` sin handler haría un GET a la misma URL.
- **Sí:** checkbox real con `defaultChecked` en vez de un check decorativo. El consentimiento es un control, no un adorno.
- **Sí:** `#FBF4EC` como clase arbitraria en el layout, sin token nuevo. Aparece una sola vez en el código; se promueve a token cuando se repita como superficie de card.
- **Sí:** panel de marca oculto bajo `lg` (1024px). A 768 la columna de `1.05fr` deja ~390px y el titular de 42px se rompe.
- **Sí:** titular a 36px entre 1024 y 1279, 42px desde 1280. Evita el desborde de "compartido con su familia" en el rango angosto.
- **No:** prefilled email en login. Sin selector de rol no hay motivo y un login prerelleno se lee como bug.
- **No:** reusar `kids.ts` para la tarjeta de invitación. El copy del mockup dice "Mateo", no "Mateo Fernández", y el texto del aviso no es un `Child`.
- **No:** pantalla de recuperación de contraseña, validación, errores, mostrar/ocultar contraseña.
- **No:** `usePathname`, `localStorage`, cookies o `middleware`.
- **No:** tokens nuevos en `globals.css` ni reglas CSS propias.
- **No:** conectar el logout del sidebar con `/login`. Va con la auth real.

## Risks

| Risk | Mitigation |
| --- | --- |
| `app/(auth)/layout.tsx` convive con el root layout en el mismo nivel de URL, así que el tipo generado `LayoutProps<"/">` no es confiable para este archivo. | Tipar `children` con `ReactNode` explícito, sin depender de los tipos generados. |
| El mockup es solo desktop; el login en mobile es invención nuestra. | Verificar a 390 px y ajustar en una revisión posterior si hace falta. |
| El panel de marca se oculta entre 768 y 1023, así que la pantalla queda sin branding en tablets. | Aceptado: prioriza el formulario y evita un titular partido. |
| Los CTAs inertes pueden leerse como "el login está roto". | Es la convención de SPEC 01/02 y está documentado acá y en el spec de auth real. |
| `Field` es una abstracción nueva con un solo consumidor por ahora. | Se justifica por 5 usos inmediatos en las mismas dos pantallas. |

## What is **not** in this spec

- El bloque "INGRESO COMO" (Personal / Familia).
- Login real, sesión, cookies, middleware, roles y protección de rutas.
- Registro, recuperación de contraseña, validación y mensajes de error.
- Feed de familia, avisos, mi cuenta y el resto de las pantallas.
- Persistencia, API y server actions.
- Dark mode.

Cada uno, si llega, va en su propio spec.
