# Slashie Admin

Private ops panel for the Slashie marketplace. Google sign-in, dashboard, auto-loaded task list, user search/management, and god-mode task edits via Apollo `@admin` APIs ([BE-42](https://linear.app/slashie/issue/BE-42), [BE-43](https://linear.app/slashie/issue/BE-43), [BE-44](https://linear.app/slashie/issue/BE-44)).

Tickets: [FE-156](https://linear.app/slashie/issue/FE-156/admin-panel-all-tasks-on-login-task-dossier-user-searchmanagement), [FE-157](https://linear.app/slashie/issue/FE-157/admin-dashboard-weekly-report-posthog-on-detail-pages), [FE-158](https://linear.app/slashie/issue/FE-158/admin-ui-slashie-brand-charts-mobile-responsive-layout), [FE-160](https://linear.app/slashie/issue/FE-160/admin-panel-reports-inbox-all-reported-tasks).

## Stack

- Next.js 16 App Router + React 19
- Bun
- Apollo Client 4 against `NEXT_PUBLIC_GRAPHQL_URL/graphql`
- Google Identity Services (`@react-oauth/google`) → existing `loginWithMethod(GOOGLE)` mutation (same JWT cookie convention as `SlashieApp/web`)
- Server-only PostHog Query API (personal key never sent to the browser)

## Auth

1. Sign in with Google.
2. The Google ID token email is checked **before** calling Apollo. Anything that does not end with `@slashie.app` is sent to **Not an admin** and never exchanged for a marketplace JWT.
3. Allowed emails (primary: `admin@slashie.app`) call `loginWithMethod`, store the Apollo JWT in the `auth` cookie, and send `Authorization: Bearer <token>` on GraphQL requests.
4. Apollo still enforces `@admin` + Admin collection + `@slashie.app`.

Add this app’s origin (local + Vercel) to the Google OAuth client’s **Authorized JavaScript origins**. Reusing the web client ID is fine.

## Nav

**Dashboard | Tasks | Users | Reports**. Landing `/` is Tasks with auto-load. People search is Users-only (worker profiles appear on user detail and as related records on a task dossier). `/reports` is the trust-and-safety inbox (default: task reports).

## GraphQL

Operations live in `src/graphql/operations.ts`. Types are generated from the live Apollo SDL (`${NEXT_PUBLIC_GRAPHQL_URL}/schema`) when `SCHEMA_ACCESS_TOKEN` is set, otherwise from `schema/admin.graphql` (BE-43/44 contract aligned with production).

| Operation | Signature |
| --- | --- |
| `adminTasks` | `(filter: AdminTaskFilter, first: Int = 50): [Task!]!` |
| `adminTask` | `(id: ID!): AdminTaskDossier!` |
| `adminUsers` | `(search: String, id: ID, first: Int = 50): [User!]!` |
| `adminOpsSummary` | `(range: AdminOpsRange!, dateFrom: DateTime, dateTo: DateTime): AdminOpsSummary!` |
| `adminUpdateTask` | `(id: ID!, input: AdminUpdateTaskInput!): Task!` |
| `adminUpdateUser` | `(id: ID!, input: AdminUpdateUserInput!): User!` |
| `adminSetUserDisabled` | `(id: ID!, disabled: Boolean!): User!` |
| `adminReports` | `(status: ReportStatus, targetType: ReportTargetType, first: Int = 50, after: String): ReportPage!` |
| `adminUpdateReportStatus` | `(id: ID!, status: ReportStatus!): Report!` |

`AdminTaskFilter`: `search`, `id`, `status`, `hidden`.

`AdminOpsRange`: `LAST_7_DAYS` | `LAST_30_DAYS` | `THIS_MONTH` | `LAST_MONTH`. Empty/omitted `adminTasks` filter returns the latest page of tasks (default `first` 50). Same for `adminUsers` with empty search.

Default inbox: omit `status`, pass `targetType: TASK`. The panel shows OPEN first. Report cards use BE-46 `targetLabel` (task title) and `reporter` / `reporterEmail`. If BE-46 fields are missing, it falls back to BE-40 `reports` / `updateReportStatus` (env allowlist) with a banner.

If BE-43/44 fields are not on the pointed-at API yet, the panel shows a banner and falls back where it can. User search/management and Mongo ops counts have no public fallback.

## PostHog

Dashboard and detail **Analytics** sections query PostHog from the Next.js server (`src/server/posthog.ts` and `/api/admin/posthog/*`). The personal API key is never `NEXT_PUBLIC_`.

Some `*_success` event names may be incomplete until [FE-153](https://linear.app/slashie/issue/FE-153). Task analytics match `properties.task_id` (live) and `properties.taskId`. User analytics use `distinct_id` = user id, then email.

## Env

Copy `.env.example` to `.env.local`:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_GRAPHQL_URL` | yes | Apollo origin, no trailing slash. Client calls `${url}/graphql`. Default in code: `https://api.slashie.app`. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | yes | GIS client ID. |
| `SCHEMA_ACCESS_TOKEN` | for live codegen | Sent as `X-Schema-Token` when fetching the live SDL (`/schema`). Local `schema/admin.graphql` is used when unset. |
| `POSTHOG_PERSONAL_API_KEY` | for analytics | Server-only personal API key. |
| `POSTHOG_PROJECT_ID` | for analytics | PostHog project id. |
| `POSTHOG_HOST` | no | Defaults to `https://eu.posthog.com`. |

## Run

```bash
bun install
cp .env.example .env.local
# fill NEXT_PUBLIC_GOOGLE_CLIENT_ID (+ GRAPHQL URL if not prod)
# fill POSTHOG_* for dashboard / detail analytics
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
