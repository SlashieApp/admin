# Slashie Admin

Private ops panel for the Slashie marketplace. Google sign-in, dashboard, auto-loaded task list, user search/management, and god-mode task edits via Apollo `@admin` APIs ([BE-42](https://linear.app/slashie/issue/BE-42), [BE-43](https://linear.app/slashie/issue/BE-43), [BE-44](https://linear.app/slashie/issue/BE-44)).

Tickets: [FE-156](https://linear.app/slashie/issue/FE-156/admin-panel-all-tasks-on-login-task-dossier-user-searchmanagement), [FE-157](https://linear.app/slashie/issue/FE-157/admin-dashboard-weekly-report-posthog-on-detail-pages), [FE-158](https://linear.app/slashie/issue/FE-158/admin-ui-slashie-brand-charts-mobile-responsive-layout), [FE-160](https://linear.app/slashie/issue/FE-160/admin-panel-reports-inbox-all-reported-tasks), [FE-165](https://linear.app/slashie/issue/FE-165/admin-product-feedback-inbox-draft-reply), [FE-170](https://linear.app/slashie/issue/FE-170/admin-practical-dashboard-paginated-filterable-tables-full-bleed-shell), [FE-171](https://linear.app/slashie/issue/FE-171/admin-tasks-map-pins-area-browse-task-detail-tabs-live-links), [FE-203](https://linear.app/slashie/issue/FE-203/fix-admin-panel-api-out-of-sync-panel-too-old).

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
5. Apollo links a Google login to an existing account only when that account's email is already verified. On `OAUTH_LINK_REQUIRES_VERIFIED_EMAIL` the login screen tells the admin to sign in on slashie.app with their password and verify the email once.

Add this app’s origin (local + Vercel) to the Google OAuth client’s **Authorized JavaScript origins**. Reusing the web client ID is fine.

## Nav

**Dashboard | Tasks | Users | Reports | Feedback**. Landing `/` is Tasks with a Mapbox pin map and shareable table filters. Users covers workers too (Worker filter = `isWorker`). `/reports` is the trust-and-safety inbox (default: task reports). `/feedback` is the product-feedback inbox. Task detail (`/tasks/[id]`) is tabbed (Overview · Quotes · Activity · Admin/god-mode) with a live public Slashie link.

## GraphQL

Operations live in `src/graphql/operations.ts`, one per screen, matching the live Apollo schema. There are no fallback queries: if an `@admin` field is missing or changed, the screen shows the API error. Fix the operation or open a `BE-*` ticket; do not work around it in the panel.

`schema/admin.graphql` is a committed snapshot of the live SDL (`${NEXT_PUBLIC_GRAPHQL_URL}/schema` with `X-Schema-Token`). `bun run codegen` uses the live SDL when `SCHEMA_ACCESS_TOKEN` is set, otherwise the snapshot. `src/graphql/operations.test.ts` validates every operation against the snapshot, so refresh it whenever apollo changes:

```bash
set -a; source .env; set +a
curl -sf -H "X-Schema-Token: $SCHEMA_ACCESS_TOKEN" "$NEXT_PUBLIC_GRAPHQL_URL/schema" -o schema/admin.graphql
bun run codegen && bun run test
```

| Operation | Used by |
| --- | --- |
| `adminTasks(filter: AdminTaskFilter, first, after): TaskPage` | Tasks table + map, edit form (by id) |
| `adminTask(id): AdminTaskDossier` | Task dossier (task, poster, workers, quotes, orders, activity) |
| `adminUsers(search, id, disabled, isWorker, createdAfter, createdBefore, first, after): UserPage` | Users table, user detail (with `tasksPosted`) |
| `adminOpsSummary(range): AdminOpsSummary` | Dashboard |
| `popularTaskCategories(first)` | Category suggestions on the Tasks filter |
| `adminUpdateTask`, `adminUpdateUser`, `adminSetUserDisabled` | God-mode edits |
| `adminReports(status, targetType, first, after): ReportPage` / `adminUpdateReportStatus` | Reports inbox |
| `adminFeedbackSummary`, `adminFeedbacks(status, category, first, after)`, `adminUpdateFeedbackStatus`, `adminFeedbackDraftReply` (query) | Feedback inbox |

Every list filter is sent to the API and lists page with `after` / `nextCursor`. Column sort orders the fetched page only. The panel has no filter the API cannot apply.

- **Tasks**: search, status (`DRAFT | OPEN | AWARDED | CANCELLED`), hidden, category (one open-text category; suggestions from `popularTaskCategories`, since tasks carry 1 to 10 free-text `categories`), poster (`posterSearch`), budget min/max/type, created date range, map viewport `bbox`. Job completion lives on `Order.status`, not the task.
- **Task dossier orders**: `ACTIVE | RESCHEDULING | CANCEL_REQUESTED | CONFLICT | COMPLETED | CANCELLED`, with booked slot, pending request, reschedule history, auto-Done and closed times. Activity is Messages flashes (`FLASH`, with `visibleToUserIds`) plus the task timeline (`TIMELINE`, one row per event that raised no flash; the type is shown in words and `TASK_UPDATED` lists the changed fields); chat messages are not included.
- **Reports**: status and target type (`TASK | WORKER | USER | REVIEW | MESSAGE`). Tasks and users link inside admin; workers and reviews link to the public `targetUrl`; `MESSAGE` rows show the reported text (`targetLabel`, no URL).
- **Feedback**: status and category. Selecting an item loads `adminFeedbackDraftReply` (subject/body with Copy + optional `mailto:`). The panel does not send the reply.

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
| `NEXT_PUBLIC_APP_URL` | no | Public Slashie origin for live task links. Defaults to `https://slashie.app`. |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | for Tasks map | Same Mapbox token as `SlashieApp/web`. Map shows a placeholder without it. |
| `NEXT_PUBLIC_MAPBOX_STYLE_LIGHT` | no | Defaults to `mapbox://styles/mapbox/streets-v12`. |

## Run

```bash
bun install
cp .env.example .env.local
# fill NEXT_PUBLIC_GOOGLE_CLIENT_ID (+ GRAPHQL URL if not prod)
# fill POSTHOG_* for dashboard / detail analytics
# fill NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN for the Tasks pin map
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
