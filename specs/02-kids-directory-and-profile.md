# SPEC 02 — Directorio de niños y perfil

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-11-08
> **Objective:** Implementar `references/pantallas/ninos.dc.html` en `/kids` y `references/pantallas/perfil-nino.dc.html` en `/kids/[slug]`, con datos mock de los 8 niños, búsqueda con debounce y navegación activa compartida con el feed.

## Scope

**In:**

- Extraer el shell actual de `app/page.tsx` (sidebar + mobile nav + main con scroll) a `src/components/AppShell.tsx`.
- `Sidebar` y `MobileNav` reciben `activeItem` y usan `next/link` solo para `/` y `/kids`.
- `src/components/nav.ts` como fuente única de los 4 ítems de navegación (hoy duplicados en ambos navs).
- `/kids`: header "GESTIÓN / Niños", CTA "Agregar niño" inerte, buscador con debounce, separador "SALA SOLES", grilla de 8 cards.
- `/kids/[slug]`: volver a Niños, cabecera con avatar grande, alerta de alergias, card de datos, botón "Resumen del día" inerte, card de padres vinculados, fila "Vincular otro padre" inerte.
- `src/data/kids.ts` con los 8 niños, su paleta, sus padres y sus notas.
- `generateStaticParams` para las 8 rutas, `notFound()` para slugs desconocidos y metadata por ruta.
- Cuatro iconos nuevos en `src/components/Icons.tsx`: búsqueda, chevron derecha, chevron izquierda, alerta.
- Responsive propio: cards a 1 columna y perfil apilado en mobile, siguiendo el patrón del SPEC 01.
- Títulos por ruta con `template` en `app/layout.tsx`.

**Out of scope (for future specs):**

- `/avisos`, `/mi-cuenta`, `/crear-publicacion`, `/detalle-publicacion`, `/login`, `/resumen-dia`, `/vincular-padre`, `/kids/new`.
- Crear, editar, archivar o vincular niños de verdad.
- Autenticación, base de datos, persistencia, API, server actions.
- Imágenes reales o avatares con foto.
- Agrupar por sala, ordenar, paginar o filtrar por alergia.
- Dark mode.

## Data model

Nuevo y único modelo, sin persistencia. Vive en `src/data/kids.ts`.

```ts
export type ChildColor = "sky" | "rose" | "sage" | "honey" | "lilac";

export type ParentStatus = "active" | "pending";

export type Parent = {
  name: string; // "Lucía Fernández"
  initial: string; // "L"
  relation: string; // "Mamá" | "Papá"
  status: ParentStatus;
};

export type Child = {
  slug: string; // "mateo-fernandez"
  name: string; // "Mateo Fernández"
  initial: string; // "M"
  color: ChildColor;
  ageYears: number; // 3
  birthDate: string; // "12 mar 2022"
  room: string; // "Soles"
  joinedAt: string; // "feb 2025"
  allergyTag: string | null; // "MANÍ" | "LACTOSA" | null
  allergyNote: string | null;
  parents: Parent[];
};
```

Paleta de avatar (los 5 pares del mockup), exportada desde el mismo archivo como `CHILD_COLOR_STYLES`:

| color | fondo | texto | asignados |
| --- | --- | --- | --- |
| `sky` | `#A9D9E8` | `#1F7A93` | Mateo, Lucas |
| `rose` | `#F4B8CC` | `#C44A7A` | Sofía, Emma |
| `sage` | `#B9DEC4` | `#3E8B62` | Benjamín, Olivia |
| `honey` | `#F4DC8E` | `#9A7B1E` | Valentina |
| `lilac` | `#C9B6E8` | `#7B5FC0` | Tomás |

Contenido de `KIDS` (orden del mockup):

| slug | nombre | edad | padres | allergyTag | allergyNote |
| --- | --- | --- | --- | --- | --- |
| `mateo-fernandez` | Mateo Fernández | 3 | Lucía (Mamá, active), Diego (Papá, pending) | MANÍ | Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila. |
| `sofia-mendez` | Sofía Méndez | 2 | Camila (Mamá, active) | — | — |
| `benjamin-ruiz` | Benjamín Ruiz | 3 | Andrés (Papá, active), Paula (Mamá, active) | — | — |
| `valentina-soto` | Valentina Soto | 2 | — | — | — |
| `tomas-diaz` | Tomás Díaz | 3 | Mariano (Papá, active) | LACTOSA | Intolerancia a la lactosa. Sin lácteos en la merienda. |
| `emma-castro` | Emma Castro | 2 | Julieta (Mamá, active) | — | — |
| `lucas-romero` | Lucas Romero | 3 | Nicolás (Papá, active) | — | — |
| `olivia-vega` | Olivia Vega | 2 | Florencia (Mamá, pending) | — | — |

Datos de detalle inventados para los 7 niños que el mockup no cubre:

| slug | birthDate | joinedAt |
| --- | --- | --- |
| `sofia-mendez` | 8 jul 2023 | mar 2025 |
| `benjamin-ruiz` | 27 nov 2022 | ene 2025 |
| `valentina-soto` | 3 may 2023 | abr 2025 |
| `tomas-diaz` | 19 sep 2022 | feb 2025 |
| `emma-castro` | 14 feb 2023 | mar 2025 |
| `lucas-romero` | 30 abr 2022 | feb 2025 |
| `olivia-vega` | 21 oct 2023 | may 2025 |

Todo lo demás es derivado, nunca un campo duplicado:

- Meta de la card: `0 → "sin padres vinculados"`, `1 → "1 padre vinculado"`, `n → "${n} padres vinculados"`.
- Pill de la card: si `allergyTag` existe, muestra la etiqueta; si no y `parents.length === 0`, muestra `VINCULAR`; si no, chevron.
- Conteo del header de sección: cantidad de niños visibles tras el filtro.

## Implementation plan

Cada paso deja la app funcionando en `pnpm dev` (http://localhost:3000).

1. **`src/components/Icons.tsx`** — exportar `IconProps` y agregar `SearchIcon` (18, stroke 2), `ChevronRightIcon` (18, 2.2), `ChevronLeftIcon` (18, 2.2) y `AlertIcon` (22, 2.2, `stroke="currentColor"`), con los mismos paths del mockup. Verificar: el feed se ve idéntico y no cambia ningún SVG existente.
2. **`src/components/nav.ts`** — `export type NavItem = "feed" | "kids"` y `NAV_ITEMS` con `{ id, label, icon, href? }`: Feed → `/`, Niños → `/kids`, Avisos y Mi cuenta sin `href`. Refactorizar `Sidebar` y `MobileNav` para mapear ese array, recibir `activeItem: NavItem` y renderizar `next/link` solo cuando hay `href`. Verificar: en `/` el ítem activo es Feed; Avisos y Mi cuenta siguen inertes.
3. **`src/components/AppShell.tsx`** — recibe `activeItem` y `children`; renderiza `Sidebar`, `MobileNav` y el `main` con scroll propio y las clases de scrollbar actuales. `app/page.tsx` queda solo con el contenido del feed dentro de `<AppShell activeItem="feed">`. Verificar contra `references/screenshots/feed.png`.
4. **`src/data/kids.ts`** — tipos, `CHILD_COLOR_STYLES`, `KIDS` (8) y `getKid(slug)`. Verificar: 8 entradas, slugs únicos.
5. **`src/components/KidProfile.tsx` + `app/kids/[slug]/page.tsx`** — perfil completo: volver a Niños (`Link` a `/kids`), cabecera con avatar grande, "Editar" inerte, alerta de alergias (solo si `allergyNote`), card de datos, botón "Resumen del día" inerte, card "PADRES VINCULADOS" con pills ACTIVA/PENDIENTE y fila "Vincular otro padre" inerte. La page usa `PageProps<'/kids/[slug]'>`, `await params`, `generateStaticParams()` con los 8 slugs, `notFound()` y `generateMetadata` con el nombre del niño. Verificar: los 8 perfiles renderizan; `/kids/no-existe` da 404.
6. **`src/components/KidCard.tsx` + `app/kids/page.tsx`** — header (eyebrow `GESTIÓN`, `h1` "Niños", CTA "Agregar niño" inerte), contenedor `max-w-[880px]`, separador "SALA SOLES" con conteo y grilla de cards (`Link` a `/kids/${slug}`). Verificar: 8 cards en orden, navegación al perfil y estado activo de "Niños" en el nav.
7. **`src/components/KidsDirectory.tsx`** — client component que reemplaza la grilla estática: input "Buscar niño…" con `aria-label`, estado de query y query debounced a 250 ms (`useEffect` + `setTimeout`), filtro por nombre normalizado (`normalize("NFD")` sin diacríticos, case-insensitive), conteo `n niño/niños` con `aria-live="polite"`, grilla filtrada y estado vacío "No encontramos niños con ese nombre.". Verificar: `sofia` encuentra a Sofía; `zz` muestra el vacío.
8. **Pasada mobile** — cards a 1 columna (`grid-cols-1 md:grid-cols-2`), perfil apilado (`flex-col md:flex-row`), avatar 64px / nombre 22px en mobile y 84px / 28px en `md`, columna derecha `w-full md:w-[300px] md:flex-none`. Verificar con Playwright a 390, 768 y 1440 px.

## Acceptance criteria

- [ ] `/kids` responde 200 y muestra 8 cards en el orden del mockup.
- [ ] Cada card muestra inicial en Fredoka, nombre, "N años · X padres vinculados" y pill o chevron según corresponda.
- [ ] Mateo muestra pill `MANÍ`, Tomás `LACTOSA` y Valentina `VINCULAR`.
- [ ] El header de sección muestra "SALA SOLES" y "8 niños".
- [ ] Escribir `sofia` filtra a Sofía Méndez; escribir `zz` muestra el estado vacío.
- [ ] El filtro se aplica ~250 ms después de la última tecla, no en cada pulsación.
- [ ] Clic en una card navega a `/kids/<slug>`.
- [ ] `/kids/mateo-fernandez` muestra nombre, "3 años · Sala Soles", alerta de alergias, "12 mar 2022", "Soles", "feb 2025" y los padres Lucía (ACTIVA) y Diego (PENDIENTE).
- [ ] `/kids/sofia-mendez` no muestra bloque de alergias.
- [ ] `/kids/tomas-diaz` muestra la nota de intolerancia a la lactosa.
- [ ] `/kids/valentina-soto` muestra "PADRES VINCULADOS" vacío y la fila "Vincular otro padre".
- [ ] `/kids/no-existe` responde 404.
- [ ] "Volver a Niños" navega a `/kids`.
- [ ] En `/kids` el nav marca "Niños" activo; en `/` marca "Feed" activo.
- [ ] "Agregar niño", "Editar", "Resumen del día", "Vincular otro padre", "Nueva publicación", Avisos y Mi cuenta no navegan ni producen 404.
- [ ] El título de `/kids` es "Niños — OpenDayCare" y el del perfil incluye el nombre del niño.
- [ ] A 390 px: cards a 1 columna, perfil apilado, sin scroll horizontal, sidebar oculto y barra inferior visible.
- [ ] A 768 px: grilla a 2 columnas, perfil a 2 columnas, sidebar visible.
- [ ] El feed en `/` se ve igual que antes del refactor.
- [ ] `app/globals.css` sigue sin reglas CSS propias.
- [ ] `package.json` no suma dependencias y no se usa `next/image`.

## Decisions

- **Sí:** rutas en inglés (`/kids`, `/kids/[slug]`) con slug legible; el copy visible sigue en español. Decisión del usuario.
- **Sí:** `AppShell` compartido en vez de repetir el shell en tres páginas. Evita que las tres pantallas deriven.
- **Sí:** `activeItem` como prop. Mantiene Sidebar, MobileNav y las páginas como Server Components; `usePathname` obligaría a cliente.
- **Sí:** `NAV_ITEMS` único en `src/components/nav.ts`. Hoy está duplicado en Sidebar y MobileNav y con los links se desincronizaría.
- **Sí:** búsqueda en cliente con debounce de 250 ms. Con 8 items no justifica server search, pero el usuario pidió debounce explícito.
- **Sí:** normalizar acentos en el filtro. "Sofía" debe encontrarse escribiendo "sofia".
- **Sí:** la alergia tiene prioridad sobre `VINCULAR` en la pill. La información de seguridad es más crítica; la falta de padres ya se lee en la meta de la card.
- **Sí:** `VINCULAR` y el conteo de padres son derivados de `parents.length`, no campos del modelo. Una sola fuente de verdad.
- **Sí:** detalle inventado y coherente para los 7 niños sin mockup. Evita perfiles vacíos y links muertos.
- **Sí:** la paleta de cada niño es dato (`color`) + mapa de clases en `kids.ts`, no tokens de `@theme`. No es tema del producto: es identidad por niño.
- **Sí:** la alerta de alergias se omite cuando `allergyNote` es `null`. No se inventa un bloque vacío.
- **Sí:** `generateStaticParams` con los 8 slugs. Con `cacheComponents: true`, sin él el segmento dinámico pide `<Suspense>` y se marca `blocking-route`.
- **Sí:** `notFound()` para slugs desconocidos.
- **Sí:** `title.template` en el root layout para que cada ruta solo declare su título corto.
- **Sí:** mobile propio, siguiendo el patrón del SPEC 01. Los mockups son solo desktop.
- **No:** `usePathname` en cliente.
- **No:** crear, editar, vincular, resumir del día. Cada uno va en su spec.
- **No:** persistencia, API o server actions.
- **No:** agrupar por sala, ordenar o filtrar por alergia.
- **No:** librería de iconos.
- **No:** imágenes reales.

## Risks

| Risk | Mitigation |
| --- | --- |
| `cacheComponents: true` marca `blocking-route` si el segmento dinámico no está prerenderizado. | `generateStaticParams` con los 8 slugs y datos 100% síncronos. |
| El debounce agrega estado de cliente a una pantalla que era estática. | Solo `KidsDirectory` es client; el resto sigue server. El bundle nuevo es mínimo. |
| El refactor del shell puede mover el layout del feed. | El paso 3 se verifica contra `references/screenshots/feed.png` antes de seguir. |
| Los 7 perfiles inventados pueden contradecir futuros datos reales. | Viven en un único archivo de datos; reemplazarlos es editar `KIDS`. |
| El diseño mobile no existe en el mockup. | Se valida con capturas a 390 px y se ajusta en una revisión posterior. |

## What is **not** in this spec

- Crear, editar, archivar o vincular niños.
- Resumen del día, avisos, mi cuenta, login, publicación y detalle de publicación.
- Autenticación, base de datos, persistencia y API.
- Imágenes reales.
- Filtros por sala o alergia, orden y paginación.
- Dark mode.

Cada uno, si llega, va en su propio spec.
