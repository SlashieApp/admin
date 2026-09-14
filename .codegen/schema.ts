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
   * Marketplace types match live apollo introspection (2026-09-14).
   * `@admin` fields are the BE-42 proposed API used by this panel:
   *
   *   adminTasks(search: String, id: ID): [Task!]!
   *   adminWorkers(search: String, id: ID): [worker!]!
   *   adminUpdateTask(id: ID!, input: AdminUpdateTaskInput!): Task!
   *
   * See https://linear.app/slashie/issue/BE-42
   */
  DateTime: { input: any; output: any; }
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
  /** BE-42 @admin — god-mode task update (ignores owner checks). */
  adminUpdateTask: Task;
  loginWithMethod: AuthPayload;
};


export type MutationAdminUpdateTaskArgs = {
  id: Scalars['ID']['input'];
  input: AdminUpdateTaskInput;
};


export type MutationLoginWithMethodArgs = {
  input: LoginInput;
};

export type Profile = {
  avatarUrl?: Maybe<Scalars['String']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  contactNumber?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  /** BE-42 @admin — search tasks by text and/or id. */
  adminTasks: Array<Task>;
  /** BE-42 @admin — search workers by text and/or id. */
  adminWorkers: Array<Worker>;
  me: User;
  task?: Maybe<Task>;
  tasks: Array<Task>;
  worker?: Maybe<Worker>;
  workers: Array<Worker>;
};


export type QueryAdminTasksArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAdminWorkersArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
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

export type ServiceArea = {
  label?: Maybe<Scalars['String']['output']>;
  radiusMiles?: Maybe<Scalars['Float']['output']>;
};

export type Task = {
  budget?: Maybe<TaskBudget>;
  category: Scalars['String']['output'];
  description: Scalars['String']['output'];
  /** BE-42 god-mode visibility. Absent on pre-admin marketplace selections. */
  hidden?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  location: TaskLocation;
  poster?: Maybe<User>;
  status: TaskStatus;
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

export type User = {
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  email: Scalars['String']['output'];
  emailVerified: Scalars['Boolean']['output'];
  enabledLoginMethods?: Maybe<Array<LoginMethod>>;
  id: Scalars['ID']['output'];
  profile?: Maybe<Profile>;
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

export type TaskAdminFieldsFragment = { id: string, title: string, description: string, category: string, status: TaskStatus, views?: number | null, hidden?: boolean | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile?: { name?: string | null, avatarUrl?: string | null } | null } | null };

export type TaskPublicFieldsFragment = { id: string, title: string, description: string, category: string, status: TaskStatus, views?: number | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile?: { name?: string | null, avatarUrl?: string | null } | null } | null };

export type WorkerAdminFieldsFragment = { id: string, userId?: string | null, legalName?: string | null, bio?: string | null, tagline?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification?: IdentityVerificationStatus | null, skills?: Array<string> | null, qualifications?: Array<string> | null, tasksCompletedCount?: number | null, quotesSentCount?: number | null, phoneVerified?: boolean | null, emailVerified?: boolean | null, memberSince?: any | null, serviceAreaLabel?: string | null, averageResponseTime?: string | null, profile?: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null } | null, user?: { id: string, email: string } | null, preferredLocation?: { name?: string | null, lat?: number | null, lng?: number | null } | null, serviceArea?: { label?: string | null, radiusMiles?: number | null } | null, ratingSummary?: { average?: number | null, count: number } | null };

export type AdminTasksQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
}>;


export type AdminTasksQuery = { adminTasks: Array<{ id: string, title: string, description: string, category: string, status: TaskStatus, views?: number | null, hidden?: boolean | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile?: { name?: string | null, avatarUrl?: string | null } | null } | null }> };

export type AdminWorkersQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
}>;


export type AdminWorkersQuery = { adminWorkers: Array<{ id: string, userId?: string | null, legalName?: string | null, bio?: string | null, tagline?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification?: IdentityVerificationStatus | null, skills?: Array<string> | null, qualifications?: Array<string> | null, tasksCompletedCount?: number | null, quotesSentCount?: number | null, phoneVerified?: boolean | null, emailVerified?: boolean | null, memberSince?: any | null, serviceAreaLabel?: string | null, averageResponseTime?: string | null, profile?: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null } | null, user?: { id: string, email: string } | null, preferredLocation?: { name?: string | null, lat?: number | null, lng?: number | null } | null, serviceArea?: { label?: string | null, radiusMiles?: number | null } | null, ratingSummary?: { average?: number | null, count: number } | null }> };

export type AdminUpdateTaskMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: AdminUpdateTaskInput;
}>;


export type AdminUpdateTaskMutation = { adminUpdateTask: { id: string, title: string, description: string, category: string, status: TaskStatus, views?: number | null, hidden?: boolean | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile?: { name?: string | null, avatarUrl?: string | null } | null } | null } };

export type TasksQueryVariables = Exact<{
  filter?: InputMaybe<TaskFilter>;
}>;


export type TasksQuery = { tasks: Array<{ id: string, title: string, description: string, category: string, status: TaskStatus, views?: number | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile?: { name?: string | null, avatarUrl?: string | null } | null } | null }> };

export type TaskQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type TaskQuery = { task?: { id: string, title: string, description: string, category: string, status: TaskStatus, views?: number | null, budget?: { amount: number, currency: Currency, type: TaskBudgetType, paymentMethod: TaskPaymentMethod } | null, location: { lat?: number | null, lng?: number | null, name?: string | null, address?: string | null }, poster?: { id: string, email: string, profile?: { name?: string | null, avatarUrl?: string | null } | null } | null } | null };

export type WorkersQueryVariables = Exact<{
  filter?: InputMaybe<WorkerFilter>;
}>;


export type WorkersQuery = { workers: Array<{ id: string, userId?: string | null, legalName?: string | null, bio?: string | null, tagline?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification?: IdentityVerificationStatus | null, skills?: Array<string> | null, qualifications?: Array<string> | null, tasksCompletedCount?: number | null, quotesSentCount?: number | null, phoneVerified?: boolean | null, emailVerified?: boolean | null, memberSince?: any | null, serviceAreaLabel?: string | null, averageResponseTime?: string | null, profile?: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null } | null, user?: { id: string, email: string } | null, preferredLocation?: { name?: string | null, lat?: number | null, lng?: number | null } | null, serviceArea?: { label?: string | null, radiusMiles?: number | null } | null, ratingSummary?: { average?: number | null, count: number } | null }> };

export type WorkerQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type WorkerQuery = { worker?: { id: string, userId?: string | null, legalName?: string | null, bio?: string | null, tagline?: string | null, primaryCategory?: WorkerPrimaryCategory | null, yearsExperience?: number | null, isVerified: boolean, identityVerification?: IdentityVerificationStatus | null, skills?: Array<string> | null, qualifications?: Array<string> | null, tasksCompletedCount?: number | null, quotesSentCount?: number | null, phoneVerified?: boolean | null, emailVerified?: boolean | null, memberSince?: any | null, serviceAreaLabel?: string | null, averageResponseTime?: string | null, profile?: { name?: string | null, avatarUrl?: string | null, contactNumber?: string | null } | null, user?: { id: string, email: string } | null, preferredLocation?: { name?: string | null, lat?: number | null, lng?: number | null } | null, serviceArea?: { label?: string | null, radiusMiles?: number | null } | null, ratingSummary?: { average?: number | null, count: number } | null } | null };
