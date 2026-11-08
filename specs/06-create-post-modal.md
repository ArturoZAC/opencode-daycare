# SPEC 06 — Modal nueva publicación

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 02, SPEC 04
> **Date:** 2026-11-08
> **Objective:** Implementar `references/pantallas/crear-publicacion.dc.html` como un `<dialog>` abierto desde el composer del feed, el CTA "Nueva publicación" del sidebar y el `+` mobile, con destinatarios multi-seleccionables (con "Toda la sala" como select-all), tipo único, descripción y carga de fotos local.

## Scope

**In:**

- `src/modules/feed/CreatePostDialog.tsx` (client): disparador configurable + `<dialog>` nativo con `showModal()`, header (Cancelar / "Nueva publicación" / Publicar) y cuerpo con PARA, TIPO, DESCRIPCIÓN y FOTOS, fiel al mockup.
- PARA multi-selección con los 8 niños de `listKids()`, chips con avatar e inicial usando `CHILD_COLOR_STYLES`, y chip final "Toda la sala".
- TIPO single-select con los 7 tipos del mockup, cada uno con su paleta exacta; el elegido lleva un ring oscuro de 2px. Arranca en `Actividad`.
- DESCRIPCIÓN con `fieldLabelClass` / `fieldControlClass`, vacía y con el placeholder del mockup.
- FOTOS: input file oculto (`accept="image/*"`, `multiple`), previews de 96×96 con `URL.createObjectURL`, X en la esquina superior derecha para quitar cada foto y tile "Agregar" siempre visible. Sin subida a servidor.
- Validación de audiencia y descripción, cierre del modal y navegación a `/` al publicar. No se crea ningún post.
- `app/page.tsx`: el composer "Compartí un momento…" pasa de `<div>` a disparador `<CreatePostDialog>`, conservando exactamente las clases y los hijos actuales. Sigue siendo Server Component.
- `Sidebar.tsx`: el CTA "Nueva publicación" pasa de `<div>` inerte a disparador del modal, con las clases actuales intactas.
- `MobileNav.tsx`: el botón `+` de la top bar pasa a disparador del modal (`aria-label="Nueva publicación"`).
- Responsive del modal siguiendo el patrón de `AddChildDialog` / `LinkParentDialog`.

**Out of scope (for future specs):**

- Crear el post en el feed, `postsStore`, persistencia, API, server actions.
- Subir la imagen a cualquier lado, recortar, comprimir, límite de peso, drag & drop.
- Filtrar el feed por audiencia o por tipo.
- La ruta `/crear-publicacion`.
- Editar una publicación existente, borradores, programación, animaciones, bottom sheet, dark mode.

## Data model

No hay estructuras persistidas ni cambios en `posts.ts`, `kids.ts` o `kidsStore.ts`. Todo vive en `useState` dentro del modal y se descarta al cerrarlo.

```ts
type PostType =
  | "food"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "photo"
  | "announcement";

type PhotoDraft = {
  id: string;   // crypto.randomUUID()
  url: string;  // URL.createObjectURL(file)
  name: string; // file.name, para el alt
};

type AudienceSelection = {
  allRoom: boolean;    // "Toda la sala" activa
  kidSlugs: string[];  // vacío cuando allRoom es true
};
```

Estado inicial: `{ allRoom: false, kidSlugs: [KIDS[0].slug] }` (Mateo, como el mockup), `postType: "activity"`, `description: ""`, `photos: []`, `errors: {}`.

Tipos de publicación (orden y paleta exactos del mockup):

| value | Label | Clases del chip |
| --- | --- | --- |
| `food` | Comida | `bg-[#9A7B1E] text-white` |
| `nap` | Siesta | `bg-[#E7DCF6] text-[#7B5FC0]` |
| `activity` | Actividad | `bg-[#2E89A6] text-white` |
| `achievement` | Logro | `bg-[#CFEBD8] text-[#3E9B6C]` |
| `mood` | Ánimo | `bg-[#F9D2DE] text-[#C56486]` |
| `photo` | Foto | `bg-[#FBD8CC] text-[#D9684A]` |
| `announcement` | Anuncio | `bg-[#CCD8F4] text-[#4E72C8]` |

Reglas de audiencia:

- Los chips de niños son checkboxes nativos (`name="audience"`). Se pueden marcar y desmarcar varios.
- Marcar "Toda la sala" deja `{ allRoom: true, kidSlugs: [] }`: el chip queda oscuro y **todos los chips de niños quedan apagados**.
- Desmarcar "Toda la sala" deja `{ allRoom: false, kidSlugs: [] }`.
- Tocar un niño con "Toda la sala" activa pasa a `{ allRoom: false, kidSlugs: [ese niño] }`.
- Un niño se ve seleccionado solo si `!allRoom && kidSlugs.includes(slug)`.

Errores (se muestran en coral debajo del bloque):

| Caso | Mensaje |
| --- | --- |
| sin audiencia (ni "Toda la sala" ni niños) | `Elegí al menos un destinatario.` |
| descripción vacía o solo espacios | `Contá algo sobre el día.` |

TIPO nunca puede faltar: siempre hay un radio elegido (`Actividad` por defecto), así que la validación efectiva es audiencia + descripción.

Copy fijo:

| Dato | Valor |
| --- | --- |
| Título del modal | `Nueva publicación` |
| Cancelar | `Cancelar` |
| CTA | `Publicar` |
| Labels | `PARA`, `TIPO`, `DESCRIPCIÓN`, `FOTOS` |
| Placeholder descripción | `Contá cómo le fue hoy…` |
| Chip select-all | `Toda la sala` |
| Tile de carga | `Agregar` |
| Texto del composer | `Compartí un momento…` |
| `aria-label` del `+` mobile | `Nueva publicación` |

## Implementation plan

Cada paso deja la app funcionando en `pnpm dev` (http://localhost:3000).

1. **`CreatePostDialog.tsx` + sidebar** — client component con `{ className, ariaLabel, children }`. Renderiza `<button type="button" aria-haspopup="dialog" aria-label={ariaLabel} onClick={open} className={className}>{children}</button>` y un `<dialog ref>` con `aria-labelledby={titleId}`, `onClose={resetForm}`, clases `m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-[580px] overflow-y-auto rounded-[24px] border border-line bg-[#FBF4EC] p-0 shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)] backdrop:bg-[rgba(63,54,46,.35)]`. `open` hace `setKids(listKids())` y `dialogRef.current?.showModal()`. Header `flex items-center justify-between gap-3 border-b border-line px-[26px] py-5` con Cancelar (`type="button"`, 15px bold muted), título (`font-display text-[18px] font-semibold`) y Publicar (`type="submit"`, 15px extrabold coral-deep). `useId()` para todos los ids, porque el componente se monta tres veces. En `Sidebar.tsx`, reemplazar el `<div>` del CTA por `<CreatePostDialog className="mb-[18px] flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] p-3 text-[14.5px] font-extrabold text-white shadow-cta"><PlusIcon size={17} />Nueva publicación</CreatePostDialog>`. Verificar: abre y cierra con Cancelar y Esc; el CTA se ve idéntico.
2. **PARA** — grupo `role="group"` + label `PARA` con `fieldLabelClass`. `kids` en estado, inicializado con `KIDS` y refrescado en `open`. Chips: `<label>` con `<input type="checkbox" className="peer sr-only">` y un `<span>` clicable que cambia entre `border-[#3F362E] bg-[#3F362E] text-white` y `border-line bg-[#FFFDF9] text-[#6E6359]`; padding `py-1.5 pl-1.5 pr-3.5`, radio `rounded-full`, `border-[1.5px]`, texto 14px bold. Avatar `h-[26px] w-[26px] rounded-full font-display text-[13px] font-semibold` + `CHILD_COLOR_STYLES[child.color]`. "Toda la sala" al final, sin avatar, `px-4 py-1.5`. Focus visible con `peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#4E72C8]`. Verificar: Mateo oscuro; marcar/desmarcar Sofía y Benjamín; "Toda la sala" apaga los 8 chips; tocar un niño con "Toda la sala" activa deja solo ese.
3. **TIPO + DESCRIPCIÓN** — radios nativos `name="post-type"` con `peer sr-only`; pill `cursor-pointer rounded-full px-4 py-2 text-[13.5px] font-extrabold` + la paleta de la tabla + `peer-checked:ring-2 peer-checked:ring-[#3F362E] peer-checked:ring-offset-2 peer-checked:ring-offset-[#FBF4EC]` y `peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#4E72C8]`. El label `TIPO` con `fieldLabelClass`. Textarea con `fieldControlClass` + `min-h-[120px] resize-y leading-[1.5]`, `aria-invalid`/`aria-describedby` cuando hay error. Verificar: Actividad arranca con ring; las flechas del teclado cambian de tipo; el texto se escribe.
4. **FOTOS** — `<input type="file" accept="image/*" multiple className="hidden" ref>`; tile "Agregar" (`h-24 w-24 rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1]`, `PlusIcon size={22}` coral, texto 12px "Agregar"). Cada foto: tile `relative h-24 w-24 overflow-hidden rounded-[14px] border border-line bg-[#F4ECE1]`, `<img className="h-full w-full object-cover" alt={photo.name}>` y X `absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#3F362E] text-white` con `aria-label="Quitar foto"` y `CloseIcon size={12}`. Al elegir archivos: `URL.createObjectURL`, append, y `event.target.value = ""` para poder repetir el mismo archivo. Quitar y resetear revocan la URL. Verificar: elegir 2 imágenes, quitar una, cerrar y reabrir con la grilla vacía.
5. **Validación y Publicar** — `handleSubmit` con `preventDefault()`: audiencia vacía → error y foco en el grupo (`tabIndex={-1}`); descripción vacía → error y foco en el textarea. Limpiar cada error cuando su valor se vuelve válido. Si todo pasa, `dialogRef.current?.close()` y `router.push("/")` con `useRouter` de `next/navigation`. `resetForm` (en `onClose`) devuelve audiencia a Mateo, tipo a Actividad, descripción vacía, fotos `[]` y errores `{}`, revocando URLs. Verificar: Publicar con descripción vacía y con audiencia vacía; Publicar válido vuelve a `/`.
6. **MobileNav** — reemplazar el `<span>` del `+` por `<CreatePostDialog ariaLabel="Nueva publicación" className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[linear-gradient(180deg,#F4977E,#EE8164)] text-white"><PlusIcon size={17} /></CreatePostDialog>`. Verificar: a 390px abre el modal; a 768px el `+` no existe y el sidebar sí.
7. **Composer del feed** — en `app/page.tsx`, reemplazar el `<div>` del composer por:

```tsx
<CreatePostDialog className="mb-6 flex w-full cursor-pointer items-center gap-3.5 rounded-[18px] border border-line bg-card px-[18px] py-3.5 text-left shadow-composer">
  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#F2937A] font-display text-base font-semibold text-white">
    C
  </div>
  <span className="flex-1 text-[15px] text-muted-2">
    Compartí un momento…
  </span>
  <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-coral-soft text-coral">
    <CameraIcon />
  </span>
</CreatePostDialog>
```

El nombre accesible es el texto visible, así que no lleva `ariaLabel`. El ícono de cámara queda decorativo dentro del botón: toda la caja abre el modal. Verificar: a 390 y 1440 px el composer se ve idéntico y cualquier click en él abre el modal.
8. **Pasada responsive** — modal con scroll interno a 390px, chips de PARA en varias filas, grilla de fotos sin desbordar, sin scroll horizontal. Verificar con Playwright a 390, 768 y 1440 px contra `references/pantallas/crear-publicacion.dc.html`.

## Acceptance criteria

- [x] El CTA "Nueva publicación" del sidebar abre el modal en `/` y en `/kids`, y se ve idéntico a antes.
- [x] El `+` de la top bar mobile abre el mismo modal a 390px y desaparece a 768px.
- [x] Click en cualquier parte del composer "Compartí un momento…" abre el modal.
- [x] El composer se ve idéntico a antes (avatar, texto, botón coral de cámara) y no cambia el layout del feed.
- [x] El modal es un `<dialog>` con backdrop `rgba(63,54,46,.35)` y se cierra con Cancelar y con Esc.
- [x] El header muestra "Cancelar", "Nueva publicación" y "Publicar".
- [x] PARA muestra los 8 niños de la sala, Mateo seleccionado, y "Toda la sala" como último chip.
- [x] Los chips de niños son checkboxes: se pueden marcar y desmarcar varios a la vez.
- [x] Al activar "Toda la sala" solo ese chip queda oscuro y los 8 chips de niños quedan apagados.
- [x] Al tocar un niño con "Toda la sala" activa, solo ese niño queda seleccionado y "Toda la sala" se apaga.
- [x] Un niño agregado desde `/kids` aparece en PARA al abrir el modal sin recargar.
- [x] TIPO muestra Comida, Siesta, Actividad, Logro, Ánimo, Foto y Anuncio con las paletas del mockup.
- [x] Actividad arranca seleccionada con el ring oscuro y solo puede haber un tipo a la vez.
- [x] Las flechas del teclado mueven la selección de TIPO.
- [x] DESCRIPCIÓN arranca vacía con el placeholder "Contá cómo le fue hoy…".
- [x] "Agregar" abre el picker de imágenes y acepta varias a la vez.
- [x] Cada foto elegida aparece como preview de 96×96 con su X, y la X la quita.
- [x] Publicar sin descripción muestra "Contá algo sobre el día." y no navega.
- [x] Publicar sin audiencia muestra "Elegí al menos un destinatario." y no navega.
- [x] Publicar con audiencia y descripción cierra el modal y vuelve a `/`.
- [x] El feed sigue mostrando los 3 posts de `POSTS`: no se agrega ninguna publicación.
- [x] Cerrar y reabrir resetea audiencia a Mateo, tipo a Actividad, descripción vacía, fotos vacías y errores.
- [x] A 390px el modal scrollea por dentro y no hay scroll horizontal.
- [x] `/`, `/kids` y `/login` se ven igual que antes.
- [x] `package.json` no suma dependencias, `app/globals.css` no cambia y `posts.ts` queda intacto.

## Decisions

- **Sí:** `<dialog>` nativo. Esc, top layer, backdrop y foco atrapado salen gratis; mismo patrón que SPEC 04 y 05.
- **Sí:** tres disparadores (composer, sidebar, `+` mobile) con el mismo componente. El composer es la acción natural del usuario y el único punto de entrada en mobile cuando el sidebar está oculto. Decisión explícita del usuario.
- **Sí:** tres instancias montadas con `useId()` en todos los ids para no duplicar ids en el DOM. Solo una es visible por breakpoint y todas arrancan cerradas.
- **Sí:** el `<button>` del composer envuelve avatar, texto e ícono de cámara. Es HTML válido (no hay controles anidados) y necesita `w-full text-left` para no cambiar el layout.
- **Sí:** PARA multi-select con checkboxes nativos; "Toda la sala" es un checkbox que reemplaza la selección y apaga los chips de niños, tal como lo describió el usuario. El state guarda los slugs; `allRoom` distingue "los 8 por select-all" de "los 8 a mano".
- **Sí:** TIPO single-select y el tipo elegido se marca con ring oscuro, conservando la paleta exacta del mockup. No se inventan variantes claras de Comida y Actividad.
- **Sí:** todos los niños de `listKids()`, no los 3 del mockup. La referencia es un estado de ejemplo; mostrar 8 es consistente con `/kids` y con los colores ya existentes.
- **Sí:** Mateo preseleccionado y Actividad por defecto, como el mockup. Arrancar vacío es cambiar una línea del estado inicial.
- **Sí:** descripción vacía con placeholder. El texto del mockup es un ejemplo de estado lleno, igual que los posts hardcodeados del feed.
- **Sí:** fotos locales y opcionales, varias, con X y sin tope arbitrario. `URL.createObjectURL` + `revokeObjectURL` al quitar y al cerrar; el archivo nunca sale del navegador.
- **Sí:** cuando no hay fotos se muestra solo el tile "Agregar". El mockup enseña un estado con imagen; el tile gris con ícono era un placeholder, no un paso previo.
- **Sí:** validación de audiencia y descripción, foco en el campo inválido y limpieza del error al corregirlo, igual que `AddChildDialog`.
- **Sí:** Publicar no crea el post: cierra, resetea y navega a `/`. La creación real es otro spec.
- **Sí:** `PostType` propio con 7 valores. No reusa `PostKind` (3 valores) porque todavía no hay creación de posts y el mockup pide 7 tipos.
- **No:** tokens nuevos en `globals.css`. Todos los colores ya existen en `@theme` o se resuelven con valores arbitrarios, como en SPEC 05.
- **No:** `next/image` (los previews son blobs locales), dependencias nuevas, iconos nuevos (`PlusIcon`, `CloseIcon`, `CameraIcon` e `ImageIcon` ya existen).
- **No:** ruta `/crear-publicacion`, persistencia, límite de peso, drag & drop.

## Risks

| Risk | Mitigation |
| --- | --- |
| Comida queda oscura sin estar seleccionada y puede leerse como activa junto a Actividad. | El ring oscuro de 2px con offset marca la diferencia; se valida visualmente a 390 y 1440 px. |
| Tres `<dialog>` montados (composer, sidebar, mobile) con ids duplicados. | Se resuelve con `useId()`; los diálogos cerrados no ocupan lugar y solo el trigger visible está en pantalla. |
| `listKids()` es un store en memoria: un niño agregado se pierde al recargar. | Comportamiento ya existente de SPEC 04; este spec solo lo consume. |
| Los `objectURL` se filtran si no se revocan. | Revocar al quitar la foto y al cerrar el modal, que pasan por `removePhoto` / `resetForm`. |
| Con muchas fotos la fila crece. | `flex flex-wrap gap-3`; no hay tope. Si molesta, se agrega en otro spec. |
| Publicar navega siempre a `/`, aunque el modal se abra desde `/kids`. | Es lo pedido ("volver al feed") y lo que hace el mockup (`feed.dc.html`). |
| El composer con ícono de cámara podría esperarse que abra el picker, no el modal. | Todo el bloque hace lo mismo y está en los criterios de aceptación; el picker vive dentro del modal. |
| `cacheComponents: true` y un client component con `useRouter` dentro del shell server. | No se usan `cookies`, `headers` ni `Date`; no hace falta `<Suspense>`. |

## What is **not** in this spec

- Crear la publicación, modificarla o mostrarla en el feed.
- Persistencia de posts, borradores o fotos; subida a un servidor.
- Filtrar el feed por audiencia o tipo.
- La ruta `/crear-publicacion`.
- Edición, programación, animaciones, bottom sheet, dark mode.

Cada uno, si llega, va en su propio spec.
