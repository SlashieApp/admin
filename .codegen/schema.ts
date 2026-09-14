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
  /** Optional preferred date after award. */
  preferredDate?: InputMaybe<Scalars['DateTime']['input']>;
  /** Quote to accept for the task. */
  quoteId: Scalars['ID']['input'];
};

export type AcceptQuotePayload = {
  order: Order;
  task: Task;
};

export type AddQuoteInput = {
  message?: InputMaybe<Scalars['String']['input']>;
  price: PriceInput;
  taskId: Scalars['ID']['input'];
};

export type AdditionalEntityFields = {
  path?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

/**
 * Ops allowlist row. Presence of an active document (plus @slashie.app email)
 * is required for fields marked `@admin`. Not a marketplace user role.
 */
export type Admin = {
  /** Inactive rows cannot call `@admin` fields. */
  active: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  /** Normalized lowercase email. Unique. Must end with `@slashie.app`. */
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** Linked user id when known (set on first successful `@admin` call). */
  userId?: Maybe<Scalars['ID']['output']>;
};

/** Ops search across all tasks (including hidden, cancelled, and non-OPEN). */
export type AdminTaskFilter = {
  /** When set, only hidden or only visible tasks. */
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  /** Exact task id lookup. */
  id?: InputMaybe<Scalars['ID']['input']>;
  /**
   * Case-insensitive match on title, description, or place name. A 24-char hex
   * value also matches the task id.
   */
  search?: InputMaybe<Scalars['String']['input']>;
  /** Constrain by status(es). Omit for all statuses. */
  status?: InputMaybe<Array<TaskStatus>>;
};

/**
 * God-mode task amendments. Every field is optional; only provided fields change.
 * Ignores poster ownership and OPEN/DRAFT restrictions. Input is still validated.
 */
export type AdminUpdateTaskInput = {
  acceptedWorkerCap?: InputMaybe<Scalars['Int']['input']>;
  budget?: InputMaybe<TaskBudgetInput>;
  category?: InputMaybe<Scalars['String']['input']>;
  /** Date and time preference. Pass null to clear. */
  datetime?: InputMaybe<TaskDateTimeInput>;
  description?: InputMaybe<Scalars['String']['input']>;
  /** Hide from public discovery (`Query.tasks`) without cancelling the task. */
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  location?: InputMaybe<TaskLocationInput>;
  preferredContactMethod?: InputMaybe<TaskContactMethod>;
  status?: InputMaybe<TaskStatus>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type AuthPayload = {
  token: Scalars['String']['output'];
  user: User;
};

export type CheckoutSessionPayload = {
  url: Scalars['String']['output'];
};

export type CreateReportInput = {
  /** Optional free-text context. Trimmed and capped at 2000 characters. */
  details?: InputMaybe<Scalars['String']['input']>;
  reason: ReportReason;
  targetId: Scalars['ID']['input'];
  targetType: ReportTargetType;
};

export type CreateTaskInput = {
  /** Positive cap of accepted workers before discovery stops showing this task. */
  acceptedWorkerCap?: InputMaybe<Scalars['Int']['input']>;
  /** Budget and currency. */
  budget: TaskBudgetInput;
  /** Product-defined task category (for example cleaning, moving, repairs). */
  category: Scalars['String']['input'];
  /** Date and time preference (before/flexible/exact). */
  datetime?: InputMaybe<TaskDateTimeInput>;
  /** Detailed description of the job. */
  description: Scalars['String']['input'];
  /** Additional image URLs or keys after upload. */
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Map-derived coordinates and place name for search. */
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

/** Per-device push registration. Multi-device per user is allowed. */
export type DevicePushToken = {
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  platform: PushPlatform;
  token: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

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
  /** Cloudflare Turnstile token. Prefer this arg; API also accepts `x-captcha-token`. */
  captchaToken?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  method?: LoginMethod;
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
  /** Accept a worker's quote, create an Order for that job, and optionally adjust schedule or location. */
  acceptQuote: AcceptQuotePayload;
  /** Legacy. Prefer `completeOrderWithVerification`. */
  acknowledgeOrderPayment: Order;
  /** Legacy payment ack on task. Prefer `acknowledgeOrderPayment`. */
  acknowledgeWorkerPayment: Task;
  addQuote: Quote;
  /** God-mode task update for ops. Does not require poster ownership. */
  adminUpdateTask: Task;
  /** Cancel an open task owned by the current user. */
  cancelTask: Task;
  /** Legacy multi-step closure. Prefer `completeOrderWithVerification`. */
  completeOrder: Order;
  /** Worker submits the customer's verification code to close the job in one step. */
  completeOrderWithVerification: Order;
  /** Legacy task-level closure (single assignee). Prefer `completeOrder` per accepted quote. */
  completeTask: Task;
  /** Legacy. Prefer `completeOrderWithVerification`. */
  confirmOrder: Order;
  /** Legacy task-level confirm. Prefer `confirmOrder` per job. */
  confirmTask: Task;
  /**
   * Submit a report against a task, worker profile, or user. Auth required.
   * Rate-limited per user and IP. Rejects self-reports and unknown targets.
   */
  createReport: Report;
  /** Create a task (customer \"post a task\"). Requires authentication via request header. */
  createTask: Task;
  /** Open Stripe Customer Portal for the worker's subscription. Requires stripeCustomerId. */
  createWorkerBillingPortal: PortalSessionPayload;
  /** Start Stripe Checkout for Slashie Unlimited. Requires an existing Worker profile. */
  createWorkerSubscriptionCheckout: CheckoutSessionPayload;
  /** Task poster declines a worker's pending quote (not the same as `withdrawQuote`). */
  declineQuote: Quote;
  forgotPassword: ForgotPasswordPayload;
  login: AuthPayload;
  loginWithMethod: AuthPayload;
  makeQuote: Quote;
  /** Marks every unread notification for the current user as read. Returns the count updated. */
  markAllNotificationsRead: Scalars['Int']['output'];
  markNotificationRead: Notification;
  register: AuthPayload;
  registerAsPro: Worker;
  /**
   * Register or refresh a device push token for the authenticated user.
   * Upserts by token so the same device can move between accounts.
   */
  registerDevicePushToken: DevicePushToken;
  /** Resend the verification email to the authenticated user. Rate-limited (max once per 2 minutes). */
  resendVerificationEmail: Scalars['Boolean']['output'];
  resetPassword: AuthPayload;
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
   * Send a 6-digit SMS verification code via Twilio Verify. Sets `pendingPhoneE164`
   * on the user. Idempotent when already verified (returns true). Rate-limited to
   * 3 sends per hour per user.
   */
  sendPhoneVerification: Scalars['Boolean']['output'];
  /** Force Stripe subscription reconcile and return fresh membership (e.g. after Checkout return). */
  syncWorkerBilling: WorkerMembership;
  /**
   * Unregister a device push token owned by the authenticated user.
   * Returns true when a matching active token was removed/deactivated.
   */
  unregisterDevicePushToken: Scalars['Boolean']['output'];
  /** Remove this worker from the viewer's list. Idempotent. */
  unsaveWorker: Worker;
  updateMyProfile: User;
  updateMySettings: User;
  /** Admin-only: set report status. Requires ADMIN_USER_IDS or ADMIN_EMAILS. */
  updateReportStatus: Report;
  /**
   * Amend an existing task owned by the current user. Only allowed while the task
   * is `OPEN`/`DRAFT`; partial update (only provided fields change).
   */
  updateTask: Task;
  /**
   * Complete email verification from the signed link (`/verify-email?token=...`).
   * Returns a fresh session token with `emailVerified: true`. Idempotent when already verified.
   */
  verifyEmail: AuthPayload;
  /**
   * Submit the SMS code Twilio sent to `pendingPhoneE164`. On approval, sets
   * `phoneVerified`, `phoneVerifiedAt`, and `profile.contactNumber`.
   */
  verifyPhone: Scalars['Boolean']['output'];
  /** Worker withdraws their own pending quote before it is accepted. */
  withdrawQuote: Quote;
};


export type MutationAcceptQuoteArgs = {
  input?: InputMaybe<AcceptQuoteInput>;
  quoteId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationAcknowledgeOrderPaymentArgs = {
  orderId: Scalars['ID']['input'];
};


export type MutationAcknowledgeWorkerPaymentArgs = {
  taskId: Scalars['ID']['input'];
};


export type MutationAddQuoteArgs = {
  input: AddQuoteInput;
};


export type MutationAdminUpdateTaskArgs = {
  id: Scalars['ID']['input'];
  input: AdminUpdateTaskInput;
};


export type MutationCancelTaskArgs = {
  taskId: Scalars['ID']['input'];
};


export type MutationCompleteOrderArgs = {
  orderId: Scalars['ID']['input'];
};


export type MutationCompleteOrderWithVerificationArgs = {
  code: Scalars['String']['input'];
  orderId: Scalars['ID']['input'];
};


export type MutationCompleteTaskArgs = {
  taskId: Scalars['ID']['input'];
};


export type MutationConfirmOrderArgs = {
  orderId: Scalars['ID']['input'];
};


export type MutationConfirmTaskArgs = {
  taskId: Scalars['ID']['input'];
};


export type MutationCreateReportArgs = {
  input: CreateReportInput;
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


export type MutationDeclineQuoteArgs = {
  quoteId: Scalars['ID']['input'];
};


export type MutationForgotPasswordArgs = {
  captchaToken?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
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


export type MutationMakeQuoteArgs = {
  message?: InputMaybe<Scalars['String']['input']>;
  price: PriceInput;
  taskId: Scalars['ID']['input'];
};


export type MutationMarkNotificationReadArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRegisterArgs = {
  captchaToken?: InputMaybe<Scalars['String']['input']>;
  contactNumber?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
};


export type MutationRegisterAsProArgs = {
  input: ProRegistrationInput;
};


export type MutationRegisterDevicePushTokenArgs = {
  platform?: InputMaybe<PushPlatform>;
  token: Scalars['String']['input'];
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


export type MutationSendPhoneVerificationArgs = {
  phone: Scalars['String']['input'];
};


export type MutationUnregisterDevicePushTokenArgs = {
  token: Scalars['String']['input'];
};


export type MutationUnsaveWorkerArgs = {
  workerId: Scalars['ID']['input'];
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


export type MutationUpdateTaskArgs = {
  input: UpdateTaskInput;
  taskId: Scalars['ID']['input'];
};


export type MutationVerifyEmailArgs = {
  token: Scalars['String']['input'];
};


export type MutationVerifyPhoneArgs = {
  code: Scalars['String']['input'];
};


export type MutationWithdrawQuoteArgs = {
  quoteId: Scalars['ID']['input'];
};

export type MyOrdersFilter = {
  role?: InputMaybe<OrderPartyRole>;
  status?: InputMaybe<Array<OrderStatus>>;
};

export type Notification = {
  actorUserId?: Maybe<Scalars['ID']['output']>;
  body: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  orderId?: Maybe<Scalars['ID']['output']>;
  quoteId?: Maybe<Scalars['ID']['output']>;
  readAt?: Maybe<Scalars['DateTime']['output']>;
  recipientUserId: Scalars['ID']['output'];
  taskId: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  type: NotificationType;
};

export type NotificationPage = {
  items: Array<Notification>;
  /** Opaque cursor (`notification` id) for the next page, or null when there are no more items. */
  nextCursor?: Maybe<Scalars['String']['output']>;
};

export enum NotificationType {
  OrderClosed = 'ORDER_CLOSED',
  OrderWorkCompleted = 'ORDER_WORK_COMPLETED',
  QuoteAccepted = 'QUOTE_ACCEPTED',
  QuoteDeclined = 'QUOTE_DECLINED',
  QuoteReceived = 'QUOTE_RECEIVED',
  TaskCompleted = 'TASK_COMPLETED',
  TaskConfirmed = 'TASK_CONFIRMED'
}

export type Order = {
  agreedPrice: OrderAgreedPrice;
  closedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Six-digit code the customer shares with the worker to close the job. Customer-only. */
  completionVerificationCode?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  customerUserId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  quoteId: Scalars['ID']['output'];
  snapshot: OrderSnapshot;
  status: OrderStatus;
  task: Task;
  taskId: Scalars['ID']['output'];
  workCompletedAt?: Maybe<Scalars['DateTime']['output']>;
  workerPaymentAcknowledgedAt?: Maybe<Scalars['DateTime']['output']>;
  workerUserId: Scalars['ID']['output'];
};

export type OrderAgreedPrice = {
  amount: Scalars['Float']['output'];
  currency: Currency;
};

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

export type OrderSnapshot = {
  budgetAmount?: Maybe<Scalars['Float']['output']>;
  category: Scalars['String']['output'];
  contactMethod?: Maybe<Scalars['String']['output']>;
  datetime?: Maybe<TaskDateTime>;
  description: Scalars['String']['output'];
  location: OrderLocationSnapshot;
  paymentMethod?: Maybe<TaskPaymentMethod>;
  quoteMessage?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
};

export enum OrderStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Closed = 'CLOSED',
  PaymentAcknowledged = 'PAYMENT_ACKNOWLEDGED',
  WorkCompleted = 'WORK_COMPLETED'
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
  /** Free-tier monthly quote allowance without a subscription. */
  freeQuotesPerMonth: Scalars['Int']['output'];
  /** Amount in minor currency units (e.g. 1999 = £19.99). */
  priceAmount: Scalars['Int']['output'];
  priceCurrency: Scalars['String']['output'];
  priceInterval: Scalars['String']['output'];
  productName: Scalars['String']['output'];
  /** Stripe Price id for future Checkout integration. */
  stripePriceId: Scalars['String']['output'];
  /** Stripe Product id for future Checkout integration. */
  stripeProductId?: Maybe<Scalars['String']['output']>;
  /** Free-trial length in days (e.g. 180 for a 6-month trial). */
  trialDays?: Maybe<Scalars['Int']['output']>;
  /** Human-readable trial label for marketing copy (e.g. "6 months free"). */
  trialLabel?: Maybe<Scalars['String']['output']>;
};

export type ProRegistrationInput = {
  bio?: InputMaybe<Scalars['String']['input']>;
  /** Date of birth (private). Persisted on the user; must meet the minimum worker age. */
  dateOfBirth?: InputMaybe<Scalars['DateTime']['input']>;
  /** Worker's legal name. Persisted on the worker and as the user's canonical profile name. */
  legalName: Scalars['String']['input'];
  location: LocationInput;
  /** Optional service area (travel radius + label) captured at registration. */
  serviceArea?: InputMaybe<ServiceAreaInput>;
  tagline?: InputMaybe<Scalars['String']['input']>;
  yearsExperience?: InputMaybe<Scalars['Int']['input']>;
};

export type Profile = {
  avatarUrl?: Maybe<Scalars['String']['output']>;
  /** Deprecated on `Profile`: worker bio is exposed via `worker.bio`. Always resolves to null here. */
  bio?: Maybe<Scalars['String']['output']>;
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
 * Push provider for a registered device token.
 * Expo tokens are preferred for Slashie mobile; APNs/FCM reserved for later.
 */
export enum PushPlatform {
  Apns = 'APNS',
  Expo = 'EXPO',
  Fcm = 'FCM'
}

export type Query = {
  /**
   * Ops task search. Requires `@admin` (auth + @slashie.app + active Admin row).
   * Newest first. Returns owner-shaped Task parents so location/address are visible.
   */
  adminTasks: Array<Task>;
  /**
   * Ops worker search, including incomplete setup drafts. Search matches legal
   * name, tagline, bio, address, linked user name/email, worker id, or user id.
   */
  adminWorkers: Array<Worker>;
  /**
   * Generates a pre-signed S3 PUT URL for the authenticated user's profile avatar
   * under `users/<userId>/<filename>`. Persist `publicUrl` via `updateMyProfile`
   * after a successful upload.
   */
  getProfileAvatarUpload: S3Url;
  /**
   * Generates one pre-signed S3 PUT URL for uploading a task file; requires authentication.
   * Caller must be the task creator.
   */
  getTaskS3Upload: Array<S3Url>;
  health: Scalars['String']['output'];
  me: User;
  /**
   * Load an order by id (authenticated party only) or by task id (viewer's booking on that task).
   * Pass exactly one of `id` or `taskId`. Prefer `task(id) { viewerOrder }` on task detail.
   */
  order?: Maybe<Order>;
  /** Public worker subscription pricing (Slashie Unlimited). No auth required. */
  pricing: Pricing;
  /**
   * Admin-only report inbox. Requires ADMIN_USER_IDS or ADMIN_EMAILS.
   * Newest first. Not visible to reporters or the public.
   */
  reports: ReportPage;
  /** Single task detail entry point. Field visibility depends on viewer role (poster, participant, public). */
  task?: Maybe<Task>;
  /**
   * Open tasks near a map center (discovery). Defaults: London, 10 mile radius, nearest-first.
   * `filter.status` is ignored (always OPEN-only). `Task.location` is discovery-style on map browse.
   * `sort` defaults to distance order; `DISTANCE` sort requires `filter.lat` and `filter.lng`.
   */
  tasks: Array<Task>;
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


export type QueryAdminTasksArgs = {
  filter?: InputMaybe<AdminTaskFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAdminWorkersArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetProfileAvatarUploadArgs = {
  filename: Scalars['String']['input'];
};


export type QueryGetTaskS3UploadArgs = {
  index: Scalars['String']['input'];
  taskId: Scalars['ID']['input'];
};


export type QueryOrderArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  taskId?: InputMaybe<Scalars['ID']['input']>;
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
  filter?: InputMaybe<TaskFilter>;
  sort?: InputMaybe<TaskSort>;
};


export type QueryWorkerArgs = {
  id: Scalars['ID']['input'];
};


export type QueryWorkersArgs = {
  filter?: InputMaybe<WorkerFilter>;
  sort?: InputMaybe<WorkerSort>;
};

export type Quote = {
  createdAt: Scalars['DateTime']['output'];
  estimatedDuration?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  message?: Maybe<Scalars['String']['output']>;
  price?: Maybe<Price>;
  status: QuoteStatus;
  task: Task;
  taskId: Scalars['ID']['output'];
  worker: User;
  workerUserId: Scalars['ID']['output'];
};

export enum QuoteStatus {
  Accepted = 'ACCEPTED',
  Declined = 'DECLINED',
  Pending = 'PENDING',
  Rejected = 'REJECTED',
  Withdrawn = 'WITHDRAWN'
}

/**
 * A trust-and-safety report against a task, worker profile, or user.
 * Only the reporter (create payload) and allowlisted admins can see reports.
 * There is no public list.
 */
export type Report = {
  createdAt: Scalars['DateTime']['output'];
  details?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  reason: ReportReason;
  reporterUserId: Scalars['ID']['output'];
  status: ReportStatus;
  targetId: Scalars['ID']['output'];
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
  Task = 'TASK',
  User = 'USER',
  Worker = 'WORKER'
}

/** Presigned upload URL (PUT). Task objects use prefix `tasks/<taskId>/…`; public read is via Space bucket policy (or CDN env), not per-upload ACL. */
export type S3Url = {
  /** Public read URL for the uploaded object (for persisting after a successful PUT). */
  publicUrl?: Maybe<Scalars['String']['output']>;
  /** Time-limited HTTPS URL for a PUT upload to object storage. */
  url?: Maybe<Scalars['String']['output']>;
};

export type SaveWorkerSetupStepInput = {
  /** Profile avatar read URL (`profile.photo`; also use `updateMyProfile` if preferred). */
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
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
  /**
   * Primary trade (`services.skills`). Preferred over embedding a display label
   * in `skills[0]` (legacy FE workaround).
   */
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
   * Emits when a new in-app notification row is created for the authenticated viewer.
   * Requires a JWT on the WebSocket connection (`connectionParams.Authorization`).
   */
  notificationAdded: Notification;
};

export type Task = {
  /** Task budget. */
  budget?: Maybe<TaskBudget>;
  /** Normalized task category used by discovery filters and cards. */
  category: Scalars['String']['output'];
  /** Task date/time preference. */
  datetime?: Maybe<TaskDateTime>;
  /** Longer description of the work required. */
  description: Scalars['String']['output'];
  /**
   * When true, the task is hidden from public map discovery. Missing on legacy
   * rows is treated as false. Set by ops via `adminUpdateTask`.
   */
  hidden: Scalars['Boolean']['output'];
  /** Task identifier. */
  id: Scalars['ID']['output'];
  /** Gallery image URLs; resolved from object storage under `tasks/<taskId>/` (not stored in MongoDB). */
  images: Array<Scalars['String']['output']>;
  /** Coordinates and label. Full precision and street address for the poster and accepted workers; discovery-style for public and pending-quote workers. */
  location: TaskLocation;
  /**
   * The authenticated viewer's order on this task, if they are customer or worker. Null for guests or non-parties.
   * Replaces `order(taskId:)` on task detail pages.
   */
  orders: Array<Order>;
  /**
   * Poster (task owner). Always resolves when task data is available.
   * For public/visitor callers, only `profile.name` is intended as public-facing identity; other
   * user fields are returned as redacted placeholders.
   */
  poster?: Maybe<User>;
  /**
   * All quotes on this task.
   * Visible to any authenticated viewer; guests get an empty list. Quote price stays poster-only.
   */
  quotes: Array<Quote>;
  /** Workflow status of the task. */
  status: TaskStatus;
  /** `timeline` is a list of events that have occurred on the task. It is used to track the history of the task and to display the timeline of the task. */
  timeline: Array<TaskTimelineEvent>;
  /** Short title shown in lists and search. */
  title: Scalars['String']['output'];
  /** Non-owner task detail views (PostHog, last 90 days). Public; 0 when PostHog is unavailable. */
  views: Scalars['Int']['output'];
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
 * Shared list filter for `tasks`, `User.tasksPosted`, and `worker.quotedTasks`.
 *
 * Per-query handling:
 * - `lat`/`lng`/`radiusMiles`: used by `tasks` (map discovery); ignored by inbox list fields.
 * - `status`: applies to inbox list fields; **ignored by `tasks`** (discovery is OPEN-only, enforced server-side).
 * - `search`, `category`, and the date-range fields apply to all three queries.
 */
export type TaskFilter = {
  /** Optional category filter (case-insensitive exact match). */
  category?: InputMaybe<Scalars['String']['input']>;
  /** Inclusive lower bound on `createdAt` (`createdAt >= value`). */
  createdAfter?: InputMaybe<Scalars['DateTime']['input']>;
  /** Inclusive upper bound on `createdAt` (`createdAt <= value`). */
  createdBefore?: InputMaybe<Scalars['DateTime']['input']>;
  /** Map center latitude; defaults to central London when omitted. Used by `tasks` only. */
  lat?: InputMaybe<Scalars['Float']['input']>;
  /** Map center longitude; defaults to central London when omitted. Used by `tasks` only. */
  lng?: InputMaybe<Scalars['Float']['input']>;
  /** Search radius in miles from the center point. Used by `tasks` only. */
  radiusMiles?: InputMaybe<Scalars['Float']['input']>;
  /**
   * Inclusive lower bound on the task's scheduled date (`datetime.date`). Compared at day granularity.
   * Tasks with no schedulable date (e.g. FLEXIBLE / missing date) are excluded when set.
   */
  scheduledAfter?: InputMaybe<Scalars['DateTime']['input']>;
  /**
   * Inclusive upper bound on the task's scheduled date (`datetime.date`). Compared at day granularity.
   * Tasks with no schedulable date (e.g. FLEXIBLE / missing date) are excluded when set.
   */
  scheduledBefore?: InputMaybe<Scalars['DateTime']['input']>;
  /** Case-insensitive text search across title, description, and place name. */
  search?: InputMaybe<Scalars['String']['input']>;
  /** Poster/worker inbox: constrain by task status(es). Omit for all statuses. Ignored by `tasks`. */
  status?: InputMaybe<Array<TaskStatus>>;
};

/** Map-backed coordinates and place label used for discovery and distance. */
export type TaskLocation = {
  /** Full street address for the task location. */
  address?: Maybe<Scalars['String']['output']>;
  /** Latitude in decimal degrees (may be rounded for public listings). */
  lat?: Maybe<Scalars['Float']['output']>;
  /** Longitude in decimal degrees (may be rounded for public listings). */
  lng?: Maybe<Scalars['Float']['output']>;
  /** Place name or label; obfuscated for non-participants on search. */
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
  /** Work finished pending confirmation. */
  Completed = 'COMPLETED',
  /** Customer confirmed completion. */
  Confirmed = 'CONFIRMED',
  /** Draft task not yet visible. */
  Draft = 'DRAFT',
  /** Work is underway. */
  InProgress = 'IN_PROGRESS',
  /** Open for worker quotes. */
  Open = 'OPEN',
  /** A quote has been accepted. */
  QuoteAccepted = 'QUOTE_ACCEPTED'
}

export type TaskTimelineEvent = {
  actor: User;
  data: Scalars['JSON']['output'];
  timestamp: Scalars['DateTime']['output'];
  type: TaskTimelineEventType;
};

export enum TaskTimelineEventType {
  TaskCancelled = 'TASK_CANCELLED',
  TaskCompleted = 'TASK_COMPLETED',
  TaskConfirmed = 'TASK_CONFIRMED',
  TaskCreated = 'TASK_CREATED',
  TaskPaid = 'TASK_PAID',
  TaskUpdated = 'TASK_UPDATED'
}

export type UpdateMyProfileInput = {
  /** Public read URL for the uploaded avatar (see `getProfileAvatarUpload`). */
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
  /** Worker bio (persisted on the canonical worker document). */
  bio?: InputMaybe<Scalars['String']['input']>;
  contactNumber?: InputMaybe<Scalars['String']['input']>;
  /** Date of birth (private). Must meet the minimum worker age. */
  dateOfBirth?: InputMaybe<Scalars['DateTime']['input']>;
  defaultPreferredContactMethod?: InputMaybe<TaskContactMethod>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateMySettingsInput = {
  isProfilePrivate?: InputMaybe<Scalars['Boolean']['input']>;
  language?: InputMaybe<UserLanguage>;
  marketingEmails?: InputMaybe<Scalars['Boolean']['input']>;
};

/**
 * Partial amendments to an existing task. Every field is optional; only provided
 * fields are changed. Editable only by the poster while the task is still
 * `OPEN`/`DRAFT`.
 */
export type UpdateTaskInput = {
  /** Positive cap of accepted workers; cannot drop below the count already accepted. */
  acceptedWorkerCap?: InputMaybe<Scalars['Int']['input']>;
  /** Budget and currency. */
  budget?: InputMaybe<TaskBudgetInput>;
  /** Product-defined task category (for example cleaning, moving, repairs). */
  category?: InputMaybe<Scalars['String']['input']>;
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

export type User = {
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  /** Whether this account's email address has been verified. */
  emailVerified: Scalars['Boolean']['output'];
  /** When the email was verified. Null until verified. */
  emailVerifiedAt?: Maybe<Scalars['DateTime']['output']>;
  enabledLoginMethods: Array<LoginMethod>;
  id: Scalars['ID']['output'];
  /** In-app activity feed for this user. */
  notifications: NotificationPage;
  /** Orders where this user is customer or worker. */
  orders: Array<Order>;
  /** Whether this account's phone number is verified (Twilio Verify). */
  phoneVerified: Scalars['Boolean']['output'];
  /** When the phone was verified. Null until verified. */
  phoneVerifiedAt?: Maybe<Scalars['DateTime']['output']>;
  profile: Profile;
  /**
   * Tasks this user has quoted on (any quote status). Owner-only (`me`); empty for other viewers.
   * Prefer over nested `worker.quotedTasks` when `me.worker` may be null.
   */
  quotedTasks: Array<Task>;
  settings: UserSettings;
  /** Tasks the user posted. */
  tasksPosted: Array<Task>;
  worker?: Maybe<Worker>;
  /**
   * True when the user satisfies worker-eligibility requirements. Only meaningful
   * for the authenticated owner (`me`); false for other viewers.
   */
  workerEligibility: Scalars['Boolean']['output'];
};


export type UserNotificationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  unreadOnly?: InputMaybe<Scalars['Boolean']['input']>;
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

export type UserSettings = {
  isProfilePrivate: Scalars['Boolean']['output'];
  language: UserLanguage;
  marketingEmails: Scalars['Boolean']['output'];
};

/**
 * A completed platform job shown on the public worker profile ("Work on
 * Slashie"). Public-safe fields only.
 */
export type WorkerCompletedJob = {
  /** Approximate area only (borough/city) — same redaction as public task views. */
  areaLabel?: Maybe<Scalars['String']['output']>;
  category: Scalars['String']['output'];
  completedAt: Scalars['DateTime']['output'];
  /** Per-job star rating (Stage 3 — null until reviews ship). */
  rating?: Maybe<Scalars['Float']['output']>;
  taskId: Scalars['ID']['output'];
  title: Scalars['String']['output'];
};

/** How the viewer can contact this worker from the profile page. */
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
  /** Sum of agreed prices on the worker's non-CLOSED orders (C2C reference only, not payouts). */
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
 * `minRating` is reserved for a future reviews phase and is ignored until then.
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
  /** Minimum average rating (Stage 3 — ignored until reviews ship). */
  minRating?: InputMaybe<Scalars['Float']['input']>;
  /** Exact match on the worker's primary trade. */
  primaryCategory?: InputMaybe<WorkerPrimaryCategory>;
  /** Search radius in miles from the center. Defaults to 25 when `lat` and `lng` are set. */
  radiusMiles?: InputMaybe<Scalars['Float']['input']>;
  /** Case-insensitive partial match on profile name, legal name, tagline, bio, and location label. */
  search?: InputMaybe<Scalars['String']['input']>;
  /** When true, only workers with `isVerified = true` are returned. */
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
 * Nullable on legacy workers who have not chosen one yet.
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

/**
 * Viewer-specific worker profile context (`worker.viewer`). Null for anonymous
 * viewers; drives the Save / Leave a review / Contact states on the profile page.
 */
export type WorkerProfileViewer = {
  /** True when the viewer has a completed (closed) job with this worker. */
  canLeaveReview: Scalars['Boolean']['output'];
  contactAction: WorkerContactAction;
  isSaved: Scalars['Boolean']['output'];
  relatedQuoteId?: Maybe<Scalars['ID']['output']>;
  relatedTaskId?: Maybe<Scalars['ID']['output']>;
};

/**
 * Aggregate review score for a worker. Stage 3 stub — `average` is null and
 * `count` is 0 until reviews ship.
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
  /** Sort by average rating (Stage 3 — no-op until reviews exist; falls back to name order). */
  Rating = 'RATING',
  /** Sort by completed task count. */
  TasksCompleted = 'TASKS_COMPLETED'
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

export type Worker = {
  averageResponseTime?: Maybe<Scalars['String']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  /** Completed (customer-confirmed) platform jobs, newest first. Empty when none. */
  completedJobs: Array<WorkerCompletedJob>;
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
  /** Worker's legal name. */
  legalName?: Maybe<Scalars['String']['output']>;
  /** @deprecated Use `preferredLocation`. */
  location: Location;
  locationAddress?: Maybe<Scalars['String']['output']>;
  locationLat?: Maybe<Scalars['Float']['output']>;
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
   * Approximate base location shown on maps and the profile. `lat`/`lng`/`name`
   * are public; `address` is only returned to the worker themself.
   */
  preferredLocation: Location;
  /**
   * Primary trade chosen at setup (`services.skills`). Null for legacy workers
   * who have not chosen one. During rollout, may be inferred from a category
   * display label previously stored as `skills[0]`.
   */
  primaryCategory?: Maybe<WorkerPrimaryCategory>;
  profile: Profile;
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
   * from `primaryCategory`. During rollout, a legacy category label at
   * `skills[0]` is stripped from this list when it maps to `primaryCategory`.
   */
  skills: Array<Scalars['String']['output']>;
  tagline?: Maybe<Scalars['String']['output']>;
  tasksCompletedCount?: Maybe<Scalars['Int']['output']>;
  /** How far the worker is willing to travel from their base location, in miles. */
  travelRadiusMiles?: Maybe<Scalars['Float']['output']>;
  user: User;
  userId: Scalars['ID']['output'];
  /** Viewer-specific context (save / review / contact states). Null when anonymous. */
  viewer?: Maybe<WorkerProfileViewer>;
  yearsExperience?: Maybe<Scalars['Int']['output']>;
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

export type TaskAdminFieldsFragment = { id: string, title: string, description: string, category: string, status: TaskStatus, views: number, hidden: boolean, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile: { name?: string | null, avatarUrl?: string | null } } | null };

export type TaskPublicFieldsFragment = { id: string, title: string, description: string, category: string, status: TaskStatus, views: number, hidden: boolean, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile: { name?: string | null, avatarUrl?: string | null } } | null };

export type WorkerAdminFieldsFragment = { id: string, userId: string, legalName?: string | null, bio?: string | null, tagline?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification: IdentityVerificationStatus, skills: Array<string>, qualifications: Array<string>, tasksCompletedCount?: number | null, quotesSentCount: number, phoneVerified: boolean, emailVerified: boolean, memberSince?: any | null, serviceAreaLabel?: string | null, averageResponseTime?: string | null, profile: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null }, user: { id: string, email: string }, preferredLocation: { name?: string | null, lat?: number | null, lng?: number | null }, serviceArea: { label?: string | null, radiusMiles?: number | null }, ratingSummary: { average?: number | null, count: number } };

export type AdminTasksQueryVariables = Exact<{
  filter?: InputMaybe<AdminTaskFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AdminTasksQuery = { adminTasks: Array<{ id: string, title: string, description: string, category: string, status: TaskStatus, views: number, hidden: boolean, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile: { name?: string | null, avatarUrl?: string | null } } | null }> };

export type AdminWorkersQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
}>;


export type AdminWorkersQuery = { adminWorkers: Array<{ id: string, userId: string, legalName?: string | null, bio?: string | null, tagline?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification: IdentityVerificationStatus, skills: Array<string>, qualifications: Array<string>, tasksCompletedCount?: number | null, quotesSentCount: number, phoneVerified: boolean, emailVerified: boolean, memberSince?: any | null, serviceAreaLabel?: string | null, averageResponseTime?: string | null, profile: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null }, user: { id: string, email: string }, preferredLocation: { name?: string | null, lat?: number | null, lng?: number | null }, serviceArea: { label?: string | null, radiusMiles?: number | null }, ratingSummary: { average?: number | null, count: number } }> };

export type AdminUpdateTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: AdminUpdateTaskInput;
}>;


export type AdminUpdateTaskMutation = { adminUpdateTask: { id: string, title: string, description: string, category: string, status: TaskStatus, views: number, hidden: boolean, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile: { name?: string | null, avatarUrl?: string | null } } | null } };

export type TasksQueryVariables = Exact<{
  filter?: InputMaybe<TaskFilter>;
}>;


export type TasksQuery = { tasks: Array<{ id: string, title: string, description: string, category: string, status: TaskStatus, views: number, hidden: boolean, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile: { name?: string | null, avatarUrl?: string | null } } | null }> };

export type TaskQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type TaskQuery = { task?: { id: string, title: string, description: string, category: string, status: TaskStatus, views: number, hidden: boolean, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile: { name?: string | null, avatarUrl?: string | null } } | null } | null };

export type WorkersQueryVariables = Exact<{
  filter?: InputMaybe<WorkerFilter>;
}>;


export type WorkersQuery = { workers: Array<{ id: string, userId: string, legalName?: string | null, bio?: string | null, tagline?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification: IdentityVerificationStatus, skills: Array<string>, qualifications: Array<string>, tasksCompletedCount?: number | null, quotesSentCount: number, phoneVerified: boolean, emailVerified: boolean, memberSince?: any | null, serviceAreaLabel?: string | null, averageResponseTime?: string | null, profile: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null }, user: { id: string, email: string }, preferredLocation: { name?: string | null, lat?: number | null, lng?: number | null }, serviceArea: { label?: string | null, radiusMiles?: number | null }, ratingSummary: { average?: number | null, count: number } }> };

export type WorkerQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type WorkerQuery = { worker?: { id: string, userId: string, legalName?: string | null, bio?: string | null, tagline?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification: IdentityVerificationStatus, skills: Array<string>, qualifications: Array<string>, tasksCompletedCount?: number | null, quotesSentCount: number, phoneVerified: boolean, emailVerified: boolean, memberSince?: any | null, serviceAreaLabel?: string | null, averageResponseTime?: string | null, profile: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null }, user: { id: string, email: string }, preferredLocation: { name?: string | null, lat?: number | null, lng?: number | null }, serviceArea: { label?: string | null, radiusMiles?: number | null }, ratingSummary: { average?: number | null, count: number } } | null };
