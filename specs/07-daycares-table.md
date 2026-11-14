# SPEC 07 — Tabla daycares y patrón de migraciones

> **Status:** Approved
> **Depends on:** — (primer spec de base de datos)
> **Date:** 2026-11-14
> **Objective:** Crear la tabla `daycares` en el proyecto Supabase remoto con el MCP (`apply_migration`), replicando el SQL del plan del profesor (DDL + RLS + policies), sembrando 5 guarderías de ejemplo y versionando cada migración como `.sql` en `supabase/migrations/`.

## Scope

**In:**

- Migración `create_daycares_table` aplicada con la herramienta `apply_migration` del MCP de Supabase sobre el proyecto `diiwyrzhrufrwuoqrrqd`: `CREATE TABLE` con `id`, `name`, `address`, `created_at`, `updated_at` + `ENABLE ROW LEVEL SECURITY` + las 4 policies del profesor (`daycares_read`, `daycares_insert`, `daycares_update`, `daycares_delete`).
- Migración `seed_daycares`: 5 `INSERT` de `name` + `address`, con el `id` generado por el default.
- Verificación del esquema, RLS/policies, filas sembradas, historial de migraciones y advisors post-aplicación.
- Con este spec queda fundado el patrón que heredan los specs de DB futuros: cada migración se versiona en `supabase/migrations/NNN_nombre.sql` (numeración del curso) y se aplica vía `apply_migration` con el contenido exacto de ese archivo.

**Out of scope (for future specs):**

- Las otras 12 tablas del diccionario y sus ENUMs (`users`, `rooms`, `children`, etc.).
- Trigger `AFTER INSERT` en `auth.users`, policies de auth, más seeds.
- Instalar `@supabase/supabase-js`, generar tipos TS o conectar la app a la DB.
- Uso de la CLI de Supabase (`db push` / `db pull`): los archivos versionan el SQL, pero la aplicación sigue siendo vía MCP.

## Data model

La tabla aterriza en `public` (search_path default de Supabase); se usa el SQL del profesor sin prefijo. Migración 1, `create_daycares_table` (copiado del plan del curso):

```sql
CREATE TABLE daycares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE daycares ENABLE ROW LEVEL SECURITY;

-- Política de lectura: cualquiera puede leer
CREATE POLICY "daycares_read" ON daycares
  FOR SELECT
  USING (true);

-- Políticas de escritura: restringidas
CREATE POLICY "daycares_insert" ON daycares
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "daycares_update" ON daycares
  FOR UPDATE
  USING (false);

CREATE POLICY "daycares_delete" ON daycares
  FOR DELETE
  USING (false);
```

Migración 2, `seed_daycares`. No se insertan ids: los genera el default `gen_random_uuid()`:

```sql
INSERT INTO daycares (name, address) VALUES
  ('Guardería Sala Soles', 'Av. del Sol 1234'),
  ('Guardería Pequeños Astros', 'Calle Luna 512'),
  ('Guardería Arcoíris', 'Av. Rivera 980'),
  ('Guardería Lunita', 'Pasaje Verde 45'),
  ('Guardería Nubecita', 'Calle Real 2200');
```

`address` es `text` nullable (sin `not null`). La guardería de la UI mock ("Guardería Sala Soles", `LoginBrandPanel.tsx`) es la primera fila; los seeds futuros (`rooms`, `users`) la referencian subqueryando por `name`, no por un id fijo.

## Implementation plan

Cada paso deja el proyecto funcional. El repo suma exactamente dos archivos: las migraciones `.sql`.

1. **Pre-chequeo** — `execute_sql`: `select 1 from information_schema.tables where table_schema = 'public' and table_name = 'daycares'`. Si devuelve fila, abortar y reportar (alguien creó la tabla fuera de banda).
2. **Migración 1** — crear `supabase/migrations/001_create_daycares_table.sql` con el SQL completo de la migración 1 del Data model (tabla + RLS + 4 policies) y aplicarlo vía `apply_migration` con `name: "create_daycares_table"` y el contenido exacto del archivo.
3. **Verificar esquema** — `execute_sql` sobre `information_schema.columns`: 5 columnas con tipos, defaults y nullabilidad exactos; PK en `id`.
4. **Verificar RLS y policies** — `execute_sql` sobre `pg_policies`: `relrowsecurity` true y exactamente 4 policies llamadas `daycares_read` (SELECT, `USING (true)`), `daycares_insert` (INSERT, `WITH CHECK (false)`), `daycares_update` (UPDATE) y `daycares_delete` (DELETE).
5. **Migración 2** — crear `supabase/migrations/002_seed_daycares.sql` con los 5 `INSERT` y aplicarlo vía `apply_migration` con `name: "seed_daycares"`. Verificar `select count(*) from daycares` = 5 y que exista una fila con `name = 'Guardería Sala Soles'`.
6. **Verificar historial** — `list_migrations` muestra `create_daycares_table` y `seed_daycares` en ese orden.
7. **Advisors** — `get_advisors`: ninguna crítica nueva atribuible a `daycares` más allá de lo esperado.

## Acceptance criteria

- [ ] `public.daycares` existe en el proyecto `diiwyrzhrufrwuoqrrqd`.
- [ ] `id` es `uuid` PK con default `gen_random_uuid()`.
- [ ] `name` es `text NOT NULL`; `address` es `text` nullable.
- [ ] `created_at` y `updated_at` son `timestamptz NOT NULL` con default `now()`.
- [ ] RLS está activado en `daycares`.
- [ ] Existen exactamente 4 policies con los nombres y expresiones de la Migración 1.
- [ ] `daycares` tiene 5 filas; una es "Guardería Sala Soles" y todas tienen `id` generado por `gen_random_uuid()`.
- [ ] `list_migrations` incluye `create_daycares_table` y `seed_daycares`.
- [ ] `supabase/migrations/001_create_daycares_table.sql` y `002_seed_daycares.sql` existen en el repo con el SQL exacto aplicado al proyecto.
- [ ] El repo no tiene otros cambios: `app/`, `src/` y `package.json` quedan intactos.
- [ ] `/`, `/kids` y `/login` se renderizan igual que antes (la app mock no lee la DB).

## Decisions

- **Sí:** replicar el SQL del plan del profesor (`001_create_daycares_table.sql`) literal, incluyendo `address`, `updated_at` en `daycares` y las 4 policies. Reemplaza la decisión previa de "RLS sin policies". Instrucción explícita del usuario.
- **Sí:** `apply_migration` vía MCP como patrón de aplicación, con nombres alineados a los archivos del curso (`create_daycares_table`, `seed_daycares`).
- **Sí:** cada migración se versiona en `supabase/migrations/NNN_nombre.sql` con la numeración del profesor (`001_`, `002_`, …) y el mismo contenido que se aplica. El repo es la fuente de verdad del esquema; el historial del proyecto es el registro de qué se aplicó. Instrucción explícita del usuario.
- **Sí:** 5 registros seed en su propia migración. Pedido explícito del usuario. Nombres: "Guardería Sala Soles" (el de la UI) + 4 inventados; intercambiables antes de aprobar.
- **No:** ids uuid literales en el seed. Instrucción explícita del usuario: el `id` lo genera el default `gen_random_uuid()`; los seeds de `rooms`/`users` buscan la guardería por `name`.
- **No:** prefijo `public.` en el SQL: se usa la forma exacta del profesor; el search_path de Supabase la crea en `public`.
- **No:** CLI de Supabase para aplicar. Si algún día se usa `db push`, el historial se puede reconstruir desde `supabase/migrations/`.
- **No:** `WITH CHECK (false)` explícito en update/delete, como el profesor: con `USING (false)` basta, el WITH CHECK default es el mismo.
- **No:** ENUMs en este spec: `daycares` no usa ninguno.
- **No:** seed de salas, niños o usuarios: va con sus tablas en specs futuros.

## Risks

| Risk | Mitigation |
| --- | --- |
| `daycares_read USING (true)` deja nombre y dirección legibles por la API con solo la anon key. | Es el patrón del curso y datos no sensibles (entidad raíz pública); las tablas sensibles (`users`, `children`) llevan policies restrictivas cuando existan. |
| El archivo `.sql` del repo y la migración aplicada pueden divergir. | El paso 2 y el paso 5 aplican el contenido exacto del archivo en el mismo paso; `list_migrations` y los criterios de aceptación cierran la deriva. |
| El diccionario (`references/docs/opendaycare-database-schema.md`) diverge del SQL del profesor (agrega `address`, `updated_at`, policies). | Gana el patrón del curso; el diccionario es la abstracción. Actualizarlo, si se quiere, en otro spec. |
| MCP corre con rol privilegiado: no verifica el comportamiento real de las policies por API. | Se comprueba en el primer spec que conecte la app: anon puede SELECT y no puede INSERT. |
| Alguien crea tablas sueltas en el dashboard fuera del patrón. | Pre-chequeo del paso 1; `list_migrations` es el control de deriva. |

## What is **not** in this spec

- `users`, `rooms`, `children` y el resto de las tablas del diccionario.
- Trigger de `auth.users`, invitations, más seeds.
- Cliente Supabase en la app, keys, tipos generados.
- Aplicar migraciones con la CLI (`db push`): los `.sql` se versionan pero se aplican por MCP.

Cada uno, si llega, va en su propio spec.
