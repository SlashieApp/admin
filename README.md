# Slashie Admin

Private ops panel for the Slashie marketplace. Google sign-in, task/worker search, and god-mode task edits via Apollo `@admin` APIs ([BE-42](https://linear.app/slashie/issue/BE-42/admin-api-admin-directive-admin-collection-god-mode-adminupdatetask)).

Ticket: [FE-155](https://linear.app/slashie/issue/FE-155/admin-panel-google-oauth-slashieapp-taskworker-search-god-mode-edits).

## Stack

- Next.js 16 App Router + React 19
- Bun
- Apollo Client 4 against `NEXT_PUBLIC_GRAPHQL_URL/graphql`
- Google Identity Services (`@react-oauth/google`) → existing `loginWithMethod(GOOGLE)` mutation (same JWT cookie convention as `SlashieApp/web`)

## Auth

1. Sign in with Google.
2. The Google ID token email is checked **before** calling Apollo. Anything that does not end with `@slashie.app` is sent to **Not an admin** and never exchanged for a marketplace JWT.
3. Allowed emails (primary: `admin@slashie.app`) call `loginWithMethod`, store the Apollo JWT in the `auth` cookie, and send `Authorization: Bearer <token>` on GraphQL requests.
4. Apollo still enforces BE-42 (`@admin` + Admin collection + `@slashie.app`).

Add this app’s origin (local + Vercel) to the Google OAuth client’s **Authorized JavaScript origins**. Reusing the web client ID is fine.

## GraphQL (BE-42)

Operations live in `src/graphql/operations.ts`. Types are generated from the live Apollo SDL (`${NEXT_PUBLIC_GRAPHQL_URL}/schema`).

| Operation | Signature |
| --- | --- |
| `adminTasks` | `(filter: AdminTaskFilter, first: Int = 50): [Task!]!` |
| `adminWorkers` | `(search: String, id: ID, first: Int = 50): [worker!]!` |
| `adminUpdateTask` | `(id: ID!, input: AdminUpdateTaskInput!): Task!` |

`AdminTaskFilter`: `search`, `id`, `status`, `hidden`.

`AdminUpdateTaskInput`: `title`, `description`, `status`, `category`, `location`, `budget`, `datetime`, `hidden`, `preferredContactMethod`, `acceptedWorkerCap`.

If those fields are not on the pointed-at API yet, search/detail **falls back** to public `tasks` / `task` / `workers` / `worker`. God-mode save has no fallback — it requires `adminUpdateTask`.

## Env

Copy `.env.example` to `.env.local`:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_GRAPHQL_URL` | yes | Apollo origin, no trailing slash. Client calls `${url}/graphql`. Default in code: `https://api.slashie.app`. Use local/staging apollo that has BE-42 for god-mode. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | yes | GIS client ID. |
| `SCHEMA_ACCESS_TOKEN` | yes (codegen) | Sent as `X-Schema-Token` when fetching the live SDL (`/schema`). |

## Run

```bash
bun install
cp .env.example .env.local
# fill NEXT_PUBLIC_GOOGLE_CLIENT_ID (+ GRAPHQL URL if not prod)
bun run codegen
bun run dev
```

```bash
bun run test
bun run typecheck
bun run lint
bun run build
```

## Deploy (Vercel)

Create a Vercel project from this repo. Set the env vars above for Production / Preview. Framework preset: Next.js. Install command: `bun install`.

After deploy, add the Vercel URL to the Google OAuth authorized JavaScript origins.
