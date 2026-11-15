# SPEC 08 — Tabla users, ENUMs y staff de prueba

> **Status:** Approved
> **Depends on:** SPEC 07
> **Date:** 2026-11-15
> **Objective:** Crear la tabla `users` con sus ENUMs (`user_role`, `user_status`), el trigger `AFTER INSERT` en `auth.users` y sus policies en el proyecto Supabase remoto, y sembrar un usuario staff real con el que se pueda iniciar sesión.

## Scope

**In:**

- Una única migración versionada en `supabase/migrations/002_create_users_table_and_seed.sql`, aplicada vía `apply_migration` del MCP sobre el proyecto `diiwyrzhrufrwuoqrrqd`, con:
  - `CREATE TYPE user_role AS ENUM ('staff','parent','admin')` y `CREATE TYPE user_status AS ENUM ('pending','active')`.
  - `CREATE TABLE users` según el diccionario (`references/docs/opendaycare-database-schema.md`): `id` PK = FK a `auth.users(id)` ON DELETE CASCADE, `daycare_id` FK a `daycares`, `role`, `status` default `active`, `full_name`, `avatar_url` nullable, `notify_on_post`/`daily_summary_enabled` default `true`, `created_at`/`updated_at`. Sin `email` ni contraseña: viven en `auth.users`.
  - `ENABLE ROW LEVEL SECURITY` + 4 policies: lectura y update solo de la propia fila (`auth.uid() = id`), insert y delete `false`.
  - Función `public.handle_new_user()` (`SECURITY DEFINER`) + trigger `on_auth_user_created` `AFTER INSERT` en `auth.users`: inserta en `public.users` leyendo `daycare_id`, `role` y `full_name` de `raw_user_meta_data`.
  - Seed del staff: `INSERT` en `auth.users` (email `arturoyz2105@gmail.com`, contraseña cifrada con bcrypt, email confirmado, metadata con `daycare_id` resuelto por subquery al `name` `'Guardería Sala Soles'`) + su `auth.identities` (provider `email`). El trigger crea la fila de `public.users` solo.
- Verificación: esquema, ENUMs, RLS/policies, trigger, filas sembradas, login real contra la API de GoTrue, historial de migraciones y advisors.

**Out of scope (for future specs):**

- Las tablas `rooms`, `children`, `parent_children`, `invitations`, `posts` y demás del diccionario, con sus ENUMs (`relationship_type`, `invitation_status`, `post_type`, `child_status`).
- Policies para leer usuarios de la propia daycare (staff viendo colegas); solo existe la lectura de la fila propia.
- `@supabase/supabase-js` en la app, login real en `/login`, middleware, protección de rutas, server actions.
- Borrar el flag `pending` de `user_status` o modelar activaciones: el estado pre-signup vive en `invitations` (spec futuro).
- Índices adicionales, `updated_at` automático, role `admin` semillado.

## Data model

Un único archivo `002_create_users_table_and_seed.sql` con el contenido exacto que se aplica (patrón SPEC 07):

```sql
CREATE TYPE user_role AS ENUM ('staff', 'parent', 'admin');
CREATE TYPE user_status AS ENUM ('pending', 'active');

CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daycare_id uuid NOT NULL REFERENCES daycares(id),
  role user_role NOT NULL,
  status user_status NOT NULL DEFAULT 'active',
  full_name text NOT NULL,
  avatar_url text,
  notify_on_post boolean NOT NULL DEFAULT true,
  daily_summary_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update" ON users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (false);

CREATE POLICY "users_delete" ON users
  FOR DELETE USING (false);

-- La fila de public.users nace de la de auth.users (patrón del diccionario)
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, daycare_id, role, full_name)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'daycare_id')::uuid,
    (NEW.raw_user_meta_data->>'role')::user_role,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed staff: la fila de public.users la crea el trigger de arriba
WITH new_user AS (
  INSERT INTO auth.users (
    id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'arturoyz2105@gmail.com',
    extensions.crypt('@Z@c2004210$', extensions.gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object(
      'full_name', 'Arturo',
      'role', 'staff',
      'daycare_id', (SELECT id FROM daycares WHERE name = 'Guardería Sala Soles')
    ),
    now(), now()
  )
  RETURNING id, email
)
INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data, email,
  last_sign_in_at, created_at, updated_at
)
SELECT
  gen_random_uuid(), id, id::text, 'email',
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  email, now(), now(), now()
FROM new_user;
```

Notas del modelo:

- Los `id` los generan los defaults/CTE: sin literales (decisión heredada de SPEC 07). El seed resuelve la guardería por `name = 'Guardería Sala Soles'` y mete el uuid en la metadata; el trigger solo sabe leer `daycare_id`.
- `full_name` del staff: `Arturo` (a criterio, por delegación del usuario; cambiable antes de aprobar).
- `email_confirmed_at = now()`: entra directo confirmado, sin pasar por el mail de verificación.
- El paso 1 del plan verifica contra `information_schema` que las columnas de `auth.users` / `auth.identities` del proyecto remoto coincidan con este SQL; si GoTrue cambió nombres en esta versión, el seed se ajusta al esquema real y esa corrección se refleja en el archivo `.sql` (el archivo siempre es igual a lo aplicado).

## Implementation plan

Cada paso deja el proyecto funcional. El repo suma exactamente un archivo.

1. **Pre-chequeo** — `execute_sql`: `users` no existe en `public`; no existen los tipos `user_role`/`user_status`; `arturoyz2105@gmail.com` no está en `auth.users`; `crypt`/`pgcrypto` disponible en `pg_extension`; y listar columnas actuales de `auth.users` y `auth.identities` para validar el seed del paso 2. Si algo falla, abortar y reportar.
2. **Migración** — crear `supabase/migrations/002_create_users_table_and_seed.sql` con el SQL del Data model y aplicarlo vía `apply_migration` con el contenido exacto del archivo (nombre de migración `create_users_table_and_seed`).
3. **Verificar ENUMs y esquema** — `pg_enum`: `user_role` = staff,parent,admin y `user_status` = pending,active en orden. `information_schema` + `pg_constraint`: 10 columnas con tipos/defaults/nullabilidad exactos, PK en `id`, FK `id`→`auth.users` con `ON DELETE CASCADE` y FK `daycare_id`→`daycares`.
4. **Verificar RLS, policies y trigger** — `pg_policies`: `relrowsecurity` true y exactamente las 4 policies con sus expresiones. `pg_trigger`: `on_auth_user_created` AFTER INSERT en `auth.users`; `handle_new_user` marcada `SECURITY DEFINER`.
5. **Verificar seed end-to-end** — `auth.users` tiene la fila con email `arturoyz2105@gmail.com`, `email_confirmed_at` no nulo y `encrypted_password` con prefijo bcrypt; su `auth.identities` con provider `email`; y `public.users` tiene la fila creada por el trigger con el mismo `id`, `role='staff'`, `status='active'`, `full_name='Arturo'`, `daycare_id` = id de "Guardería Sala Soles".
6. **Verificar login** — `POST https://diiwyrzhrufrwuoqrrqd.supabase.co/auth/v1/token?grant_type=password` con la anon key del proyecto (obtenida por el MCP) y el email/contraseña del seed → 200 con `access_token`.
7. **Verificar historial y advisors** — `list_migrations` incluye la nueva en orden; `get_advisors`: ninguna crítica nueva atribuible a `users` más allá de lo esperado.

## Acceptance criteria

- [ ] `user_role` existe con valores `staff`, `parent`, `admin` en orden; `user_status` con `pending`, `active`.
- [ ] `public.users` existe con las 10 columnas del Data model: tipos, defaults y nullabilidad exactos.
- [ ] `users.id` es PK y FK a `auth.users(id)` ON DELETE CASCADE; `daycare_id` es FK a `daycares` NOT NULL.
- [ ] RLS activado y exactamente 4 policies: `users_read`/`users_update` con `auth.uid() = id`, `users_insert`/`users_delete` con `false`.
- [ ] `handle_new_user()` es `SECURITY DEFINER` y `on_auth_user_created` dispara `AFTER INSERT` en `auth.users`.
- [ ] Existe la fila en `auth.users` con email `arturoyz2105@gmail.com`, email confirmado y contraseña cifrada bcrypt, con su `auth.identities` provider `email`.
- [ ] El trigger creó la fila en `public.users`: `role='staff'`, `status='active'`, `full_name='Arturo'`, `daycare_id` = "Guardería Sala Soles".
- [ ] El `POST /auth/v1/token?grant_type=password` con esas credenciales devuelve 200 y `access_token`.
- [ ] `supabase/migrations/002_create_users_table_and_seed.sql` existe y coincide con el SQL aplicado; `list_migrations` la registra.
- [ ] El repo no tiene otros cambios: `app/`, `src/` y `package.json` intactos; `/`, `/kids` y `/login` se renderizan igual que antes.

## Decisions

- **Sí:** trigger `handle_new_user` en este spec. Instrucción explícita del usuario; es la nota de implementación del diccionario y hace que el seed del staff lo cree el propio trigger.
- **Sí:** seed del staff en SQL dentro de la migración, con las credenciales que dio el usuario (`arturoyz2105@gmail.com`). Instrucción explícita: "creala en el sql no hay problema". Reproducible y versionado.
- **No:** crear el staff desde el dashboard. El usuario descartó la alternativa al elegir SQL.
- **Sí:** policies de fila propia (`auth.uid() = id`), insert/delete `false`. Elección del usuario sobre la recomendación. El trigger SECURITY DEFINER escribe sin toparse con RLS.
- **No:** `SELECT USING (true)` como en `daycares`: `users` tiene datos personales (nombre, flags); se abre con las policies por daycare en el spec que conecte el staff.
- **No:** uuid literal en el seed: se mantiene la decisión de SPEC 07; el CTE encadena `auth.users` → `auth.identities` y la guardería se resuelve por `name`.
- **No:** pasar `daycare_name` en la metadata y resolverlo en el trigger: el contrato del diccionario es `daycare_id` en `raw_user_meta_data`; el seed resuelve el uuid por nombre.
- **Sí:** `email_confirmed_at = now()` en el seed: es una cuenta de prueba, no hay servidor de mail en el loop.
- **No:** índices en `daycare_id` ni triggers de `updated_at`: una fila hoy; se agrega cuando los advisors o el uso lo pidan.
- **No:** borrar `pending` de `user_status` aunque ningún flujo lo escriba todavía: el diccionario lo define y sale gratis.
- **No:** nada de la app: ni `@supabase/supabase-js`, ni login real en `/login` (SPEC 03 sigue mock).

## Risks

| Risk                                     | Mitigation                                                                                                                                                        |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La contraseña real queda en texto plano en el `.sql` y en el git del repo. | Aceptado explícitamente por el usuario. Si el repo se hace público, rotar la contraseña del usuario desde el dashboard o cambiar a un email descartable.          |
| Insertar en `auth.users`/`auth.identities` usa internals de GoTrue, no una API soportada. | El paso 1 chequea las columnas reales contra `information_schema` y el paso 6 verifica login de verdad por HTTP; si algo cambió, se ajusta el seed antes de cerrar el spec. |
| `extensions.crypt` / `extensions.gen_salt` dependen de la extensión instalada en el schema `extensions`. | Pre-chequeo en `pg_extension` en el paso 1; si no está, abortar y decidir (habilitar `pgcrypto` o crear el usuario desde el dashboard).                           |
| Un futuro signup sin `daycare_id`/`role`/`full_name` en la metadata hace fallar el trigger y aborta el alta. | Es el contrato del diccionario; el spec de auth real debe validar la metadata antes de llamar al signup. Queda documentado acá.                                   |
| MCP corre con rol privilegiado: no prueba que el resto de RLS bloquee lo que debe. | Se comprueba en el primer spec que conecte la app con anon/user token, como en SPEC 07.                                                                           |

## What is **not** in this spec

- `rooms`, `children`, `parent_children`, `invitations`, `posts` y sus ENUMs.
- Login real en la app, `@supabase/supabase-js`, middleware, roles y permisos en la UI.
- Policies para que el staff vea otros usuarios de su daycare.
- Índices extra, `updated_at` automático, cuentas `admin` o `parent` de prueba.

Cada uno, si llega, va en su propio spec.
