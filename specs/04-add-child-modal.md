# SPEC 04 — Modal Agregar niño

> **Status:** Implemented
> **Depends on:** SPEC 02
> **Date:** 2026-11-08
> **Objective:** Convertir el CTA "Agregar niño" de `/kids` en un `<dialog>` que valida nombre, fecha de nacimiento y sala, y agrega el niño a la grilla y a su perfil en memoria durante la sesión.

## Scope

**In:**

- `src/modules/kids/AddChildDialog.tsx`: botón CTA + `<dialog>` nativo con `showModal()`, header (Cancelar / "Agregar niño" / Guardar), los 5 campos de `references/pantallas/agregar-nino.dc.html` y validación con mensajes en español.
- `src/modules/kids/DateField.tsx`: wrapper de `<input type="date">` con `value` ISO (`yyyy-mm-dd`), `max` para limitar al día de hoy, `inputMode` nativo, `aria-invalid` y `aria-describedby`.
- `src/modules/kids/kidsStore.ts`: store en memoria (módulo) con los 8 niños iniciales + los agregados; `listKids`, `getStoredKid`, `addChild`.
- `Child.allergyTags: string[]` en lugar de `allergyTag: string | null`; ajuste de los 8 registros, `KidCard` y `KidProfile`.
- `src/modules/kids/LocalKidProfile.tsx`: perfil en cliente de un niño agregado, leyendo el store.
- `app/kids/[slug]/page.tsx` gana un fallback: si el slug no es uno de los 8, renderiza `LocalKidProfile` en vez de `notFound()`.
- Mover `Field` de `src/modules/auth/Field.tsx` a `src/components/Field.tsx` (UI compartida) y re-apuntar `LoginForm` y `ActivateAccountForm`; `label` pasa a `ReactNode` para el asterisco.
- `ChevronDownIcon` nuevo en `src/components/Icons.tsx` para el select de sala.
- `KidsDirectory` absorbe el header de la página (`GESTIÓN / Niños` + CTA) porque el estado de la grilla y del modal viven ahí.

**Out of scope (for future specs):**

- Persistencia real: nada sobrevive a un reload ni a cerrar la pestaña.
- Editar o archivar niños, vincular padres, asignar más de una sala.
- Backend, API, server actions, autenticación, roles.
- Calendario desplegable (el campo es máscara, no date-picker visual).
- Chips interactivos de alergias, animaciones del modal, bottom sheet en mobile.
- Recarga de `/kids/[slug]` con niños agregados (por diseño, ese caso no encuentra al niño).

## Data model

### Cambio en `Child` (`src/modules/kids/kids.ts`)

```ts
export type Child = {
  slug: string;
  name: string;
  initial: string;
  color: ChildColor;
  ageYears: number;
  birthDate: string; // display "12 mar 2022"
  room: string;
  joinedAt: string; // display "nov 2026"
  allergyTags: string[]; // reemplaza allergyTag: string | null
  allergyNote: string | null;
  parents: Parent[];
};
```

Los 8 registros del mock cambian solo el campo: `allergyTag: "MANÍ"` → `allergyTags: ["MANÍ"]`; los nulos → `[]`.

### Helpers nuevos en `kids.ts`

| helper | firma | comportamiento |
| --- | --- | --- |
| `parseAllergyTags` | `(raw: string) => string[]` | parte por `,` `;` `/` y por ` y ` / ` e ` / ` i ` entre palabras (`/\s+(?:y|e|i)\s+/i`); recorta, descarta vacíos, deduplica sin distinguir mayúsculas. Los espacios internos se conservan: "frutos secos" es una etiqueta. |
| `formatBirthDate` | `(iso: string) => string` | `"2022-03-12"` → `"12 mar 2022"` con array fijo `MONTHS_ES = ["ene",…,"dic"]`, sin `Intl` (evita puntos y variantes de ICU). |
| `ageFromIso` | `(iso: string, today: Date) => number` | años cumplidos. |
| `slugify` | `(name: string) => string` | minúsculas, sin diacríticos, espacios → `-`. |
| `monthYear` | `(date: Date) => string` | `"nov 2026"` para `joinedAt`. |
| `isoFromTypedDate` | `(typed: string) => string \| null` | `"12/03/2022"` → `"2022-03-12"`; `null` si no son 8 dígitos o la fecha no existe. |

### Store (`src/modules/kids/kidsStore.ts`)

```ts
let children: Child[] = [...KIDS];

export function listKids(): Child[];
export function getStoredKid(slug: string): Child | undefined;
export function addChild(child: Child): void;
export function nextChildColor(): ChildColor;
export function uniqueSlug(base: string): string;
```

Mutable a nivel de módulo: vive mientras la pestaña esté abierta. Solo lo importan componentes cliente (`KidsDirectory`, `AddChildDialog`, `LocalKidProfile`).

### Valores de un niño nuevo

| campo | origen |
| --- | --- |
| `name` | input, `trim()` |
| `initial` | primer carácter de `name` en mayúscula |
| `color` | rotación `CHILD_COLOR_ORDER[children.length % 5]` |
| `ageYears` | `ageFromIso` |
| `birthDate` | `formatBirthDate` |
| `room` | `"Soles"` (única opción) |
| `joinedAt` | `monthYear(new Date())` |
| `allergyTags` | `parseAllergyTags(allergies)` |
| `allergyNote` | notas médicas, `trim()` o `null` si vacío |
| `parents` | `[]` |

Un niño sin padres y sin alergias muestra la pill `VINCULAR` del card, y su perfil cae en el mismo estado vacío de "PADRES VINCULADOS" que Valentina.

## Implementation plan

Cada paso deja la app funcionando en `pnpm dev`.

1. **`src/modules/kids/kids.ts`** — renombrar `allergyTag` a `allergyTags: string[]` en el tipo y en los 8 registros; agregar `MONTHS_ES`, `parseAllergyTags`, `formatBirthDate`, `ageFromIso`, `slugify`, `monthYear`, `isoFromTypedDate` y `CHILD_COLOR_ORDER`. Verificar: `/kids` y los 8 perfiles compilan con el campo nuevo.
2. **`KidCard.tsx` + `KidProfile.tsx`** — card: pill si `allergyTags.length > 0`, muestra `allergyTags[0]` en mayúsculas. Perfil: el bloque de alerta aparece si hay `allergyTags` o `allergyNote`, y lista las etiquetas separadas por ` · ` arriba de la nota. Verificar: Mateo muestra `MANÍ`, Tomás `LACTOSA`, y los perfiles sin alergias no muestran bloque.
3. **`src/components/Icons.tsx`** — `ChevronDownIcon({ size = 16 })` con `stroke="currentColor"` y el path `m6 9 6 6 6-6`. Verificar: no cambia ningún SVG existente.
4. **Mover `Field` a `src/components/Field.tsx`** — copiar el componente, `label: ReactNode`, `ref?: Ref<HTMLInputElement>`, exportar además `fieldLabelClass` y `fieldControlClass` para el `textarea` y el `select`. Borrar `src/modules/auth/Field.tsx` y re-apuntar los imports de `LoginForm` y `ActivateAccountForm`. Verificar: `/login` y `/activate-account` se ven idénticos.
5. **`src/modules/kids/kidsStore.ts`** — store mutable con `listKids`, `getStoredKid`, `addChild`, `nextChildColor`, `uniqueSlug`. Verificar: `listKids()` devuelve los 8 del mock al arrancar.
6. **`src/modules/kids/DateField.tsx`** — client component controlado: recibe `id`, `label`, `value` (texto ISO `yyyy-mm-dd`), `onChange`, `error`, `max`, `ref`. Usa `<input type="date">` con `max={todayIso()}`, `aria-invalid` y `aria-describedby`. El navegador maneja el selector visual. Verificar: el campo muestra un selector de calendario nativo y el valor se formatea según el locale del navegador.
7. **`src/modules/kids/AddChildDialog.tsx`** — CTA visible (degradado coral + `shadow-cta`) que abre `<dialog>` con `showModal()`; `onClose` sincroniza el estado y resetea el formulario (cubre Esc). Contenido: `<form noValidate>`, header, `Field` NOMBRE COMPLETO (`*`, full width), fila de 2 columnas con `DateField` (`*`, ISO, `max=hoy`) y `<select>` SALA (`*`, `appearance-none` + `ChevronDownIcon`, opciones: Soles/Lunas/Estrellas/Arcoíris), `Field` ALERGIAS (`placeholder="Ej. Maní, Lactosa"`) y `textarea` NOTAS MÉDICAS. Validación al submit con mensajes en español y foco en el primer campo inválido: nombre vacío, fecha vacía, fecha inválida, fecha futura. **Validación en tiempo real**: un `useEffect` limpia errores de nombre y fecha cuando sus valores se vuelven válidos. Al pasar: arma el `Child`, `addChild`, `onAdded`, cierra. Verificar: abrir/cerrar con Cancelar, con Esc y con Guardar válido.
8. **`KidsDirectory.tsx` + `app/kids/page.tsx`** — `page.tsx` queda en `AppShell activeItem="kids"` + `<KidsDirectory />` (metadata intacta). `KidsDirectory` renderiza el header (eyebrow, `h1`, `AddChildDialog`), el buscador, el separador con conteo y la grilla; estado `kids` inicializado en `KIDS` y sincronizado con `listKids()` dentro de un `useEffect` para evitar mismatch de hidratación. Verificar: agregar un niño lo suma al final, el conteo pasa a 9 y el buscador lo encuentra.
9. **`LocalKidProfile.tsx` + `app/kids/[slug]/page.tsx`** — el perfil nuevo resuelve el slug contra el store dentro de un `useEffect` (sin mismatch de hidratación); mientras no resuelve no renderiza nada, y si no existe muestra el estado "No encontramos ese niño." con link a `/kids`. La page queda: niño estático → perfil server como hoy; slug desconocido → `<LocalKidProfile slug>` dentro del `AppShell`; `generateMetadata` con `"Niño"` cuando no es estático. Verificar: crear "Martina López", entrar a su card y ver nombre, edad, `dd/mm/aaaa`, Sala Soles, ingreso del mes, alergias y "sin padres vinculados".
10. **Pasada responsive y de estilo** — dialog `m-auto w-[calc(100%-2rem)] max-w-[520px] max-h-[85dvh] overflow-y-auto rounded-[24px] border border-line bg-[#FBF4EC]` con `backdrop:bg-[rgba(63,54,46,.35)]`; a 390 px el formulario scrollea dentro del card. Verificar con Playwright a 390, 768 y 1440 px, sin scroll horizontal.

## Acceptance criteria

- [x] El CTA "Agregar niño" abre el modal; "Cancelar" y Esc lo cierran.
- [x] El modal muestra los 5 campos con el copy del mockup y el header Cancelar / Agregar niño / Guardar.
- [x] Las etiquetas de NOMBRE COMPLETO, FECHA DE NACIMIENTO y SALA llevan asterisco coral; ALERGIAS y NOTAS MÉDICAS no.
- [x] Guardar con nombre vacío muestra "Ingresá el nombre completo." y no agrega nada.
- [x] Guardar con fecha vacía muestra "Ingresá la fecha de nacimiento.".
- [x] Tipo `31022022` se rechaza con "Ingresá una fecha válida.".
- [x] Una fecha futura se rechaza con "La fecha no puede ser futura.".
- [x] Escribir `12032022` en el campo fecha muestra `12/03/2022` y no acepta letras.
- [x] El campo de fecha es un componente custom con máscara `dd/mm/aaaa` y calendario picker.
- [x] Guardar válido cierra el modal, agrega el niño al final de la grilla y el conteo sube a 9 niños.
- [x] El niño agregado muestra inicial, edad en años, `sin padres vinculados` y la pill según sus alergias.
- [x] Click en la card del niño nuevo abre su perfil con nombre, edad, fecha `dd/mm/aaaa`, sala seleccionada, ingreso del mes actual, alergias y notas cargadas.
- [x] Con "Maní y lactosa" el perfil lista dos etiquetas; con "frutos secos" lista una sola.
- [x] El niño agregado se encuentra escribiendo su nombre en el buscador.
- [x] `/kids/mateo-fernandez` sigue mostrando `MANÍ`, la nota y sus dos padres sin cambios.
- [x] Recargar la página descarta el niño agregado (comportamiento esperado, no bug).
- [x] A 390 px el modal no desborda, scrollea por dentro y no hay scroll horizontal.
- [x] `package.json` no suma dependencias; `globals.css` no cambia.
- [x] `/login` y `/activate-account` se ven igual que antes del movimiento de `Field`.

## Decisions

- **Sí:** componente custom de fecha con máscara `dd/mm/aaaa` y calendario picker. El usuario pidió un selector visual personalizado con los mismos estilos que el resto de la UI. La validación previene fechas inválidas (31/02) y futuras.
- **Sí:** `<dialog>` nativo con `showModal()`. Esc, foco atrapado, backdrop y capa superior vienen gratis; un overlay propio obliga a reimplementarlos.
- **Sí:** estado del niño nuevo en un store de módulo, no en `useState` del directorio. Es lo que permite que el perfil lo vea sin persistencia. Decisión del usuario.
- **Sí:** aceptar que `/kids/<slug-desconocido>` responda 200 con el estado vacío de "No encontramos ese niño". Es el precio de resolver el perfil en cliente y contradice un criterio de SPEC 02 de forma deliberada.
- **Sí:** `allergyTags: string[]`. El usuario describió varias alergias, no una sola.
- **Sí:** partir etiquetas por `,` `;` `/` y por ` y ` / ` e ` / ` i `, conservando espacios internos. Cubre "Maní, Lactosa", "Maní y Lactosa" y "frutos secos" sin romper frases.
- **Sí:** mensajes de error propios con `<form noValidate>`. Los tooltips nativos salen en el idioma del navegador, no en español.
- **Sí:** asterisco coral en los 3 obligatorios. El mockup no los distingue y no hay otra pista visual.
- **Sí:** `<select>` nativo con salas hardcodeadas (`Soles`, `Lunas`, `Estrellas`, `Arcoíris`). Es el control correcto y no suma JS.
- **Sí:** mover `Field` a `src/components`. Se reutiliza en 5 campos nuevos y evita duplicar el par label+input ya existente.
- **Sí:** el store se lee dentro de `useEffect`. Evita que la grilla renderizada en servidor con 8 niños choque con el cliente con 9.
- **Sí:** el perfil nuevo resuelve el slug en un `useEffect` y no con `notFound()`. Lanzar en el render rompería el SSR del documento inicial y la navegación cliente.
- **No:** persistencia, localStorage, API, server actions.
- **No:** chips interactivos, animación de apertura, bottom sheet en mobile.
- **No:** editar o vincular padres desde el perfil nuevo. Se mockea `parents: []` y queda el estado vacío existente.
- **No:** `globals.css`, dependencias nuevas, `next/image`.

## Risks

| Risk | Mitigation |
| --- | --- |
| El perfil del niño nuevo rompe el 404 real de `/kids/[slug]` que SPEC 02 eligió con `instant = false`. | Aceptado y documentado: los 8 perfiles estáticos siguen renderizando en servidor; solo el slug desconocido llega al fallback cliente, que muestra un estado vacío con link a `/kids`. |
| In-memory: recargar o abrir la URL directa pierde al niño y muestra "No encontramos ese niño". | Es el alcance acordado ("solo en memoria"). Se explicita en los criterios para que no se lea como bug. |
| Store de módulo + hidratación: el servidor renderiza 8 y el cliente 9. | Inicializar con `KIDS` y sincronizar con `listKids()` en un `useEffect`, nunca en el inicializador. |
| La máscara reescribe el caret al final. | `shortcut` anotado en el código; aceptable mientras solo se tipea de corrido. Se mejora si aparecen correcciones en el medio. |
| `slugify` puede colisionar con los 8 slugs o entre niños nuevos. | `uniqueSlug` agrega sufijo incremental contra el store antes de insertar. |
| Un niño sin alergias y sin padres muestra la pill `VINCULAR` en el card. | Comportamiento derivado de `KidCard`, no se inventa un estado nuevo. |

## What is **not** in this spec

- Persistencia (localStorage, DB, API), edición y archivado.
- Vincular padres, más de una sala, múltiples fotos o avatar.
- Calendario desplegable, chips de etiquetas, animaciones y bottom sheet.
- Backend, auth y protección de rutas.

Cada uno, si llega, va en su propio spec.
