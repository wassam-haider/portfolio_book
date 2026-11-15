# The Archives of Wasam Haider

A fantasy-themed interactive portfolio: visitors open an ancient leather tome on a
candle-lit desk, and every project occupies its own two-page spread with a realistic
page-flip animation. **S.H.E.A.** (Smart Helpful Electronic Assistant) — an animated
mascot guarding the archives — answers questions about the work using a real
Retrieval-Augmented Generation (RAG) pipeline grounded in the site's own database.
An admin dashboard lets the owner manage every project, the profile/about section,
and media, without touching code.

- **Desktop**: a two-page `react-pageflip` book with keyboard/button navigation and a
  table of contents.
- **Mobile**: a dedicated single-page swipe reader (not a shrunk desktop layout).
- **S.H.E.A.**: an original SVG mascot with idle/thinking/talking states, a themed
  chat panel, suggested questions, and the ability to flip the book to a project it
  mentions.
- **Admin** (`/admin`): project CRUD with live preview, profile/about editing,
  screenshot & video uploads, and one-click knowledge-base re-indexing.
- **RAG**: every published project and the profile are chunked, embedded (or
  keyword-indexed), and retrieved by similarity to ground S.H.E.A.'s answers — it
  never invents facts, and says so when it doesn't know something.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling / motion | Tailwind CSS v4, Framer Motion |
| Book UI | `react-pageflip` |
| Database | PostgreSQL via Prisma 6 (built for [Neon](https://neon.tech)) |
| Auth | Signed JWT cookie (`jose`), checked in `middleware.ts` |
| File storage | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) in production, local disk in dev |
| LLM (S.H.E.A.'s voice) | [OpenRouter](https://openrouter.ai) — any model id, default `nvidia/nemotron-3-ultra-550b-a55b:free` |
| Embeddings | Pluggable: Voyage AI, OpenAI, or a dependency-free lexical fallback |

## Project structure

```
app/                      Routes (App Router)
  page.tsx                Public site entry (loads projects + profile)
  admin/                  Admin dashboard (protected)
  api/                    Route handlers (admin CRUD, auth, chat, tracking)
components/
  book/                   Desk scene, cover, flip book, mobile reader, page content
  shea/                   S.H.E.A. mascot + chat panel
  admin/                  Admin-only form components
lib/
  db.ts                   Prisma client singleton
  types.ts                DB row <-> app type mapping (JSON-in-text columns)
  validation.ts           Zod schemas (create vs. partial-update are separate —
                           see the comment on `projectUpdateSchema`)
  rag/                    knowledge.ts (chunking) -> indexer.ts (sync to DB) ->
                           retrieve.ts (similarity/keyword search) -> llm.ts
                           (OpenRouter call) -> persona.ts (S.H.E.A.'s prompt)
prisma/
  schema.prisma           Data model
  migrations/             SQL migrations (hand-reviewed; applied with `migrate deploy`)
  seed.ts                 Placeholder projects + profile
```

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Get a database

The schema is PostgreSQL. Easiest path: a free [Neon](https://neon.tech) project.

1. Create a project at neon.tech (or via Vercel's Marketplace → Neon integration).
2. Copy the **pooled** connection string (hostname contains `-pooler`).
3. Append `&pgbouncer=true` to it. This tells Prisma to skip server-side prepared
   statements, which Neon's PgBouncer-fronted pooler needs — without it, queries
   intermittently fail with `prepared statement "sN" already exists`.

   ```
   DATABASE_URL="postgresql://USER:PASS@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
   ```

   Prisma's local `prisma dev` Postgres is **not** a good substitute here: in testing
   it turned out to be a lightweight WASM emulation that doesn't reliably handle
   prepared statements across reconnects. Use a real Postgres (Neon or otherwise).

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in `.env` — see the table below. At minimum you need `DATABASE_URL`,
`ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `AUTH_SECRET` to run the site and sign in to
`/admin`. Everything else has a safe default or a graceful fallback.

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Neon pooled connection string, `&pgbouncer=true` appended |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Yes | Credentials for `/admin/login` |
| `AUTH_SECRET` | Yes | 32+ random chars, e.g. `openssl rand -hex 32` |
| `OPENROUTER_API_KEY` | No | Get one at [openrouter.ai/keys](https://openrouter.ai/keys). Empty = S.H.E.A. still replies, but honestly says she isn't configured yet |
| `OPENROUTER_MODEL` | No | Any [OpenRouter model id](https://openrouter.ai/models); defaults to a free Nemotron model |
| `EMBEDDING_PROVIDER` | No | `lexical` (default, no key needed), `voyage`, or `openai` |
| `EMBEDDING_API_KEY` / `EMBEDDING_MODEL` | No | Only used when `EMBEDDING_PROVIDER` isn't `lexical` |
| `BLOB_READ_WRITE_TOKEN` | No | Set automatically by Vercel's Blob integration; empty locally saves uploads to `public/uploads` |

### 4. Apply migrations and seed placeholder content

```bash
npx prisma migrate deploy   # creates the schema
npm run db:seed             # ASTRA + 2 placeholder projects + placeholder profile
```

### 5. Run it

```bash
npm run dev
```

Visit `http://localhost:3000` for the book, `http://localhost:3000/admin` for the
dashboard.

## Using the admin dashboard

- **Projects**: create, edit, reorder (↑/↓, swaps `displayOrder`), publish/unpublish,
  and delete. The project form has a **Preview in book** button that renders the
  exact left/right page components live, before you save.
- **About Me**: introduction, education, skill groups, experience, achievements,
  interests, and social links — this is what S.H.E.A. draws on when asked about the
  developer, and what the book's "Concerning the Maker" page shows.
- **Media**: screenshots (JPEG/PNG/WebP/GIF, ≤8MB) and demo videos (an uploaded
  MP4/WebM, ≤100MB, or a pasted YouTube/Vimeo URL) attach per project.
- **Knowledge base** (on the Overview page): shows indexing status, document count,
  and retrieval mode. Re-indexing happens automatically on every project/profile
  save, but you can force a full rebuild with **Re-index now** — useful after
  switching `EMBEDDING_PROVIDER`, since that changes how every chunk needs to be
  embedded.

Every **published** project you save appears in the book immediately — no rebuild
or redeploy needed, since the book renders straight from the database on each
request.

## How S.H.E.A.'s RAG pipeline works

1. **Chunking** (`lib/rag/knowledge.ts`): each published project becomes several
   self-contained chunks (overview, description, technical, challenges,
   documentation); the profile becomes one chunk per section.
2. **Indexing** (`lib/rag/indexer.ts`): chunks are diffed against what's already
   stored (by content hash) and only changed ones are re-embedded, keeping
   re-indexing fast. Unpublishing or deleting a project removes its chunks.
3. **Retrieval** (`lib/rag/retrieve.ts`): a visitor's question is embedded (if a
   real embedding provider is configured) and compared by cosine similarity to every
   stored chunk; with `EMBEDDING_PROVIDER=lexical` (the default, no API key needed)
   it falls back to keyword overlap scoring instead.
4. **Generation** (`lib/rag/llm.ts` + `lib/rag/persona.ts`): the top matching chunks
   are inserted into a strict system prompt that instructs the model to answer only
   from that context, admit when it doesn't know something, and never invent
   skills, projects, or achievements. A response can end with `[[open:slug]]` to
   tell the book UI to flip to a specific project.

Swapping `EMBEDDING_PROVIDER` or `OPENROUTER_MODEL` requires no code changes — both
are read from the environment at request time.

## Deploying to Vercel

1. **Push this repo to GitHub**, then **import it in Vercel**.
2. **Database**: add Neon through Vercel's Marketplace integration (Storage tab →
   Postgres) — this sets `DATABASE_URL` automatically. Edit it afterward in
   Project Settings → Environment Variables to append `&pgbouncer=true` if the
   integration didn't already include it.
3. **File uploads**: add a Vercel Blob store (Storage tab → Blob). This sets
   `BLOB_READ_WRITE_TOKEN` automatically.
4. **Set the remaining environment variables** in Project Settings → Environment
   Variables: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AUTH_SECRET`, `OPENROUTER_API_KEY`
   (and `OPENROUTER_MODEL` / `EMBEDDING_*` if you want non-default values).
5. **Deploy.** `npm run build` runs `prisma generate` automatically; it does not run
   migrations. Apply the schema once, pointed at the production database:
   ```bash
   DATABASE_URL="<same value as in Vercel>" npx prisma migrate deploy
   ```
6. **Seed placeholder content** (optional, do this once):
   ```bash
   DATABASE_URL="<same value as in Vercel>" npm run db:seed
   ```
   Then replace it with real content through `/admin` on the live site.

## Security notes

- `/admin/*` and `/api/admin/*` are protected by `middleware.ts`, which checks a
  signed JWT cookie — the admin API is never reachable without it.
- Login attempts are rate-limited (`lib/rateLimit.ts`); credential comparison uses
  constant-time equality.
- Chat requests are rate-limited per IP; the chat API is separate from every admin
  endpoint, so no admin action is ever reachable through the public chatbot.
- Uploaded files are validated by MIME type and size before being stored.
- Rate limiting is in-memory per server instance — fine for a single-region
  deployment; swap `lib/rateLimit.ts` for a shared store (e.g. Upstash Redis) if you
  run multiple instances.

## A note on partial updates

`lib/validation.ts` keeps two separate Zod schemas for projects: `projectInputSchema`
(used for creation, where Zod's `.default()` values are desirable) and
`projectUpdateSchema` (used for `PUT` requests, with every field plainly optional
and **no** defaults). This is deliberate — `projectInputSchema.partial()` looks like
the obvious way to validate a partial update, but Zod backfills `.default()` values
for any key missing from the request even after `.partial()`, so a request that
only sends `{ displayOrder }` (e.g. the reorder buttons) would silently reset every
other field to its default and wipe the project's content. Keep using
`projectUpdateSchema` for any new partial-update endpoint.
