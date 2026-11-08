# SPEC 01 — Feed como home

> **Status:** Approved
> **Depends on:** —
> **Date:** 2026-11-07
> **Objective:** Implementar `references/pantallas/feed.dc.html` como home `/`, con el mismo estilo visual, datos mock y navegación inerte.

## Scope

**In:**

- Reemplazar por completo el boilerplate de `app/page.tsx` con el feed.
- Estilos 100% con utilidades de Tailwind. El único CSS del repo son los tokens de `@theme`.
- Paleta, radios y sombras del mockup como tokens en `app/globals.css` (`@theme`).
- Fredoka (display) y Nunito (texto) vía `next/font/google` en `app/layout.tsx`; `lang="es"` y metadata propia. Se elimina Geist.
- Shell desktop (≥768px): sidebar de 248px fija, main con scroll propio, contenido centrado a 760px.
- Shell mobile (<768px): top bar + barra de navegación inferior fija; sidebar oculto.
- Header del feed, composer "Compartí un momento…", separador "PUBLICADO HOY".
- Tres post cards con los datos del mockup: logro, actividad con placeholder de foto, anuncio.
- Datos mock tipados en `src/data/posts.ts` y componentes en `src/components/`. `app/` queda solo para rutas y archivos de convención (`page`, `layout`, `loading`, etc.).

**Out of scope (for future specs):**

- Rutas `/ninos`, `/avisos`, `/mi-cuenta`, `/crear-publicacion`, `/detalle-publicacion`, `/login`, `/foto`.
- Autenticación, base de datos, persistencia, API.
- Likes, comentarios y edición funcionales.
- Carga de imágenes reales: solo el placeholder punteado.
- Dark mode.
- El resto de las pantallas de `references/pantallas/`.

## Data model

Nuevo y único modelo, sin persistencia. Vive en `src/data/posts.ts`.

```ts
type PostKind = "achievement" | "activity" | "announcement";

type Post = {
  id: string;
  kind: PostKind;
  title: string;          // "Mateo" | "Anuncio general"
  avatar: string | null;  // "M" | null (anuncio usa ícono de megáfono)
  time: string;           // "14:20"
  authorLabel: string;    // "publicado por vos"
  audience: string;       // "Para: familia de Mateo"
  body: string;
  likes: number;
  comments: number;
  photoLabel?: string;    // "Foto · pintando con témperas"
};
```

Estilo por `kind` (constante `KIND_STYLES` en `PostCard.tsx`):

| kind | label | pill bg / texto | dot |
| --- | --- | --- | --- |
| `achievement` | LOGRO | `#CFEBD8` / `#3E9B6C` | `#3E9B6C` |
| `activity` | ACTIVIDAD | `#C7E7F1` / `#2E89A6` | `#2E89A6` |
| `announcement` | ANUNCIO | `#CCD8F4` / `#4E72C8` | `#4E72C8` |

Tokens en `app/globals.css` (`@theme`), solo los usados:

```css
--color-cream: #F6ECDF;        /* fondo de página */
--color-card: #FFFDF9;         /* cards y sidebar */
--color-line: #ECE0D0;         /* bordes */
--color-line-soft: #F0E6D8;    /* divisor dentro de la card */
--color-ink: #3F362E;          /* títulos */
--color-ink-body: #4A4038;     /* cuerpo del post */
--color-muted: #94887B;        /* subtítulos */
--color-muted-2: #A89A8B;      /* meta, placeholders */
--color-coral: #E0654A;        /* activo, corazones */
--color-coral-deep: #C5503A;   /* "Editar" */
--color-coral-soft: #FBE3D8;   /* item activo, botón cámara */
--color-coral-cta-from: #F4977E;
--color-coral-cta-to: #EE8164;
```

## Implementation plan

Cada paso deja la app funcionando en `pnpm dev` (http://localhost:3000).

1. **`app/globals.css`** — dejar solo `@import "tailwindcss"` y los tokens de arriba en `@theme`. Eliminar el bloque `prefers-color-scheme: dark`, los tokens de Geist, la regla `body { ... }` y el `font-family: Arial`. No queda ninguna regla CSS propia. Verificar: el archivo no contiene selectores fuera de `@theme`.
2. **`app/layout.tsx`** — `Fredoka` y `Nunito` con `variable: "--font-display"` / `"--font-sans"` y `subsets: ["latin"]`; `lang="es"`; metadata `OpenDayCare — Feed` / `Feed de la sala Soles`; `body` con `bg-cream text-ink font-sans antialiased`. Verificar: `document.body` computa Nunito.
3. **`src/components/Icons.tsx`** — copiar los 12 SVG del mockup (sol, plus, casa, usuarios, campana, usuario, logout, cámara, corazón, mensaje, imagen, megáfono) como componentes con `size` y `className`; mismos `viewBox`, `stroke-width` y `fill` que el original. Verificar: compila sin errores de TS.
4. **`src/data/posts.ts`** — tipos y array `POSTS` con los tres posts, copy exacto del mockup.
5. **`src/components/Sidebar.tsx`** — logo (sol + "OpenDayCare" / "Sala Soles"), CTA degradado coral con plus, los cuatro items de nav (`Feed` activo: fondo `coral-soft` / texto `coral`, resto `#6E6359`), footer con avatar "C", "Caro Giménez", "Maestra · Soles" y botón de logout. Todo inerte (`<div>`/`<span>`, sin `href`). Montarlo en `page.tsx` con `hidden md:flex`. Verificar: sidebar idéntico al screenshot, main vacío.
6. **`src/components/PostCard.tsx`** — render por `kind`: avatar (inicial o megáfono), título, hora + autor, pill de badge, audiencia, cuerpo `15.5px/1.55`, placeholder de foto si hay `photoLabel`, footer con corazón + likes, mensaje + comentarios y "Editar". Verificar: las tres variantes.
7. **`app/page.tsx`** — shell `flex min-h-dvh bg-cream md:h-dvh md:overflow-hidden`, main `md:h-dvh md:overflow-y-auto` con el scrollbar del mockup resuelto en clases: `[&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb]:border-[3px] [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-[#E4D6C4] [&::-webkit-scrollbar-thumb]:bg-clip-content`, contenedor `mx-auto max-w-[760px] px-5 pt-6 pb-28 md:px-10 md:pt-[34px] md:pb-20`. Dentro: header (eyebrow, "Buenas, Caro", "12 niños · martes 17 jun"), composer, separador, `POSTS.map(<PostCard />)`. Verificar contra `references/screenshots/feed.png` a 920px y 1440px.
8. **`src/components/MobileNav.tsx`** — top bar (`md:hidden`): logo compacto a la izquierda; a la derecha botón coral 38px con plus y avatar "C" de 34px. Barra inferior fija (`md:hidden`), fondo `card`, borde superior, cuatro items con icono + label, activo en coral, `pb-[env(safe-area-inset-bottom)]`. Verificar a 390px: sin scroll horizontal y sidebar oculto.

## Acceptance criteria

- [x] `/` renderiza el feed sin errores en consola.
- [x] `h1` "Buenas, Caro" se computa en Fredoka; el cuerpo del post en Nunito.
- [x] Fondo de página `#F6ECDF`; cards `#FFFDF9` con borde `#ECE0D0`, radio 20px y la sombra del mockup.
- [x] El header muestra "GUARDERÍA · SALA SOLES", "Buenas, Caro" y "12 niños · martes 17 jun".
- [x] Se ven los tres posts en orden: logro (badge verde), actividad con placeholder de foto (badge celeste), anuncio (badge azul, ícono de megáfono en lugar de inicial).
- [x] Los conteos del mockup coinciden: 3/1, 5/2, 8/0.
- [x] Sidebar: "Feed" con fondo `#FBE3D8` y texto `#D9583C`; los otros tres items en `#6E6359`.
- [x] Footer del sidebar muestra "Caro Giménez" / "Maestra · Soles" y el botón de logout.
- [x] Click en CTA, items de nav, composer, "Editar", corazones y logout no navega ni produce 404.
- [x] A 390px: sidebar oculto, top bar y barra inferior visibles, sin scroll horizontal.
- [x] A 768px: sidebar visible, top bar y barra inferior ocultas.
- [x] En desktop el main hace scroll propio y el sidebar queda fijo.
- [x] `app/globals.css` no contiene ninguna regla CSS propia: solo `@import "tailwindcss"` y `@theme`.
- [x] `package.json` no suma dependencias.
- [x] No se usa `next/image` (no hay imágenes reales).

## Decisions

- **Sí:** estilos 100% con utilidades de Tailwind. Los tokens de `@theme` son el mecanismo de tema de Tailwind v4, no reglas CSS sueltas.
- **Sí:** Server Components puros, sin `"use client"`. Todo es estático y no hay estado.
- **Sí:** `next/font/google` en lugar de `<link>` al CDN, y en lugar de Geist. Sin FOUT ni requests externos en runtime.
- **Sí:** tokens en `@theme` porque vienen once pantallas más del mismo sistema visual.
- **Sí:** SVG inline propios en `Icons.tsx`. Cero dependencias y control exacto de `stroke-width` (el mockup usa 1.7, 2, 2.2 y 2.4 según el icono).
- **Sí:** `src/` para todo el código que no es ruta (`src/components`, `src/data`). `app/` conserva solo `page.tsx`, `layout.tsx`, `globals.css` y futuros `loading`/`error`. Sin prefijos `_`.
- **No:** cambiar el alias `@/*` (`./*`). Los imports usan `@/src/components/...` y `@/src/data/posts`.
- **Sí:** datos mock en `src/data/posts.ts`. Editar contenido = editar el array.
- **Sí:** enlaces inertes (`<span>`/`<div>` sin `href`). No se crean rutas placeholder ni se habilitan 404.
- **Sí:** mobile con top bar + barra inferior, sin drawer. No necesita estado de cliente.
- **Sí:** tamaños en px exactos del mockup (`text-[15.5px]`, `text-[12.5px]`, `rounded-[20px]`) donde la escala de Tailwind redondearía y se perdería la identidad.
- **Sí:** `md` (768px) como breakpoint. Tablets verticales conservan el sidebar.
- **No:** sidebar en `app/layout.tsx`. `login`, `activar-cuenta` y `vincular-padre` no lo llevan.
- **No:** dark mode. Se elimina el media query del template.
- **No:** `lucide-react`. La librería traería defaults distintos a los del mockup.
- **No:** reglas CSS propias (selectores, `@layer base`, `body { ... }`, scrollbar escrito a mano). Lo que el mockup resuelve con CSS se traduce a clases, incluido el scrollbar vía variantes arbitrarias.
- **No:** datos dinámicos, `cookies`, `headers` o `searchParams`. Con `cacheComponents: true` eso exigiría `<Suspense>` y no aporta nada acá.

## Risks

| Risk | Mitigation |
| --- | --- |
| `next/font` descarga Fredoka y Nunito en build; sin red el build falla. | Ambas son fuentes públicas de Google Fonts; el mockup ya depende de ellas. |
| `cacheComponents: true` marca `blocking-route` si alguien introduce una API de request o `Date.now()`. | La página es 100% síncrona: no agregar fuentes de datos ni tiempo real. |
| El diseño mobile no existe en el mockup; es invención nuestra. | Se valida con screenshot a 390px y se ajusta en una revisión posterior si hace falta. |

## What is **not** in this spec

- Rutas de niños, avisos, cuenta, creación/detalle de publicación, login y foto.
- Autenticación, base de datos y persistencia.
- Likes, comentarios y edición funcionales.
- Imágenes reales.
- Dark mode.
- Las demás pantallas de `references/pantallas/`.

Cada uno, si llega, va en su propio spec.
