# SPEC 05 — Modal Vincular padre

> **Status:** Approved
> **Depends on:** SPEC 02, SPEC 04
> **Date:** 2026-11-08
> **Objective:** Convertir la fila "Vincular otro padre" del perfil del niño en un `<dialog>` con el formulario de `references/pantallas/vincular-padre.dc.html`, que valida nombre y email y se cierra sin enviar nada.

## Scope

**In:**

- `src/modules/kids/LinkParentDialog.tsx` (client): fila disparadora "Vincular otro padre" + `<dialog>` nativo con `showModal()`, header (título, subtítulo, X), banner informativo, nombre, email, parentesco, bloque de código y CTA "Enviar invitación".
- Validación de nombre y email con mensajes en español; con datos válidos el modal cierra.
- `CloseIcon`, `InfoIcon` y `SendIcon` nuevos en `src/components/Icons.tsx`.
- `src/modules/kids/KidProfile.tsx`: la fila `<div className="flex items-center gap-3 pt-0.5">…</div>` se reemplaza por `<LinkParentDialog childName={child.name} />`. `KidProfile` sigue siendo Server Component.
- Responsive propio del modal siguiendo el de `AddChildDialog` (ancho `calc(100%-2rem)`, `max-w-[480px]`, `max-h-[85dvh]` con scroll interno).

**Out of scope (for future specs):**

- Agregar el padre a `PADRES VINCULADOS`, cambiar `kidsStore`, persistencia, envío real de correo, API, server actions.
- Abrir el modal desde la pill `VINCULAR` de las cards de `/kids`.
- Estado de éxito o confirmación, animaciones de apertura, bottom sheet en mobile.
- Cambiar el código fijo o hacerlo aleatorio, links reales, `/resumen-dia`.

## Data model

Esta feature no introduce estructuras nuevas ni toca `kids.ts` / `kidsStore.ts`. El formulario vive en `useState` dentro de `LinkParentDialog` y no se persiste.

Valores fijos que se verifican:

| Dato | Valor |
| --- | --- |
| Título | `Vincular padre` |
| Subtítulo | `a {child.name}` (nombre completo) |
| Banner | `Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {primerNombre}.` |
| Código | `7K4P9` |
| Vencimiento | `Vence en 7 días` |
| Parentesco inicial | `Mamá` |
| Opciones | `Mamá`, `Papá`, `Tutor/a` |
| Placeholder nombre | `Ej. Diego Fernández` |
| Placeholder email | `correo@ejemplo.com` |
| CTA | `Enviar invitación` |

`primerNombre = child.name.split(" ")[0]`.

Errores:

| Caso | Mensaje |
| --- | --- |
| nombre vacío | `Ingresá el nombre del padre o la madre.` |
| email vacío | `Ingresá el email.` |
| email inválido (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) | `Ingresá un email válido.` |

## Implementation plan

Cada paso deja la app funcionando en `pnpm dev` (http://localhost:3000).

1. **`src/components/Icons.tsx`** — agregar `CloseIcon` (`size = 18`, stroke 2.2, `M18 6 6 18M6 6l12 12`), `InfoIcon` (`size = 20`, stroke 2, `<circle cx="12" cy="12" r="10"/>` + `M12 16v-4M12 8h.01`) y `SendIcon` (`size = 19`, stroke 2, `m22 2-7 20-4-9-9-4z` + `M22 2 11 13`), con el patrón `IconProps` existente. Verificar: ningún SVG previo cambia y el feed se ve igual.
2. **`LinkParentDialog.tsx`** — client component que recibe `{ childName: string }`. Devuelve un fragmento con:
   - **Disparador**: `<button type="button" onClick={() => dialogRef.current?.showModal()} aria-haspopup="dialog">` con las clases actuales de la fila (`flex w-full cursor-pointer items-center gap-3 pt-0.5 text-left`, círculo `h-10 w-10` con borde punteado `#D8CBBA` y `PlusIcon`, texto `text-[14.5px] font-extrabold text-coral-deep`). Visualmente idéntico a hoy.
   - **Dialog**: `m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-[480px] overflow-y-auto rounded-[24px] border border-line bg-[#FBF4EC] p-0 backdrop:bg-[rgba(63,54,46,.35)]`, `aria-labelledby="link-parent-title"`, `onClose={resetForm}`.
   - Header `border-b border-line px-[26px] py-5`: título 18px `font-display` semibold + subtítulo 13px `text-muted-2`; botón X `h-[34px] w-[34px] rounded-[10px] bg-[#F0E6D8] text-muted` que cierra.
   - Cuerpo `px-[26px] py-[22px]` con `<form noValidate>`: banner azul (`bg-[#E3ECFB]`, texto `#3F5694` 13.5px, `InfoIcon` `#4E72C8`), `Field` nombre, `Field` email (`type="email"`), fieldset PARENTESCO, bloque de código y CTA.
   - Parentesco con radios nativos: `<fieldset>` + `<legend>` y tres `<label>` con `<input type="radio" name="relation" className="peer sr-only">`; el `<span>` usa `peer-checked:border-[#9FB8EC] peer-checked:bg-[#CCD8F4] peer-checked:text-[#4E72C8]` y `peer-focus-visible:ring-2`.
   - Código: `rounded-2xl border-[1.5px] border-dashed border-[#E6D08A] bg-[#FBF1D6] p-[18px] text-center`, código en `font-display text-[34px] tracking-[7px] text-[#8A7234]`.
   - CTA `<button type="submit">` con el degradado y `shadow-cta`.
   Verificar: abrir, cerrar con X y con Esc; el foco queda atrapado en el modal.
3. **Validación** — `handleSubmit` con `preventDefault()`, arma los errores, los setea y enfoca el primer campo inválido con refs (igual que `AddChildDialog`). Un `useEffect` limpia el error de cada campo cuando su valor se vuelve válido. Si todo pasa, `dialogRef.current?.close()`; no se agrega ningún padre. Verificar: vacío, email `correo` y email válido.
4. **`KidProfile.tsx`** — importar `LinkParentDialog` y reemplazar el bloque de la fila por `<LinkParentDialog childName={child.name} />`, conservando el `gap-3.5` del contenedor. Verificar: los 8 perfiles renderizan y la fila se ve igual.
5. **Pasada responsive** — a 390 px el modal scrollea por dentro, los tres chips entran en una fila y no hay scroll horizontal. Verificar con Playwright a 390, 768 y 1440 px.

## Acceptance criteria

- [ ] La fila "Vincular otro padre" es un botón y abre el modal en `/kids/mateo-fernandez`.
- [ ] La fila se ve idéntica a antes de convertirla en botón.
- [ ] El modal es un `<dialog>` con backdrop `rgba(63,54,46,.35)` y se cierra con la X y con Esc.
- [ ] El header muestra "Vincular padre" y "a Mateo Fernández".
- [ ] El banner azul muestra el copy completo y termina en "Solo verá el feed de Mateo."
- [ ] En el perfil de Valentina el banner dice "Solo verá el feed de Valentina."
- [ ] Nombre y email usan `Field` con `type="email"` en email y los placeholders del mockup.
- [ ] Click en "NOMBRE DEL PADRE/MADRE" y en "EMAIL" enfoca su campo.
- [ ] Parentesco arranca en Mamá con el estilo azul del mockup.
- [ ] Papá y Tutor/a se seleccionan con click y con las flechas del teclado.
- [ ] El código es `7K4P9` y debajo dice "Vence en 7 días".
- [ ] Enviar vacío muestra "Ingresá el nombre del padre o la madre." y enfoca el nombre.
- [ ] Email vacío muestra "Ingresá el email."; email `correo` muestra "Ingresá un email válido."
- [ ] Escribir un nombre o email válido limpia su error sin reenviar.
- [ ] Con nombre y email válidos el modal se cierra.
- [ ] Al cerrar, la card "PADRES VINCULADOS" no cambia: no se agrega ningún padre.
- [ ] Cerrar y reabrir resetea campos, parentesco a Mamá y errores.
- [ ] A 390 px el modal no desborda, scrollea por dentro y no hay scroll horizontal.
- [ ] `/`, `/kids`, los 8 perfiles y `/login` se ven igual que antes.
- [ ] `package.json` no suma dependencias y `app/globals.css` no cambia.

## Decisions

- **Sí:** `<dialog>` nativo con `showModal()`. Esc, foco atrapado, backdrop y top layer salen gratis; es el patrón ya usado en SPEC 04.
- **Sí:** el envío es ficticio: valida y cierra, pero no agrega el padre ni envía correo. Decisión explícita del usuario; evita tocar `kidsStore` y la card de padres.
- **Sí:** código fijo `7K4P9`, igual que SPEC 03 con el código de activación. El mockup no pide uno dinámico y un valor aleatorio rompería la fidelidad.
- **Sí:** radios nativos estilizados como pills en vez de `<button aria-pressed>`. Dan semántica, foco y navegación con flechas sin ARIA manual.
- **Sí:** banner con el primer nombre del niño derivado de `child.name`. El mockup está escrito para Mateo; hardcodear "Mateo" rompería los otros 7 perfiles.
- **Sí:** reusar `Field` para nombre y email. Ya existe y trae label, `id` y estilos.
- **Sí:** el disparador y el dialog viven en un único componente cliente. `KidProfile` sigue server; solo este nodo se hidrata.
- **No:** agregar el padre, `addParent` en el store, persistencia, localStorage.
- **No:** abrir el modal desde `/kids`.
- **No:** estado de éxito, animación de apertura, bottom sheet, scroll lock manual.
- **No:** tokens nuevos en `globals.css` ni dependencias.

## Risks

| Risk | Mitigation |
| --- | --- |
| Un CTA que "envía" y no envía nada puede leerse como bug. | Es el mismo criterio de los CTA inertes de SPEC 01/02/03; el spec y el criterio de aceptación lo dejan explícito. |
| El banner dinámico se desvía del copy literal ("Mateo"). | Solo cambia el nombre propio; el resto del texto es idéntico. Se verifica en Mateo y Valentina. |
| El `<dialog>` como hijo del flex de la card podría ocupar espacio. | Cerrado aplica `display: none` del user agent; abierto va al top layer. |
| La validación con regex simple acepta emails raros. | Es un mock sin backend; la regex cubre el caso visible y se endurece cuando exista envío real. |

## What is **not** in this spec

- Alta real de padres, store, persistencia, correo, API.
- Confirmación de envío y cualquier cambio en la card de padres.
- Abrir el modal desde el directorio.
- Animaciones, bottom sheet, dark mode.

Cada uno, si llega, va en su propio spec.
