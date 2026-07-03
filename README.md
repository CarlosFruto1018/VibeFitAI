# FitAI — Entrena con inteligencia

PWA móvil para registrar y consultar entrenamientos de gimnasio **hablando, con una foto o por texto**, en español. La IA extrae los datos estructurados (ejercicio, series, reps, peso, duración, distancia) y los guarda automáticamente en tu historial.

## Cómo funciona

1. Envías un input (texto, audio o imagen) → `POST /api/input`.
2. Se guarda como `raw_input` y se agrupa en una sesión de entrenamiento (ventana de 90 min).
3. **Texto**: se procesa síncrono — Gemini extrae los ejercicios y se guardan los sets. Si la IA no está disponible o responde mal, hay un extractor local por regex como fallback.
4. **Audio/imagen**: se sube directo a R2 con URL prefirmada y se encola en QStash; el webhook `/api/webhooks/qstash` transcribe/analiza en background.
5. El contexto del usuario (ejercicios frecuentes, últimas cargas, PRs) se cachea en Redis 24 h y alimenta los prompts.
6. En `/chat` puedes preguntar en lenguaje natural por tu historial ("¿cuánto levanté la última vez en sentadilla?").

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript strict |
| Estilos | Tailwind CSS v4 (tema claro slate/emerald, mobile-first) |
| Base de datos | Drizzle ORM + Neon (Postgres serverless) |
| Auth | NextAuth v5 con Google OAuth (JWT) |
| IA | Google Gemini vía `@google/genai` (extracción, visión, transcripción) |
| Cache / Cola | Upstash Redis (contexto, rate limiting) / Upstash QStash (jobs) |
| Storage | Cloudflare R2 (SDK S3) |
| Charts | Recharts |
| Tests | Vitest |

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completa las variables (ver abajo)
npm run db:migrate           # aplica migraciones a tu Neon
npm run db:seed              # catálogo inicial de ejercicios
npm run dev
```

Sin `GEMINI_API_KEY`, la extracción de texto usa el fallback local por regex (funciona para los formatos comunes: "press banca 3x10 con 80kg"). Sin Redis/QStash/R2 configurados, la app funciona solo con registro por texto.

### Variables de entorno

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Postgres de Neon |
| `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | NextAuth + Google OAuth |
| `GEMINI_API_KEY` | Gemini (extracción NL, visión y transcripción de audio) |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Cache de contexto + rate limiting |
| `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` | Cola de procesamiento en background |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Storage de audio/imágenes |
| `NEXT_PUBLIC_APP_URL` | URL pública (la usa QStash para llamar al webhook) |

## Scripts

```bash
npm run dev          # servidor de desarrollo
npm run build        # build de producción
npm run lint         # ESLint
npm test             # Vitest
npm run db:generate  # genera migración desde el schema de Drizzle
npm run db:migrate   # aplica migraciones
npm run db:studio    # Drizzle Studio
npm run db:seed      # seed del catálogo de ejercicios
```

## Estructura

```
src/
  app/
    (app)/            # páginas autenticadas: dashboard, record, chat, history, progress, session/[id], settings
    api/              # input, input/presign, query, sessions, account, webhooks/qstash
    login/            # login con Google
    offline/          # fallback del service worker
  components/         # UI (record, dashboard, session, layout, landing)
  lib/
    ai/               # gateway Gemini, extractores (texto/visión/local), query engine, session grouper
    db/               # schema Drizzle, cliente Neon, queries
    memory/           # contexto de usuario cacheado en Redis
    logger.ts         # logging JSON estructurado
    rate-limit.ts     # rate limiting por usuario con Redis
drizzle/migrations/   # migraciones SQL generadas
public/sw.js          # service worker (offline básico + caché de estáticos)
.github/workflows/    # CI: lint + test + build
```

## PWA

La app es instalable (manifest + íconos + service worker). El SW usa red-primero para navegación con fallback a `/offline`, y caché-primero para los estáticos de Next. Solo se registra en producción.
