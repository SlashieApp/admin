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
  /**
   * Slashie admin GraphQL contract.
   *
   * Marketplace types match live apollo introspection (2026-09-14) plus BE-43
   * admin expansions. `@admin` fields:
   *
   *   adminTasks(filter: AdminTaskFilter, first: Int = 50): [Task!]!
   *   adminTask(id: ID!): AdminTaskDossier!
   *   adminWorkers(search: String, id: ID, first: Int): [worker!]!
   *   adminUsers(search: String, id: ID, first: Int = 50): [User!]!
   *   adminOpsSummary(range: AdminOpsRange!, dateFrom: DateTime, dateTo: DateTime): AdminOpsSummary!
   *   adminReports(status: ReportStatus, targetType: ReportTargetType, first: Int = 100, after: String): ReportPage!
   *   adminUpdateTask(id: ID!, input: AdminUpdateTaskInput!): Task!
   *   adminUpdateUser(id: ID!, input: AdminUpdateUserInput!): User!
   *   adminSetUserDisabled(id: ID!, disabled: Boolean!): User!
   *   adminUpdateReportStatus(id: ID!, status: ReportStatus!): Report!
   *
   * BE-46 report inbox is `@admin` (Admin collection + `@slashie.app`). It does
   * not require env `ADMIN_EMAILS` / `ADMIN_USER_IDS`. The BE-40 env-allowlist
   * `reports` / `updateReportStatus` fields stay for existing tools; the panel
   * falls back to them when `adminReports` is not deployed yet.
   *
   * Default inbox view: omit `status` (all statuses, newest first from the API)
   * and pass `targetType: TASK`. The panel then displays OPEN-first so ops see
   * actionable reports without hiding history.
   *
   * Legacy BE-42 `adminTasks(search, id)` args are kept so the panel can fall
   * back if an environment has not switched to `filter`.
   *
   * See https://linear.app/slashie/issue/BE-42
   * See https://linear.app/slashie/issue/BE-43
   * See https://linear.app/slashie/issue/BE-46
   */
  DateTime: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export type AdminOpsMetric = {
  current: Scalars['Int']['output'];
  percentChange?: Maybe<Scalars['Float']['output']>;
  previous: Scalars['Int']['output'];
};

export enum AdminOpsRange {
  Last_7Days = 'LAST_7_DAYS',
  Last_30Days = 'LAST_30_DAYS',
  LastMonth = 'LAST_MONTH',
  ThisMonth = 'THIS_MONTH'
}

/** BE-44 Mongo-authoritative ops KPIs for the admin dashboard. */
export type AdminOpsSummary = {
  dateFrom: Scalars['DateTime']['output'];
  dateTo: Scalars['DateTime']['output'];
  disabledUsers: Scalars['Int']['output'];
  hiddenTasks: Scalars['Int']['output'];
  jobsCompleted: AdminOpsMetric;
  jobsConfirmed: AdminOpsMetric;
  newUsers: AdminOpsMetric;
  openReports: Scalars['Int']['output'];
  ordersOpened: AdminOpsMetric;
  previousDateFrom: Scalars['DateTime']['output'];
  previousDateTo: Scalars['DateTime']['output'];
  quotesAccepted: AdminOpsMetric;
  quotesDeclined: AdminOpsMetric;
  quotesSent: AdminOpsMetric;
  range: AdminOpsRange;
  reportsSubmitted: AdminOpsMetric;
  tasksByStatus: Array<AdminTaskStatusCount>;
  tasksCreated: AdminOpsMetric;
  workersRegistered: AdminOpsMetric;
};

export type AdminTaskActivity = {
  actorUserId?: Maybe<Scalars['ID']['output']>;
  body?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  orderId?: Maybe<Scalars['ID']['output']>;
  quoteId?: Maybe<Scalars['ID']['output']>;
  recipientUserId?: Maybe<Scalars['ID']['output']>;
  source: AdminTaskActivitySource;
  title?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
};

export enum AdminTaskActivitySource {
  Notification = 'NOTIFICATION',
  Timeline = 'TIMELINE'
}

export type AdminTaskDossier = {
  activity: Array<AdminTaskActivity>;
  orders: Array<Order>;
  poster?: Maybe<User>;
  quotes: Array<Quote>;
  task: Task;
  workers: Array<Worker>;
};

export type AdminTaskFilter = {
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Array<TaskStatus>>;
};

export type AdminTaskStatusCount = {
  count: Scalars['Int']['output'];
  status: TaskStatus;
};

export type AdminUpdateTaskInput = {
  budget?: InputMaybe<TaskBudgetInput>;
  category?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  location?: InputMaybe<TaskLocationInput>;
  status?: InputMaybe<TaskStatus>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type AdminUpdateUserInput = {
  contactNumber?: InputMaybe<Scalars['String']['input']>;
  emailVerified?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  phoneVerified?: InputMaybe<Scalars['Boolean']['input']>;
};

export type AuthPayload = {
  token: Scalars['String']['output'];
  user: User;
};

export enum Currency {
  Gbp = 'GBP',
  Usd = 'USD'
}

export enum IdentityVerificationStatus {
  NotStarted = 'NOT_STARTED',
  Pending = 'PENDING',
  Verified = 'VERIFIED'
}

export type Location = {
  address?: Maybe<Scalars['String']['output']>;
  lat?: Maybe<Scalars['Float']['output']>;
  lng?: Maybe<Scalars['Float']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type LoginInput = {
  captchaToken?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  method: LoginMethod;
  oauthToken?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
};

export enum LoginMethod {
  Apple = 'APPLE',
  Google = 'GOOGLE',
  Password = 'PASSWORD'
}

export type Mutation = {
  /** BE-43 @admin — disable or re-enable a user if the API ships it. */
  adminSetUserDisabled: User;
  /** BE-46 @admin — set report status. Does not require ADMIN_EMAILS. */
  adminUpdateReportStatus: Report;
  /** BE-42 @admin — god-mode task update (ignores owner checks). */
  adminUpdateTask: Task;
  /** BE-43 @admin — ops profile / verification updates. */
  adminUpdateUser: User;
  loginWithMethod: AuthPayload;
  /** BE-40 env-allowlist status update. Kept for existing tools. */
  updateReportStatus: Report;
};


export type MutationAdminSetUserDisabledArgs = {
  disabled: Scalars['Boolean']['input'];
  id: Scalars['ID']['input'];
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


export type MutationLoginWithMethodArgs = {
  input: LoginInput;
};


export type MutationUpdateReportStatusArgs = {
  id: Scalars['ID']['input'];
  status: ReportStatus;
};

export type Notification = {
  actor?: Maybe<User>;
  actorUserId?: Maybe<Scalars['ID']['output']>;
  body: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  orderId?: Maybe<Scalars['ID']['output']>;
  quoteId?: Maybe<Scalars['ID']['output']>;
  recipient?: Maybe<User>;
  recipientUserId?: Maybe<Scalars['ID']['output']>;
  taskId?: Maybe<Scalars['ID']['output']>;
  title: Scalars['String']['output'];
  type: NotificationType;
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
  agreedPrice?: Maybe<OrderAgreedPrice>;
  closedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  customerUserId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  quoteId?: Maybe<Scalars['ID']['output']>;
  status: OrderStatus;
  task?: Maybe<Task>;
  taskId?: Maybe<Scalars['ID']['output']>;
  workCompletedAt?: Maybe<Scalars['DateTime']['output']>;
  workerUserId?: Maybe<Scalars['ID']['output']>;
};

export type OrderAgreedPrice = {
  amount: Scalars['Float']['output'];
  currency: Currency;
};

export enum OrderStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Closed = 'CLOSED',
  PaymentAcknowledged = 'PAYMENT_ACKNOWLEDGED',
  WorkCompleted = 'WORK_COMPLETED'
}

export type Price = {
  amount: Scalars['Float']['output'];
  currency: Currency;
};

export type Profile = {
  avatarUrl?: Maybe<Scalars['String']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  contactNumber?: Maybe<Scalars['String']['output']>;
  emailVerified?: Maybe<Scalars['Boolean']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  phoneVerified?: Maybe<Scalars['Boolean']['output']>;
};

export type Query = {
  /** BE-44 @admin — Mongo-authoritative ops KPIs. */
  adminOpsSummary: AdminOpsSummary;
  /**
   * BE-46 @admin — full ops report inbox. Newest first. Paginate with after.
   * Omit status for all statuses. Pass targetType: TASK for the default inbox.
   */
  adminReports: ReportPage;
  /** BE-43 @admin — full related records for one task. */
  adminTask: AdminTaskDossier;
  /** BE-42/43 @admin — newest tasks first. Empty/omitted filter = latest page. */
  adminTasks: Array<Task>;
  /** BE-43 @admin — search users by email, name, and/or id. */
  adminUsers: Array<User>;
  /** BE-42 @admin — search workers by text and/or id. */
  adminWorkers: Array<Worker>;
  me: User;
  order?: Maybe<Order>;
  /**
   * BE-40 env-allowlist inbox (ADMIN_EMAILS / ADMIN_USER_IDS). Kept for existing
   * tools. No targetType arg — the panel filters TASK client-side when falling back.
   */
  reports: ReportPage;
  task?: Maybe<Task>;
  tasks: Array<Task>;
  worker?: Maybe<Worker>;
  workers: Array<Worker>;
};


export type QueryAdminOpsSummaryArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']['input']>;
  dateTo?: InputMaybe<Scalars['DateTime']['input']>;
  range: AdminOpsRange;
};


export type QueryAdminReportsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<ReportStatus>;
  targetType?: InputMaybe<ReportTargetType>;
};


export type QueryAdminTaskArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAdminTasksArgs = {
  filter?: InputMaybe<AdminTaskFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAdminUsersArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAdminWorkersArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
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
};


export type QueryWorkerArgs = {
  id: Scalars['ID']['input'];
};


export type QueryWorkersArgs = {
  filter?: InputMaybe<WorkerFilter>;
};

export type Quote = {
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  estimatedDuration?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  message?: Maybe<Scalars['String']['output']>;
  price?: Maybe<Price>;
  status: QuoteStatus;
  task?: Maybe<Task>;
  taskId?: Maybe<Scalars['ID']['output']>;
  /** Live marketplace names this field `worker` but the type is User. */
  worker?: Maybe<User>;
  workerUserId?: Maybe<Scalars['ID']['output']>;
};

export enum QuoteStatus {
  Accepted = 'ACCEPTED',
  Declined = 'DECLINED',
  Pending = 'PENDING',
  Rejected = 'REJECTED',
  Withdrawn = 'WITHDRAWN'
}

/**
 * Trust-and-safety report. BE-46 enriches `reporter` and `targetTitle` for ops.
 * BE-40 payloads always include reporterUserId + target fields.
 */
export type Report = {
  createdAt: Scalars['DateTime']['output'];
  details?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  reason: ReportReason;
  reporter?: Maybe<User>;
  reporterUserId: Scalars['ID']['output'];
  status: ReportStatus;
  targetId: Scalars['ID']['output'];
  /** Linked task title when targetType is TASK (BE-46). */
  targetTitle?: Maybe<Scalars['String']['output']>;
  targetType: ReportTargetType;
  targetUrl?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type ReportPage = {
  items: Array<Report>;
  /** Opaque cursor (report id) for the next page, or null when done. */
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

export type ServiceArea = {
  label?: Maybe<Scalars['String']['output']>;
  radiusMiles?: Maybe<Scalars['Float']['output']>;
};

export type Task = {
  budget?: Maybe<TaskBudget>;
  category: Scalars['String']['output'];
  datetime?: Maybe<TaskDateTime>;
  description: Scalars['String']['output'];
  /** BE-42 god-mode visibility. Absent on pre-admin marketplace selections. */
  hidden?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  images?: Maybe<Array<Scalars['String']['output']>>;
  location: TaskLocation;
  orders?: Maybe<Array<Order>>;
  poster?: Maybe<User>;
  quotes?: Maybe<Array<Quote>>;
  status: TaskStatus;
  timeline?: Maybe<Array<TaskTimelineEvent>>;
  title: Scalars['String']['output'];
  views?: Maybe<Scalars['Int']['output']>;
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
  Email = 'EMAIL',
  InApp = 'IN_APP',
  Phone = 'PHONE'
}

export type TaskDateTime = {
  date?: Maybe<Scalars['String']['output']>;
  time?: Maybe<Scalars['String']['output']>;
  type: TaskDateTimeType;
};

export enum TaskDateTimeType {
  Before = 'BEFORE',
  Exact = 'EXACT',
  Flexible = 'FLEXIBLE'
}

export type TaskFilter = {
  category?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Array<TaskStatus>>;
};

export type TaskLocation = {
  address?: Maybe<Scalars['String']['output']>;
  lat?: Maybe<Scalars['Float']['output']>;
  lng?: Maybe<Scalars['Float']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type TaskLocationInput = {
  address: Scalars['String']['input'];
  lat: Scalars['Float']['input'];
  lng: Scalars['Float']['input'];
  name: Scalars['String']['input'];
};

export enum TaskPaymentMethod {
  BankTransfer = 'BANK_TRANSFER',
  Cash = 'CASH'
}

export enum TaskStatus {
  Awarded = 'AWARDED',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Confirmed = 'CONFIRMED',
  Draft = 'DRAFT',
  InProgress = 'IN_PROGRESS',
  Open = 'OPEN',
  QuoteAccepted = 'QUOTE_ACCEPTED'
}

export type TaskTimelineEvent = {
  actor: User;
  data?: Maybe<Scalars['JSON']['output']>;
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

export type User = {
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  disabled: Scalars['Boolean']['output'];
  email: Scalars['String']['output'];
  emailVerified: Scalars['Boolean']['output'];
  enabledLoginMethods?: Maybe<Array<LoginMethod>>;
  id: Scalars['ID']['output'];
  phoneVerified?: Maybe<Scalars['Boolean']['output']>;
  profile?: Maybe<Profile>;
  tasksPosted?: Maybe<Array<Task>>;
  worker?: Maybe<Worker>;
};

export type WorkerFilter = {
  search?: InputMaybe<Scalars['String']['input']>;
};

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

export type WorkerRatingSummary = {
  average?: Maybe<Scalars['Float']['output']>;
  count: Scalars['Int']['output'];
};

/** Live apollo names this object `worker` (lowercase). */
export type Worker = {
  averageResponseTime?: Maybe<Scalars['String']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  emailVerified?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  identityVerification?: Maybe<IdentityVerificationStatus>;
  isVerified: Scalars['Boolean']['output'];
  legalName?: Maybe<Scalars['String']['output']>;
  memberSince?: Maybe<Scalars['DateTime']['output']>;
  phoneVerified?: Maybe<Scalars['Boolean']['output']>;
  preferredLocation?: Maybe<Location>;
  primaryCategory?: Maybe<WorkerPrimaryCategory>;
  profile?: Maybe<Profile>;
  qualifications?: Maybe<Array<Scalars['String']['output']>>;
  quotesSentCount?: Maybe<Scalars['Int']['output']>;
  ratingSummary?: Maybe<WorkerRatingSummary>;
  serviceArea?: Maybe<ServiceArea>;
  serviceAreaLabel?: Maybe<Scalars['String']['output']>;
  skills?: Maybe<Array<Scalars['String']['output']>>;
  tagline?: Maybe<Scalars['String']['output']>;
  tasksCompletedCount?: Maybe<Scalars['Int']['output']>;
  user?: Maybe<User>;
  userId?: Maybe<Scalars['ID']['output']>;
  yearsExperience?: Maybe<Scalars['Int']['output']>;
};

export type LoginWithGoogleMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type LoginWithGoogleMutation = { loginWithMethod: { token: string, user: { id: string, email: string, emailVerified: boolean } } };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me: { id: string, email: string, emailVerified: boolean, profile?: { name?: string | null, avatarUrl?: string | null } | null } };

export type UserAdminFieldsFragment = { id: string, email: string, emailVerified: boolean, phoneVerified?: boolean | null, createdAt?: any | null, disabled: boolean, profile?: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null, bio?: string | null } | null, worker?: { id: string, userId?: string | null, legalName?: string | null, tagline?: string | null, bio?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification?: IdentityVerificationStatus | null, skills?: Array<string> | null, phoneVerified?: boolean | null, emailVerified?: boolean | null, memberSince?: any | null, serviceAreaLabel?: string | null, profile?: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null } | null, ratingSummary?: { average?: number | null, count: number } | null } | null };

export type TaskListFieldsFragment = { id: string, title: string, description: string, category: string, status: TaskStatus, views?: number | null, hidden?: boolean | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile?: { name?: string | null, avatarUrl?: string | null } | null } | null };

export type TaskDossierFieldsFragment = { id: string, title: string, description: string, category: string, status: TaskStatus, views?: number | null, hidden?: boolean | null, datetime?: { date?: string | null, time?: string | null, type: TaskDateTimeType } | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, emailVerified: boolean, phoneVerified?: boolean | null, createdAt?: any | null, profile?: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null, bio?: string | null } | null, worker?: { id: string, legalName?: string | null, isVerified: boolean, profile?: { name?: string | null } | null } | null } | null, quotes?: Array<{ id: string, status: QuoteStatus, message?: string | null, createdAt?: any | null, price?: { amount: number, currency: Currency } | null, worker?: { id: string, email: string, profile?: { name?: string | null, avatarUrl?: string | null } | null, worker?: { id: string, legalName?: string | null, isVerified: boolean, profile?: { name?: string | null } | null } | null } | null }> | null, orders?: Array<{ id: string, status: OrderStatus, createdAt?: any | null, workerUserId?: string | null, customerUserId?: string | null, quoteId?: string | null, agreedPrice?: { amount: number, currency: Currency } | null }> | null, timeline?: Array<{ type: TaskTimelineEventType, timestamp: any, actor: { id: string, email: string, profile?: { name?: string | null } | null } }> | null };

export type WorkerAdminFieldsFragment = { id: string, userId?: string | null, legalName?: string | null, bio?: string | null, tagline?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification?: IdentityVerificationStatus | null, skills?: Array<string> | null, qualifications?: Array<string> | null, tasksCompletedCount?: number | null, quotesSentCount?: number | null, phoneVerified?: boolean | null, emailVerified?: boolean | null, memberSince?: any | null, serviceAreaLabel?: string | null, averageResponseTime?: string | null, profile?: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null } | null, user?: { id: string, email: string } | null, preferredLocation?: { name?: string | null, lat?: number | null, lng?: number | null } | null, serviceArea?: { label?: string | null, radiusMiles?: number | null } | null, ratingSummary?: { average?: number | null, count: number } | null };

export type AdminTaskDossierFieldsFragment = { task: { id: string, title: string, description: string, category: string, status: TaskStatus, views?: number | null, hidden?: boolean | null, datetime?: { date?: string | null, time?: string | null, type: TaskDateTimeType } | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, emailVerified: boolean, phoneVerified?: boolean | null, createdAt?: any | null, profile?: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null, bio?: string | null } | null, worker?: { id: string, legalName?: string | null, isVerified: boolean, profile?: { name?: string | null } | null } | null } | null, quotes?: Array<{ id: string, status: QuoteStatus, message?: string | null, createdAt?: any | null, price?: { amount: number, currency: Currency } | null, worker?: { id: string, email: string, profile?: { name?: string | null, avatarUrl?: string | null } | null, worker?: { id: string, legalName?: string | null, isVerified: boolean, profile?: { name?: string | null } | null } | null } | null }> | null, orders?: Array<{ id: string, status: OrderStatus, createdAt?: any | null, workerUserId?: string | null, customerUserId?: string | null, quoteId?: string | null, agreedPrice?: { amount: number, currency: Currency } | null }> | null, timeline?: Array<{ type: TaskTimelineEventType, timestamp: any, actor: { id: string, email: string, profile?: { name?: string | null } | null } }> | null }, poster?: { id: string, email: string, emailVerified: boolean, phoneVerified?: boolean | null, createdAt?: any | null, disabled: boolean, profile?: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null, bio?: string | null } | null, worker?: { id: string, userId?: string | null, legalName?: string | null, tagline?: string | null, bio?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification?: IdentityVerificationStatus | null, skills?: Array<string> | null, phoneVerified?: boolean | null, emailVerified?: boolean | null, memberSince?: any | null, serviceAreaLabel?: string | null, profile?: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null } | null, ratingSummary?: { average?: number | null, count: number } | null } | null } | null, workers: Array<{ id: string, userId?: string | null, legalName?: string | null, bio?: string | null, tagline?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification?: IdentityVerificationStatus | null, skills?: Array<string> | null, qualifications?: Array<string> | null, tasksCompletedCount?: number | null, quotesSentCount?: number | null, phoneVerified?: boolean | null, emailVerified?: boolean | null, memberSince?: any | null, serviceAreaLabel?: string | null, averageResponseTime?: string | null, profile?: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null } | null, user?: { id: string, email: string } | null, preferredLocation?: { name?: string | null, lat?: number | null, lng?: number | null } | null, serviceArea?: { label?: string | null, radiusMiles?: number | null } | null, ratingSummary?: { average?: number | null, count: number } | null }>, quotes: Array<{ id: string, status: QuoteStatus, message?: string | null, createdAt?: any | null, price?: { amount: number, currency: Currency } | null, worker?: { id: string, email: string, profile?: { name?: string | null } | null, worker?: { id: string, legalName?: string | null, isVerified: boolean, profile?: { name?: string | null } | null } | null } | null }>, orders: Array<{ id: string, status: OrderStatus, createdAt?: any | null, workerUserId?: string | null, customerUserId?: string | null, quoteId?: string | null, agreedPrice?: { amount: number, currency: Currency } | null }>, activity: Array<{ source: AdminTaskActivitySource, type: string, title?: string | null, body?: string | null, createdAt: any, actorUserId?: string | null, recipientUserId?: string | null, quoteId?: string | null, orderId?: string | null }> };

export type AdminTasksQueryVariables = Exact<{
  filter?: InputMaybe<AdminTaskFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AdminTasksQuery = { adminTasks: Array<{ id: string, title: string, description: string, category: string, status: TaskStatus, views?: number | null, hidden?: boolean | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile?: { name?: string | null, avatarUrl?: string | null } | null } | null }> };

export type AdminTasksLegacyQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
}>;


export type AdminTasksLegacyQuery = { adminTasks: Array<{ id: string, title: string, description: string, category: string, status: TaskStatus, views?: number | null, hidden?: boolean | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile?: { name?: string | null, avatarUrl?: string | null } | null } | null }> };

export type AdminTaskQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AdminTaskQuery = { adminTask: { task: { id: string, title: string, description: string, category: string, status: TaskStatus, views?: number | null, hidden?: boolean | null, datetime?: { date?: string | null, time?: string | null, type: TaskDateTimeType } | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, emailVerified: boolean, phoneVerified?: boolean | null, createdAt?: any | null, profile?: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null, bio?: string | null } | null, worker?: { id: string, legalName?: string | null, isVerified: boolean, profile?: { name?: string | null } | null } | null } | null, quotes?: Array<{ id: string, status: QuoteStatus, message?: string | null, createdAt?: any | null, price?: { amount: number, currency: Currency } | null, worker?: { id: string, email: string, profile?: { name?: string | null, avatarUrl?: string | null } | null, worker?: { id: string, legalName?: string | null, isVerified: boolean, profile?: { name?: string | null } | null } | null } | null }> | null, orders?: Array<{ id: string, status: OrderStatus, createdAt?: any | null, workerUserId?: string | null, customerUserId?: string | null, quoteId?: string | null, agreedPrice?: { amount: number, currency: Currency } | null }> | null, timeline?: Array<{ type: TaskTimelineEventType, timestamp: any, actor: { id: string, email: string, profile?: { name?: string | null } | null } }> | null }, poster?: { id: string, email: string, emailVerified: boolean, phoneVerified?: boolean | null, createdAt?: any | null, disabled: boolean, profile?: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null, bio?: string | null } | null, worker?: { id: string, userId?: string | null, legalName?: string | null, tagline?: string | null, bio?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification?: IdentityVerificationStatus | null, skills?: Array<string> | null, phoneVerified?: boolean | null, emailVerified?: boolean | null, memberSince?: any | null, serviceAreaLabel?: string | null, profile?: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null } | null, ratingSummary?: { average?: number | null, count: number } | null } | null } | null, workers: Array<{ id: string, userId?: string | null, legalName?: string | null, bio?: string | null, tagline?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification?: IdentityVerificationStatus | null, skills?: Array<string> | null, qualifications?: Array<string> | null, tasksCompletedCount?: number | null, quotesSentCount?: number | null, phoneVerified?: boolean | null, emailVerified?: boolean | null, memberSince?: any | null, serviceAreaLabel?: string | null, averageResponseTime?: string | null, profile?: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null } | null, user?: { id: string, email: string } | null, preferredLocation?: { name?: string | null, lat?: number | null, lng?: number | null } | null, serviceArea?: { label?: string | null, radiusMiles?: number | null } | null, ratingSummary?: { average?: number | null, count: number } | null }>, quotes: Array<{ id: string, status: QuoteStatus, message?: string | null, createdAt?: any | null, price?: { amount: number, currency: Currency } | null, worker?: { id: string, email: string, profile?: { name?: string | null } | null, worker?: { id: string, legalName?: string | null, isVerified: boolean, profile?: { name?: string | null } | null } | null } | null }>, orders: Array<{ id: string, status: OrderStatus, createdAt?: any | null, workerUserId?: string | null, customerUserId?: string | null, quoteId?: string | null, agreedPrice?: { amount: number, currency: Currency } | null }>, activity: Array<{ source: AdminTaskActivitySource, type: string, title?: string | null, body?: string | null, createdAt: any, actorUserId?: string | null, recipientUserId?: string | null, quoteId?: string | null, orderId?: string | null }> } };

export type AdminTaskByFilterQueryVariables = Exact<{
  filter?: InputMaybe<AdminTaskFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AdminTaskByFilterQuery = { adminTasks: Array<{ id: string, title: string, description: string, category: string, status: TaskStatus, views?: number | null, hidden?: boolean | null, datetime?: { date?: string | null, time?: string | null, type: TaskDateTimeType } | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, emailVerified: boolean, phoneVerified?: boolean | null, createdAt?: any | null, profile?: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null, bio?: string | null } | null, worker?: { id: string, legalName?: string | null, isVerified: boolean, profile?: { name?: string | null } | null } | null } | null, quotes?: Array<{ id: string, status: QuoteStatus, message?: string | null, createdAt?: any | null, price?: { amount: number, currency: Currency } | null, worker?: { id: string, email: string, profile?: { name?: string | null, avatarUrl?: string | null } | null, worker?: { id: string, legalName?: string | null, isVerified: boolean, profile?: { name?: string | null } | null } | null } | null }> | null, orders?: Array<{ id: string, status: OrderStatus, createdAt?: any | null, workerUserId?: string | null, customerUserId?: string | null, quoteId?: string | null, agreedPrice?: { amount: number, currency: Currency } | null }> | null, timeline?: Array<{ type: TaskTimelineEventType, timestamp: any, actor: { id: string, email: string, profile?: { name?: string | null } | null } }> | null }> };

export type AdminWorkersQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AdminWorkersQuery = { adminWorkers: Array<{ id: string, userId?: string | null, legalName?: string | null, bio?: string | null, tagline?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification?: IdentityVerificationStatus | null, skills?: Array<string> | null, qualifications?: Array<string> | null, tasksCompletedCount?: number | null, quotesSentCount?: number | null, phoneVerified?: boolean | null, emailVerified?: boolean | null, memberSince?: any | null, serviceAreaLabel?: string | null, averageResponseTime?: string | null, profile?: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null } | null, user?: { id: string, email: string } | null, preferredLocation?: { name?: string | null, lat?: number | null, lng?: number | null } | null, serviceArea?: { label?: string | null, radiusMiles?: number | null } | null, ratingSummary?: { average?: number | null, count: number } | null }> };

export type AdminUsersQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AdminUsersQuery = { adminUsers: Array<{ id: string, email: string, emailVerified: boolean, phoneVerified?: boolean | null, createdAt?: any | null, disabled: boolean, profile?: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null, bio?: string | null } | null, worker?: { id: string, userId?: string | null, legalName?: string | null, tagline?: string | null, bio?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification?: IdentityVerificationStatus | null, skills?: Array<string> | null, phoneVerified?: boolean | null, emailVerified?: boolean | null, memberSince?: any | null, serviceAreaLabel?: string | null, profile?: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null } | null, ratingSummary?: { average?: number | null, count: number } | null } | null }> };

export type AdminUserDetailQueryVariables = Exact<{
  id?: InputMaybe<Scalars['ID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AdminUserDetailQuery = { adminUsers: Array<{ id: string, email: string, emailVerified: boolean, phoneVerified?: boolean | null, createdAt?: any | null, disabled: boolean, tasksPosted?: Array<{ id: string, title: string, status: TaskStatus, category: string }> | null, profile?: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null, bio?: string | null } | null, worker?: { id: string, userId?: string | null, legalName?: string | null, tagline?: string | null, bio?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification?: IdentityVerificationStatus | null, skills?: Array<string> | null, phoneVerified?: boolean | null, emailVerified?: boolean | null, memberSince?: any | null, serviceAreaLabel?: string | null, profile?: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null } | null, ratingSummary?: { average?: number | null, count: number } | null } | null }> };

export type AdminUserDetailCoreQueryVariables = Exact<{
  id?: InputMaybe<Scalars['ID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AdminUserDetailCoreQuery = { adminUsers: Array<{ id: string, email: string, emailVerified: boolean, phoneVerified?: boolean | null, createdAt?: any | null, disabled: boolean, profile?: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null, bio?: string | null } | null, worker?: { id: string, userId?: string | null, legalName?: string | null, tagline?: string | null, bio?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification?: IdentityVerificationStatus | null, skills?: Array<string> | null, phoneVerified?: boolean | null, emailVerified?: boolean | null, memberSince?: any | null, serviceAreaLabel?: string | null, profile?: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null } | null, ratingSummary?: { average?: number | null, count: number } | null } | null }> };

export type AdminUpdateTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: AdminUpdateTaskInput;
}>;


export type AdminUpdateTaskMutation = { adminUpdateTask: { id: string, title: string, description: string, category: string, status: TaskStatus, views?: number | null, hidden?: boolean | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile?: { name?: string | null, avatarUrl?: string | null } | null } | null } };

export type AdminUpdateUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: AdminUpdateUserInput;
}>;


export type AdminUpdateUserMutation = { adminUpdateUser: { id: string, email: string, emailVerified: boolean, phoneVerified?: boolean | null, createdAt?: any | null, disabled: boolean, profile?: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null, bio?: string | null } | null, worker?: { id: string, userId?: string | null, legalName?: string | null, tagline?: string | null, bio?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification?: IdentityVerificationStatus | null, skills?: Array<string> | null, phoneVerified?: boolean | null, emailVerified?: boolean | null, memberSince?: any | null, serviceAreaLabel?: string | null, profile?: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null } | null, ratingSummary?: { average?: number | null, count: number } | null } | null } };

export type AdminSetUserDisabledMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  disabled: Scalars['Boolean']['input'];
}>;


export type AdminSetUserDisabledMutation = { adminSetUserDisabled: { id: string, email: string, emailVerified: boolean, phoneVerified?: boolean | null, createdAt?: any | null, disabled: boolean, profile?: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null, bio?: string | null } | null, worker?: { id: string, userId?: string | null, legalName?: string | null, tagline?: string | null, bio?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification?: IdentityVerificationStatus | null, skills?: Array<string> | null, phoneVerified?: boolean | null, emailVerified?: boolean | null, memberSince?: any | null, serviceAreaLabel?: string | null, profile?: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null } | null, ratingSummary?: { average?: number | null, count: number } | null } | null } };

export type ReportFieldsFragment = { id: string, targetId: string, targetType: ReportTargetType, reason: ReportReason, details?: string | null, status: ReportStatus, targetUrl?: string | null, createdAt: any, updatedAt: any, reporterUserId: string, targetTitle?: string | null, reporter?: { id: string, email: string, profile?: { name?: string | null } | null } | null };

export type ReportCoreFieldsFragment = { id: string, targetId: string, targetType: ReportTargetType, reason: ReportReason, details?: string | null, status: ReportStatus, targetUrl?: string | null, createdAt: any, updatedAt: any, reporterUserId: string };

export type AdminReportsQueryVariables = Exact<{
  status?: InputMaybe<ReportStatus>;
  targetType?: InputMaybe<ReportTargetType>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type AdminReportsQuery = { adminReports: { nextCursor?: string | null, items: Array<{ id: string, targetId: string, targetType: ReportTargetType, reason: ReportReason, details?: string | null, status: ReportStatus, targetUrl?: string | null, createdAt: any, updatedAt: any, reporterUserId: string, targetTitle?: string | null, reporter?: { id: string, email: string, profile?: { name?: string | null } | null } | null }> } };

export type AdminReportsCoreQueryVariables = Exact<{
  status?: InputMaybe<ReportStatus>;
  targetType?: InputMaybe<ReportTargetType>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type AdminReportsCoreQuery = { adminReports: { nextCursor?: string | null, items: Array<{ id: string, targetId: string, targetType: ReportTargetType, reason: ReportReason, details?: string | null, status: ReportStatus, targetUrl?: string | null, createdAt: any, updatedAt: any, reporterUserId: string }> } };

export type ReportsQueryVariables = Exact<{
  status?: InputMaybe<ReportStatus>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type ReportsQuery = { reports: { nextCursor?: string | null, items: Array<{ id: string, targetId: string, targetType: ReportTargetType, reason: ReportReason, details?: string | null, status: ReportStatus, targetUrl?: string | null, createdAt: any, updatedAt: any, reporterUserId: string }> } };

export type AdminUpdateReportStatusMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  status: ReportStatus;
}>;


export type AdminUpdateReportStatusMutation = { adminUpdateReportStatus: { id: string, targetId: string, targetType: ReportTargetType, reason: ReportReason, details?: string | null, status: ReportStatus, targetUrl?: string | null, createdAt: any, updatedAt: any, reporterUserId: string } };

export type UpdateReportStatusMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  status: ReportStatus;
}>;


export type UpdateReportStatusMutation = { updateReportStatus: { id: string, targetId: string, targetType: ReportTargetType, reason: ReportReason, details?: string | null, status: ReportStatus, targetUrl?: string | null, createdAt: any, updatedAt: any, reporterUserId: string } };

export type AdminOpsSummaryQueryVariables = Exact<{
  range: AdminOpsRange;
}>;


export type AdminOpsSummaryQuery = { adminOpsSummary: { range: AdminOpsRange, dateFrom: any, dateTo: any, previousDateFrom: any, previousDateTo: any, openReports: number, hiddenTasks: number, disabledUsers: number, newUsers: { current: number, previous: number, percentChange?: number | null }, tasksCreated: { current: number, previous: number, percentChange?: number | null }, workersRegistered: { current: number, previous: number, percentChange?: number | null }, quotesSent: { current: number, previous: number, percentChange?: number | null }, quotesAccepted: { current: number, previous: number, percentChange?: number | null }, quotesDeclined: { current: number, previous: number, percentChange?: number | null }, ordersOpened: { current: number, previous: number, percentChange?: number | null }, jobsCompleted: { current: number, previous: number, percentChange?: number | null }, jobsConfirmed: { current: number, previous: number, percentChange?: number | null }, reportsSubmitted: { current: number, previous: number, percentChange?: number | null }, tasksByStatus: Array<{ status: TaskStatus, count: number }> } };

export type TasksQueryVariables = Exact<{
  filter?: InputMaybe<TaskFilter>;
}>;


export type TasksQuery = { tasks: Array<{ id: string, title: string, description: string, category: string, status: TaskStatus, views?: number | null, hidden?: boolean | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile?: { name?: string | null, avatarUrl?: string | null } | null } | null }> };

export type TaskQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type TaskQuery = { task?: { id: string, title: string, description: string, category: string, status: TaskStatus, views?: number | null, hidden?: boolean | null, datetime?: { date?: string | null, time?: string | null, type: TaskDateTimeType } | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, emailVerified: boolean, phoneVerified?: boolean | null, createdAt?: any | null, profile?: { name?: string | null, contactNumber?: string | null, avatarUrl?: string | null, bio?: string | null } | null, worker?: { id: string, legalName?: string | null, isVerified: boolean, profile?: { name?: string | null } | null } | null } | null, quotes?: Array<{ id: string, status: QuoteStatus, message?: string | null, createdAt?: any | null, price?: { amount: number, currency: Currency } | null, worker?: { id: string, email: string, profile?: { name?: string | null, avatarUrl?: string | null } | null, worker?: { id: string, legalName?: string | null, isVerified: boolean, profile?: { name?: string | null } | null } | null } | null }> | null, orders?: Array<{ id: string, status: OrderStatus, createdAt?: any | null, workerUserId?: string | null, customerUserId?: string | null, quoteId?: string | null, agreedPrice?: { amount: number, currency: Currency } | null }> | null, timeline?: Array<{ type: TaskTimelineEventType, timestamp: any, actor: { id: string, email: string, profile?: { name?: string | null } | null } }> | null } | null };

export type TaskCoreQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type TaskCoreQuery = { task?: { id: string, title: string, description: string, category: string, status: TaskStatus, views?: number | null, hidden?: boolean | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile?: { name?: string | null, avatarUrl?: string | null } | null } | null } | null };

export type WorkersQueryVariables = Exact<{
  filter?: InputMaybe<WorkerFilter>;
}>;


export type WorkersQuery = { workers: Array<{ id: string, userId?: string | null, legalName?: string | null, bio?: string | null, tagline?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification?: IdentityVerificationStatus | null, skills?: Array<string> | null, qualifications?: Array<string> | null, tasksCompletedCount?: number | null, quotesSentCount?: number | null, phoneVerified?: boolean | null, emailVerified?: boolean | null, memberSince?: any | null, serviceAreaLabel?: string | null, averageResponseTime?: string | null, profile?: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null } | null, user?: { id: string, email: string } | null, preferredLocation?: { name?: string | null, lat?: number | null, lng?: number | null } | null, serviceArea?: { label?: string | null, radiusMiles?: number | null } | null, ratingSummary?: { average?: number | null, count: number } | null }> };

export type WorkerQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type WorkerQuery = { worker?: { id: string, userId?: string | null, legalName?: string | null, bio?: string | null, tagline?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification?: IdentityVerificationStatus | null, skills?: Array<string> | null, qualifications?: Array<string> | null, tasksCompletedCount?: number | null, quotesSentCount?: number | null, phoneVerified?: boolean | null, emailVerified?: boolean | null, memberSince?: any | null, serviceAreaLabel?: string | null, averageResponseTime?: string | null, profile?: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null } | null, user?: { id: string, email: string } | null, preferredLocation?: { name?: string | null, lat?: number | null, lng?: number | null } | null, serviceArea?: { label?: string | null, radiusMiles?: number | null } | null, ratingSummary?: { average?: number | null, count: number } | null } | null };
