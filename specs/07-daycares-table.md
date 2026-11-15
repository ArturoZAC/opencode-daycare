# SPEC 07 — Tabla daycares y patrón de migraciones

> **Status:** Approved
> **Depends on:** — (primer spec de base de datos)
> **Date:** 2026-11-14
> **Objective:** Crear la tabla `daycares` en el proyecto Supabase remoto con el MCP (`apply_migration`), replicando el SQL del plan del profesor (DDL + RLS + policies), sembrando 5 guarderías de ejemplo y versionando cada migración como `.sql` en `supabase/migrations/`.

## Scope

**In:**

- Una única migración `create_daycares_table_and_seed`, versionada en `supabase/migrations/001_create_daycares_table_and_seed.sql` y aplicada con la herramienta `apply_migration` del MCP de Supabase sobre el proyecto `diiwyrzhrufrwuoqrrqd`: `CREATE TABLE` con `id`, `name`, `address`, `created_at`, `updated_at` + `ENABLE ROW LEVEL SECURITY` + las 4 policies del profesor (`daycares_read`, `daycares_insert`, `daycares_update`, `daycares_delete`) + 5 `INSERT` de `name` + `address`, con el `id` generado por el default.
- Verificación del esquema, RLS/policies, filas sembradas, historial de migraciones y advisors post-aplicación.
- Con este spec queda fundado el patrón que heredan los specs de DB futuros: cada migración se versiona en `supabase/migrations/NNN_nombre.sql` y se aplica vía `apply_migration` con el contenido exacto de ese archivo. (Corrección post-implementación, pedido explícito del usuario: spec07 terminó en **un único archivo** con DDL + policies + seed, no dos.)

**Out of scope (for future specs):**

- Las otras 12 tablas del diccionario y sus ENUMs (`users`, `rooms`, `children`, etc.).
- Trigger `AFTER INSERT` en `auth.users`, policies de auth, más seeds.
- Instalar `@supabase/supabase-js`, generar tipos TS o conectar la app a la DB.
- Uso de la CLI de Supabase (`db push` / `db pull`): los archivos versionan el SQL, pero la aplicación sigue siendo vía MCP.

## Data model

La tabla aterriza en `public` (search_path default de Supabase); se usa el SQL del profesor sin prefijo. Un único archivo `001_create_daycares_table_and_seed.sql` (corregido tras la implementación: antes eran dos migraciones), con el SQL del plan del curso. DDL + RLS + policies:

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

Seed, en el mismo archivo. No se insertan ids: los genera el default `gen_random_uuid()`:

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

Cada paso deja el proyecto funcional. El repo suma exactamente un archivo: la migración `.sql` (DDL + policies + seed juntos).

1. **Pre-chequeo** — `execute_sql`: `select 1 from information_schema.tables where table_schema = 'public' and table_name = 'daycares'`. Si devuelve fila, abortar y reportar (alguien creó la tabla fuera de banda).
2. **Migración** — crear `supabase/migrations/001_create_daycares_table_and_seed.sql` con el SQL completo del Data model (tabla + RLS + 4 policies + 5 `INSERT`) y aplicarlo vía `apply_migration` con el contenido exacto del archivo. *(Aplicado originalmente como dos migraciones —`create_daycares_table` + `seed_daycares`— por la versión previa del plan; el historial remoto conserva ambas.)*
3. **Verificar esquema** — `execute_sql` sobre `information_schema.columns`: 5 columnas con tipos, defaults y nullabilidad exactos; PK en `id`.
4. **Verificar RLS y policies** — `execute_sql` sobre `pg_policies`: `relrowsecurity` true y exactamente 4 policies llamadas `daycares_read` (SELECT, `USING (true)`), `daycares_insert` (INSERT, `WITH CHECK (false)`), `daycares_update` (UPDATE) y `daycares_delete` (DELETE).
5. **Verificar seed** — `select count(*) from daycares` = 5 y que exista una fila con `name = 'Guardería Sala Soles'`, todas con `id` generado por el default.
6. **Verificar historial** — `list_migrations` muestra las migraciones aplicadas en orden.
7. **Advisors** — `get_advisors`: ninguna crítica nueva atribuible a `daycares` más allá de lo esperado.

## Acceptance criteria

- [x] `public.daycares` existe en el proyecto `diiwyrzhrufrwuoqrrqd`.
- [x] `id` es `uuid` PK con default `gen_random_uuid()`.
- [x] `name` es `text NOT NULL`; `address` es `text` nullable.
- [x] `created_at` y `updated_at` son `timestamptz NOT NULL` con default `now()`.
- [x] RLS está activado en `daycares`.
- [x] Existen exactamente 4 policies con los nombres y expresiones de la migración.
- [x] `daycares` tiene 5 filas; una es "Guardería Sala Soles" y todas tienen `id` generado por `gen_random_uuid()`.
- [x] `list_migrations` incluye las migraciones de `daycares` aplicadas.
- [x] `supabase/migrations/001_create_daycares_table_and_seed.sql` existe en el repo (único archivo) con el SQL exacto aplicado al proyecto.
- [x] El repo no tiene otros cambios: `app/`, `src/` y `package.json` quedan intactos.
- [x] `/`, `/kids` y `/login` se renderizan igual que antes (la app mock no lee la DB).

## Decisions

- **Sí:** un solo archivo `.sql` en el repo, DDL + policies + seed juntos, con su migración propia. Instrucción explícita del usuario tras la implementación (reemplaza las dos migraciones separadas del plan original; el historial remoto conserva `create_daycares_table` + `seed_daycares`).
- **Sí:** replicar el SQL del plan del profesor literal, incluyendo `address`, `updated_at` en `daycares` y las 4 policies. Reemplaza la decisión previa de "RLS sin policies". Instrucción explícita del usuario.
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
