<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->

## Stack y comandos

- Next.js 16.4.5 (App Router, Turbopack) + React 19.3 + TypeScript + Tailwind v4. Package manager **pnpm** (`pnpm-lock.yaml`, `packageManager: pnpm@11.1.1`).
- `pnpm dev` → http://localhost:3000. `pnpm lint` y `pnpm build` existen pero **no se ejecutan** (regla global del usuario: nunca lint/build/formatters).
- No hay script `test` ni runner de tests. No agregar uno sin pedirlo.
- Alias `@/*` → raíz del repo (`tsconfig.json`). Tipos como `LayoutProps<"/">` y `PageProps` son generados en `.next/types`: no escribirlos a mano.
- Remote git: `git@github.com-personal:...` (alias SSH, no `github.com` directo). Rama base: `main`.

## Cache Components (gotcha de esta versión)

`next.config.ts` habilita `cacheComponents: true` y `partialPrefetching: true`. Consecuencia real: todo acceso a datos dinámicos o APIs de request que no esté bajo `'use cache'` debe ir dentro de `<Suspense>`, o el dev overlay marca `blocking-route`.

- Antes de crear pages, layouts, route handlers o data fetching, leer `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`. No extrapolar de Next 14/15.

## Tailwind v4

- Sin `tailwind.config.*` ni `postcss.config.*`. El loader `@tailwindcss/turbopack` se registra en `next.config.ts` → `turbopack.rules`.
- Tokens y tema en `app/globals.css` (`@import "tailwindcss"` + `@theme inline`). Extender ahí, no crear config aparte.

## Diseño de referencia

- `references/pantallas/*.dc.html`: mockups HTML estáticos (custom element `x-dc` + `support.js`), se abren directo en el navegador. Son referencia visual, **no** código para importar en la app.
- `references/screenshots/*.png`: capturas de esas pantallas.
- El copy de UI y los mockups están en español.

## SDD: solo `/spec` y `/spec-impl`

El desarrollo del proyecto se hace exclusivamente con estas dos skills. No redactar specs ni implementar features por fuera de ellas.

- `/spec` → define la feature y escribe `specs/NN-slug.md` (la carpeta aún no existe). No escribe código.
- Revisar el spec y marcarlo `Approved`.
- `/spec-impl NN-slug` → crea la rama `spec-NN-slug` desde `main` e implementa por pasos. Rechaza specs no aprobados.

## MCPs

- **Context7**: documentación actualizada antes de responder sobre APIs, sintaxis, configuración o versiones de librerías/frameworks. Flujo: `resolve-library-id` → `query-docs`. No responder de memoria si hay riesgo de desactualización.
- **Playwright**: navegar, inspeccionar y capturar la app (verificación visual, screenshots, flujos E2E) contra el dev server en `http://localhost:3000`.

## Imágenes generadas

Todas las imágenes que genere el agente (capturas de Playwright, screenshots, imágenes de referencia) deben guardarse dentro de `.playwright-mcp/`, nunca en la raíz del proyecto ni en `app/` o `public/`. Esa carpeta está en `.gitignore`.
