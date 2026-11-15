# SPEC 10 — Tablas rooms/children y niños reales

> **Status:** Implemented
> **Depends on:** SPEC 02, SPEC 04, SPEC 08, SPEC 09
> **Date:** 2026-11-15
> **Objective:** Crear `rooms` y `children` (con el ENUM `child_status` y la columna `slug`) en el proyecto Supabase con sus policies y el seed de las 4 salas, y conectar `/kids`, el modal "Agregar niño" y `/kids/[slug]` a esos datos reales, eliminando los mocks.

## Scope

**In:**

- Migración `supabase/migrations/003_create_rooms_and_children.sql`: `CREATE TYPE child_status`, `rooms`, `children`, RLS + 4 policies por tabla, índices de las FKs y seed de las 4 salas de "Guardería Sala Soles".
- `src/modules/kids/queries.ts` (server): `listSections()`, `getChildBySlug(slug)` y el mapeo fila DB → `Child`, con la misma forma que ya consumen `KidCard` y `KidProfile`.
- `src/modules/kids/actions.ts` (`'use server'`): `createChild(input)` inserta con el JWT del staff y hace `revalidatePath("/kids")`.
- `app/kids/page.tsx`: `export const instant = false`, lee salas + niños de la DB y se los pasa a `KidsDirectory`.
- `src/modules/kids/KidsDirectory.tsx`: recibe `sections` en vez de `KIDS`/`listKids`, mantiene el buscador con debounce y agrupa la grilla por sala con un header por sala.
- `src/modules/kids/AddChildDialog.tsx`: el select SALA sale de `rooms`, y al guardar llama al server action en vez del store en memoria.
- `app/kids/[slug]/page.tsx`: resuelve el niño por `slug` en la DB; pierde `generateStaticParams`.
- Borrar `src/modules/kids/kidsStore.ts` y `src/modules/kids/LocalKidProfile.tsx`; quitar `KIDS` y `getKid` de `kids.ts`.
- Helpers nuevos en `kids.ts`: `kidColorFromSlug` y `monthYearFromIso`.

**Out of scope (for future specs):**

- `parent_children` e `invitations`: la card PADRES VINCULADOS sigue con `parents: []` y `<LinkParentDialog>` queda **intacto** (valida y cierra, no escribe en DB).
- Editar o archivar niños, `child_status = archived` en UI, `photo_consent` en el formulario.
- Lectura de niños para usuarios de rol `parent` (llega con `parent_children`).
- Agrupar por sala con colapsables, orden configurable o paginación.

## Data model

### SQL completo de la migración

```sql
CREATE TYPE child_status AS ENUM ('active', 'archived');

CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id uuid NOT NULL REFERENCES daycares(id),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id),
  slug text NOT NULL UNIQUE,
  full_name text NOT NULL,
  birth_date date NOT NULL,
  enrolled_at date NOT NULL DEFAULT current_date,
  medical_notes text,
  allergy_tags text[] NOT NULL DEFAULT '{}',
  photo_consent boolean NOT NULL DEFAULT true,
  status child_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX rooms_daycare_id_idx ON rooms(daycare_id);
CREATE INDEX children_room_id_idx ON children(room_id);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Las policies subconsultan `users`, cuya RLS deja leer solo la fila propia.
CREATE POLICY "rooms_read" ON rooms FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
      AND u.daycare_id = rooms.daycare_id
      AND u.role IN ('staff', 'admin')
  ));

CREATE POLICY "rooms_insert" ON rooms FOR INSERT WITH CHECK (false);
CREATE POLICY "rooms_update" ON rooms FOR UPDATE USING (false);
CREATE POLICY "rooms_delete" ON rooms FOR DELETE USING (false);

CREATE POLICY "children_read" ON children FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rooms r
    JOIN users u ON u.daycare_id = r.daycare_id
    WHERE r.id = children.room_id
      AND u.id = auth.uid()
      AND u.role IN ('staff', 'admin')
  ));

CREATE POLICY "children_insert" ON children FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM rooms r
    JOIN users u ON u.daycare_id = r.daycare_id
    WHERE r.id = children.room_id
      AND u.id = auth.uid()
      AND u.role IN ('staff', 'admin')
  ));

CREATE POLICY "children_update" ON children FOR UPDATE USING (false);
CREATE POLICY "children_delete" ON children FOR DELETE USING (false);

INSERT INTO rooms (daycare_id, name)
SELECT d.id, room.name
FROM daycares d
CROSS JOIN (VALUES ('Soles'), ('Lunas'), ('Estrellas'), ('Arcoíris')) AS room(name)
WHERE d.name = 'Guardería Sala Soles';
```

Notas del modelo:

- `children` extiende el diccionario con `slug` (decisión del usuario) para conservar URLs legibles en `/kids/[slug]`.
- `allergy_tags` guarda el texto tal como se escribe en el formulario (`{Maní,Lactosa}`); la UI lo muestra en mayúsculas. El diccionario pide inglés, pero el input es texto libre.
- `enrolled_at` toma `current_date` al insertar: el formulario no pregunta la fecha de ingreso.
- `photo_consent` y `status` existen con sus defaults del diccionario, pero no se editan desde la UI.
- La migración siembra solo las 4 salas; `children` queda vacía.

### Mapeo DB → `Child` (`src/modules/kids/kids.ts`)

`Child`, `Parent`, `CHILD_COLOR_STYLES` y `CHILD_COLOR_ORDER` quedan igual. Cambia solo el origen de los valores:

| campo `Child` | origen |
| --- | --- |
| `slug` | `children.slug` |
| `name` | `children.full_name` |
| `initial` | primer carácter de `full_name`, en mayúscula |
| `color` | `kidColorFromSlug(slug)`: suma de `charCodeAt` `% CHILD_COLOR_ORDER.length` |
| `ageYears` | `ageFromIso(birth_date, new Date())` |
| `birthDate` | `formatBirthDate(birth_date)` |
| `room` | `rooms.name` del join |
| `joinedAt` | `monthYearFromIso(enrolled_at)` |
| `allergyTags` | `children.allergy_tags` tal cual; la UI las muestra en mayúsculas |
| `allergyNote` | `children.medical_notes` |
| `parents` | `[]` hasta que exista `parent_children` |

### Superficies nuevas

```ts
// src/modules/kids/queries.ts
export type KidSection = { id: string; name: string; kids: Child[] };

export async function listSections(): Promise<KidSection[]>; // salas por created_at, niños por full_name
export async function getChildBySlug(slug: string): Promise<Child | null>;

// src/modules/kids/actions.ts
export type CreateChildInput = {
  fullName: string;
  birthDate: string; // ISO yyyy-mm-dd
  roomName: string;
  allergyTags: string[];
  medicalNotes: string;
};

export async function createChild(
  input: CreateChildInput,
): Promise<{ ok: true } | { ok: false; message: string }>;

// src/modules/kids/kids.ts
export function kidColorFromSlug(slug: string): ChildColor;
export function monthYearFromIso(iso: string): string;
```

Reglas del action:

- **Sala:** resuelve `room_id` con `rooms.name = roomName` filtrado por el `daycare_id` del usuario autenticado (`users.id = auth.uid()`). Si no la encuentra, devuelve `{ ok: false, message: "No pudimos guardar el niño. Intentá de nuevo." }`.
- **Slug:** `slugify(fullName)`; si el insert falla con `23505` (unique violation), reintenta `base-2`, `base-3`… hasta `base-5`. Si los 5 fallan, devuelve el mismo mensaje genérico.
- **Validación server-side:** nombre vacío o `birthDate` que no matchea `yyyy-mm-dd`/es futura → `{ ok: false, message: "Revisá los datos del niño." }`. No duplica los mensajes por campo del cliente.
- **Éxito:** inserta, `revalidatePath("/kids")`, devuelve `{ ok: true }`.

Ambos lectores arrancan con `await connection()` para forzar render por request y que `new Date()` no reviente el prerender.

## Implementation plan

Cada paso deja la app funcionando en `pnpm dev` (http://localhost:3000).

1. **Migración** — pre-chequeo vía `execute_sql`: `rooms`, `children` y `child_status` no existen; existe `daycares.name = 'Guardería Sala Soles'`. Crear `supabase/migrations/003_create_rooms_and_children.sql` con el SQL del Data model y aplicarlo con `apply_migration` (nombre `create_rooms_and_children`) usando el contenido exacto del archivo. Verificar en `information_schema`/`pg_policies`: 2 tablas con sus columnas, `children.slug` UNIQUE, 4 policies por tabla, `rooms` con exactamente 4 filas de Sala Soles y `children` con 0 filas. La app no cambia.
2. **`queries.ts`** — `await connection()`, `listSections()` (`rooms` con `children(...)` embebido y `rooms(name)` en cada niño), `getChildBySlug(slug)`, `toChild()`/`buildSections()`, y `kidColorFromSlug`/`monthYearFromIso` en `kids.ts`. Verificar: archivo sin consumidores, app idéntica.
3. **`/kids` + modal contra la DB** — `app/kids/page.tsx` gana `export const instant = false`, llama `listSections()` y renderiza `<KidsDirectory sections={sections} />`. `KidsDirectory` filtra dentro de cada sección y renderiza un bloque por sala con header `SALA <NOMBRE>` + conteo; sin niños en ninguna sala muestra "Todavía no hay niños. Agregá el primero."; con filtro sin coincidencias, "No encontramos niños con ese nombre.". `AddChildDialog` recibe `rooms: string[]` (nombres de las salas), deja de importar `kidsStore`, valida en cliente y llama `createChild(input)` dentro de un `useTransition`: con `{ ok: true }` cierra y resetea; con `{ ok: false }` muestra `message` arriba del CTA y no cierra. Verificar: `/kids` muestra el vacío nuevo, agregar "Martina López / 12/03/2022 / Soles" cierra el modal y la card aparece bajo SALA SOLES con "1 niño"; un F5 la conserva.
4. **Perfil real** — `app/kids/[slug]/page.tsx`: quitar `generateStaticParams`, mantener `instant = false`, `getChildBySlug(slug)` → `notFound()` si no existe, y `generateMetadata` con el mismo fetch. `KidProfile` no se toca (ya tolera `parents: []`). Verificar: `/kids/martina-lopez` muestra nombre, edad, `12 mar 2022`, Sala Soles, ingreso del mes y la card de padres vacía con "Vincular otro padre" abriendo su modal.
5. **Limpieza y verificación final** — borrar `kidsStore.ts` y `LocalKidProfile.tsx`, quitar `KIDS` y `getKid` de `kids.ts` y confirmar con grep que nadie importa lo borrado. Verificar: `/kids/mateo-fernandez` responde 404 real, flujo completo (agregar → card → perfil → F5), segunda "Martina López" con slug `martina-lopez-2`, y capturas a 390/768/1440 px sin scroll horizontal.

## Acceptance criteria

- [x] `public.rooms` y `public.children` existen; el ENUM `child_status` tiene `active` y `archived`.
- [x] `children` tiene las 12 columnas del Data model con tipos, defaults y nullabilidad exactos; `slug` es `text NOT NULL UNIQUE`.
- [x] RLS está activo en ambas tablas con exactamente 4 policies cada una: `rooms_read`/`children_read`/`children_insert` con el chequeo staff+guardería, y `rooms_insert`/`rooms_update`/`rooms_delete`/`children_update`/`children_delete` en `false`.
- [x] `rooms` tiene exactamente 4 filas (Soles, Lunas, Estrellas, Arcoíris) de "Guardería Sala Soles"; `children` tiene 0 filas.
- [x] `supabase/migrations/003_create_rooms_and_children.sql` existe, coincide con lo aplicado y `list_migrations` lo registra.
- [x] `/kids` sin niños reales muestra "Todavía no hay niños. Agregá el primero." y no aparece ningún niño del mock.
- [x] El select SALA del modal lista Soles, Lunas, Estrellas y Arcoíris leídas de `rooms`.
- [x] Guardar "Martina López / 12/03/2022 / Soles" cierra el modal y la card aparece bajo SALA SOLES con "1 niño".
- [x] F5 en `/kids` conserva a Martina: el dato vive en la DB, no en memoria.
- [x] Una segunda "Martina López" crea el slug `martina-lopez-2` y las dos cards conviven.
- [x] Un niño agregado en Lunas aparece bajo SALA LUNAS y no bajo Soles.
- [x] `/kids/martina-lopez` muestra nombre, "0 años · Sala Soles", `12 mar 2022`, Sala Soles, ingreso del mes actual y las alergias en mayúsculas.
- [x] La card PADRES VINCULADOS muestra su estado vacío y "Vincular otro padre" abre el modal de SPEC 05 sin escribir en la DB.
- [x] `/kids/mateo-fernandez` responde 404 (el mock ya no existe).
- [x] El buscador sigue filtrando ~250 ms después de la última tecla y oculta las salas sin coincidencias.
- [x] Guardar con nombre vacío o fecha inválida no llama al action y muestra los mismos mensajes de SPEC 04.
- [x] `package.json` y `app/globals.css` no cambian; `KidCard`, `KidProfile`, `LinkParentDialog`, `DateField` y `SelectField` no se editan.
- [x] `/`, `/login` y el sidebar se ven igual que antes.

## Decisions

- **Sí:** columna `slug` en `children` (decisión del usuario) para conservar URLs legibles; se genera en el action y se protege con UNIQUE + reintento con sufijo.
- **Sí:** solo `rooms` + `children` + `child_status` (decisión del usuario). `parent_children` e `invitations` van al spec de invitaciones; mientras tanto `parents` se mapea a `[]`.
- **Sí:** seed solo de las 4 salas (decisión del usuario). `/kids` arranca vacío y los 8 perfiles mock dejan de existir.
- **Sí:** RLS solo para `staff`/`admin` de la propia guardería. Es lo que impide que un futuro usuario `parent` liste o cree niños por API; la lectura acotada a sus hijos llega con `parent_children`.
- **Sí:** `allergy_tags` guarda el texto tal como se escribe (decisión del usuario) y la UI lo muestra en mayúsculas. Se normaliza cuando exista un catálogo de alergias.
- **Sí:** server action + `revalidatePath("/kids")` en vez del store en memoria: el alta sobrevive al reload y la grilla se re-renderiza con el niño nuevo.
- **Sí:** el select manda el nombre de la sala y el action resuelve el `room_id`. Evita cambiar la firma de `SelectField` (`options: string[]`) por un cambio de tipos.
- **Sí:** `instant = false` en `/kids`. Es el patrón ya usado en `/kids/[slug]`; la página lee `cookies()` y con `cacheComponents` eso apagaría la validación de instant-navigation sin inventar un skeleton nuevo.
- **Sí:** `Child` conserva su forma y el mapeo ocurre en `queries.ts`. `KidCard`/`KidProfile`/`LinkParentDialog` no se tocan: el diff queda en datos.
- **Sí:** color del avatar derivado del slug, no una columna. No es un dato del dominio.
- **Sí:** índices en `rooms(daycare_id)` y `children(room_id)`. Las FKs sin índice salen en `get_advisors` y cuestan una línea.
- **No:** borrar/editar niños, `archived` en UI, `photo_consent` en el formulario.
- **No:** tocar `LinkParentDialog` ni crear `invitations`: ese flujo es otro spec.

## Risks

| Risk | Mitigation |
| --- | --- |
| Borrar los mocks deja `/kids` vacío y los 8 perfiles en 404: parece una regresión. | Es el alcance elegido (seed solo de salas); el criterio lo deja explícito y el vacío tiene copy propio. |
| La policy de `children_read` subconsulta `rooms`, que aplica su propia RLS. | Ambas exigen staff de la misma guardería, así que el anidado es consistente; se valida con el JWT real del staff (lectura y alta por la app). |
| El MCP corre con rol privilegiado: no prueba que RLS bloquee. | Policies verificadas en `pg_policies` + prueba real por la app con la sesión del staff; probar con un token `parent` cuando exista ese usuario. |
| `birth_date`/`enrolled_at` son `date` y `enrolled_at` usa `current_date` (UTC): un alta a las 23:50 local cae en el día siguiente. | Solo afecta el mes mostrado en "Ingreso"; la fecha de nacimiento viene del formulario y no pasa por zona horaria. |
| Colisión de slug en dos altas simultáneas con el mismo nombre. | UNIQUE en la DB + reintento con sufijo; si los 5 intentos fallan, el action devuelve mensaje y no se cierra el modal. |
| El action inserta sin verificar que la sala sea de la guardería. | La policy `children_insert` ya lo bloquea; además el lookup previo por nombre + `daycare_id` devuelve error antes del insert. |
| `cacheComponents` puede marcar `blocking-route` en `/kids` pese a `instant = false`. | Es el mismo patrón de `/kids/[slug]`; si el overlay insiste, se envuelve la sección de datos en `<Suspense>` con un skeleton de grilla. |

## What is **not** in this spec

- `parent_children`, `invitations` y el alta real de invitaciones.
- Editar, archivar o dar de baja niños; consentimiento de fotos.
- Lectura de niños para padres y permisos por rol en la UI.
- Agrupación colapsable por sala, orden configurable, paginación, filtros por sala o alergia.
- Dark mode.

Cada uno, si llega, va en su propio spec.
