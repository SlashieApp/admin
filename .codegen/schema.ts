export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export type AcceptQuoteInput = {
  /** Optional location update when accepting. */
  location?: InputMaybe<LocationInput>;
  /** Quote to accept for the task. */
  quoteId: Scalars['ID']['input'];
  /** One of the quote's `proposedSlots`; becomes the order's booked time. Must still be in the future. */
  selectedSlotId: Scalars['ID']['input'];
};

export type AcceptQuotePayload = {
  order: Order;
  task: Task;
};

export type AccountDeletionBlocker = {
  kind: AccountDeletionBlockerKind;
  orderId: Scalars['ID']['output'];
  taskId: Scalars['ID']['output'];
};

export enum AccountDeletionBlockerKind {
  /** An order that is ACTIVE, RESCHEDULING, CANCEL_REQUESTED or CONFLICT. */
  LiveOrder = 'LIVE_ORDER'
}

export type AddQuoteInput = {
  message?: InputMaybe<Scalars['String']['input']>;
  price: PriceInput;
  /** 1-2 exact slots the worker can do the job. */
  proposedSlots: Array<TimeSlotInput>;
  taskId: Scalars['ID']['input'];
};

export type AdditionalEntityFields = {
  path?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

/**
 * Ops allowlist row. `@admin` also requires a verified `@slashie.app` account
 * whose id matches `userId` once the row is linked. Not a marketplace user role.
 */
export type Admin = {
  /** Inactive rows cannot call `@admin` fields. */
  active: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  /** Normalized lowercase email. Unique. Must end with `@slashie.app`. */
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /**
   * Linked user id. Set on the first successful `@admin` call by the verified
   * account with this email. Later calls must be that same user.
   */
  userId?: Maybe<Scalars['ID']['output']>;
};

/**
 * Segments an admin may target. Unioned with explicit `userIds`. There is no
 * all-users value: omitting both targets is rejected.
 */
export enum AdminCohortKey {
  FoundingWorkers = 'founding_workers',
  GeoWatfordBushey = 'geo_watford_bushey'
}

/**
 * Templated ops reply for a feedback row. Not sent automatically — copy and
 * personalise before sending.
 */
export type AdminFeedbackDraftReply = {
  bodyHtml?: Maybe<Scalars['String']['output']>;
  bodyText: Scalars['String']['output'];
  subject: Scalars['String']['output'];
};

/**
 * Point-in-time counts for the product-feedback inbox. Distinct from
 * `adminOpsSummary.openReports` / trust reports.
 */
export type AdminFeedbackSummary = {
  dismissed: Scalars['Int']['output'];
  open: Scalars['Int']['output'];
  replied: Scalars['Int']['output'];
  reviewed: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

/**
 * A ranged Mongo count plus the immediately preceding window of the same length.
 * `percentChange` is `((current - previous) / previous) * 100`. Null when previous
 * is 0 and current is not (undefined % from zero). 0 when both are 0.
 */
export type AdminOpsMetric = {
  current: Scalars['Int']['output'];
  percentChange?: Maybe<Scalars['Float']['output']>;
  previous: Scalars['Int']['output'];
};

/**
 * Preset windows for `adminOpsSummary`. All windows are UTC and half-open
 * `[from, to)`. Rolling ranges are `[now - N days, now)`. `THIS_MONTH` is
 * `[UTC month start, now)` compared with the same elapsed slice of the previous
 * month. `LAST_MONTH` is the previous UTC calendar month vs the month before.
 * Pass `dateFrom` and `dateTo` together to override with a custom window.
 */
export enum AdminOpsRange {
  Last_7Days = 'LAST_7_DAYS',
  Last_30Days = 'LAST_30_DAYS',
  LastMonth = 'LAST_MONTH',
  ThisMonth = 'THIS_MONTH'
}

/**
 * Mongo-authoritative ops KPIs for the admin dashboard. Ranged fields use the
 * resolved `[dateFrom, dateTo)` window; snapshot fields are current as of now.
 */
export type AdminOpsSummary = {
  dateFrom: Scalars['DateTime']['output'];
  dateTo: Scalars['DateTime']['output'];
  /**
   * Point-in-time: users with `disabled: true`. Missing field is treated as not
   * disabled.
   */
  disabledUsers: Scalars['Int']['output'];
  /**
   * Point-in-time: tasks suspended by Slashie (`Task.suspension.bySlashie`).
   * Tasks suspended only because the poster's account is suspended are not
   * counted.
   */
  hiddenTasks: Scalars['Int']['output'];
  /** Orders that reached COMPLETED (mutual Done or 7-day auto-Done) in the window, by `closedAt`. */
  jobsCompleted: AdminOpsMetric;
  /** Users with `createdAt` in the window. */
  newUsers: AdminOpsMetric;
  /** Point-in-time: reports currently `OPEN`. */
  openReports: Scalars['Int']['output'];
  /** Orders with `createdAt` in the window (one per accepted quote). */
  ordersOpened: AdminOpsMetric;
  previousDateFrom: Scalars['DateTime']['output'];
  previousDateTo: Scalars['DateTime']['output'];
  /**
   * Quotes currently `ACCEPTED` whose `createdAt` falls in the window. Quotes have
   * no status-changed timestamp, so this is dated by send time, not accept time.
   */
  quotesAccepted: AdminOpsMetric;
  /**
   * Quotes currently `DECLINED` or `REJECTED` whose `createdAt` falls in the
   * window. Withdrawn quotes are not declined.
   */
  quotesDeclined: AdminOpsMetric;
  /** Quotes with `createdAt` in the window (any later status, including withdrawn). */
  quotesSent: AdminOpsMetric;
  range: AdminOpsRange;
  /** Trust reports with `createdAt` in the window (any status). */
  reportsSubmitted: AdminOpsMetric;
  /** Point-in-time: every `TaskStatus` and its current document count. */
  tasksByStatus: Array<AdminTaskStatusCount>;
  /** Tasks with `createdAt` in the window (all statuses, including suspended/drafts). */
  tasksCreated: AdminOpsMetric;
  /**
   * Workers whose setup was submitted in the window (`setupCompletedAt`, the same
   * flag as public `Query.workers` visibility). Incomplete setup drafts are excluded.
   */
  workersRegistered: AdminOpsMetric;
};

export type AdminReviewSignal = {
  abuseFlags: Array<ReviewAbuseFlag>;
  review: Review;
};

export type AdminReviewSignalPage = {
  items: Array<AdminReviewSignal>;
  /** Opaque cursor (review id) for the next page, or null when there are no more items. */
  nextCursor?: Maybe<Scalars['String']['output']>;
};

export type AdminSendSystemFlashInput = {
  body: Scalars['String']['input'];
  cohortKeys?: InputMaybe<Array<AdminCohortKey>>;
  /**
   * When true, resolve the recipient count and write an audit row, but do not
   * write flashes.
   */
  dryRun: Scalars['Boolean']['input'];
  /** Optional https image shown on the flash card. */
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
  /** Explicit recipients. Unioned with `cohortKeys`. Both empty is rejected. */
  userIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type AdminSendSystemFlashPayload = {
  audit: AdminSystemFlashAudit;
  dryRun: Scalars['Boolean']['output'];
  recipientCount: Scalars['Int']['output'];
};

/** Audit row for an ops announcement sent to `SYSTEM` threads. */
export type AdminSystemFlashAudit = {
  actorEmail: Scalars['String']['output'];
  actorUserId: Scalars['ID']['output'];
  body: Scalars['String']['output'];
  cohortKeys: Array<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  dryRun: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  /** The flashes written. Empty for dry runs. */
  itemIds: Array<Scalars['ID']['output']>;
  recipientCount: Scalars['Int']['output'];
  /** Resolved recipients after union and de-duplication. */
  recipientUserIds: Array<Scalars['ID']['output']>;
  title: Scalars['String']['output'];
  /** Explicit user ids requested (before cohort union). */
  userIds: Array<Scalars['ID']['output']>;
};

export type AdminTaskActivity = {
  actorUserId?: Maybe<Scalars['ID']['output']>;
  body?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  orderId?: Maybe<Scalars['ID']['output']>;
  quoteId?: Maybe<Scalars['ID']['output']>;
  source: AdminTaskActivitySource;
  title?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
  /** Flashes: who can see it. Empty for timeline rows. */
  visibleToUserIds: Array<Scalars['ID']['output']>;
};

/**
 * Unified activity row for a task dossier, newest first, one row per event: the
 * flash when the event raised one (with who could see it), otherwise the task
 * timeline event (task edits, reviews, withdrawn or lapsed booking requests).
 * Flashes that are not events, such as review prompts, are rows too. Chat
 * messages are not included. The full typed log is `task.timeline`.
 */
export enum AdminTaskActivitySource {
  Flash = 'FLASH',
  Timeline = 'TIMELINE'
}

/**
 * Everything related to one task for ops. Prefer this over stitching public queries.
 * Task is owner-shaped so location/address and both suspension reasons
 * (`task.suspension`) are visible. Quotes always come with the quoting worker
 * (`Quote.workerUserId`, and `Quote.worker` including the email). Suspensions
 * and their lifting are `TIMELINE` activity rows (`TASK_SUSPENDED`,
 * `TASK_UNSUSPENDED`) whose `body` holds the reason and whose `actorUserId` is
 * the admin who did it.
 */
export type AdminTaskDossier = {
  activity: Array<AdminTaskActivity>;
  orders: Array<Order>;
  poster?: Maybe<User>;
  quotes: Array<Quote>;
  task: Task;
  /**
   * Union of workers linked via quotes or orders on this task. Users without a
   * worker profile are omitted here (they still appear on quotes/orders).
   */
  workers: Array<Worker>;
};

/** Ops search across all tasks (including suspended, cancelled, and non-OPEN). */
export type AdminTaskFilter = {
  /**
   * Map viewport: tasks whose `location` falls inside the box (inclusive).
   * South-west / north-east corners. Antimeridian-crossing boxes are rejected
   * (`INVALID_BOUNDS`). Combine with `after` / `nextCursor` to page pins in view.
   */
  bbox?: InputMaybe<GeoBoundsInput>;
  /** Inclusive upper bound on `budget.amount`. */
  budgetMax?: InputMaybe<Scalars['Float']['input']>;
  /** Inclusive lower bound on `budget.amount`. */
  budgetMin?: InputMaybe<Scalars['Float']['input']>;
  /** Exact budget type (`ONE_OFF`, `PER_DAY`, `PER_HOUR`). */
  budgetType?: InputMaybe<TaskBudgetType>;
  /**
   * Tasks that have this category: case-insensitive exact match on any of
   * `categories` (same rule as public `TaskFilter.category`).
   */
  category?: InputMaybe<Scalars['String']['input']>;
  /** Inclusive lower bound on task `createdAt` (`createdAt >= value`). */
  createdAfter?: InputMaybe<Scalars['DateTime']['input']>;
  /** Inclusive upper bound on task `createdAt` (`createdAt <= value`). */
  createdBefore?: InputMaybe<Scalars['DateTime']['input']>;
  /**
   * When set, only tasks suspended by Slashie, or only tasks that are not.
   * @deprecated Use `suspended`.
   */
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  /** Exact task id lookup. */
  id?: InputMaybe<Scalars['ID']['input']>;
  /** Exact poster user id (`Task.createdByUserId`). */
  posterId?: InputMaybe<Scalars['ID']['input']>;
  /**
   * Case-insensitive match on poster email or profile name. A 24-char hex value
   * also matches the poster user id.
   */
  posterSearch?: InputMaybe<Scalars['String']['input']>;
  /**
   * Case-insensitive match on title, description, or place name. A 24-char hex
   * value also matches the task id.
   */
  search?: InputMaybe<Scalars['String']['input']>;
  /** Constrain by status(es). Omit for all statuses. */
  status?: InputMaybe<Array<TaskStatus>>;
  /**
   * When set, only suspended tasks (for any reason, see `Task.suspension`), or
   * only tasks that are not suspended.
   */
  suspended?: InputMaybe<Scalars['Boolean']['input']>;
};

/**
 * Point-in-time task count for one `TaskStatus`. `adminOpsSummary.tasksByStatus`
 * always includes every status, including zeros.
 */
export type AdminTaskStatusCount = {
  count: Scalars['Int']['output'];
  status: TaskStatus;
};

/**
 * God-mode task amendments. Every field is optional; only provided fields change.
 * Ignores poster ownership and OPEN/DRAFT restrictions. Input is still validated.
 */
export type AdminUpdateTaskInput = {
  budget?: InputMaybe<TaskBudgetInput>;
  /** Replaces all categories. Same rules as `CreateTaskInput.categories`. */
  categories?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Date and time preference. Pass null to clear. */
  datetime?: InputMaybe<TaskDateTimeInput>;
  description?: InputMaybe<Scalars['String']['input']>;
  /**
   * True suspends the task by Slashie, false lifts that; the same as
   * `adminSetTaskSuspended` (it logs `TASK_SUSPENDED` / `TASK_UNSUSPENDED`, not
   * a `TASK_UPDATED` line). A value that matches the task changes nothing.
   * @deprecated Use `adminSetTaskSuspended`.
   */
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  location?: InputMaybe<TaskLocationInput>;
  preferredContactMethod?: InputMaybe<TaskContactMethod>;
  status?: InputMaybe<TaskStatus>;
  title?: InputMaybe<Scalars['String']['input']>;
};

/**
 * God-mode user amendments. Every field is optional; only provided fields change.
 * Does not expose or accept password hashes or reset tokens.
 */
export type AdminUpdateUserInput = {
  contactNumber?: InputMaybe<Scalars['String']['input']>;
  emailVerified?: InputMaybe<Scalars['Boolean']['input']>;
  /** Display name (`User.profile.name`). */
  name?: InputMaybe<Scalars['String']['input']>;
  phoneVerified?: InputMaybe<Scalars['Boolean']['input']>;
};

export type AuthPayload = {
  token: Scalars['String']['output'];
  user: User;
};

export type CheckoutSessionPayload = {
  url: Scalars['String']['output'];
};

export type CreateFeedbackInput = {
  category: FeedbackCategory;
  /** Required for guests. Optional when signed in (defaults to the account email). */
  email?: InputMaybe<Scalars['String']['input']>;
  /** Required free-text. Trimmed and capped at 2000 characters. */
  message: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  pageUrl?: InputMaybe<Scalars['String']['input']>;
  path?: InputMaybe<Scalars['String']['input']>;
  /** 1–5. Required when `category` is RATING; optional otherwise. */
  rating?: InputMaybe<Scalars['Int']['input']>;
  userAgent?: InputMaybe<Scalars['String']['input']>;
};

export type CreateReportInput = {
  /** Optional free-text context. Trimmed and capped at 2000 characters. */
  details?: InputMaybe<Scalars['String']['input']>;
  reason: ReportReason;
  targetId: Scalars['ID']['input'];
  targetType: ReportTargetType;
};

export type CreateReviewInput = {
  /** Optional. Trimmed, empty becomes null, capped at 1000 characters. */
  comment?: InputMaybe<Scalars['String']['input']>;
  orderId: Scalars['ID']['input'];
  /** Integer 1–5. */
  stars: Scalars['Int']['input'];
};

export type CreateTaskInput = {
  /** Budget and currency. */
  budget: TaskBudgetInput;
  /**
   * 1 to 10 open category tags, any text (for example "Plumbing", "Leaky tap").
   * Each is trimmed with inner spaces collapsed; empty ones are dropped and
   * duplicates removed ignoring case (the first spelling is kept). Errors:
   * `CATEGORY_REQUIRED` (none left), `TOO_MANY_CATEGORIES` (over 10),
   * `CATEGORY_TOO_LONG` (over 64 characters).
   */
  categories: Array<Scalars['String']['input']>;
  /** Date and time preference (before/flexible/exact). */
  datetime?: InputMaybe<TaskDateTimeInput>;
  /** Detailed description of the job. */
  description: Scalars['String']['input'];
  /** Additional image URLs or keys after upload. */
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Map-derived coordinates and address. `name` is reduced to the town on save. */
  location: TaskLocationInput;
  /** Which profile contact channel may be shared with workers. */
  preferredContactMethod: TaskContactMethod;
  /** Short title for the task. */
  title: Scalars['String']['input'];
};

export enum Currency {
  Gbp = 'GBP',
  Usd = 'USD'
}

/**
 * Customer-side My Tasks achievements. Completed counts, category mix, location,
 * and agreed totals use orders where this account is the customer (host) and
 * status is `COMPLETED`. Canceled and any non-completed status are excluded.
 */
export type CustomerTaskAchievements = {
  /**
   * Accepted quote amounts on `COMPLETED` hosted orders, grouped by currency.
   * Off-platform amounts agreed with the worker. Subscription charges are not included.
   */
  agreedTotalsOnCompletedJobs: Array<Price>;
  /** Category mix of those `COMPLETED` hosted orders (snapshot category). */
  categoryMix: Array<TaskAchievementCategoryShare>;
  /**
   * True when this account has posted any task or has any order as the customer.
   * False when there is no customer-side history.
   */
  hasActivity: Scalars['Boolean']['output'];
  /** Orders with status `COMPLETED` where this account is the customer. */
  hostedCompletedCount: Scalars['Int']['output'];
  /** Most common area on those `COMPLETED` hosted orders. Null when none have a place label. */
  mostUsedLocation?: Maybe<TaskAchievementLocationStat>;
  /**
   * Quotes received on this account's posted tasks. EXPIRED rows (withdrawn or
   * overwritten) and quotes on canceled tasks are excluded.
   */
  quotesReceived: Scalars['Int']['output'];
};

/** Per-device push registration. Multi-device per user is allowed. */
export type DevicePushToken = {
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  platform: PushPlatform;
  token: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/**
 * Product feedback from a guest or signed-in user (bugs, ratings, feature
 * requests, general comments). Distinct from trust-and-safety `Report`.
 * Submitters see the create payload. Ops list via `@admin` `adminFeedbacks`.
 * There is no public list.
 */
export type Feedback = {
  /** When the auto-ack email was sent. Null if persist succeeded but email failed. */
  ackEmailSentAt?: Maybe<Scalars['DateTime']['output']>;
  category: FeedbackCategory;
  createdAt: Scalars['DateTime']['output'];
  /** Address used for the auto-ack email. From the form, or the signed-in user. */
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  /** Full page URL they submitted from, when the client sends it. */
  pageUrl?: Maybe<Scalars['String']['output']>;
  /** Path-only fallback (for example `/dashboard`) when a full URL is unavailable. */
  path?: Maybe<Scalars['String']['output']>;
  /** Optional 1–5 score. Required when `category` is RATING. */
  rating?: Maybe<Scalars['Int']['output']>;
  status: FeedbackStatus;
  updatedAt: Scalars['DateTime']['output'];
  /**
   * Live User when `userId` still exists. Admin-shaped for ops. Null for guests
   * or if the account was deleted.
   */
  user?: Maybe<User>;
  userAgent?: Maybe<Scalars['String']['output']>;
  /** Authenticated submitter when the request had a JWT. Null for guests. */
  userId?: Maybe<Scalars['ID']['output']>;
};

export enum FeedbackCategory {
  Bug = 'BUG',
  FeatureRequest = 'FEATURE_REQUEST',
  General = 'GENERAL',
  Rating = 'RATING'
}

export type FeedbackPage = {
  items: Array<Feedback>;
  /** Opaque cursor (`feedback` id) for the next page, or null when there are no more items. */
  nextCursor?: Maybe<Scalars['String']['output']>;
};

export enum FeedbackStatus {
  Dismissed = 'DISMISSED',
  Open = 'OPEN',
  Replied = 'REPLIED',
  Reviewed = 'REVIEWED'
}

export enum FlashKind {
  CancellationDeclined = 'CANCELLATION_DECLINED',
  CancellationRequested = 'CANCELLATION_REQUESTED',
  OrderCancelled = 'ORDER_CANCELLED',
  OrderCompleted = 'ORDER_COMPLETED',
  OrderConflict = 'ORDER_CONFLICT',
  OrderMarkedDone = 'ORDER_MARKED_DONE',
  OrderMarkedFailed = 'ORDER_MARKED_FAILED',
  QuoteAccepted = 'QUOTE_ACCEPTED',
  QuoteDeclined = 'QUOTE_DECLINED',
  /**
   * The owner accepted another worker's quote. Only the non-selected worker sees
   * it; it carries their quote (now NOT_SELECTED).
   */
  QuoteNotSelected = 'QUOTE_NOT_SELECTED',
  QuoteReceived = 'QUOTE_RECEIVED',
  /**
   * The worker withdrew their quote. Owner and worker see it; it carries the
   * quote (now WITHDRAWN).
   */
  QuoteWithdrawn = 'QUOTE_WITHDRAWN',
  RescheduleConfirmed = 'RESCHEDULE_CONFIRMED',
  RescheduleDeclined = 'RESCHEDULE_DECLINED',
  RescheduleRequested = 'RESCHEDULE_REQUESTED',
  /** Ask the viewer to review the other party. Carries `orderId`. */
  ReviewPrompt = 'REVIEW_PROMPT',
  /** Ops announcement in the `SYSTEM` thread. */
  SystemAnnouncement = 'SYSTEM_ANNOUNCEMENT',
  /**
   * The owner cancelled the task. Each worker with a pending quote gets one,
   * carrying their quote (still PENDING, so a reopen can bring it back).
   */
  TaskCancelled = 'TASK_CANCELLED',
  /**
   * The owner reopened the task (`reopenTask`). Each worker whose quote is
   * pending again gets one, carrying their quote.
   */
  TaskReopened = 'TASK_REOPENED'
}

export type ForgotPasswordPayload = {
  cooldownSecondsRemaining: Scalars['Int']['output'];
  resetToken?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

/** Map viewport for geo filtering: south-west and north-east corners in decimal degrees. */
export type GeoBoundsInput = {
  neLat: Scalars['Float']['input'];
  neLng: Scalars['Float']['input'];
  swLat: Scalars['Float']['input'];
  swLng: Scalars['Float']['input'];
};

/**
 * Identity verification progress for a worker. `NOT_STARTED` until the worker
 * begins identity checks; `PENDING` while checks are in review; `VERIFIED` once
 * approved. `worker.isVerified` is derived from this (`VERIFIED` only).
 */
export enum IdentityVerificationStatus {
  NotStarted = 'NOT_STARTED',
  Pending = 'PENDING',
  Verified = 'VERIFIED'
}

/**
 * One image upload (BE-83). PUT the file's bytes to `url`, then pass `uploadKey`
 * to `finalizeTaskImage` or `finalizeAvatarUpload`. The upload is private, and
 * one that is never finalized is deleted after about an hour.
 */
export type ImageUpload = {
  /** Pass this to the finalize mutation. */
  uploadKey: Scalars['String']['output'];
  /** Time-limited presigned PUT URL. Any Content-Type; the server reads the bytes. */
  url: Scalars['String']['output'];
};

export type LinkLoginMethodInput = {
  /**
   * `APPLE` only. The one-time authorization code, so deletion can revoke the
   * refresh token. Optional.
   */
  authorizationCode?: InputMaybe<Scalars['String']['input']>;
  /** `APPLE` only. Used to fill an empty profile name. The address comes from the token. */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** `APPLE` only. See `firstName`. */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** `GOOGLE` or `APPLE`. `PASSWORD` is `LOGIN_METHOD_NOT_SUPPORTED`. */
  method: LoginMethod;
  /** `APPLE` only. The raw nonce. Same rule as `LoginInput.nonce`. */
  nonce?: InputMaybe<Scalars['String']['input']>;
  /**
   * `GOOGLE`: Google ID token. `APPLE`: Sign in with Apple identity token.
   * Invalid or expired: `INVALID_OAUTH_TOKEN`.
   */
  oauthToken: Scalars['String']['input'];
};

export type Location = {
  /** Free-text or structured address line when present. */
  address?: Maybe<Scalars['String']['output']>;
  /** Latitude in decimal degrees. */
  lat?: Maybe<Scalars['Float']['output']>;
  /** Longitude in decimal degrees. */
  lng?: Maybe<Scalars['Float']['output']>;
  /** Display or geocoding label (for example from Mapbox). */
  name?: Maybe<Scalars['String']['output']>;
};

export type LocationInput = {
  /** Free-text or structured address line when present. */
  address?: InputMaybe<Scalars['String']['input']>;
  /** Latitude in decimal degrees. */
  lat?: InputMaybe<Scalars['Float']['input']>;
  /** Longitude in decimal degrees. */
  lng?: InputMaybe<Scalars['Float']['input']>;
  /** Display or geocoding label (for example from Mapbox). */
  name?: InputMaybe<Scalars['String']['input']>;
};

export type LoginInput = {
  /**
   * `APPLE` only. The one-time authorization code from the sign-in. Exchanged
   * for a refresh token so account deletion can revoke it. Optional: sign-in
   * still works without it, and those accounts cannot be revoked at Apple.
   */
  authorizationCode?: InputMaybe<Scalars['String']['input']>;
  /** Cloudflare Turnstile token. Prefer this arg; API also accepts `x-captcha-token`. */
  captchaToken?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  /**
   * `APPLE` only: the name Apple returns to the client on the first authorization.
   * Used only when the account is created. The email always comes from the token.
   */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** `APPLE` only. See `firstName`. */
  lastName?: InputMaybe<Scalars['String']['input']>;
  method?: LoginMethod;
  /**
   * `APPLE` only. The raw nonce. The identity token's `nonce` claim must be the
   * SHA-256 hex of this value. A token that carries a nonce, or a raw value that
   * does not match, is `INVALID_OAUTH_TOKEN`. Clients that do not send one yet
   * can omit it; their tokens have no nonce claim.
   */
  nonce?: InputMaybe<Scalars['String']['input']>;
  /**
   * `GOOGLE`: Google ID token. `APPLE`: Sign in with Apple identity token (audience
   * = web Services ID or iOS bundle ID). Invalid or expired: `INVALID_OAUTH_TOKEN`.
   * A first Google / Apple login whose email matches an existing account links to it
   * only when that account's email is verified and the provider verified it too;
   * otherwise `OAUTH_LINK_REQUIRES_VERIFIED_EMAIL` (sign in with the password and
   * verify the email first). Email already linked to a different Google / Apple
   * account: `OAUTH_ACCOUNT_CONFLICT`. Linking a provider whose address is not the
   * account email is `linkLoginMethod`, while signed in. That keeps `email`.
   */
  oauthToken?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
};

export enum LoginMethod {
  Apple = 'APPLE',
  Google = 'GOOGLE',
  Password = 'PASSWORD'
}

export type Mutation = {
  _empty?: Maybe<Scalars['String']['output']>;
  /** The other party agrees → CANCELLED. */
  acceptOrderCancellation: Order;
  /**
   * Accept a worker's quote on one of its slots and create the Order (booked at that slot).
   * Works from Messages with a flash's `quoteId` and a `quote.proposedSlots` id.
   * Every other worker's PENDING quote becomes NOT_SELECTED, and each of them gets
   * a `QUOTE_NOT_SELECTED` flash carrying their quote. Errors include
   * `TASK_NOT_OPEN` (also while cancelled), `TASK_SUSPENDED`, and
   * `COUNTERPARTY_SUSPENDED` (the quoting worker's account is suspended).
   */
  acceptQuote: AcceptQuotePayload;
  /**
   * Worker submits a quote, or updates a pending quote by inserting another row
   * for the same task. The previous live quote for that worker and task becomes
   * EXPIRED. Free tier allows 3 distinct tasks per UTC month that still have a
   * non-EXPIRED quote created that month. Edits on a live quote do not use
   * another slot. After withdraw, that task no longer counts until quoted again.
   * Unlimited and Pro memberships bypass the cap.
   * Blocked while this worker has an ACCEPTED quote on the task.
   * Every quote, new or updated, raises its own `QUOTE_RECEIVED` flash carrying it.
   * A suspended task: `TASK_SUSPENDED` for a worker who already quoted on it,
   * `TASK_NOT_FOUND` for anyone else.
   */
  addQuote: Quote;
  /** Ops soft-hide. Keeps the row. Does not add the author review-then-delete flag. */
  adminHideReview: Review;
  /**
   * Ops announcement as a flash in each recipient's `SYSTEM` thread, with push.
   *
   * Targets are the union of `userIds` and `cohortKeys`. Omitting both is rejected
   * (no push-to-all). `dryRun: true` returns the recipient count and an audit row
   * without writing flashes. Live sends are rate-limited.
   *
   * Errors: `FLASH_TARGET_REQUIRED`, `FLASH_USER_IDS_CAP`, `FLASH_RECIPIENT_CAP`,
   * `USER_NOT_FOUND`, `FLASH_TITLE_REQUIRED`, `FLASH_BODY_REQUIRED`,
   * `INVALID_FLASH_URL`, `ADMIN_FLASH_RATE_LIMITED`, `UNKNOWN_COHORT_KEY`, `NOT_ADMIN`.
   */
  adminSendSystemFlash: AdminSendSystemFlashPayload;
  /**
   * Suspend a task by Slashie, or lift that suspension (BE-108). See
   * `TaskSuspension`: the task leaves every public list, non-parties get
   * `NOT_FOUND`, and everything on it is frozen. Lifting it leaves a suspension
   * because the poster's account is suspended in place. Logs `TASK_SUSPENDED` /
   * `TASK_UNSUSPENDED` (reason `SLASHIE`); a call that changes nothing logs
   * nothing. Throws `TASK_NOT_FOUND`.
   */
  adminSetTaskSuspended: Task;
  /**
   * Disable (suspend) or re-enable a marketplace account. Login still succeeds
   * and returns `user.disabled: true`. `@auth` actions (except `Query.me`) throw
   * `ACCOUNT_DISABLED`. Password-reset tokens are cleared on disable.
   *
   * Disabling also suspends every task the user posted
   * (`Task.suspension.posterSuspended`, logged `TASK_SUSPENDED` with reason
   * `POSTER_SUSPENDED`) and freezes their quotes and bookings on other people's
   * tasks (`COUNTERPARTY_SUSPENDED` for the other party). Re-enabling lifts the
   * poster suspension (`TASK_UNSUSPENDED`) but not a suspension by Slashie.
   * Nothing else is rewritten either way.
   */
  adminSetUserDisabled: User;
  /** Set product-feedback status. Does not send the draft reply. */
  adminUpdateFeedbackStatus: Feedback;
  /**
   * Set report status for the ops inbox. Same `reports` collection as BE-40
   * `updateReportStatus` (env allowlist). Does not require ADMIN_EMAILS.
   */
  adminUpdateReportStatus: Report;
  /** God-mode task update for ops. Does not require poster ownership. */
  adminUpdateTask: Task;
  /** God-mode user update for ops. Safe fields only (name, contact, verification). */
  adminUpdateUser: User;
  /**
   * Block a user: neither side can send messages to the other until unblocked.
   * Errors: `CANNOT_BLOCK_SELF`.
   */
  blockUser: Scalars['Boolean']['output'];
  /** Drop a pending email change. Earlier links for it stop working. */
  cancelEmailChange: Scalars['Boolean']['output'];
  /** Drop a pending phone change. The saved number is untouched. */
  cancelPhoneChange: Scalars['Boolean']['output'];
  /** The requester withdraws their reschedule request → ACTIVE. */
  cancelRescheduleRequest: Order;
  /**
   * Cancel an open task owned by the current user. Pending quotes stay PENDING,
   * so `reopenTask` can bring them back, but none can be accepted while the task
   * is cancelled. Each worker with a pending quote gets a `TASK_CANCELLED` flash
   * carrying their quote. Errors: `TASK_HAS_ACCEPTED_QUOTE` (someone is booked),
   * `TASK_ALREADY_CANCELLED` (a repeat call; nothing more is logged),
   * `TASK_CHANGED` (it changed while cancelling; read it again),
   * `TASK_SUSPENDED`.
   */
  cancelTask: Task;
  /**
   * Replace the password while signed in. The current password is the re-auth
   * (login rate limit and lockout). Google / Apple-only accounts use
   * `setPassword`. Ends every other session (BE-102): tokens issued before now
   * stop working and open subscriptions close. Returns a new token for this
   * device; store it in place of the old one. Errors: `PASSWORD_NOT_SET`,
   * `INVALID_CREDENTIALS`, `WEAK_PASSWORD` (under 8 characters),
   * `PASSWORD_UNCHANGED`.
   */
  changePassword: AuthPayload;
  /** The other party picks one proposed slot → ACTIVE with the new booked time. */
  confirmReschedule: Order;
  /**
   * Submit product feedback. Auth optional. Rate-limited per IP and email.
   * Persists first, then sends an auto-ack (fail-open if email fails).
   */
  createFeedback: Feedback;
  /**
   * A new private upload for one image. Accepted images: JPEG, PNG, WebP,
   * HEIC/HEIF and AVIF, up to 15 MB and 100 megapixels.
   */
  createImageUpload: ImageUpload;
  /**
   * Submit a report against a task, worker profile, user, or review. Auth required.
   * Rate-limited per user and IP. Rejects self-reports and unknown targets.
   */
  createReport: Report;
  /**
   * Submit the caller's one review for a COMPLETED order. Open to either party,
   * not a founding cohort. Rate-limited to 10 reviews per account per UTC day.
   * `createReview`, `updateReview` and `hideReview` are refused while the
   * booking is frozen (BE-108): `TASK_SUSPENDED` (its task is suspended) or
   * `COUNTERPARTY_SUSPENDED` (the other party's account is).
   */
  createReview: Review;
  /** Create a task (customer \"post a task\"). Requires authentication via request header. */
  createTask: Task;
  /** Open Stripe Customer Portal for the worker's subscription. Requires stripeCustomerId. */
  createWorkerBillingPortal: PortalSessionPayload;
  /** Start Stripe Checkout for Slashie Unlimited. Requires an existing Worker profile. */
  createWorkerSubscriptionCheckout: CheckoutSessionPayload;
  /** The other party refuses → back to ACTIVE (or stays CONFLICT). */
  declineOrderCancellation: Order;
  /**
   * Task poster declines a worker's pending quote (not the same as `withdrawQuote`).
   * Works from Messages with a flash's `quoteId`. Raises `QUOTE_DECLINED` with the
   * quote. Errors include `TASK_SUSPENDED` and `COUNTERPARTY_SUSPENDED` (the
   * quoting worker's account is suspended).
   */
  declineQuote: Quote;
  /** The other party rejects the request → ACTIVE with the old booked time. */
  declineReschedule: Order;
  /**
   * Converts an upload into the caller's avatar (JPEG, long edge at most
   * 1024 px, metadata removed), sets `avatarUrl` and deletes the previous
   * uploaded avatar. Errors: `UPLOAD_NOT_FOUND`, `IMAGE_TOO_LARGE`,
   * `UNSUPPORTED_IMAGE`.
   */
  finalizeAvatarUpload: User;
  /**
   * Converts an upload into task photo `index` (0 to 9) and returns its public
   * URL. Stored as a JPEG: oriented, long edge at most 2048 px, all metadata
   * (GPS included) removed. Replaces any earlier photo in that slot. Task poster
   * only, while the task is OPEN or DRAFT. Errors: `UPLOAD_NOT_FOUND`,
   * `IMAGE_TOO_LARGE`, `UNSUPPORTED_IMAGE`, `INVALID_INDEX`, `TASK_NOT_FOUND`,
   * `FORBIDDEN_TASK_UPLOAD`, `TASK_NOT_EDITABLE`, `TASK_SUSPENDED`.
   */
  finalizeTaskImage: Scalars['String']['output'];
  forgotPassword: ForgotPasswordPayload;
  /**
   * Author soft-hide. The row stays for audit and the one-review slot stays used.
   * Flags REVIEW_THEN_DELETE for the ops queue.
   */
  hideReview: Review;
  /**
   * Link Google or Apple to the signed-in account from the login method page.
   *
   * The account email stays as it is. The provider address, including an Apple
   * Hide My Email relay, is stored only as `googleLoginEmail` or
   * `appleLoginEmail`. A blank account email is filled from the provider. A new
   * Google or Apple sign-in (no account yet) still uses `loginWithMethod`, which
   * copies the provider address into `email`.
   *
   * `PASSWORD` is `LOGIN_METHOD_NOT_SUPPORTED`. A bad token is
   * `INVALID_OAUTH_TOKEN`. That Google or Apple account already on someone else,
   * or a different one already on this account, is `OAUTH_ACCOUNT_CONFLICT`.
   * Apple's first link must include the address (`APPLE_EMAIL_REQUIRED`).
   */
  linkLoginMethod: User;
  login: AuthPayload;
  loginWithMethod: AuthPayload;
  /**
   * Either party, on or after the booked start, while ACTIVE. Done means the work is
   * finished and the C2C payment is settled.
   */
  markOrderDone: Order;
  /** Either party, on or after the booked start, while ACTIVE. The reason stays private. */
  markOrderFailed: Order;
  /** Mark everything in the thread read for the viewer. */
  markThreadRead: Thread;
  /**
   * Create a password account. `@slashie.app` is reserved (`EMAIL_DOMAIN_RESERVED`);
   * staff sign in with Google or Apple.
   */
  register: AuthPayload;
  /**
   * Register or refresh a device push token for the authenticated user.
   * Upserts by token so the same device can move between accounts.
   */
  registerDevicePushToken: DevicePushToken;
  /**
   * Register or refresh a browser Web Push subscription for the authenticated user.
   * Upserts by `endpoint` so the same browser can move between accounts.
   * Keys are stored server-side and are not returned.
   *
   * Errors: `INVALID_WEB_PUSH_SUBSCRIPTION`.
   */
  registerWebPushSubscription: WebPushSubscription;
  /**
   * Reopen one of your tasks for quotes (BE-108). Two cases:
   * - A CANCELLED task goes back to OPEN. Quotes that were still PENDING can be
   *   accepted again; declined and withdrawn ones stay closed.
   * - A booked task (AWARDED, live order) whose booked worker's account is
   *   suspended (`Order.counterpartySuspension.canReopen`): the order becomes
   *   CANCELLED (`ORDER_CANCELLED`), that worker's quote DECLINED
   *   (`QUOTE_DECLINED`), the task OPEN, and the quotes that were not selected
   *   PENDING again.
   * Logs `TASK_REOPENED`, and each worker whose quote is pending again gets a
   * `TASK_REOPENED` flash carrying it. Errors: `TASK_NOT_FOUND`, `FORBIDDEN`
   * (not the owner), `TASK_SUSPENDED` (a suspended task cannot be reopened),
   * `TASK_ALREADY_OPEN` (OPEN or DRAFT), `WORKER_NOT_SUSPENDED` (booked to a
   * worker whose account is active: cancel through the booking instead),
   * `TASK_NOT_REOPENABLE` (anything else, such as a finished booking),
   * `TASK_CHANGED` (it changed while reopening; read it again).
   */
  reopenTask: Task;
  /**
   * Delete my account. The account is disabled straight away and anonymised 30
   * days later unless restored. Open tasks are cancelled and pending quotes
   * withdrawn (they stay that way after a restore). Emails a confirmation now, a
   * reminder around day 25, and a notice when done.
   *
   * Re-auth: password accounts must pass `password` (behind the login rate limit
   * and lockout; wrong: `INVALID_CREDENTIALS`). Google / Apple-only accounts must
   * have signed in within the last 10 minutes (`REAUTH_REQUIRED`).
   * Blocked while any of my orders is ACTIVE, RESCHEDULING, CANCEL_REQUESTED or
   * CONFLICT: `ACCOUNT_HAS_LIVE_ORDERS`.
   */
  requestAccountDeletion: User;
  /**
   * Start an email change (password accounts only). Stores `pendingEmail`, emails
   * a verify link to it, and notifies the current address. `email` changes only
   * when the link is used (`verifyEmail`). Errors: `EMAIL_CHANGE_NOT_ALLOWED`
   * (Google- or Apple-only account), `INVALID_CREDENTIALS` (behind the login rate limit and
   * lockout), `INVALID_EMAIL`, `EMAIL_UNCHANGED`, `EMAIL_DOMAIN_RESERVED`
   * (`@slashie.app`), `EMAIL_OR_PHONE_IN_USE`,
   * `RESEND_VERIFICATION_RATE_LIMITED`.
   */
  requestEmailChange: Scalars['Boolean']['output'];
  /** Either party asks to cancel: before the booked start (→ CANCEL_REQUESTED), or while CONFLICT. */
  requestOrderCancellation: Order;
  /** Either party, before the booked start, while ACTIVE: propose 1-2 new slots → RESCHEDULING. */
  requestReschedule: Order;
  /**
   * Resend the verification email. Goes to `pendingEmail` when an email change is
   * waiting, otherwise to the unverified `email`. Rate-limited (max once per 2 minutes):
   * `RESEND_VERIFICATION_RATE_LIMITED`.
   */
  resendVerificationEmail: Scalars['Boolean']['output'];
  /**
   * Set a new password from the emailed reset link. Ends every session that
   * existed before (BE-102) and returns a token for this device.
   */
  resetPassword: AuthPayload;
  /**
   * Cancel a pending account deletion (after a normal sign-in). Allowed while
   * the account is disabled for deletion. No deletion pending: returns the user
   * unchanged.
   */
  restoreAccount: User;
  /** Save this worker to the viewer's list. Idempotent; cannot save yourself. */
  saveWorker: Worker;
  /**
   * Incremental worker onboarding save. Upserts a draft worker row and merges `setupProgress`.
   * Each sub-step validates its fields before marking complete.
   * Workers who have already completed setup can replay sub-steps to edit their
   * profile: the data is validated and saved, but setup progress and directory
   * visibility are untouched.
   */
  saveWorkerSetupStep: Worker;
  /**
   * Send a chat message in a task thread. Only the owner and the accepted worker
   * can send, once a quote is accepted (or an order exists); it never locks again.
   * Errors: `MESSAGE_EMPTY`, `MESSAGE_TOO_LONG` (2000 characters), `FORBIDDEN`
   * (not the owner or accepted worker, or a system thread), `MESSAGE_LOCKED` (no
   * accepted quote yet), `MESSAGE_BLOCKED` (either side blocked the other),
   * `MESSAGE_RATE_LIMITED`, `TASK_SUSPENDED`, `COUNTERPARTY_SUSPENDED` (the
   * other party's account is suspended).
   */
  sendMessage: ThreadItem;
  /**
   * Send a 6-digit SMS code (Twilio Verify) to `phone` and hold it as `pendingPhone`.
   * The saved number and its verification stay live until `verifyPhone`. Works
   * for first-time verification (the saved number) and for changing a verified
   * number. Returns true without sending when `phone` is the already verified
   * number. Replacing a verified number requires `password`, or a sign-in in the
   * last 10 minutes when the account has no password (`REAUTH_REQUIRED`), and
   * texts the old number. Errors: `EMAIL_OR_PHONE_IN_USE`,
   * `PHONE_VERIFICATION_RATE_LIMITED` (3 sends per hour per user),
   * `INVALID_CREDENTIALS`, `REAUTH_REQUIRED`.
   */
  sendPhoneVerification: Scalars['Boolean']['output'];
  /**
   * Add a password to a Google / Apple-only account. The sign-in must be from
   * the last 10 minutes (`REAUTH_REQUIRED`). Errors: `PASSWORD_ALREADY_SET`,
   * `WEAK_PASSWORD`.
   */
  setPassword: User;
  /** Force Stripe subscription reconcile and return fresh membership (e.g. after Checkout return). */
  syncWorkerBilling: WorkerMembership;
  unblockUser: Scalars['Boolean']['output'];
  /**
   * Remove Google or Apple from the signed-in account. The account email stays.
   * `PASSWORD` is `LOGIN_METHOD_NOT_SUPPORTED`. Refuses when it would leave no
   * password and no other provider (`LAST_LOGIN_METHOD`): set a password or keep
   * the other provider first. Already unlinked: returns the user unchanged.
   */
  unlinkLoginMethod: User;
  /**
   * Unregister a device push token owned by the authenticated user.
   * Returns true when a matching active token was removed/deactivated.
   */
  unregisterDevicePushToken: Scalars['Boolean']['output'];
  /**
   * Unregister a Web Push subscription owned by the authenticated user.
   * Returns true when a matching active subscription was deactivated.
   */
  unregisterWebPushSubscription: Scalars['Boolean']['output'];
  /** Remove this worker from the viewer's list. Idempotent. */
  unsaveWorker: Worker;
  /**
   * Turn marketing email off from the link in a marketing email. No login. Safe
   * to repeat. The token never expires. The same token also works as a one-click
   * `POST /unsubscribe?token=` (RFC 8058, used by mail apps).
   * Errors: `INVALID_UNSUBSCRIBE_TOKEN`.
   */
  unsubscribeMarketingEmails: Scalars['Boolean']['output'];
  updateMyProfile: User;
  updateMySettings: User;
  /**
   * Env-allowlist ops: set report status. Requires ADMIN_USER_IDS or
   * ADMIN_EMAILS. Prefer `adminUpdateReportStatus` (`@admin`) for the panel.
   */
  updateReportStatus: Report;
  /**
   * Change stars and/or comment within 48 hours of submit. Rejected after that,
   * and rejected once the review is hidden.
   */
  updateReview: Review;
  /**
   * Amend an existing task owned by the current user. Only allowed while the task
   * is `OPEN`/`DRAFT`; partial update (only provided fields change).
   * Suspended: `TASK_SUSPENDED`.
   */
  updateTask: Task;
  /**
   * Edit a finished worker profile in one call. Same checks as replaying
   * `saveWorkerSetupStep` for details, bio, skills, experience, location,
   * travel and portfolio. Setup progress stays complete. A draft is
   * `WORKER_SETUP_INCOMPLETE` — finish setup with `saveWorkerSetupStep`.
   */
  updateWorkerProfile: Worker;
  /**
   * Complete email verification from the signed link (`/verify-email?token=...`).
   * Returns a fresh session token with `emailVerified: true`. Idempotent when already verified.
   *
   * A link for the account's `pendingEmail` completes an email change: `email`
   * becomes the pending address, the old address gets a notice. A link for an
   * address that is neither the email nor the pending email (cancelled or
   * replaced): `EMAIL_MISMATCH`. Address taken meanwhile: `EMAIL_OR_PHONE_IN_USE`.
   * A pending `@slashie.app` address: `EMAIL_DOMAIN_RESERVED`.
   */
  verifyEmail: AuthPayload;
  /**
   * Submit the SMS code sent to `pendingPhone`. On approval the pending number
   * becomes `profile.contactNumber` with `phoneVerifiedAt` set. Errors:
   * `PHONE_VERIFICATION_NOT_REQUESTED`, `INVALID_OR_EXPIRED_VERIFICATION`,
   * `EMAIL_OR_PHONE_IN_USE` (number taken since the code was sent).
   */
  verifyPhone: Scalars['Boolean']['output'];
  /** The requester withdraws their cancellation request. */
  withdrawOrderCancellation: Order;
  /**
   * Worker withdraws their own pending quote before it is accepted. That quote
   * becomes WITHDRAWN (any older live versions EXPIRED), and the owner and worker
   * get a `QUOTE_WITHDRAWN` flash. Accepted quotes cannot be withdrawn. The task
   * drops out of the worker pipeline and `Task.quotes`, and stops counting toward
   * the monthly quote limit. A later `addQuote` inserts a new PENDING row.
   * Suspended task: `TASK_SUSPENDED`.
   */
  withdrawQuote: Quote;
};


export type MutationAcceptOrderCancellationArgs = {
  orderId: Scalars['ID']['input'];
};


export type MutationAcceptQuoteArgs = {
  input: AcceptQuoteInput;
};


export type MutationAddQuoteArgs = {
  input: AddQuoteInput;
};


export type MutationAdminHideReviewArgs = {
  id: Scalars['ID']['input'];
};


export type MutationAdminSendSystemFlashArgs = {
  input: AdminSendSystemFlashInput;
};


export type MutationAdminSetTaskSuspendedArgs = {
  id: Scalars['ID']['input'];
  suspended: Scalars['Boolean']['input'];
};


export type MutationAdminSetUserDisabledArgs = {
  disabled: Scalars['Boolean']['input'];
  id: Scalars['ID']['input'];
};


export type MutationAdminUpdateFeedbackStatusArgs = {
  id: Scalars['ID']['input'];
  status: FeedbackStatus;
};


export type MutationAdminUpdateReportStatusArgs = {
  id: Scalars['ID']['input'];
  status: ReportStatus;
};


export type MutationAdminUpdateTaskArgs = {
  id: Scalars['ID']['input'];
  input: AdminUpdateTaskInput;
};


export type MutationAdminUpdateUserArgs = {
  id: Scalars['ID']['input'];
  input: AdminUpdateUserInput;
};


export type MutationBlockUserArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationCancelRescheduleRequestArgs = {
  orderId: Scalars['ID']['input'];
};


export type MutationCancelTaskArgs = {
  taskId: Scalars['ID']['input'];
};


export type MutationChangePasswordArgs = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};


export type MutationConfirmRescheduleArgs = {
  orderId: Scalars['ID']['input'];
  slotId: Scalars['ID']['input'];
};


export type MutationCreateFeedbackArgs = {
  input: CreateFeedbackInput;
};


export type MutationCreateReportArgs = {
  input: CreateReportInput;
};


export type MutationCreateReviewArgs = {
  input: CreateReviewInput;
};


export type MutationCreateTaskArgs = {
  input: CreateTaskInput;
};


export type MutationCreateWorkerBillingPortalArgs = {
  returnUrl: Scalars['String']['input'];
};


export type MutationCreateWorkerSubscriptionCheckoutArgs = {
  cancelUrl: Scalars['String']['input'];
  successUrl: Scalars['String']['input'];
};


export type MutationDeclineOrderCancellationArgs = {
  orderId: Scalars['ID']['input'];
};


export type MutationDeclineQuoteArgs = {
  quoteId: Scalars['ID']['input'];
};


export type MutationDeclineRescheduleArgs = {
  orderId: Scalars['ID']['input'];
};


export type MutationFinalizeAvatarUploadArgs = {
  uploadKey: Scalars['String']['input'];
};


export type MutationFinalizeTaskImageArgs = {
  index: Scalars['Int']['input'];
  taskId: Scalars['ID']['input'];
  uploadKey: Scalars['String']['input'];
};


export type MutationForgotPasswordArgs = {
  captchaToken?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
};


export type MutationHideReviewArgs = {
  id: Scalars['ID']['input'];
};


export type MutationLinkLoginMethodArgs = {
  input: LinkLoginMethodInput;
};


export type MutationLoginArgs = {
  captchaToken?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  method?: LoginMethod;
  password: Scalars['String']['input'];
};


export type MutationLoginWithMethodArgs = {
  input: LoginInput;
};


export type MutationMarkOrderDoneArgs = {
  orderId: Scalars['ID']['input'];
};


export type MutationMarkOrderFailedArgs = {
  orderId: Scalars['ID']['input'];
  reason: OrderFailedReason;
};


export type MutationMarkThreadReadArgs = {
  threadId: Scalars['ID']['input'];
};


export type MutationRegisterArgs = {
  captchaToken?: InputMaybe<Scalars['String']['input']>;
  contactNumber?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
};


export type MutationRegisterDevicePushTokenArgs = {
  platform?: InputMaybe<PushPlatform>;
  token: Scalars['String']['input'];
};


export type MutationRegisterWebPushSubscriptionArgs = {
  input: RegisterWebPushSubscriptionInput;
};


export type MutationReopenTaskArgs = {
  taskId: Scalars['ID']['input'];
};


export type MutationRequestAccountDeletionArgs = {
  password?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRequestEmailChangeArgs = {
  newEmail: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationRequestOrderCancellationArgs = {
  orderId: Scalars['ID']['input'];
};


export type MutationRequestRescheduleArgs = {
  orderId: Scalars['ID']['input'];
  proposedSlots: Array<TimeSlotInput>;
};


export type MutationResetPasswordArgs = {
  newPassword: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


export type MutationSaveWorkerArgs = {
  workerId: Scalars['ID']['input'];
};


export type MutationSaveWorkerSetupStepArgs = {
  input: SaveWorkerSetupStepInput;
};


export type MutationSendMessageArgs = {
  body: Scalars['String']['input'];
  threadId: Scalars['ID']['input'];
};


export type MutationSendPhoneVerificationArgs = {
  password?: InputMaybe<Scalars['String']['input']>;
  phone: Scalars['String']['input'];
};


export type MutationSetPasswordArgs = {
  newPassword: Scalars['String']['input'];
};


export type MutationUnblockUserArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationUnlinkLoginMethodArgs = {
  method: LoginMethod;
};


export type MutationUnregisterDevicePushTokenArgs = {
  token: Scalars['String']['input'];
};


export type MutationUnregisterWebPushSubscriptionArgs = {
  endpoint: Scalars['String']['input'];
};


export type MutationUnsaveWorkerArgs = {
  workerId: Scalars['ID']['input'];
};


export type MutationUnsubscribeMarketingEmailsArgs = {
  token: Scalars['String']['input'];
};


export type MutationUpdateMyProfileArgs = {
  input: UpdateMyProfileInput;
};


export type MutationUpdateMySettingsArgs = {
  input: UpdateMySettingsInput;
};


export type MutationUpdateReportStatusArgs = {
  id: Scalars['ID']['input'];
  status: ReportStatus;
};


export type MutationUpdateReviewArgs = {
  id: Scalars['ID']['input'];
  input: UpdateReviewInput;
};


export type MutationUpdateTaskArgs = {
  input: UpdateTaskInput;
  taskId: Scalars['ID']['input'];
};


export type MutationUpdateWorkerProfileArgs = {
  input: UpdateWorkerProfileInput;
};


export type MutationVerifyEmailArgs = {
  token: Scalars['String']['input'];
};


export type MutationVerifyPhoneArgs = {
  code: Scalars['String']['input'];
};


export type MutationWithdrawOrderCancellationArgs = {
  orderId: Scalars['ID']['input'];
};


export type MutationWithdrawQuoteArgs = {
  quoteId: Scalars['ID']['input'];
};

export type MyOrdersFilter = {
  role?: InputMaybe<OrderPartyRole>;
  status?: InputMaybe<Array<OrderStatus>>;
};

/**
 * My Tasks hub buckets on `/tasks`.
 *
 * `OPEN` is posted drafts/open tasks, or a pending quote on an open task nobody else has been awarded.
 * `BOOKED` is awarded or in-progress work, including an accepted quote or an active order.
 * `COMPLETED` is finished, confirmed, cancelled, or otherwise closed for this viewer.
 */
export enum MyTaskHubSection {
  Booked = 'BOOKED',
  Completed = 'COMPLETED',
  Open = 'OPEN'
}

/** Owner-only My Tasks achievements. `worker` and `customer` are independent. */
export type MyTasksAchievements = {
  customer: CustomerTaskAchievements;
  worker: WorkerTaskAchievements;
};

/**
 * A booking: one per accepted quote. A reopened task (`reopenTask`) can have
 * more than one; `Task.orders` lists them newest first.
 *
 * Every order mutation is refused while the booking is frozen (BE-108):
 * `TASK_SUSPENDED` when its task is suspended, `COUNTERPARTY_SUSPENDED` when the
 * other party's account is suspended, `ACCOUNT_DISABLED` when the caller's is.
 * The 7-day auto-Done and the lapse of a cancellation request wait too, and
 * apply once nothing is suspended.
 */
export type Order = {
  agreedPrice: OrderAgreedPrice;
  /** When the other party is auto-marked Done (7 days after a one-sided Done). */
  autoDoneAt?: Maybe<Scalars['DateTime']['output']>;
  bookedEnd?: Maybe<Scalars['DateTime']['output']>;
  /** Exact booked start (the accepted or rescheduled slot). Gates Done / Failed. */
  bookedStart: Scalars['DateTime']['output'];
  /** When the order reached COMPLETED or CANCELLED. */
  closedAt?: Maybe<Scalars['DateTime']['output']>;
  counterpartyCloseAction?: Maybe<OrderCloseAction>;
  /**
   * Set when the other party's account is suspended (BE-108), for the order's
   * two parties only; null otherwise. The booking is frozen, not cancelled:
   * every order mutation throws `COUNTERPARTY_SUSPENDED` for the viewer until
   * ops lift the suspension, which restores it exactly as it was.
   */
  counterpartySuspension?: Maybe<OrderCounterpartySuspension>;
  createdAt: Scalars['DateTime']['output'];
  customerUserId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  myCloseAction?: Maybe<OrderCloseAction>;
  pendingRequest?: Maybe<OrderPendingRequest>;
  quoteId: Scalars['ID']['output'];
  rescheduleHistory: Array<OrderReschedule>;
  /** Review eligibility and the reviews this party is allowed to see. */
  reviewState: OrderReviewState;
  snapshot: OrderSnapshot;
  status: OrderStatus;
  task: Task;
  taskId: Scalars['ID']['output'];
  workerUserId: Scalars['ID']['output'];
};

export type OrderAgreedPrice = {
  amount: Scalars['Float']['output'];
  currency: Currency;
};

export type OrderCloseAction = {
  at: Scalars['DateTime']['output'];
  /** Only set on the viewer's own action. */
  failedReason?: Maybe<OrderFailedReason>;
  kind: OrderCloseKind;
};

export enum OrderCloseKind {
  Done = 'DONE',
  Failed = 'FAILED'
}

/** The other party on a booking has a suspended account (BE-108). */
export type OrderCounterpartySuspension = {
  /**
   * True when the viewer may `reopenTask` to end this booking and take quotes
   * again: the customer, while the booking is live and the task is not itself
   * suspended. Always false for the worker, who only gets the notice.
   */
  canReopen: Scalars['Boolean']['output'];
  /** Their public display name, for "{name}'s account has been suspended". */
  name: Scalars['String']['output'];
  /**
   * Who is suspended: `WORKER` when the viewer is the customer, `CUSTOMER` when
   * the viewer is the worker.
   */
  role: OrderPartyRole;
};

/** Private to the party who chose it. */
export enum OrderFailedReason {
  NoShow = 'NO_SHOW',
  Other = 'OTHER',
  PaymentNotSettled = 'PAYMENT_NOT_SETTLED',
  WorkNotDone = 'WORK_NOT_DONE'
}

export type OrderLocationSnapshot = {
  address?: Maybe<Scalars['String']['output']>;
  lat?: Maybe<Scalars['Float']['output']>;
  lng?: Maybe<Scalars['Float']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export enum OrderPartyRole {
  Customer = 'CUSTOMER',
  Worker = 'WORKER'
}

export type OrderPendingRequest = {
  kind: OrderRequestKind;
  /** Reschedule requests only: the 1-2 proposed slots. Empty for cancellations. */
  proposedSlots: Array<TimeSlot>;
  requestedAt: Scalars['DateTime']['output'];
  requestedByUserId: Scalars['ID']['output'];
};

/** C2C job summary PDF for a completed order. Not a Slashie tax invoice. */
export type OrderReceipt = {
  contentType: Scalars['String']['output'];
  /** The disclaimer printed on the PDF. */
  disclaimer: Scalars['String']['output'];
  filename: Scalars['String']['output'];
  /** PDF bytes, base64-encoded. */
  pdfBase64: Scalars['String']['output'];
};

export enum OrderRequestKind {
  Cancel = 'CANCEL',
  Reschedule = 'RESCHEDULE'
}

/** A confirmed reschedule: the booked window before and after. */
export type OrderReschedule = {
  confirmedAt: Scalars['DateTime']['output'];
  end?: Maybe<Scalars['DateTime']['output']>;
  previousEnd?: Maybe<Scalars['DateTime']['output']>;
  previousStart: Scalars['DateTime']['output'];
  requestedByUserId: Scalars['ID']['output'];
  start: Scalars['DateTime']['output'];
};

/** What the signed-in party can see and do for reviews on one order. */
export type OrderReviewState = {
  /**
   * True when this party is on a COMPLETED order and has not used their one
   * review. False while the booking is frozen by a suspension (BE-108).
   */
  canSubmit: Scalars['Boolean']['output'];
  /** The other party's review, or null while it is locked, missing, or hidden. */
  counterpartReview?: Maybe<Review>;
  /**
   * `closedAt` plus 14 days. After this instant the other party's review is
   * visible even if only one party has submitted. Null when the order has no
   * `closedAt`.
   */
  counterpartUnlocksAt?: Maybe<Scalars['DateTime']['output']>;
  /** True when `counterpartReview` is populated. */
  counterpartVisible: Scalars['Boolean']['output'];
  /**
   * True once the viewer has submitted their review (a later soft-hide still counts).
   * Clients should hide the receipt call-to-action until this is true. The receipt
   * API itself authorizes any party on the completed order.
   */
  viewerHasSubmittedReview: Scalars['Boolean']['output'];
  /** The viewer's review, including after they soft-hide it. Null before submit. */
  viewerReview?: Maybe<Review>;
};

export type OrderSnapshot = {
  budgetAmount?: Maybe<Scalars['Float']['output']>;
  categories: Array<Scalars['String']['output']>;
  contactMethod?: Maybe<Scalars['String']['output']>;
  datetime?: Maybe<TaskDateTime>;
  description: Scalars['String']['output'];
  location: OrderLocationSnapshot;
  paymentMethod?: Maybe<TaskPaymentMethod>;
  quoteMessage?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

/**
 * Order lifecycle (BE-66 / BE-67). Before the booked start either party may request a
 * reschedule or a cancellation, which the other party confirms or declines. On or after
 * the booked start only Done / Failed apply: both Done → COMPLETED, Done vs Failed →
 * CONFLICT, both Failed → CANCELLED. CONFLICT exits only through an accepted cancellation.
 */
export enum OrderStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  /**
   * A cancellation request (made before the booked start) is waiting for the other party.
   * It lapses back to ACTIVE when the booked start passes.
   */
  CancelRequested = 'CANCEL_REQUESTED',
  Completed = 'COMPLETED',
  /** One party marked Done and the other Failed. */
  Conflict = 'CONFLICT',
  /** A reschedule request is waiting for the other party. */
  Rescheduling = 'RESCHEDULING'
}

export type PaginationInfo = {
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  page: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  totalItems: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type PaginationInput = {
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
};

export type PortalSessionPayload = {
  url: Scalars['String']['output'];
};

export type Price = {
  amount: Scalars['Float']['output'];
  currency: Currency;
};

export type PriceInput = {
  amount: Scalars['Float']['input'];
  currency: Currency;
};

/** Public Slashie Unlimited catalog for the /pricing page (Stripe-backed). */
export type Pricing = {
  description?: Maybe<Scalars['String']['output']>;
  /** Free-tier monthly allowance: distinct tasks a worker may newly quote, without a subscription. */
  freeQuotesPerMonth: Scalars['Int']['output'];
  /** Amount in minor currency units (e.g. 1999 = £19.99). */
  priceAmount: Scalars['Int']['output'];
  priceCurrency: Scalars['String']['output'];
  priceInterval: Scalars['String']['output'];
  /** Charges every this many intervals. 3 with `priceInterval` month is every 3 months. */
  priceIntervalCount: Scalars['Int']['output'];
  productName: Scalars['String']['output'];
  /** Stripe Price id for future Checkout integration. */
  stripePriceId: Scalars['String']['output'];
  /** Stripe Product id for future Checkout integration. */
  stripeProductId?: Maybe<Scalars['String']['output']>;
  /**
   * Free-trial length in days (e.g. 180 for a 6-month trial).
   * The Price's own trial when it has one, otherwise 180. Same source as Checkout.
   */
  trialDays?: Maybe<Scalars['Int']['output']>;
  /** Human-readable trial label for marketing copy (e.g. "6 months free"). */
  trialLabel?: Maybe<Scalars['String']['output']>;
};

export type Profile = {
  avatarUrl?: Maybe<Scalars['String']['output']>;
  contactNumber?: Maybe<Scalars['String']['output']>;
  /** Date of birth. Owner-only (private): returned as null for non-owner viewers. */
  dateOfBirth?: Maybe<Scalars['DateTime']['output']>;
  defaultPreferredContactMethod?: Maybe<TaskContactMethod>;
  /** Whether the owner's email is verified. Owner-only: false for other viewers. */
  emailVerified: Scalars['Boolean']['output'];
  /** Canonical display name for the user. */
  name?: Maybe<Scalars['String']['output']>;
  /** Whether the owner's phone number is verified. Owner-only: false for other viewers. */
  phoneVerified: Scalars['Boolean']['output'];
};

/**
 * Public profile for `/profile/[userId]`.
 *
 * Anonymous access is allowed. Null when the id is invalid or missing, the
 * account is disabled (suspended or banned — stored as `disabled`), deleted,
 * or `settings.isProfilePrivate` is true and the viewer is not the owner.
 * That null does not say which case it was. The owner of a private profile
 * gets this preview (`isHidden` is true), including Your activity.
 *
 * `taskAchievements` and `workHistory` are null unless the authenticated
 * viewer is this user. Strangers do not receive agreed totals, streaks,
 * quote allowance, or the day-level history list.
 *
 * Never includes email, phone, street address, or Stripe ids.
 */
export type PublicProfile = {
  /** Completed bookings this account posted. Same count as `User.hostedCompletedCount`. */
  hostedCompletedCount: Scalars['Int']['output'];
  /**
   * Stable user id (`users._id`). Same id as `/user/[id]`, `Query.user(id:)`,
   * and `me.id`.
   */
  id: Scalars['ID']['output'];
  /**
   * True when this profile is private. Only the owner receives the profile in
   * that case, so a stranger never sees this flag.
   */
  isHidden: Scalars['Boolean']['output'];
  /** True when the JWT subject is this user. Computed on the server. */
  isSelf: Scalars['Boolean']['output'];
  /** When the account was created. */
  memberSince: Scalars['DateTime']['output'];
  /** Count of publicly discoverable `OPEN` tasks, honoring `excludeTaskId`. */
  openTaskCount: Scalars['Int']['output'];
  /**
   * Tasks this user posted that are publicly discoverable: status `OPEN` and
   * not suspended. Newest first. Same redaction and limits as `PublicUser.openTasks`.
   */
  openTasks: Array<Task>;
  profile: PublicUserProfile;
  /**
   * Unlocked reviews about this user. `average` stays null until `count` is
   * at least 3.
   */
  ratingSummary: WorkerRatingSummary;
  /** Pass to `createReport`. `targetType` is `USER` and `targetId` is `id`. */
  reportTarget: PublicProfileReportTarget;
  /**
   * Unlocked reviews about this user, as worker or customer. Hidden and
   * still-locked rows are omitted. Same mutual-unlock rule as worker reviews:
   * both parties have a review row, or 14 days have passed since completion.
   * Newest first.
   */
  reviews: Array<Review>;
  /**
   * Same payload as `me.taskAchievements`, including agreed totals, streaks,
   * and quote allowance. Null for every other viewer.
   */
  taskAchievements?: Maybe<MyTasksAchievements>;
  /** `WORKER` when `worker` is present. Otherwise `CUSTOMER`. */
  userType: PublicProfileUserType;
  /**
   * Completed orders only (canceled and any non-completed status, including a
   * future disputed status, are excluded). Newest first, capped at 200.
   * A self-hired order (same account on both sides) appears once, as `WORKER`.
   *
   * Null for every viewer who is not this user. Omit `search` to feed a
   * calendar; pass `search` for a case-insensitive match on title, any category,
   * and area label. Agreed amounts are not on these rows.
   */
  workHistory?: Maybe<Array<PublicProfileWorkHistoryItem>>;
  /**
   * Present when a directory-visible worker profile exists. Null for customers
   * and for workers who have not finished setup.
   */
  worker?: Maybe<PublicProfileWorker>;
};


/**
 * Public profile for `/profile/[userId]`.
 *
 * Anonymous access is allowed. Null when the id is invalid or missing, the
 * account is disabled (suspended or banned — stored as `disabled`), deleted,
 * or `settings.isProfilePrivate` is true and the viewer is not the owner.
 * That null does not say which case it was. The owner of a private profile
 * gets this preview (`isHidden` is true), including Your activity.
 *
 * `taskAchievements` and `workHistory` are null unless the authenticated
 * viewer is this user. Strangers do not receive agreed totals, streaks,
 * quote allowance, or the day-level history list.
 *
 * Never includes email, phone, street address, or Stripe ids.
 */
export type PublicProfileOpenTaskCountArgs = {
  excludeTaskId?: InputMaybe<Scalars['ID']['input']>;
};


/**
 * Public profile for `/profile/[userId]`.
 *
 * Anonymous access is allowed. Null when the id is invalid or missing, the
 * account is disabled (suspended or banned — stored as `disabled`), deleted,
 * or `settings.isProfilePrivate` is true and the viewer is not the owner.
 * That null does not say which case it was. The owner of a private profile
 * gets this preview (`isHidden` is true), including Your activity.
 *
 * `taskAchievements` and `workHistory` are null unless the authenticated
 * viewer is this user. Strangers do not receive agreed totals, streaks,
 * quote allowance, or the day-level history list.
 *
 * Never includes email, phone, street address, or Stripe ids.
 */
export type PublicProfileOpenTasksArgs = {
  excludeTaskId?: InputMaybe<Scalars['ID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


/**
 * Public profile for `/profile/[userId]`.
 *
 * Anonymous access is allowed. Null when the id is invalid or missing, the
 * account is disabled (suspended or banned — stored as `disabled`), deleted,
 * or `settings.isProfilePrivate` is true and the viewer is not the owner.
 * That null does not say which case it was. The owner of a private profile
 * gets this preview (`isHidden` is true), including Your activity.
 *
 * `taskAchievements` and `workHistory` are null unless the authenticated
 * viewer is this user. Strangers do not receive agreed totals, streaks,
 * quote allowance, or the day-level history list.
 *
 * Never includes email, phone, street address, or Stripe ids.
 */
export type PublicProfileWorkHistoryArgs = {
  search?: InputMaybe<Scalars['String']['input']>;
};

/**
 * Identity for `createReport` from `/profile/[userId]`.
 * Always `USER` and the profile user id — not the worker document id.
 */
export type PublicProfileReportTarget = {
  targetId: Scalars['ID']['output'];
  targetType: ReportTargetType;
};

export enum PublicProfileUserType {
  /** No directory-visible worker profile. The account can still host tasks. */
  Customer = 'CUSTOMER',
  /** A directory-visible worker profile exists (setup complete). */
  Worker = 'WORKER'
}

/**
 * One completed order for the owner's calendar and searchable history.
 * No agreed amount. Area is borough/city, not a street.
 */
export type PublicProfileWorkHistoryItem = {
  /** Borough/city area. A leading street segment is dropped. */
  areaLabel?: Maybe<Scalars['String']['output']>;
  categories: Array<Scalars['String']['output']>;
  completedAt: Scalars['DateTime']['output'];
  orderId: Scalars['ID']['output'];
  role: PublicProfileWorkRole;
  taskId: Scalars['ID']['output'];
  title: Scalars['String']['output'];
};

/** Which side of a completed order this account was on. */
export enum PublicProfileWorkRole {
  /** This account hosted the task. */
  Customer = 'CUSTOMER',
  /** This account did the work. */
  Worker = 'WORKER'
}

/**
 * Directory-visible worker section on a public profile.
 *
 * About, skills, an approximate service area, and completed-job rows.
 * No street address, coordinates, membership, or agreed amounts.
 */
export type PublicProfileWorker = {
  /** About text (worker bio). */
  bio?: Maybe<Scalars['String']['output']>;
  /**
   * Completed platform jobs, newest first. No prices. `first` limits the page
   * (at most 100). Omit it to return every row.
   */
  completedJobs: Array<WorkerCompletedJob>;
  /** Completed platform jobs, including rows past `first`. */
  completedJobsCount: Scalars['Int']['output'];
  /** Trust flag only. The email address is not on this type. */
  emailVerified: Scalars['Boolean']['output'];
  /** Worker document id. Not the profile URL — use `PublicProfile.id`. */
  id: Scalars['ID']['output'];
  isVerified: Scalars['Boolean']['output'];
  /** Trust flag only. The phone number is not on this type. */
  phoneVerified: Scalars['Boolean']['output'];
  portfolioUrls: Array<Scalars['String']['output']>;
  primaryCategory?: Maybe<WorkerPrimaryCategory>;
  qualifications: Array<Scalars['String']['output']>;
  /** Quotes sent, withdrawn quotes excluded. Not the monthly allowance. */
  quotesSentCount: Scalars['Int']['output'];
  /**
   * Approximate service area, e.g. "Camden & Islington (~5 miles)".
   * Same label as `worker.serviceAreaLabel`. Never a street address or lat/lng.
   */
  serviceAreaLabel?: Maybe<Scalars['String']['output']>;
  skills: Array<Scalars['String']['output']>;
  tagline?: Maybe<Scalars['String']['output']>;
  /**
   * Save / review / contact state. Null when the viewer is anonymous;
   * clients treat that as sign-in required (same as `worker.viewer`).
   */
  viewer?: Maybe<WorkerProfileViewer>;
  yearsExperience?: Maybe<Scalars['Int']['output']>;
};


/**
 * Directory-visible worker section on a public profile.
 *
 * About, skills, an approximate service area, and completed-job rows.
 * No street address, coordinates, membership, or agreed amounts.
 */
export type PublicProfileWorkerCompletedJobsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
};

/**
 * Public user profile for a marketplace peek (task poster or any other account).
 *
 * Always this shell, including when the viewer is the subject or an admin.
 * Use `me` for the authenticated account (email, phone, settings, orders,
 * messages, quoted tasks).
 *
 * Anonymous access is allowed. Null when the id is invalid or missing, the
 * account is disabled, or `settings.isProfilePrivate` is true.
 */
export type PublicUser = {
  /** When the account was created. */
  createdAt: Scalars['DateTime']['output'];
  /**
   * True once the account has been deleted (anonymised on day 30). The profile
   * then shows as "Deleted user" with no avatar: don't link to it. False while a
   * deletion is only scheduled.
   */
  deleted: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  /** When the account was created. Same instant as `createdAt`. */
  memberSince: Scalars['DateTime']['output'];
  /**
   * Count of publicly discoverable `OPEN` tasks, honoring `excludeTaskId`
   * the same way `openTasks` does.
   */
  openTaskCount: Scalars['Int']['output'];
  /**
   * Tasks this user posted that are publicly discoverable: status `OPEN` and
   * not suspended. Newest first. Visitor-safe task fields (same redaction as
   * `Query.tasks` / public `task(id)`).
   *
   * `first` defaults to 10 and is capped at 20. Values below 1 are treated as 1.
   * `excludeTaskId` omits one task (for "other open tasks" on task detail).
   * An invalid `excludeTaskId` is ignored.
   */
  openTasks: Array<Task>;
  profile: PublicUserProfile;
  /**
   * Linked worker profile when one exists and is visible in the directory
   * (setup complete). Null for drafts.
   */
  worker?: Maybe<PublicUserWorker>;
};


/**
 * Public user profile for a marketplace peek (task poster or any other account).
 *
 * Always this shell, including when the viewer is the subject or an admin.
 * Use `me` for the authenticated account (email, phone, settings, orders,
 * messages, quoted tasks).
 *
 * Anonymous access is allowed. Null when the id is invalid or missing, the
 * account is disabled, or `settings.isProfilePrivate` is true.
 */
export type PublicUserOpenTaskCountArgs = {
  excludeTaskId?: InputMaybe<Scalars['ID']['input']>;
};


/**
 * Public user profile for a marketplace peek (task poster or any other account).
 *
 * Always this shell, including when the viewer is the subject or an admin.
 * Use `me` for the authenticated account (email, phone, settings, orders,
 * messages, quoted tasks).
 *
 * Anonymous access is allowed. Null when the id is invalid or missing, the
 * account is disabled, or `settings.isProfilePrivate` is true.
 */
export type PublicUserOpenTasksArgs = {
  excludeTaskId?: InputMaybe<Scalars['ID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

/**
 * Display name and avatar for a public profile peek.
 * Contact number, date of birth, and verification flags are not on this type.
 */
export type PublicUserProfile = {
  /** Public avatar URL. Null when the account has no avatar. */
  avatarUrl?: Maybe<Scalars['String']['output']>;
  /** Canonical display name. Null when the account has no name set. */
  name?: Maybe<Scalars['String']['output']>;
};

/**
 * Directory-visible worker profile linked from a public user.
 * Load trust stats and completed jobs with `worker(id:)`.
 */
export type PublicUserWorker = {
  id: Scalars['ID']['output'];
};

/**
 * Push provider for a registered device token.
 * Expo tokens are preferred for Slashie mobile; APNs/FCM reserved for later.
 */
export enum PushPlatform {
  Apns = 'APNS',
  Expo = 'EXPO',
  Fcm = 'FCM'
}

export type Query = {
  /** Templated draft reply quoting this feedback. Does not send email. */
  adminFeedbackDraftReply: AdminFeedbackDraftReply;
  /** Point-in-time product-feedback counts. Distinct from trust reports. */
  adminFeedbackSummary: AdminFeedbackSummary;
  /**
   * Ops product-feedback inbox. Newest first. Omit `status` / `category` to
   * include every value. `first` defaults to 50 (clamped 1–100). `after` is
   * the previous page's last feedback id. `search` matches message, name, or
   * email. `email` is a case-insensitive contains match on the stored address.
   */
  adminFeedbacks: FeedbackPage;
  /**
   * Mongo-authoritative ops summary for the admin dashboard. Requires `@admin`.
   * Provide `range`, or both `dateFrom` and `dateTo` (half-open, UTC). When both
   * custom dates are set they override the preset window; `range` is still
   * returned on the payload for the client toggle.
   */
  adminOpsSummary: AdminOpsSummary;
  /**
   * Ops trust-report inbox. Newest first. Omit `status` to include every
   * status (OPEN, REVIEWED, ACTIONED, DISMISSED). Filter `targetType: TASK`
   * for reported tasks. `first` defaults to 50 (clamped 1–100). `after` is
   * the previous page's last report id. Does not require ADMIN_EMAILS.
   * `reporter` matches reporter email, profile name, or user id.
   */
  adminReports: ReportPage;
  /**
   * Reviews flagged for burst posting, identical comments, or review-then-delete.
   * Newest first. Ops only.
   */
  adminReviewSignals: AdminReviewSignalPage;
  /**
   * Full ops dossier for one task: owner-shaped task, poster, linked workers,
   * quotes, orders, and activity (flashes + timeline). Throws TASK_NOT_FOUND.
   */
  adminTask: AdminTaskDossier;
  /**
   * Ops task search. Requires `@admin` (auth + @slashie.app + active Admin row).
   * Newest first. Empty or omitted `filter.search` returns the newest tasks.
   * `first` defaults to 50 (clamped 1–100). `after` is the previous page's last
   * task id. Returns owner-shaped Task parents so location/address are visible.
   * `filter.bbox` pages tasks in the visible map area.
   */
  adminTasks: TaskPage;
  /**
   * Primary ops people search (customers and workers). Matches email, profile
   * name, user id, or linked worker legal name/tagline/bio/id. Nested `worker`
   * is present when a profile exists so the UI can show "is worker" without a
   * second query. Empty or omitted search returns the newest users. `first`
   * defaults to 50 (clamped 1–100). `after` is the previous page's last user id.
   * `disabled` / `isWorker` / date bounds are optional composed filters.
   */
  adminUsers: UserPage;
  health: Scalars['String']['output'];
  me: User;
  /**
   * Load an order by id (authenticated party only) or by task id (viewer's booking on that task).
   * Pass exactly one of `id` or `taskId`. Prefer `task(id) { viewerOrder }` on task detail.
   */
  order?: Maybe<Order>;
  /**
   * C2C job-summary PDF for a completed order. Caller must be a party.
   * This is not a Slashie tax invoice. Clients should still wait until
   * `viewerHasSubmittedReview` before showing the download action.
   */
  orderReceipt: OrderReceipt;
  /** Review state for one order. Caller must be a party on the order. */
  orderReviews: OrderReviewState;
  /**
   * Most-used categories on open tasks that are not suspended, most used first: suggestions
   * for the create-task category input. Grouped ignoring case; each shows its
   * most common spelling. `first` defaults to 12, capped at 50. Anonymous OK.
   */
  popularTaskCategories: Array<Scalars['String']['output']>;
  /** Public worker subscription pricing (Slashie Unlimited). No auth required. */
  pricing: Pricing;
  /**
   * Public profile by user id for `/profile/[userId]`. Anonymous OK.
   *
   * Null when the user does not exist, the id is invalid, the account is
   * disabled or deleted, or the profile is private and the viewer is not the
   * owner. The owner of a private profile gets the preview, with `isHidden`.
   * See `PublicProfile`.
   */
  publicProfile?: Maybe<PublicProfile>;
  /**
   * Env-allowlist report inbox (BE-40). Requires ADMIN_USER_IDS or
   * ADMIN_EMAILS. Newest first. Prefer `adminReports` (`@admin`) for the
   * private admin panel. Not visible to reporters or the public.
   */
  reports: ReportPage;
  /**
   * Single task detail entry point. Field visibility depends on viewer role (poster, participant, public).
   * A cancelled or suspended task (`Task.suspension`) is only for its owner and
   * parties (workers with a quote, any status, or a booking on it), so the
   * `TASK_CANCELLED` and `TASK_REOPENED` flashes open it. A finished booking is
   * only for its customer and worker. Everyone else, guests included, gets
   * `NOT_FOUND`.
   */
  task?: Maybe<Task>;
  /**
   * Open tasks for discovery (map and search), never suspended ones. Center
   * defaults to London. No radius limit unless `filter.radiusMiles` is passed.
   * Nearest first by default.
   * `filter.status`, `filter.ownerUserId`, and `filter.hubSection` are ignored (always OPEN-only).
   * `Task.location` is discovery-style on map browse.
   * `DISTANCE` sort requires `filter.lat` and `filter.lng`.
   *
   * Paging: `first` tasks per page (default and max 100). For the next page, pass the
   * last returned task's `id` as `after` with the same filter and sort. A full page
   * means there may be more; fewer than `first` means the end. If that task has since
   * closed, the next page still starts where it would have sorted. Unknown id:
   * `INVALID_CURSOR`.
   */
  tasks: Array<Task>;
  /**
   * One thread the viewer participates in. Null when it does not exist or the
   * viewer is not a participant.
   */
  thread?: Maybe<Thread>;
  /**
   * Items in a thread that are visible to the viewer, newest first. Pass the
   * oldest returned item's `id` as `before` for older items. `first` defaults to
   * 50 (max 100). Not a participant: `FORBIDDEN`.
   */
  threadItems: Array<ThreadItem>;
  /**
   * Public user profile by id. Anonymous OK.
   *
   * Always returns `PublicUser` — never email, phone, settings, orders,
   * messages, or quoted tasks, even when the viewer is that user.
   * Use `me` for the signed-in account.
   *
   * Null when the user does not exist, the id is invalid, the account is
   * disabled or waiting for deletion, or the profile is private
   * (`settings.isProfilePrivate`). A deleted account returns a shell named
   * "Deleted user" with no avatar, worker profile or open tasks, and
   * `deleted: true`, so references (reviews, orders) keep working without a
   * profile link; `publicProfile` stays null for it.
   */
  user?: Maybe<PublicUser>;
  /**
   * URL-safe base64 VAPID public key for `PushManager.subscribe`.
   * Null when the server has no VAPID keys configured.
   * The key is public; registering a subscription still requires auth.
   */
  webPushVapidPublicKey?: Maybe<Scalars['String']['output']>;
  /**
   * Public worker profile by worker id. Null when not found, or when the profile
   * is a draft (setup incomplete) and the viewer is not the worker themself.
   */
  worker?: Maybe<Worker>;
  /**
   * Discover registered workers for the /workers directory. Supports text search, verification,
   * and optional geo radius. Nested `user` uses the public shell unless the JWT subject is that worker.
   */
  workers: Array<Worker>;
};


export type QueryAdminFeedbackDraftReplyArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAdminFeedbacksArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<FeedbackCategory>;
  createdAfter?: InputMaybe<Scalars['DateTime']['input']>;
  createdBefore?: InputMaybe<Scalars['DateTime']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  rating?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<FeedbackStatus>;
};


export type QueryAdminOpsSummaryArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']['input']>;
  dateTo?: InputMaybe<Scalars['DateTime']['input']>;
  range: AdminOpsRange;
};


export type QueryAdminReportsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  createdAfter?: InputMaybe<Scalars['DateTime']['input']>;
  createdBefore?: InputMaybe<Scalars['DateTime']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  reason?: InputMaybe<ReportReason>;
  reporter?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<ReportStatus>;
  targetType?: InputMaybe<ReportTargetType>;
};


export type QueryAdminReviewSignalsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAdminTaskArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAdminTasksArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<AdminTaskFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAdminUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  createdAfter?: InputMaybe<Scalars['DateTime']['input']>;
  createdBefore?: InputMaybe<Scalars['DateTime']['input']>;
  disabled?: InputMaybe<Scalars['Boolean']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  isWorker?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryOrderArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  taskId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryOrderReceiptArgs = {
  orderId: Scalars['ID']['input'];
};


export type QueryOrderReviewsArgs = {
  orderId: Scalars['ID']['input'];
};


export type QueryPopularTaskCategoriesArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPublicProfileArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryReportsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<ReportStatus>;
};


export type QueryTaskArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTasksArgs = {
  after?: InputMaybe<Scalars['ID']['input']>;
  filter?: InputMaybe<TaskFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<TaskSort>;
};


export type QueryThreadArgs = {
  id: Scalars['ID']['input'];
};


export type QueryThreadItemsArgs = {
  before?: InputMaybe<Scalars['ID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  threadId: Scalars['ID']['input'];
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryWorkerArgs = {
  id: Scalars['ID']['input'];
};


export type QueryWorkersArgs = {
  filter?: InputMaybe<WorkerFilter>;
  sort?: InputMaybe<WorkerSort>;
};

/**
 * A worker's offer on a task. `Task.quotes` decides who sees which quotes. Every
 * quote a viewer gets has its price, times and message; who sent it
 * (`workerUserId`, `worker`) is only there for the task owner, that worker and
 * ops.
 */
export type Quote = {
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  /** Pitch from the quoting worker, for anyone who can see the quote. */
  message?: Maybe<Scalars['String']['output']>;
  /** The quoted amount, for anyone who can see the quote. */
  price?: Maybe<Price>;
  /**
   * The worker's 1-2 exact slots, for anyone who can see the quote. The owner
   * picks one on `acceptQuote`.
   */
  proposedSlots: Array<TimeSlot>;
  status: QuoteStatus;
  task: Task;
  taskId: Scalars['ID']['output'];
  /**
   * The quoting worker. Same rule as `workerUserId`: the task owner, that
   * worker, and ops only; null for everyone else, guests included. `email` is
   * empty unless the viewer is that worker or the admin task dossier; the task
   * owner does not get it, even after accepting.
   */
  worker?: Maybe<User>;
  /**
   * True when the quoting worker's account is suspended (BE-108): the quote is
   * frozen, so it cannot be accepted or declined (`COUNTERPARTY_SUSPENDED`)
   * until ops lift the suspension. Only for viewers who get `worker`; false for
   * everyone else.
   */
  workerSuspended: Scalars['Boolean']['output'];
  /**
   * The quoting worker's user id. Only the task owner, that worker, and ops
   * (through the admin queries) get it. Null for everyone else, guests included.
   */
  workerUserId?: Maybe<Scalars['ID']['output']>;
};

export enum QuoteStatus {
  Accepted = 'ACCEPTED',
  Declined = 'DECLINED',
  /**
   * Replaced by a newer quote from the same worker on the same task (its own
   * `QUOTE_RECEIVED` flash carries the new one). Product reads omit EXPIRED rows.
   */
  Expired = 'EXPIRED',
  /** The owner accepted another worker's quote on this task. */
  NotSelected = 'NOT_SELECTED',
  Pending = 'PENDING',
  Rejected = 'REJECTED',
  Withdrawn = 'WITHDRAWN'
}

export type RegisterWebPushSubscriptionInput = {
  /** `PushSubscription.keys.auth` (URL-safe or standard base64). */
  auth: Scalars['String']['input'];
  /** `PushSubscription.endpoint`. Must be https. */
  endpoint: Scalars['String']['input'];
  /** `PushSubscription.keys.p256dh` (URL-safe or standard base64). */
  p256dh: Scalars['String']['input'];
};

/**
 * A trust-and-safety report against a task, worker profile, user, or review.
 * Reporters see the create payload. Ops list via `@admin` `adminReports`
 * (and the BE-40 env-allowlist `reports` query). There is no public list.
 */
export type Report = {
  createdAt: Scalars['DateTime']['output'];
  details?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  reason: ReportReason;
  /**
   * Live reporter User when the account still exists. Admin-shaped for ops
   * (email, verification, disabled). Null if the user row was deleted.
   */
  reporter?: Maybe<User>;
  /** Email snapshot at report time. Useful if the user row is later deleted. */
  reporterEmail?: Maybe<Scalars['String']['output']>;
  reporterUserId: Scalars['ID']['output'];
  status: ReportStatus;
  targetId: Scalars['ID']['output'];
  /**
   * Snapshot label at report time: task title, worker legal name, or user
   * profile name. Use this for TASK title in the ops inbox.
   */
  targetLabel?: Maybe<Scalars['String']['output']>;
  targetType: ReportTargetType;
  /** Snapshot URL on slashie.app for ops (task or worker page). */
  targetUrl?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type ReportPage = {
  items: Array<Report>;
  /** Opaque cursor (`report` id) for the next page, or null when there are no more items. */
  nextCursor?: Maybe<Scalars['String']['output']>;
};

export enum ReportReason {
  Harassment = 'HARASSMENT',
  IllegalOrProhibited = 'ILLEGAL_OR_PROHIBITED',
  Other = 'OTHER',
  Scam = 'SCAM',
  Spam = 'SPAM'
}

export enum ReportStatus {
  Actioned = 'ACTIONED',
  Dismissed = 'DISMISSED',
  Open = 'OPEN',
  Reviewed = 'REVIEWED'
}

export enum ReportTargetType {
  /**
   * A chat message (`ThreadItem` id). The reporter must be able to see it and not
   * be its author; the message text is stored as `targetLabel` for review.
   */
  Message = 'MESSAGE',
  Review = 'REVIEW',
  Task = 'TASK',
  User = 'USER',
  Worker = 'WORKER'
}

/**
 * One party's review of the other party on a completed order.
 * Stars are 1–5. `comment` is optional. Hidden rows stay in the database.
 */
export type Review = {
  /** Author's public photo. Null when the account is deleted or has none. */
  authorAvatarUrl?: Maybe<Scalars['String']['output']>;
  /**
   * First word of the author's public name. Null when the account is deleted
   * or has no name. Not the legal name.
   */
  authorFirstName?: Maybe<Scalars['String']['output']>;
  authorRole: ReviewPartyRole;
  authorUserId: Scalars['ID']['output'];
  comment?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  /** Submit time plus 48 hours. Edits after this instant are rejected. */
  editableUntil: Scalars['DateTime']['output'];
  /** Set when the author or an admin soft-hides the review. The row is kept. */
  hiddenAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  /**
   * Job title from the order snapshot, or the first category when the title
   * is empty.
   */
  jobTitle?: Maybe<Scalars['String']['output']>;
  orderId: Scalars['ID']['output'];
  stars: Scalars['Int']['output'];
  subjectUserId: Scalars['ID']['output'];
  taskId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/**
 * Light abuse signals stored on the review for the ops queue.
 * Not returned on the public review type.
 */
export enum ReviewAbuseFlag {
  Burst = 'BURST',
  IdenticalText = 'IDENTICAL_TEXT',
  ReviewThenDelete = 'REVIEW_THEN_DELETE'
}

/** Which side of a completed order wrote the review. */
export enum ReviewPartyRole {
  Customer = 'CUSTOMER',
  Worker = 'WORKER'
}

export type SaveWorkerSetupStepInput = {
  bio?: InputMaybe<Scalars['String']['input']>;
  /** Private DOB on the user (`profile.details`). */
  dateOfBirth?: InputMaybe<Scalars['DateTime']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** Full legal/display name. Alternative to `firstName` + `lastName` (`profile.details`). */
  legalName?: InputMaybe<Scalars['String']['input']>;
  location?: InputMaybe<LocationInput>;
  /** Portfolio URLs (`verify.portfolio`). */
  portfolioUrls?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Primary trade (`services.skills`). Required when saving that step. */
  primaryCategory?: InputMaybe<WorkerPrimaryCategory>;
  /**
   * Qualifications / certifications (`services.experience`). Max 10 items,
   * each 2–40 characters after trim; duplicates are dropped.
   */
  qualifications?: InputMaybe<Array<Scalars['String']['input']>>;
  /**
   * Service area radius and label (`area.travel`). `radiusMiles` here takes
   * precedence over the flat `travelRadiusMiles` when both are supplied.
   */
  serviceArea?: InputMaybe<ServiceAreaInput>;
  /** Additional skills/tags (`services.skills`). */
  skills?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Sub-step being saved, e.g. `profile.details`, `services.skills`, `review.submit`. */
  subStep: Scalars['String']['input'];
  tagline?: InputMaybe<Scalars['String']['input']>;
  /** Travel radius in miles (`area.travel`). */
  travelRadiusMiles?: InputMaybe<Scalars['Float']['input']>;
  yearsExperience?: InputMaybe<Scalars['Int']['input']>;
};

/**
 * Join row recording that a user saved a worker. Storage-only (not queryable
 * directly); surfaced through `worker.viewer.isSaved`.
 */
export type SavedWorker = {
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  userId: Scalars['ID']['output'];
  workerId: Scalars['ID']['output'];
};

/**
 * How far a worker travels from their base location, plus an optional
 * human-readable label (for example "Camden & Islington").
 */
export type ServiceArea = {
  /** Display label for the covered area, e.g. "Camden & Islington (~5 miles)". */
  label?: Maybe<Scalars['String']['output']>;
  /** Travel radius from the worker's preferred location, in miles. */
  radiusMiles?: Maybe<Scalars['Float']['output']>;
};

export type ServiceAreaInput = {
  /** Display label for the covered area. */
  label?: InputMaybe<Scalars['String']['input']>;
  /** Travel radius in miles. Must be greater than 0 and at most 50. */
  radiusMiles?: InputMaybe<Scalars['Float']['input']>;
};

export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type Subscription = {
  _empty?: Maybe<Scalars['String']['output']>;
  /**
   * A new item visible to the viewer, in any of their threads (messages and
   * flashes). Requires a JWT on the WebSocket connection
   * (`connectionParams.Authorization`).
   */
  threadItemAdded: ThreadItem;
};

export type Task = {
  /** Task budget. */
  budget?: Maybe<TaskBudget>;
  /**
   * Open category tags (1 to 10), as the poster typed them. Search and
   * `TaskFilter.category` match any of them, ignoring case.
   */
  categories: Array<Scalars['String']['output']>;
  /** When the task row was created. Persisted on `createTask`. */
  createdAt: Scalars['DateTime']['output'];
  /** Task date/time preference. */
  datetime?: Maybe<TaskDateTime>;
  /** Longer description of the work required. */
  description: Scalars['String']['output'];
  /**
   * True when Slashie suspended the task (`suspension.bySlashie`). False when it
   * is suspended only because the poster's account is suspended.
   * @deprecated Use `suspension.bySlashie`.
   */
  hidden: Scalars['Boolean']['output'];
  /** Task identifier. */
  id: Scalars['ID']['output'];
  /** Gallery image URLs; resolved from object storage under `tasks/<taskId>/` (not stored in MongoDB). */
  images: Array<Scalars['String']['output']>;
  /** Coordinates and label. Exact point and address for the poster and the accepted worker; town and public point for everyone else. Radius filters and distance sort use the public point. */
  location: TaskLocation;
  /**
   * The authenticated viewer's order on this task, if they are customer or worker. Null for guests or non-parties.
   * Replaces `order(taskId:)` on task detail pages.
   */
  orders: Array<Order>;
  /**
   * Poster (task owner). Always resolves when task data is available.
   * Public and pending-quote viewers get the redacted `User` shell (name and
   * avatar via the same helper as `Query.user`; email blanked). The accepted
   * worker (accepted quote or live order) also gets the poster's `email` and
   * verified flags; owner-only fields (orders, threads, achievements, settings,
   * pending contact changes, verification timestamps) stay empty for them. For a
   * profile peek whose schema cannot request private fields, use `user(id:)`.
   */
  poster?: Maybe<User>;
  /**
   * The latest quote per worker, newest first (EXPIRED and WITHDRAWN never
   * appear). Every quote returned has its price, times and message; who sent it
   * (`Quote.workerUserId`, `Quote.worker`) is only there for the task owner and
   * for the viewer's own quote.
   * - Task owner, and ops through the admin queries (`adminTask`,
   *   `adminTasks`, `adminUpdateTask`): every worker's quote, any status, with
   *   the worker.
   * - Everyone else, guests included: while the task is OPEN, the PENDING
   *   quotes without the worker, plus the viewer's own quote at any status.
   *   Once the task is not OPEN (booked or cancelled), only the viewer's own
   *   quote; guests get an empty list.
   */
  quotes: Array<Quote>;
  /** Workflow status of the task. */
  status: TaskStatus;
  /**
   * Why the task is suspended, for its owner, its parties (workers with a quote
   * or a booking on it) and ops. Null when it is not suspended. Nobody else can
   * reach a suspended task: it is in no public list, and `task(id)` throws
   * `NOT_FOUND` for them.
   */
  suspension?: Maybe<TaskSuspension>;
  /**
   * The task's activity log, oldest first: one entry per event, resolved for
   * the viewer when read. Chat messages are not events.
   * - Task owner, and ops through the admin queries: every event, with
   *   `actor` and `worker`.
   * - Suspension lines (`TASK_SUSPENDED`, `TASK_UNSUSPENDED`) only for the
   *   owner, ops and the task's parties (workers with a quote or a booking on
   *   it), never with an `actor`.
   * - Everyone else, guests included:
   *   - task created, edited, cancelled and reopened, with the poster as
   *     `actor` (an ops edit has no `actor`);
   *   - every quote event, without `actor` or `worker`, unless it is about the
   *     viewer's own quote. `QUOTE_ACCEPTED` is the "booked" line;
   *   - booking events (reschedule and cancellation requests and their
   *     answers, withdrawals and lapses, done, failed, conflict, completed,
   *     cancelled booking, reviews) only on the viewer's own booking, with the
   *     owner as `actor` on the owner's events.
   */
  timeline: Array<TaskTimelineEvent>;
  /** Short title shown in lists and search. */
  title: Scalars['String']['output'];
  /** Non-owner task detail views (PostHog, last 90 days). Public; 0 when PostHog is unavailable. */
  views: Scalars['Int']['output'];
};

/**
 * Share of jobs in one achievements panel.
 * Percents are rounded to one decimal and adjusted so the panel sums to 100.
 */
export type TaskAchievementCategoryShare = {
  category: Scalars['String']['output'];
  count: Scalars['Int']['output'];
  percent: Scalars['Float']['output'];
};

/**
 * Most common area in one achievements panel.
 * The label drops a leading street segment when the stored place is comma-separated.
 */
export type TaskAchievementLocationStat = {
  count: Scalars['Int']['output'];
  label: Scalars['String']['output'];
};

export type TaskBudget = {
  amount: Scalars['Float']['output'];
  currency: Currency;
  paymentMethod: TaskPaymentMethod;
  type: TaskBudgetType;
};

export type TaskBudgetInput = {
  amount: Scalars['Float']['input'];
  currency: Currency;
  paymentMethod: TaskPaymentMethod;
  type: TaskBudgetType;
};

export enum TaskBudgetType {
  OneOff = 'ONE_OFF',
  PerDay = 'PER_DAY',
  PerHour = 'PER_HOUR'
}

export enum TaskContactMethod {
  /** Share the email from the poster's profile. */
  Email = 'EMAIL',
  /** Keep communication inside the app only. */
  InApp = 'IN_APP',
  /** Share the phone number from the poster's profile. */
  Phone = 'PHONE'
}

export type TaskDateTime = {
  date?: Maybe<Scalars['String']['output']>;
  time?: Maybe<Scalars['String']['output']>;
  type: TaskDateTimeType;
};

export type TaskDateTimeInput = {
  date?: InputMaybe<Scalars['String']['input']>;
  time?: InputMaybe<Scalars['String']['input']>;
  type: TaskDateTimeType;
};

export enum TaskDateTimeType {
  Before = 'BEFORE',
  Exact = 'EXACT',
  Flexible = 'FLEXIBLE'
}

/**
 * A task field that an edit can change. `STATUS` and `HIDDEN` only change in an
 * ops edit. `HIDDEN` is only on edits logged before BE-108: hiding a task is now
 * a suspension (`TASK_SUSPENDED`).
 */
export enum TaskEditableField {
  Budget = 'BUDGET',
  Categories = 'CATEGORIES',
  ContactMethod = 'CONTACT_METHOD',
  Datetime = 'DATETIME',
  Description = 'DESCRIPTION',
  Hidden = 'HIDDEN',
  Location = 'LOCATION',
  Status = 'STATUS',
  Title = 'TITLE'
}

/**
 * Shared list filter for discovery `tasks` and My Tasks hub lists
 * (`User.tasksPosted`, `User.quotedTasks`, `worker.quotedTasks`).
 *
 * Per-query handling:
 * - `lat`/`lng`/`radiusMiles`: used by `tasks` (map discovery); ignored by hub list fields.
 * - `status`: applies to hub list fields; **ignored by `tasks`** (discovery is OPEN-only, enforced server-side).
 * - `ownerUserId` and `hubSection`: apply to hub list fields; **ignored by `tasks`**.
 * - `search`, `category`, and the date-range fields apply to every list above.
 *
 * Hub section narrowing keeps the Open / Booked / Completed IA. It does not merge
 * those sections into one list. Hosted vs Quoted stays which field returned the
 * task (`tasksPosted` vs `quotedTasks` / `worker.quotedTasks`); a task can be in both.
 */
export type TaskFilter = {
  /** Inclusive upper bound on the raw `budget.amount`, whatever the budget type. */
  budgetMax?: InputMaybe<Scalars['Float']['input']>;
  /**
   * Inclusive lower bound on the raw `budget.amount`, whatever the budget type
   * (one-off, per hour, per day). Must be >= 0 and <= `budgetMax` (`INVALID_BUDGET_RANGE`).
   */
  budgetMin?: InputMaybe<Scalars['Float']['input']>;
  /** Tasks that have this category: case-insensitive exact match on any of `categories`. */
  category?: InputMaybe<Scalars['String']['input']>;
  /** Inclusive lower bound on `createdAt` (`createdAt >= value`). */
  createdAfter?: InputMaybe<Scalars['DateTime']['input']>;
  /** Inclusive upper bound on `createdAt` (`createdAt <= value`). */
  createdBefore?: InputMaybe<Scalars['DateTime']['input']>;
  /**
   * Narrow My Tasks hub sections. Omit to include Open, Booked, and Completed.
   * An empty list matches nothing. Hub lists only. Ignored by discovery `tasks`.
   */
  hubSection?: InputMaybe<Array<MyTaskHubSection>>;
  /** Map center latitude; defaults to central London when omitted. Used by `tasks` only. */
  lat?: InputMaybe<Scalars['Float']['input']>;
  /** Map center longitude; defaults to central London when omitted. Used by `tasks` only. */
  lng?: InputMaybe<Scalars['Float']['input']>;
  /** Task poster (`Task.user` / `createdByUserId`). Hub lists only. Ignored by discovery `tasks`. */
  ownerUserId?: InputMaybe<Scalars['ID']['input']>;
  /**
   * Map radius in miles from the center point (capped at 50). Omit (or null) for no
   * radius limit: every open task, nearest first. Must be greater than 0
   * (`INVALID_RADIUS`). Used by `tasks` only.
   */
  radiusMiles?: InputMaybe<Scalars['Float']['input']>;
  /**
   * Inclusive lower bound on the task's scheduled date (`datetime.date`). Compared at day granularity.
   * On discovery `tasks`, FLEXIBLE and undated tasks still match; My Tasks lists exclude them.
   */
  scheduledAfter?: InputMaybe<Scalars['DateTime']['input']>;
  /**
   * Inclusive upper bound on the task's scheduled date (`datetime.date`). Compared at day granularity.
   * On discovery `tasks`, FLEXIBLE and undated tasks still match; My Tasks lists exclude them.
   */
  scheduledBefore?: InputMaybe<Scalars['DateTime']['input']>;
  /** Case-insensitive substring match on title, description, place name, and any category. */
  search?: InputMaybe<Scalars['String']['input']>;
  /** Poster/worker inbox: constrain by task status(es). Omit for all statuses. Ignored by `tasks`. */
  status?: InputMaybe<Array<TaskStatus>>;
};

/** Map-backed coordinates and place label used for discovery and distance. */
export type TaskLocation = {
  /** Exact address. Participants only; null for everyone else. */
  address?: Maybe<Scalars['String']['output']>;
  /**
   * Latitude. Exact for participants; for everyone else a fixed public point up
   * to about 250 m from the real one (the same on every request).
   */
  lat?: Maybe<Scalars['Float']['output']>;
  /** Longitude. Same rule as `lat`. */
  lng?: Maybe<Scalars['Float']['output']>;
  /** Town or locality only (e.g. "Bushey"), for everyone. Stored that way on save. */
  name?: Maybe<Scalars['String']['output']>;
};

export type TaskLocationInput = {
  /** Full street address for the task location. */
  address: Scalars['String']['input'];
  /** Latitude in decimal degrees. */
  lat: Scalars['Float']['input'];
  /** Longitude in decimal degrees. */
  lng: Scalars['Float']['input'];
  /** Place name or label from the map provider (for example Mapbox). */
  name: Scalars['String']['input'];
};

/** Cursor page for ops task lists (`adminTasks`). Newest first. */
export type TaskPage = {
  items: Array<Task>;
  /** Opaque cursor (task id) for the next page, or null when there are no more items. */
  nextCursor?: Maybe<Scalars['String']['output']>;
};

export enum TaskPaymentMethod {
  /** Payment by bank transfer. */
  BankTransfer = 'BANK_TRANSFER',
  /** Cash payment on completion or as agreed. */
  Cash = 'CASH'
}

/**
 * Sort order for list queries. Supplied as a sibling argument to `filter` (never nested inside it).
 * When omitted, all list queries default to `CREATED_AT` `DESC` (except `tasks` with a geo center, which
 * defaults to nearest-first distance ordering).
 */
export type TaskSort = {
  direction: SortDirection;
  field: TaskSortField;
};

export enum TaskSortField {
  /** Sort by task creation time. */
  CreatedAt = 'CREATED_AT',
  /**
   * Sort by distance from the map center. Valid on `tasks` only, and only when `filter.lat` and
   * `filter.lng` are provided; rejected on other queries or without coordinates.
   */
  Distance = 'DISTANCE',
  /** Sort by the task's scheduled date/time; tasks without a schedulable date sort last. */
  ScheduledAt = 'SCHEDULED_AT',
  /** Sort alphabetically by title (case-insensitive). */
  Title = 'TITLE'
}

export enum TaskStatus {
  /** A worker has been chosen. */
  Awarded = 'AWARDED',
  /** Task cancelled. */
  Cancelled = 'CANCELLED',
  /** Draft task not yet visible. */
  Draft = 'DRAFT',
  /** Open for worker quotes. */
  Open = 'OPEN'
}

/**
 * Why a task is suspended (BE-108). A suspended task is frozen, not deleted: it
 * is in no public list, only its owner and parties (workers with a quote or a
 * booking on it) can open it, and nothing on it can be quoted, accepted,
 * declined, withdrawn, edited, cancelled, reopened, rescheduled, marked done or
 * failed, reviewed or messaged (`TASK_SUSPENDED`). Nothing is rewritten on
 * suspend, so lifting it restores the task exactly as it was. Both reasons can
 * apply at once; each is lifted on its own.
 */
export type TaskSuspension = {
  /**
   * Slashie suspended the task. Only ops lift it: tell the owner to contact
   * support. It cannot be reopened.
   */
  bySlashie: Scalars['Boolean']['output'];
  /** The poster's account is suspended. Lifted when ops re-enable the account. */
  posterSuspended: Scalars['Boolean']['output'];
};

/** Which suspension a `TASK_SUSPENDED` or `TASK_UNSUSPENDED` line set or lifted. */
export enum TaskSuspensionReason {
  /** The poster's account was suspended or re-enabled. */
  PosterSuspended = 'POSTER_SUSPENDED',
  /** Slashie (ops) suspended or unsuspended the task. */
  Slashie = 'SLASHIE'
}

/**
 * One line of a task's activity log: what happened, who did it, and when.
 * `Task.timeline` decides per viewer which lines they get and who they see.
 */
export type TaskTimelineEvent = {
  /**
   * Who did it. Null when the viewer may not know (another worker's quote
   * event, the booked line, an ops edit, a suspension line), and when nobody did
   * (`QUOTE_NOT_SELECTED`, `CANCELLATION_LAPSED`, an automatic
   * `ORDER_COMPLETED`).
   */
  actor?: Maybe<User>;
  /** True when the viewer did it. */
  byViewer: Scalars['Boolean']['output'];
  /** `TASK_UPDATED`: the fields that changed. Empty for every other type. */
  changedFields: Array<TaskEditableField>;
  /**
   * `TASK_UPDATED`: `{ fields }` with the changed field names, plus
   * `admin: true` for an ops edit. `{}` for every other type.
   * @deprecated Use `changedFields`.
   */
  data: Scalars['JSON']['output'];
  /**
   * `TASK_SUSPENDED` and `TASK_UNSUSPENDED`: which suspension was set or
   * lifted. Null for every other type.
   */
  suspensionReason?: Maybe<TaskSuspensionReason>;
  timestamp: Scalars['DateTime']['output'];
  type: TaskTimelineEventType;
  /**
   * The worker a quote or booking event is about. Only the task owner (and
   * ops) and that worker get it; null for everyone else and on task events.
   */
  worker?: Maybe<User>;
};

/**
 * What happened. Quote and booking events have the same names as the Messages
 * flashes they come with (`FlashKind`), except that both kinds of quote send
 * are `QUOTE_RECEIVED` there. `RESCHEDULE_WITHDRAWN`, `CANCELLATION_WITHDRAWN`
 * and `CANCELLATION_LAPSED` are in the log only, with no flash.
 */
export enum TaskTimelineEventType {
  /** The actor refused the other party's request to cancel. */
  CancellationDeclined = 'CANCELLATION_DECLINED',
  /** A request to cancel lapsed unanswered at the booked start. No actor. */
  CancellationLapsed = 'CANCELLATION_LAPSED',
  /** The actor asked to cancel the booking. */
  CancellationRequested = 'CANCELLATION_REQUESTED',
  /** The actor withdrew their own request to cancel. */
  CancellationWithdrawn = 'CANCELLATION_WITHDRAWN',
  /**
   * The booking was cancelled: the actor accepted the other party's request to
   * cancel, or both parties marked it failed (the actor second).
   */
  OrderCancelled = 'ORDER_CANCELLED',
  /**
   * The job is completed: both parties marked it done (the actor second), or
   * 7 days passed after one did (no actor).
   */
  OrderCompleted = 'ORDER_COMPLETED',
  /** One party marked the job done and the other failed (the actor second). */
  OrderConflict = 'ORDER_CONFLICT',
  /** The actor marked the job done; the other party has 7 days to answer. */
  OrderMarkedDone = 'ORDER_MARKED_DONE',
  /** The actor marked the job failed. The reason is never in the log. */
  OrderMarkedFailed = 'ORDER_MARKED_FAILED',
  /** The owner accepted a quote: the task is booked. */
  QuoteAccepted = 'QUOTE_ACCEPTED',
  /** The owner declined a quote. */
  QuoteDeclined = 'QUOTE_DECLINED',
  /** The owner accepted another quote, so this one was not selected. No actor. */
  QuoteNotSelected = 'QUOTE_NOT_SELECTED',
  /** A worker sent a quote. */
  QuoteSent = 'QUOTE_SENT',
  /** A worker replaced their pending quote with a new one. */
  QuoteUpdated = 'QUOTE_UPDATED',
  /** A worker withdrew their pending quote. */
  QuoteWithdrawn = 'QUOTE_WITHDRAWN',
  /** The actor accepted the other party's new time. */
  RescheduleConfirmed = 'RESCHEDULE_CONFIRMED',
  /** The actor declined the other party's new time; the booking keeps its time. */
  RescheduleDeclined = 'RESCHEDULE_DECLINED',
  /** The actor asked to move the booking to a new time. */
  RescheduleRequested = 'RESCHEDULE_REQUESTED',
  /** The actor withdrew their own request for a new time. */
  RescheduleWithdrawn = 'RESCHEDULE_WITHDRAWN',
  /** The actor left a review. The log never has the stars or the text. */
  ReviewLeft = 'REVIEW_LEFT',
  /** The poster cancelled the task before anyone was booked. */
  TaskCancelled = 'TASK_CANCELLED',
  /** The poster posted the task. */
  TaskCreated = 'TASK_CREATED',
  /**
   * The poster reopened the task for quotes (`reopenTask`): a cancelled task, or
   * a booking whose worker's account is suspended.
   */
  TaskReopened = 'TASK_REOPENED',
  /**
   * The task was suspended (`suspensionReason`). No actor. Only the owner, ops
   * and the task's parties get this line.
   */
  TaskSuspended = 'TASK_SUSPENDED',
  /**
   * A suspension was lifted (`suspensionReason`); the task may still be
   * suspended for the other reason. Same visibility as `TASK_SUSPENDED`.
   */
  TaskUnsuspended = 'TASK_UNSUSPENDED',
  /** The task was edited (`changedFields`). */
  TaskUpdated = 'TASK_UPDATED'
}

/**
 * A conversation. Only participants can read it; each sees only the items whose
 * `visibleTo` includes them.
 */
export type Thread = {
  /**
   * The next step waiting on the viewer. Null when nothing is waiting, including
   * on a system thread, for a worker who was not awarded the task, and while
   * the task or the other party on the booking is suspended.
   */
  attention?: Maybe<ThreadAttention>;
  /** The viewer blocked `otherParty`. */
  blockedByMe: Scalars['Boolean']['output'];
  /**
   * True when the viewer may `sendMessage` here: they are the owner or the
   * booked worker, a quote was accepted (or an order exists), neither has
   * blocked the other, and nothing is suspended (the task, or either account).
   * Once unlocked it stays unlocked, also after completion or cancellation. On a
   * reopened task the pair is the owner and the latest booked worker.
   */
  canSend: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  kind: ThreadKind;
  /** Latest item visible to the viewer. */
  lastItem?: Maybe<ThreadItem>;
  /**
   * The other person: the owner sees the accepted worker (null before a quote is
   * accepted), a worker sees the owner. Null for `SYSTEM`.
   */
  otherParty?: Maybe<ThreadParty>;
  /** The task for `TASK` threads. Null for `SYSTEM`. */
  task?: Maybe<Task>;
  /** Task title, or "Slashie" for the system thread. */
  title: Scalars['String']['output'];
  /** Items visible to the viewer, not made by the viewer, newer than their last read. */
  unreadCount: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type ThreadAttention = {
  /** Live pending quotes when `kind` is `COMPARE_QUOTES`. Null otherwise. */
  count?: Maybe<Scalars['Int']['output']>;
  kind: ThreadAttentionKind;
};

/** Why a thread is waiting on the viewer. Matches My tasks' Needs you list. */
export enum ThreadAttentionKind {
  AnswerCancel = 'ANSWER_CANCEL',
  AnswerFailed = 'ANSWER_FAILED',
  AnswerReschedule = 'ANSWER_RESCHEDULE',
  CompareQuotes = 'COMPARE_QUOTES',
  ConfirmDone = 'CONFIRM_DONE',
  Conflict = 'CONFLICT',
  MarkDone = 'MARK_DONE'
}

export type ThreadItem = {
  /** Message author or flash actor. Null for system flashes. */
  author?: Maybe<ThreadParty>;
  /** Message text, or the flash body. */
  body: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  /** Set on flashes only. */
  flashKind?: Maybe<FlashKind>;
  id: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['String']['output']>;
  /** The viewer wrote the message or raised the flash. */
  isMine: Scalars['Boolean']['output'];
  orderId?: Maybe<Scalars['ID']['output']>;
  /**
   * The quote a quote flash is about (`QUOTE_RECEIVED`, `QUOTE_ACCEPTED`,
   * `QUOTE_DECLINED`, `QUOTE_NOT_SELECTED`, `QUOTE_WITHDRAWN`, and the
   * worker's `TASK_CANCELLED` / `TASK_REOPENED`): price, message,
   * slots, worker and its current `status`, read live. Only for the task owner
   * and the quoting worker; null otherwise and for other flashes. The owner can
   * act on a PENDING quote straight from the thread with `acceptQuote` (pick a
   * `proposedSlots` id) or `declineQuote`. Every outcome flash carries the same
   * quote, so a normalised client cache updates the original flash's status
   * when the outcome arrives on `threadItemAdded`. After `QUOTE_ACCEPTED`, refetch
   * the thread to see the other quotes become NOT_SELECTED.
   */
  quote?: Maybe<Quote>;
  quoteId?: Maybe<Scalars['ID']['output']>;
  taskId?: Maybe<Scalars['ID']['output']>;
  threadId: Scalars['ID']['output'];
  /** Flash title. Null on messages. */
  title?: Maybe<Scalars['String']['output']>;
  type: ThreadItemType;
};

export enum ThreadItemType {
  /**
   * Event card (quote, booking, reschedule, completion, review prompt, announcement).
   * Push text is exactly the flash `title` and `body`.
   */
  Flash = 'FLASH',
  /** Chat text between the task owner and the accepted worker. */
  Message = 'MESSAGE'
}

/**
 * `TASK`: one thread per task, shared by the task owner and every worker who
 * quoted. `SYSTEM`: one Slashie thread per user (admin announcements).
 */
export enum ThreadKind {
  System = 'SYSTEM',
  Task = 'TASK'
}

/**
 * A person shown in Messages. A deleted account shows as `name: "Deleted user"`
 * with `deleted: true` and no avatar.
 */
export type ThreadParty = {
  avatarUrl?: Maybe<Scalars['String']['output']>;
  /** Completed bookings this person did as the worker. 0 when the account is deleted. */
  completedJobsCount: Scalars['Int']['output'];
  deleted: Scalars['Boolean']['output'];
  /** Completed bookings this person posted. 0 when the account is deleted. */
  hostedCompletedCount: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  /**
   * Unlocked reviews about this person, the same summary as the public profile.
   * `average` stays null until `count` is at least 3. A deleted account is
   * `{ average: null, count: 0 }`.
   */
  ratingSummary: WorkerRatingSummary;
  userId: Scalars['ID']['output'];
};

/** An exact booking window. `end` is null when only a start was given. */
export type TimeSlot = {
  end?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  start: Scalars['DateTime']['output'];
};

/**
 * Exact start plus an optional `end` or `durationMinutes` (15 to 1440), not both.
 * Must start in the future and within a year. Times are instants (stored UTC);
 * Europe/London is the display zone.
 */
export type TimeSlotInput = {
  durationMinutes?: InputMaybe<Scalars['Int']['input']>;
  end?: InputMaybe<Scalars['DateTime']['input']>;
  start: Scalars['DateTime']['input'];
};

export type UpdateMyProfileInput = {
  /** Worker bio (persisted on the canonical worker document). */
  bio?: InputMaybe<Scalars['String']['input']>;
  /**
   * Empty string clears the number (and its verification). Changing a verified
   * number throws `PHONE_CHANGE_REQUIRES_VERIFICATION`: use
   * `sendPhoneVerification` + `verifyPhone` instead. An unverified number can be
   * changed here. Taken by another account: `EMAIL_OR_PHONE_IN_USE`.
   */
  contactNumber?: InputMaybe<Scalars['String']['input']>;
  /** Date of birth (private). Must meet the minimum worker age. */
  dateOfBirth?: InputMaybe<Scalars['DateTime']['input']>;
  defaultPreferredContactMethod?: InputMaybe<TaskContactMethod>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateMySettingsInput = {
  hideTaskPostingNotice?: InputMaybe<Scalars['Boolean']['input']>;
  isProfilePrivate?: InputMaybe<Scalars['Boolean']['input']>;
  language?: InputMaybe<UserLanguage>;
  marketingEmails?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateReviewInput = {
  /** Pass null to clear the comment. Omit to leave it unchanged. */
  comment?: InputMaybe<Scalars['String']['input']>;
  stars?: InputMaybe<Scalars['Int']['input']>;
};

/**
 * Partial amendments to an existing task. Every field is optional; only provided
 * fields are changed. Editable only by the poster while the task is still
 * `OPEN`/`DRAFT`.
 */
export type UpdateTaskInput = {
  /** Budget and currency. */
  budget?: InputMaybe<TaskBudgetInput>;
  /** Replaces all categories. Same rules as `CreateTaskInput.categories`. */
  categories?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Date and time preference (before/flexible/exact). Pass null to clear. */
  datetime?: InputMaybe<TaskDateTimeInput>;
  /** Detailed description of the job. */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Map-derived coordinates and place name for search. */
  location?: InputMaybe<TaskLocationInput>;
  /** Which profile contact channel may be shared with workers (re-snapshotted from profile). */
  preferredContactMethod?: InputMaybe<TaskContactMethod>;
  /** Short title for the task. */
  title?: InputMaybe<Scalars['String']['input']>;
};

/** The finished-profile editor. Same fields the Account profile form saves. */
export type UpdateWorkerProfileInput = {
  bio: Scalars['String']['input'];
  legalName: Scalars['String']['input'];
  location: LocationInput;
  portfolioUrls: Array<Scalars['String']['input']>;
  primaryCategory: WorkerPrimaryCategory;
  qualifications: Array<Scalars['String']['input']>;
  skills: Array<Scalars['String']['input']>;
  tagline: Scalars['String']['input'];
  travelRadiusMiles?: InputMaybe<Scalars['Float']['input']>;
  yearsExperience: Scalars['Int']['input'];
};

export type User = {
  /**
   * Address on the linked Apple account, including a Hide My Email relay. This
   * is only the mapping for that login. It is not `email`, and it does not have
   * to match `email`. Null when Apple is not linked. Owner (`me`) and admin only.
   */
  appleLoginEmail?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  /**
   * True once the account has been deleted (anonymised on day 30). The profile
   * then shows as "Deleted user" with no avatar: don't link to it. False while a
   * deletion is only scheduled.
   */
  deleted: Scalars['Boolean']['output'];
  /**
   * Why `requestAccountDeletion` would refuse, before the dialog. Empty when
   * nothing blocks it. Re-auth is still required at the mutation. Owner only
   * (`me`); empty for every other viewer.
   */
  deletionBlockers: Array<AccountDeletionBlocker>;
  /**
   * Set while the owner's account deletion is pending: the account is disabled
   * and will be anonymised at this time unless `restoreAccount` is called. Every
   * `@auth` action except `Query.me` and `restoreAccount` returns
   * `ACCOUNT_DELETION_SCHEDULED`. Owner and admin only.
   */
  deletionScheduledFor?: Maybe<Scalars['DateTime']['output']>;
  /**
   * When true, `@auth` actions are rejected with `ACCOUNT_DISABLED` except
   * `Query.me` (so clients can show a suspended state). Password and Google
   * login still succeed and return this flag. Password reset stays blocked.
   * Set by ops via `adminSetUserDisabled`.
   */
  disabled: Scalars['Boolean']['output'];
  /**
   * The real address for the account owner (`me`), admins, and the accepted
   * worker reading `Task.poster`. An empty string for every other viewer,
   * including the task owner reading `Quote.worker`.
   */
  email: Scalars['String']['output'];
  /** Whether this account's email address has been verified (`emailVerifiedAt` is set). */
  emailVerified: Scalars['Boolean']['output'];
  /** When the email was verified. Null until verified. */
  emailVerifiedAt?: Maybe<Scalars['DateTime']['output']>;
  /**
   * `PASSWORD` when a password is set, `GOOGLE` / `APPLE` when that account is linked.
   * Owner (`me`) and admin only; empty for every other viewer.
   */
  enabledLoginMethods: Array<LoginMethod>;
  /**
   * Address on the linked Google account. This is only the mapping for that
   * login. It is not `email`, and it does not have to match `email`. Null when
   * Google is not linked. Owner (`me`) and admin only.
   */
  googleLoginEmail?: Maybe<Scalars['String']['output']>;
  /**
   * Public trust signal for every viewer: orders with status `COMPLETED` where
   * this account is the customer. Same number as
   * `taskAchievements.customer.hostedCompletedCount`. 0 for deleted accounts.
   */
  hostedCompletedCount: Scalars['Int']['output'];
  /**
   * Distinct category strings on this user's My Tasks hub: tasks they posted,
   * plus tasks they still have a product-visible quote on. Unfiltered, so category
   * chips stay stable while search, owner, and section filters change.
   * Owner-only (`me`); empty for other viewers. Case-insensitive unique, sorted.
   */
  hubTaskCategories: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** Orders where this user is customer or worker. */
  orders: Array<Order>;
  /**
   * New email waiting for its verify link (`requestEmailChange`). `email` stays
   * live until then. Owner only (`me`); null for everyone else.
   */
  pendingEmail?: Maybe<Scalars['String']['output']>;
  /**
   * New phone (E.164) waiting for its SMS code (`sendPhoneVerification`). The
   * saved number stays live until `verifyPhone`. Owner only (`me`).
   */
  pendingPhone?: Maybe<Scalars['String']['output']>;
  /** Whether this account's phone number is verified (Twilio Verify; `phoneVerifiedAt` is set). */
  phoneVerified: Scalars['Boolean']['output'];
  /** When the phone was verified. Null until verified. */
  phoneVerifiedAt?: Maybe<Scalars['DateTime']['output']>;
  profile: Profile;
  /**
   * Tasks this user has quoted on (any quote status). Owner-only (`me`); empty for other viewers.
   * Prefer over nested `worker.quotedTasks` when `me.worker` may be null.
   */
  quotedTasks: Array<Task>;
  /**
   * Workers this account saved, newest first. Owner-only (`me`); empty for every
   * other viewer. A worker who is no longer public is left out.
   */
  savedWorkers: Array<Worker>;
  /**
   * Owner (`me`) and admin only. Every other viewer gets the default shell
   * (`isProfilePrivate: true`, `marketingEmails: false`,
   * `hideTaskPostingNotice: false`, default language).
   */
  settings: UserSettings;
  /**
   * My Tasks achievements for the authenticated owner (`me`).
   *
   * Two panels: work this account did as a worker, and tasks this account hosted
   * as a customer. An order is counted in only one panel for a given role, so a
   * dual-role account is not summed twice inside either panel.
   *
   * Money fields are agreed quote amounts on `COMPLETED` orders (off-platform
   * settlement between customer and worker). Subscription charges are not
   * included. Empty shell for every other viewer.
   */
  taskAchievements: MyTasksAchievements;
  /**
   * Tasks the user posted. For anyone but the user and ops, suspended tasks are
   * left out.
   */
  tasksPosted: Array<Task>;
  /**
   * Messages inbox: task threads and the Slashie system thread this user takes
   * part in, most recently active first. Owner-only (`me`); empty for other viewers.
   */
  threads: Array<Thread>;
  /** Unread items across all threads (the Messages badge). Owner-only (`me`); 0 for others. */
  unreadMessageCount: Scalars['Int']['output'];
  /**
   * The user's worker profile. Null for other viewers until worker setup is
   * complete, as in the directory and `PublicUser.worker`; the user themself
   * and admins also see a profile still in setup.
   */
  worker?: Maybe<Worker>;
  /**
   * True when the user satisfies worker-eligibility requirements. Only meaningful
   * for the authenticated owner (`me`); false for other viewers.
   */
  workerEligibility: Scalars['Boolean']['output'];
};


export type UserOrdersArgs = {
  filter?: InputMaybe<MyOrdersFilter>;
};


export type UserQuotedTasksArgs = {
  filter?: InputMaybe<TaskFilter>;
  sort?: InputMaybe<TaskSort>;
};


export type UserTasksPostedArgs = {
  filter?: InputMaybe<TaskFilter>;
  sort?: InputMaybe<TaskSort>;
};

export enum UserLanguage {
  En = 'EN',
  ZhTw = 'ZH_TW'
}

/** Cursor page for ops people lists (`adminUsers`). Newest first. */
export type UserPage = {
  items: Array<User>;
  /** Opaque cursor (user id) for the next page, or null when there are no more items. */
  nextCursor?: Maybe<Scalars['String']['output']>;
};

export type UserSettings = {
  /**
   * Owner chose not to see the allowed-task notice on Post a task again.
   * Missing on older accounts, which still see the notice.
   */
  hideTaskPostingNotice: Scalars['Boolean']['output'];
  isProfilePrivate: Scalars['Boolean']['output'];
  language: UserLanguage;
  marketingEmails: Scalars['Boolean']['output'];
};

/** Browser Push API subscription. `p256dh` and `auth` are stored but not readable. */
export type WebPushSubscription = {
  createdAt: Scalars['DateTime']['output'];
  endpoint: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/**
 * A completed platform job shown on the public worker profile ("Work on
 * Slashie"). Public-safe fields only.
 */
export type WorkerCompletedJob = {
  /** Approximate area only (borough/city) — same redaction as public task views. */
  areaLabel?: Maybe<Scalars['String']['output']>;
  categories: Array<Scalars['String']['output']>;
  completedAt: Scalars['DateTime']['output'];
  /**
   * Stars from the customer's unlocked review of this job. Null until that
   * review is public (both parties submitted, or 14 days after completion)
   * or when the review is hidden.
   */
  rating?: Maybe<Scalars['Float']['output']>;
  taskId: Scalars['ID']['output'];
  title: Scalars['String']['output'];
};

export enum WorkerContactAction {
  /** No existing relationship — contact unlocks after accepting a quote on a task. */
  AcceptQuoteFirst = 'ACCEPT_QUOTE_FIRST',
  /** Contact does not apply (viewing your own profile). */
  None = 'NONE',
  /** This worker has a pending quote on the viewer's open task — see `relatedQuoteId`. */
  OpenQuote = 'OPEN_QUOTE',
  /** Viewer has an active job with this worker — contact via `relatedTaskId`. */
  OpenTask = 'OPEN_TASK',
  /** Viewer is anonymous — sign in first. */
  SignIn = 'SIGN_IN'
}

export type WorkerEarnings = {
  /** Sum of agreed prices on the worker's non-COMPLETED orders (C2C reference only, not payouts). */
  pending: Price;
};

/**
 * Filter constraints for worker directory search (`Query.workers`).
 * `search` matches worker bio/tagline/legal name and user profile name plus location label.
 * Geo filtering matches workers whose service area (preferred location + travel radius)
 * intersects the search area — either `lat`/`lng`/`radiusMiles` (point + radius; default
 * radius 25 miles, capped at 50) or `bounds` (map viewport). `bounds` wins when both are
 * set. Workers with no location set are excluded from geo-filtered results only.
 * `primaryCategory` exact-matches the worker's primary trade.
 * `minRating` is accepted and ignored. Public rating filters are not offered.
 */
export type WorkerFilter = {
  /** Map viewport bounding box. Takes precedence over `lat`/`lng`/`radiusMiles`. */
  bounds?: InputMaybe<GeoBoundsInput>;
  /** Map/search center latitude for geo filtering and distance sort. */
  lat?: InputMaybe<Scalars['Float']['input']>;
  /** Map/search center longitude for geo filtering and distance sort. */
  lng?: InputMaybe<Scalars['Float']['input']>;
  /** Case-insensitive partial match on the worker's location label (area/city). */
  location?: InputMaybe<Scalars['String']['input']>;
  /** Ignored. Slashie does not filter the directory by rating. */
  minRating?: InputMaybe<Scalars['Float']['input']>;
  /** Exact match on the worker's primary trade. */
  primaryCategory?: InputMaybe<WorkerPrimaryCategory>;
  /** Search radius in miles from the center. Defaults to 25 when `lat` and `lng` are set. */
  radiusMiles?: InputMaybe<Scalars['Float']['input']>;
  /** Case-insensitive partial match on profile name, legal name, tagline, bio, and location label. */
  search?: InputMaybe<Scalars['String']['input']>;
  /** When true, only workers whose identity verification is `VERIFIED` are returned. */
  verifiedOnly?: InputMaybe<Scalars['Boolean']['input']>;
};

export type WorkerMembership = {
  /** True when the worker has a Stripe customer id and can open the billing portal. */
  canManageBilling: Scalars['Boolean']['output'];
  canStartTrial: Scalars['Boolean']['output'];
  /** True when the worker can start Checkout for Slashie Unlimited (no unlimited access, billing configured). */
  canUpgrade: Scalars['Boolean']['output'];
  /** True when Stripe `cancel_at_period_end` is set on the live subscription. */
  cancelAtPeriodEnd: Scalars['Boolean']['output'];
  /** When Stripe recorded the subscription cancellation, if available. */
  canceledAt?: Maybe<Scalars['DateTime']['output']>;
  currentPeriodEnd?: Maybe<Scalars['DateTime']['output']>;
  freeQuotesPerMonth: Scalars['Int']['output'];
  hasUnlimitedQuotes: Scalars['Boolean']['output'];
  planName: Scalars['String']['output'];
  quotesRemainingThisMonth: Scalars['Int']['output'];
  /**
   * Distinct tasks this worker quoted in the current UTC month.
   * Withdrawn and soft-deleted quotes still count. Edits on the same task do not add another.
   */
  quotesUsedThisMonth: Scalars['Int']['output'];
  /** One-line helper for subtitles (e.g. trial end date, payment reminder). */
  statusDescription?: Maybe<Scalars['String']['output']>;
  /** Short badge label (Free, Trial, Active, Past due, etc.). Prefer this over re-deriving on the client. */
  statusLabel: Scalars['String']['output'];
  subscriptionStatus: WorkerSubscriptionStatus;
  trialEndsAt?: Maybe<Scalars['DateTime']['output']>;
};

/**
 * Primary trade / service category chosen during worker setup (`services.skills`).
 * Null until setup picks one.
 */
export enum WorkerPrimaryCategory {
  Carpentry = 'CARPENTRY',
  Cleaning = 'CLEANING',
  DeliveryErrands = 'DELIVERY_ERRANDS',
  Electrical = 'ELECTRICAL',
  FurnitureAssembly = 'FURNITURE_ASSEMBLY',
  Gardening = 'GARDENING',
  Handyman = 'HANDYMAN',
  MountingInstallation = 'MOUNTING_INSTALLATION',
  Other = 'OTHER',
  Painting = 'PAINTING',
  Plumbing = 'PLUMBING',
  Removals = 'REMOVALS'
}

export enum WorkerProfileGap {
  Bio = 'BIO',
  Headline = 'HEADLINE',
  Photo = 'PHOTO',
  Portfolio = 'PORTFOLIO',
  ServiceArea = 'SERVICE_AREA',
  Skills = 'SKILLS'
}

/**
 * Viewer-specific worker profile context (`worker.viewer`). Null for anonymous
 * viewers; drives the Save / Leave a review / Contact states on the profile page.
 */
export type WorkerProfileViewer = {
  /**
   * True when the viewer still has a completed job with this worker that they
   * have not reviewed. False once every finished job is reviewed. There is no
   * separate deadline for a first review; the 48-hour window only limits edits.
   */
  canLeaveReview: Scalars['Boolean']['output'];
  contactAction: WorkerContactAction;
  isSaved: Scalars['Boolean']['output'];
  relatedQuoteId?: Maybe<Scalars['ID']['output']>;
  relatedTaskId?: Maybe<Scalars['ID']['output']>;
  /** Newest unreviewed completed job with this worker. Null when `canLeaveReview` is false. */
  reviewOrderId?: Maybe<Scalars['ID']['output']>;
  /** Task for `reviewOrderId`. */
  reviewTaskId?: Maybe<Scalars['ID']['output']>;
};

/** How the viewer can contact this worker from the profile page. */
export enum WorkerPublishState {
  Draft = 'DRAFT',
  Hidden = 'HIDDEN',
  Published = 'PUBLISHED'
}

/**
 * Public reviews of this worker. `count` is how many are unlocked.
 * `average` stays null until `count` is at least 3 — no partial average.
 */
export type WorkerRatingSummary = {
  average?: Maybe<Scalars['Float']['output']>;
  count: Scalars['Int']['output'];
};

export type WorkerSetupProgress = {
  /** Sub-step ids the worker has completed via `saveWorkerSetupStep`. */
  completedSubSteps: Array<Scalars['String']['output']>;
  /** Active sub-step id, e.g. `profile.details`. */
  currentSubStep: Scalars['String']['output'];
  /** True when setup is finished (`review.submit` saved successfully). */
  isComplete: Scalars['Boolean']['output'];
};

/**
 * Sort order for `Query.workers`. Supplied as a sibling argument to `filter`.
 * Default when omitted: `NAME` `ASC`.
 */
export type WorkerSort = {
  direction: SortDirection;
  field: WorkerSortField;
};

export enum WorkerSortField {
  /**
   * Sort by distance from `filter.lat` / `filter.lng` (or the centre of `filter.bounds`).
   * Requires a geo filter; otherwise falls back to name order.
   */
  Distance = 'DISTANCE',
  /** Sort alphabetically by display name (legal name, then linked user profile name). */
  Name = 'NAME',
  /** Accepted and ignored. Falls back to name order. No public sort-by-rating. */
  Rating = 'RATING'
}

export enum WorkerSubscriptionStatus {
  /** Stripe `active` — paying subscriber with unlimited quotes. */
  Active = 'ACTIVE',
  /** Stripe `canceled` — subscription ended; free tier applies. */
  Canceled = 'CANCELED',
  /** Stripe `incomplete` — Checkout started but not completed. */
  Incomplete = 'INCOMPLETE',
  /** Stripe `incomplete_expired` — Checkout session expired. */
  IncompleteExpired = 'INCOMPLETE_EXPIRED',
  /** No live subscription — free tier quote limits apply. */
  None = 'NONE',
  /** Stripe `past_due` — payment failed; quotes blocked until resolved. */
  PastDue = 'PAST_DUE',
  /** Stripe `paused` — subscription paused (if enabled on account). */
  Paused = 'PAUSED',
  /** Stripe `trialing` — unlimited quotes during trial. */
  Trialing = 'TRIALING',
  /** Stripe `unpaid` — invoice unpaid; quotes blocked. */
  Unpaid = 'UNPAID'
}

/**
 * Worker-side My Tasks achievements. Counts and agreed totals use orders where
 * this account is the worker and status is `COMPLETED`. Canceled and any
 * non-completed status (including a future disputed status) are excluded.
 */
export type WorkerTaskAchievements = {
  /**
   * Accepted quote amounts on `COMPLETED` worker orders, grouped by currency.
   * Off-platform amounts agreed with the customer. Subscription charges are not included.
   */
  agreedTotalsOnCompletedJobs: Array<Price>;
  /** Category mix of those `COMPLETED` worker orders (snapshot category). */
  categoryMix: Array<TaskAchievementCategoryShare>;
  /** Orders with status `COMPLETED` where this account is the worker. */
  completedJobsCount: Scalars['Int']['output'];
  /**
   * Free-tier cap for `quotesThisMonth` (3 per UTC month). Stays 3 when the
   * worker has unlimited quotes; clients should read `hasUnlimitedQuotes`.
   */
  freeQuotesPerMonth: Scalars['Int']['output'];
  /**
   * True when this account has any quote or any order as the worker.
   * False when there is no worker-side history, even if a worker profile exists.
   */
  hasActivity: Scalars['Boolean']['output'];
  /**
   * True when the stored membership currently allows unlimited quotes.
   * This is not a money amount and is not added into agreed totals.
   */
  hasUnlimitedQuotes: Scalars['Boolean']['output'];
  /** Most common area on those `COMPLETED` worker orders. Null when none have a place label. */
  mostWorkedLocation?: Maybe<TaskAchievementLocationStat>;
  /**
   * Distinct tasks with a non-EXPIRED quote created in the current UTC month.
   * Same allowance rule as worker membership. Edits on one task count once.
   */
  quotesThisMonth: Scalars['Int']['output'];
  /**
   * Consecutive UTC weeks (Monday 00:00 start), ending this week, that each
   * contain at least one `COMPLETED` worker order. Zero when this week has none.
   */
  streakWeeks: Scalars['Int']['output'];
};

export type Worker = {
  bio?: Maybe<Scalars['String']['output']>;
  /**
   * Completed platform jobs, newest first. `first` limits the page (at most 100).
   * Omit it to return every row. Jobs on a suspended task are left out while it
   * is suspended.
   */
  completedJobs: Array<WorkerCompletedJob>;
  /**
   * Completed platform jobs, including rows past `first` and jobs on suspended
   * tasks (which `completedJobs` leaves out).
   */
  completedJobsCount: Scalars['Int']['output'];
  /** Reference earnings summary (not payouts). Viewer must be the worker. */
  earnings: WorkerEarnings;
  /**
   * Public trust signal from the linked user account (Trust & verification card).
   * Mirrors the user's `emailVerified` flag. Boolean only — never exposes the
   * email address itself.
   */
  emailVerified: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  /**
   * Identity verification progress (Trust & verification card). Distinguishes
   * "not started" from "in review" so the FE can render each state.
   */
  identityVerification: IdentityVerificationStatus;
  /**
   * Convenience flag derived from `identityVerification` — true only when
   * identity verification is `VERIFIED`.
   */
  isVerified: Scalars['Boolean']['output'];
  /**
   * Worker's legal name. The worker themself and the admin dossier (which reads
   * this profile as self). Everyone else gets null.
   */
  legalName?: Maybe<Scalars['String']['output']>;
  /** Base town (stored town-only). Same value as `preferredLocation.name`. */
  locationAddress?: Maybe<Scalars['String']['output']>;
  /** Exact for the worker; the public point for everyone else. */
  locationLat?: Maybe<Scalars['Float']['output']>;
  /** Exact for the worker; the public point for everyone else. */
  locationLng?: Maybe<Scalars['Float']['output']>;
  /** When the worker joined Slashie (linked user's registration date). */
  memberSince?: Maybe<Scalars['DateTime']['output']>;
  /** Platform subscription plan and quote usage. Stripe-verified when the viewer is the worker. */
  membership: WorkerMembership;
  /**
   * Public trust signal from the linked user account (Trust & verification card).
   * True only when the user's phone number is actually verified via Twilio
   * Verify approval (`phoneVerified` + `phoneVerifiedAt` + a saved phone number).
   */
  phoneVerified: Scalars['Boolean']['output'];
  /** Optional portfolio image URLs (setup step `verify.portfolio`). */
  portfolioUrls: Array<Scalars['String']['output']>;
  /**
   * Base location. `name` is the town. The worker gets the exact point and
   * `address`; everyone else gets a fixed public point up to about 250 m away and
   * no `address`. Geo search matches on the public point.
   */
  preferredLocation: Location;
  /** Primary trade chosen at setup (`services.skills`). Null until chosen. */
  primaryCategory?: Maybe<WorkerPrimaryCategory>;
  profile: Profile;
  /**
   * What the profile could still add, using the same floors as the edit form
   * (headline 10, bio 80, 3 skills; a CJK character counts as two). Portfolio
   * last. Empty when nothing is missing.
   */
  profileGaps: Array<WorkerProfileGap>;
  /**
   * Draft until setup is finished. Hidden when the account profile is private.
   * Published otherwise. Same order as the Profile page.
   */
  publishState: WorkerPublishState;
  /**
   * Qualifications and certifications (setup step `services.experience`), e.g.
   * "City & Guilds", "NICEIC", "Gas Safe". Public labels only — no documents.
   */
  qualifications: Array<Scalars['String']['output']>;
  /** Tasks this worker has quoted on (viewer must be the worker). */
  quotedTasks: Array<Task>;
  /**
   * Number of quotes this worker has sent (withdrawn quotes excluded). Public
   * "At a glance" stat.
   */
  quotesSentCount: Scalars['Int']['output'];
  ratingSummary: WorkerRatingSummary;
  /**
   * Publicly unlocked reviews of this worker, newest first. Hidden reviews are
   * omitted. This list is not sortable by rating.
   */
  reviews: Array<Review>;
  /**
   * How far the worker travels from their preferred location. Drives geo search
   * intersection (`Query.workers` `filter.lat/lng/radiusMiles` or `filter.bounds`).
   */
  serviceArea: ServiceArea;
  /**
   * Public display label for the service area, e.g. "Camden & Islington (~5 miles)".
   * Uses the stored service-area label, falling back to the area display name plus
   * travel radius. Never a street address.
   */
  serviceAreaLabel?: Maybe<Scalars['String']['output']>;
  /** Multi-step onboarding progress. Owner-only (`me.worker`); null for other viewers. */
  setupProgress?: Maybe<WorkerSetupProgress>;
  /**
   * Additional free-text skills/tags (setup step `services.skills`). Distinct
   * from `primaryCategory`.
   */
  skills: Array<Scalars['String']['output']>;
  tagline?: Maybe<Scalars['String']['output']>;
  /** How far the worker is willing to travel from their base location, in miles. */
  travelRadiusMiles?: Maybe<Scalars['Float']['output']>;
  user: User;
  userId: Scalars['ID']['output'];
  /** Viewer-specific context (save / review / contact states). Null when anonymous. */
  viewer?: Maybe<WorkerProfileViewer>;
  yearsExperience?: Maybe<Scalars['Int']['output']>;
};


export type WorkerCompletedJobsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type WorkerQuotedTasksArgs = {
  filter?: InputMaybe<TaskFilter>;
  sort?: InputMaybe<TaskSort>;
};

export type LoginWithGoogleMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type LoginWithGoogleMutation = { loginWithMethod: { token: string, user: { id: string, email: string, emailVerified: boolean } } };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me: { id: string, email: string, emailVerified: boolean, profile: { name?: string | null, avatarUrl?: string | null } } };

export type UserAdminFieldsFragment = { id: string, email: string, emailVerified: boolean, phoneVerified: boolean, createdAt: any, disabled: boolean, profile: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null }, worker?: { id: string, userId: string, legalName?: string | null, tagline?: string | null, bio?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification: IdentityVerificationStatus, skills: Array<string>, phoneVerified: boolean, emailVerified: boolean, memberSince?: any | null, serviceAreaLabel?: string | null, profile: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null }, ratingSummary: { average?: number | null, count: number } } | null };

export type TaskListFieldsFragment = { id: string, title: string, description: string, categories: Array<string>, status: TaskStatus, views: number, suspension?: { bySlashie: boolean, posterSuspended: boolean } | null, datetime?: { date?: string | null, time?: string | null, type: TaskDateTimeType } | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile: { name?: string | null, avatarUrl?: string | null } } | null };

export type WorkerAdminFieldsFragment = { id: string, userId: string, legalName?: string | null, bio?: string | null, tagline?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification: IdentityVerificationStatus, skills: Array<string>, qualifications: Array<string>, quotesSentCount: number, phoneVerified: boolean, emailVerified: boolean, memberSince?: any | null, serviceAreaLabel?: string | null, profile: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null }, user: { id: string, email: string }, preferredLocation: { name?: string | null, lat?: number | null, lng?: number | null }, serviceArea: { label?: string | null, radiusMiles?: number | null }, ratingSummary: { average?: number | null, count: number } };

export type AdminTaskDossierFieldsFragment = { task: { id: string, title: string, description: string, categories: Array<string>, status: TaskStatus, views: number, suspension?: { bySlashie: boolean, posterSuspended: boolean } | null, datetime?: { date?: string | null, time?: string | null, type: TaskDateTimeType } | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile: { name?: string | null, avatarUrl?: string | null } } | null }, poster?: { id: string, email: string, emailVerified: boolean, phoneVerified: boolean, createdAt: any, disabled: boolean, profile: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null }, worker?: { id: string, userId: string, legalName?: string | null, tagline?: string | null, bio?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification: IdentityVerificationStatus, skills: Array<string>, phoneVerified: boolean, emailVerified: boolean, memberSince?: any | null, serviceAreaLabel?: string | null, profile: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null }, ratingSummary: { average?: number | null, count: number } } | null } | null, workers: Array<{ id: string, userId: string, legalName?: string | null, bio?: string | null, tagline?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification: IdentityVerificationStatus, skills: Array<string>, qualifications: Array<string>, quotesSentCount: number, phoneVerified: boolean, emailVerified: boolean, memberSince?: any | null, serviceAreaLabel?: string | null, profile: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null }, user: { id: string, email: string }, preferredLocation: { name?: string | null, lat?: number | null, lng?: number | null }, serviceArea: { label?: string | null, radiusMiles?: number | null }, ratingSummary: { average?: number | null, count: number } }>, quotes: Array<{ id: string, status: QuoteStatus, message?: string | null, createdAt: any, workerSuspended: boolean, price?: { amount: number, currency: Currency } | null, worker?: { id: string, email: string, profile: { name?: string | null }, worker?: { id: string, legalName?: string | null, isVerified: boolean, profile: { name?: string | null } } | null } | null }>, orders: Array<{ id: string, status: OrderStatus, createdAt: any, workerUserId: string, customerUserId: string, quoteId: string, bookedStart: any, bookedEnd?: any | null, autoDoneAt?: any | null, closedAt?: any | null, agreedPrice: { amount: number, currency: Currency }, pendingRequest?: { kind: OrderRequestKind, requestedByUserId: string, requestedAt: any } | null, rescheduleHistory: Array<{ previousStart: any, start: any, requestedByUserId: string, confirmedAt: any }> }>, activity: Array<{ source: AdminTaskActivitySource, type: string, title?: string | null, body?: string | null, createdAt: any, actorUserId?: string | null, visibleToUserIds: Array<string>, quoteId?: string | null, orderId?: string | null }> };

export type AdminTasksQueryVariables = Exact<{
  filter?: InputMaybe<AdminTaskFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type AdminTasksQuery = { adminTasks: { nextCursor?: string | null, items: Array<{ id: string, title: string, description: string, categories: Array<string>, status: TaskStatus, views: number, suspension?: { bySlashie: boolean, posterSuspended: boolean } | null, datetime?: { date?: string | null, time?: string | null, type: TaskDateTimeType } | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile: { name?: string | null, avatarUrl?: string | null } } | null }> } };

export type AdminTaskQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AdminTaskQuery = { adminTask: { task: { id: string, title: string, description: string, categories: Array<string>, status: TaskStatus, views: number, suspension?: { bySlashie: boolean, posterSuspended: boolean } | null, datetime?: { date?: string | null, time?: string | null, type: TaskDateTimeType } | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile: { name?: string | null, avatarUrl?: string | null } } | null }, poster?: { id: string, email: string, emailVerified: boolean, phoneVerified: boolean, createdAt: any, disabled: boolean, profile: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null }, worker?: { id: string, userId: string, legalName?: string | null, tagline?: string | null, bio?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification: IdentityVerificationStatus, skills: Array<string>, phoneVerified: boolean, emailVerified: boolean, memberSince?: any | null, serviceAreaLabel?: string | null, profile: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null }, ratingSummary: { average?: number | null, count: number } } | null } | null, workers: Array<{ id: string, userId: string, legalName?: string | null, bio?: string | null, tagline?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification: IdentityVerificationStatus, skills: Array<string>, qualifications: Array<string>, quotesSentCount: number, phoneVerified: boolean, emailVerified: boolean, memberSince?: any | null, serviceAreaLabel?: string | null, profile: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null }, user: { id: string, email: string }, preferredLocation: { name?: string | null, lat?: number | null, lng?: number | null }, serviceArea: { label?: string | null, radiusMiles?: number | null }, ratingSummary: { average?: number | null, count: number } }>, quotes: Array<{ id: string, status: QuoteStatus, message?: string | null, createdAt: any, workerSuspended: boolean, price?: { amount: number, currency: Currency } | null, worker?: { id: string, email: string, profile: { name?: string | null }, worker?: { id: string, legalName?: string | null, isVerified: boolean, profile: { name?: string | null } } | null } | null }>, orders: Array<{ id: string, status: OrderStatus, createdAt: any, workerUserId: string, customerUserId: string, quoteId: string, bookedStart: any, bookedEnd?: any | null, autoDoneAt?: any | null, closedAt?: any | null, agreedPrice: { amount: number, currency: Currency }, pendingRequest?: { kind: OrderRequestKind, requestedByUserId: string, requestedAt: any } | null, rescheduleHistory: Array<{ previousStart: any, start: any, requestedByUserId: string, confirmedAt: any }> }>, activity: Array<{ source: AdminTaskActivitySource, type: string, title?: string | null, body?: string | null, createdAt: any, actorUserId?: string | null, visibleToUserIds: Array<string>, quoteId?: string | null, orderId?: string | null }> } };

export type AdminUsersQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  disabled?: InputMaybe<Scalars['Boolean']['input']>;
  isWorker?: InputMaybe<Scalars['Boolean']['input']>;
  createdAfter?: InputMaybe<Scalars['DateTime']['input']>;
  createdBefore?: InputMaybe<Scalars['DateTime']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type AdminUsersQuery = { adminUsers: { nextCursor?: string | null, items: Array<{ id: string, email: string, emailVerified: boolean, phoneVerified: boolean, createdAt: any, disabled: boolean, profile: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null }, worker?: { id: string, userId: string, legalName?: string | null, tagline?: string | null, bio?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification: IdentityVerificationStatus, skills: Array<string>, phoneVerified: boolean, emailVerified: boolean, memberSince?: any | null, serviceAreaLabel?: string | null, profile: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null }, ratingSummary: { average?: number | null, count: number } } | null }> } };

export type AdminUserDetailQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AdminUserDetailQuery = { adminUsers: { items: Array<{ id: string, email: string, emailVerified: boolean, phoneVerified: boolean, createdAt: any, disabled: boolean, tasksPosted: Array<{ id: string, title: string, status: TaskStatus, categories: Array<string> }>, profile: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null }, worker?: { id: string, userId: string, legalName?: string | null, tagline?: string | null, bio?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification: IdentityVerificationStatus, skills: Array<string>, phoneVerified: boolean, emailVerified: boolean, memberSince?: any | null, serviceAreaLabel?: string | null, profile: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null }, ratingSummary: { average?: number | null, count: number } } | null }> } };

export type AdminUpdateTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: AdminUpdateTaskInput;
}>;


export type AdminUpdateTaskMutation = { adminUpdateTask: { id: string, title: string, description: string, categories: Array<string>, status: TaskStatus, views: number, suspension?: { bySlashie: boolean, posterSuspended: boolean } | null, datetime?: { date?: string | null, time?: string | null, type: TaskDateTimeType } | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile: { name?: string | null, avatarUrl?: string | null } } | null } };

export type AdminSetTaskSuspendedMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  suspended: Scalars['Boolean']['input'];
}>;


export type AdminSetTaskSuspendedMutation = { adminSetTaskSuspended: { id: string, title: string, description: string, categories: Array<string>, status: TaskStatus, views: number, suspension?: { bySlashie: boolean, posterSuspended: boolean } | null, datetime?: { date?: string | null, time?: string | null, type: TaskDateTimeType } | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile: { name?: string | null, avatarUrl?: string | null } } | null } };

export type AdminUpdateUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: AdminUpdateUserInput;
}>;


export type AdminUpdateUserMutation = { adminUpdateUser: { id: string, email: string, emailVerified: boolean, phoneVerified: boolean, createdAt: any, disabled: boolean, profile: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null }, worker?: { id: string, userId: string, legalName?: string | null, tagline?: string | null, bio?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification: IdentityVerificationStatus, skills: Array<string>, phoneVerified: boolean, emailVerified: boolean, memberSince?: any | null, serviceAreaLabel?: string | null, profile: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null }, ratingSummary: { average?: number | null, count: number } } | null } };

export type AdminSetUserDisabledMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  disabled: Scalars['Boolean']['input'];
}>;


export type AdminSetUserDisabledMutation = { adminSetUserDisabled: { id: string, email: string, emailVerified: boolean, phoneVerified: boolean, createdAt: any, disabled: boolean, profile: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null }, worker?: { id: string, userId: string, legalName?: string | null, tagline?: string | null, bio?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification: IdentityVerificationStatus, skills: Array<string>, phoneVerified: boolean, emailVerified: boolean, memberSince?: any | null, serviceAreaLabel?: string | null, profile: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null }, ratingSummary: { average?: number | null, count: number } } | null } };

export type ReportFieldsFragment = { id: string, targetId: string, targetType: ReportTargetType, reason: ReportReason, details?: string | null, status: ReportStatus, targetUrl?: string | null, createdAt: any, updatedAt: any, reporterUserId: string, reporterEmail?: string | null, targetLabel?: string | null, reporter?: { id: string, email: string, profile: { name?: string | null } } | null };

export type AdminReportsQueryVariables = Exact<{
  status?: InputMaybe<ReportStatus>;
  targetType?: InputMaybe<ReportTargetType>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type AdminReportsQuery = { adminReports: { nextCursor?: string | null, items: Array<{ id: string, targetId: string, targetType: ReportTargetType, reason: ReportReason, details?: string | null, status: ReportStatus, targetUrl?: string | null, createdAt: any, updatedAt: any, reporterUserId: string, reporterEmail?: string | null, targetLabel?: string | null, reporter?: { id: string, email: string, profile: { name?: string | null } } | null }> } };

export type AdminUpdateReportStatusMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  status: ReportStatus;
}>;


export type AdminUpdateReportStatusMutation = { adminUpdateReportStatus: { id: string, targetId: string, targetType: ReportTargetType, reason: ReportReason, details?: string | null, status: ReportStatus, targetUrl?: string | null, createdAt: any, updatedAt: any, reporterUserId: string, reporterEmail?: string | null, targetLabel?: string | null, reporter?: { id: string, email: string, profile: { name?: string | null } } | null } };

export type FeedbackFieldsFragment = { id: string, userId?: string | null, email: string, name?: string | null, category: FeedbackCategory, rating?: number | null, message: string, pageUrl?: string | null, path?: string | null, userAgent?: string | null, status: FeedbackStatus, ackEmailSentAt?: any | null, createdAt: any, updatedAt: any };

export type AdminFeedbackSummaryQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminFeedbackSummaryQuery = { adminFeedbackSummary: { total: number, open: number, reviewed: number, replied: number } };

export type AdminFeedbacksQueryVariables = Exact<{
  status?: InputMaybe<FeedbackStatus>;
  category?: InputMaybe<FeedbackCategory>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type AdminFeedbacksQuery = { adminFeedbacks: { nextCursor?: string | null, items: Array<{ id: string, userId?: string | null, email: string, name?: string | null, category: FeedbackCategory, rating?: number | null, message: string, pageUrl?: string | null, path?: string | null, userAgent?: string | null, status: FeedbackStatus, ackEmailSentAt?: any | null, createdAt: any, updatedAt: any }> } };

export type AdminUpdateFeedbackStatusMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  status: FeedbackStatus;
}>;


export type AdminUpdateFeedbackStatusMutation = { adminUpdateFeedbackStatus: { id: string, userId?: string | null, email: string, name?: string | null, category: FeedbackCategory, rating?: number | null, message: string, pageUrl?: string | null, path?: string | null, userAgent?: string | null, status: FeedbackStatus, ackEmailSentAt?: any | null, createdAt: any, updatedAt: any } };

export type AdminFeedbackDraftReplyQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AdminFeedbackDraftReplyQuery = { adminFeedbackDraftReply: { subject: string, bodyText: string, bodyHtml?: string | null } };

export type AdminOpsSummaryQueryVariables = Exact<{
  range: AdminOpsRange;
}>;


export type AdminOpsSummaryQuery = { adminOpsSummary: { range: AdminOpsRange, dateFrom: any, dateTo: any, previousDateFrom: any, previousDateTo: any, openReports: number, hiddenTasks: number, disabledUsers: number, newUsers: { current: number, previous: number, percentChange?: number | null }, tasksCreated: { current: number, previous: number, percentChange?: number | null }, workersRegistered: { current: number, previous: number, percentChange?: number | null }, quotesSent: { current: number, previous: number, percentChange?: number | null }, quotesAccepted: { current: number, previous: number, percentChange?: number | null }, quotesDeclined: { current: number, previous: number, percentChange?: number | null }, ordersOpened: { current: number, previous: number, percentChange?: number | null }, jobsCompleted: { current: number, previous: number, percentChange?: number | null }, reportsSubmitted: { current: number, previous: number, percentChange?: number | null }, tasksByStatus: Array<{ status: TaskStatus, count: number }> } };

export type PopularTaskCategoriesQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type PopularTaskCategoriesQuery = { popularTaskCategories: Array<string> };
