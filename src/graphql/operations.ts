import { gql } from 'graphql-tag'

export const LoginWithGoogle = gql`
  mutation LoginWithGoogle($token: String!) {
    loginWithMethod(input: { method: GOOGLE, oauthToken: $token }) {
      token
      user {
        id
        email
        emailVerified
      }
    }
  }
`

export const Me = gql`
  query Me {
    me {
      id
      email
      emailVerified
      profile {
        name
        avatarUrl
      }
    }
  }
`

const USER_ADMIN_FIELDS = gql`
  fragment UserAdminFields on User {
    id
    email
    emailVerified
    phoneVerified
    createdAt
    disabled
    profile {
      name
      contactNumber
      avatarUrl
    }
    worker {
      id
      userId
      legalName
      tagline
      bio
      primaryCategory
      yearsExperience
      isVerified
      identityVerification
      skills
      phoneVerified
      emailVerified
      memberSince
      serviceAreaLabel
      profile {
        name
        avatarUrl
        contactNumber
      }
      ratingSummary {
        average
        count
      }
    }
  }
`

const TASK_LIST_FIELDS = gql`
  fragment TaskListFields on Task {
    id
    title
    description
    category
    status
    views
    hidden
    datetime {
      date
      time
      type
    }
    budget {
      amount
      currency
      type
      paymentMethod
    }
    location {
      lat
      lng
      name
      address
    }
    poster {
      id
      email
      profile {
        name
        avatarUrl
      }
    }
  }
`

const WORKER_FIELDS = gql`
  fragment WorkerAdminFields on worker {
    id
    userId
    legalName
    bio
    tagline
    primaryCategory
    yearsExperience
    isVerified
    identityVerification
    skills
    qualifications
    quotesSentCount
    phoneVerified
    emailVerified
    memberSince
    serviceAreaLabel
    profile {
      name
      avatarUrl
      contactNumber
    }
    user {
      id
      email
    }
    preferredLocation {
      name
      lat
      lng
    }
    serviceArea {
      label
      radiusMiles
    }
    ratingSummary {
      average
      count
    }
  }
`

const ADMIN_TASK_DOSSIER = gql`
  fragment AdminTaskDossierFields on AdminTaskDossier {
    task {
      ...TaskListFields
    }
    poster {
      ...UserAdminFields
    }
    workers {
      ...WorkerAdminFields
    }
    quotes {
      id
      status
      message
      createdAt
      price {
        amount
        currency
      }
      worker {
        id
        email
        profile {
          name
        }
        worker {
          id
          legalName
          isVerified
          profile {
            name
          }
        }
      }
    }
    orders {
      id
      status
      createdAt
      workerUserId
      customerUserId
      quoteId
      agreedPrice {
        amount
        currency
      }
      bookedStart
      bookedEnd
      autoDoneAt
      closedAt
      pendingRequest {
        kind
        requestedByUserId
        requestedAt
      }
      rescheduleHistory {
        previousStart
        start
        requestedByUserId
        confirmedAt
      }
    }
    activity {
      source
      type
      title
      body
      createdAt
      actorUserId
      visibleToUserIds
      quoteId
      orderId
    }
  }
`

export const AdminTasks = gql`
  ${TASK_LIST_FIELDS}
  query AdminTasks($filter: AdminTaskFilter, $first: Int, $after: String) {
    adminTasks(filter: $filter, first: $first, after: $after) {
      nextCursor
      items {
        ...TaskListFields
      }
    }
  }
`

export const AdminTask = gql`
  ${TASK_LIST_FIELDS}
  ${USER_ADMIN_FIELDS}
  ${WORKER_FIELDS}
  ${ADMIN_TASK_DOSSIER}
  query AdminTask($id: ID!) {
    adminTask(id: $id) {
      ...AdminTaskDossierFields
    }
  }
`

export const AdminUsers = gql`
  ${USER_ADMIN_FIELDS}
  query AdminUsers(
    $search: String
    $id: ID
    $disabled: Boolean
    $isWorker: Boolean
    $createdAfter: DateTime
    $createdBefore: DateTime
    $first: Int
    $after: String
  ) {
    adminUsers(
      search: $search
      id: $id
      disabled: $disabled
      isWorker: $isWorker
      createdAfter: $createdAfter
      createdBefore: $createdBefore
      first: $first
      after: $after
    ) {
      nextCursor
      items {
        ...UserAdminFields
      }
    }
  }
`

export const AdminUserDetail = gql`
  ${USER_ADMIN_FIELDS}
  query AdminUserDetail($id: ID!) {
    adminUsers(id: $id, first: 1) {
      items {
        ...UserAdminFields
        tasksPosted {
          id
          title
          status
          category
        }
      }
    }
  }
`

export const AdminUpdateTask = gql`
  ${TASK_LIST_FIELDS}
  mutation AdminUpdateTask($id: ID!, $input: AdminUpdateTaskInput!) {
    adminUpdateTask(id: $id, input: $input) {
      ...TaskListFields
    }
  }
`

export const AdminUpdateUser = gql`
  ${USER_ADMIN_FIELDS}
  mutation AdminUpdateUser($id: ID!, $input: AdminUpdateUserInput!) {
    adminUpdateUser(id: $id, input: $input) {
      ...UserAdminFields
    }
  }
`

export const AdminSetUserDisabled = gql`
  ${USER_ADMIN_FIELDS}
  mutation AdminSetUserDisabled($id: ID!, $disabled: Boolean!) {
    adminSetUserDisabled(id: $id, disabled: $disabled) {
      ...UserAdminFields
    }
  }
`

const REPORT_FIELDS = gql`
  fragment ReportFields on Report {
    id
    targetId
    targetType
    reason
    details
    status
    targetUrl
    createdAt
    updatedAt
    reporterUserId
    reporterEmail
    targetLabel
    reporter {
      id
      email
      profile {
        name
      }
    }
  }
`

export const AdminReports = gql`
  ${REPORT_FIELDS}
  query AdminReports(
    $status: ReportStatus
    $targetType: ReportTargetType
    $first: Int
    $after: String
  ) {
    adminReports(
      status: $status
      targetType: $targetType
      first: $first
      after: $after
    ) {
      nextCursor
      items {
        ...ReportFields
      }
    }
  }
`

export const AdminUpdateReportStatus = gql`
  ${REPORT_FIELDS}
  mutation AdminUpdateReportStatus($id: ID!, $status: ReportStatus!) {
    adminUpdateReportStatus(id: $id, status: $status) {
      ...ReportFields
    }
  }
`

const FEEDBACK_FIELDS = gql`
  fragment FeedbackFields on Feedback {
    id
    userId
    email
    name
    category
    rating
    message
    pageUrl
    path
    userAgent
    status
    ackEmailSentAt
    createdAt
    updatedAt
  }
`

export const AdminFeedbackSummary = gql`
  query AdminFeedbackSummary {
    adminFeedbackSummary {
      total
      open
      reviewed
      replied
    }
  }
`

export const AdminFeedbacks = gql`
  ${FEEDBACK_FIELDS}
  query AdminFeedbacks(
    $status: FeedbackStatus
    $category: FeedbackCategory
    $first: Int
    $after: String
  ) {
    adminFeedbacks(
      status: $status
      category: $category
      first: $first
      after: $after
    ) {
      nextCursor
      items {
        ...FeedbackFields
      }
    }
  }
`

export const AdminUpdateFeedbackStatus = gql`
  ${FEEDBACK_FIELDS}
  mutation AdminUpdateFeedbackStatus($id: ID!, $status: FeedbackStatus!) {
    adminUpdateFeedbackStatus(id: $id, status: $status) {
      ...FeedbackFields
    }
  }
`

export const AdminFeedbackDraftReply = gql`
  query AdminFeedbackDraftReply($id: ID!) {
    adminFeedbackDraftReply(id: $id) {
      subject
      bodyText
      bodyHtml
    }
  }
`

export const AdminOpsSummary = gql`
  query AdminOpsSummary($range: AdminOpsRange!) {
    adminOpsSummary(range: $range) {
      range
      dateFrom
      dateTo
      previousDateFrom
      previousDateTo
      newUsers {
        current
        previous
        percentChange
      }
      tasksCreated {
        current
        previous
        percentChange
      }
      workersRegistered {
        current
        previous
        percentChange
      }
      quotesSent {
        current
        previous
        percentChange
      }
      quotesAccepted {
        current
        previous
        percentChange
      }
      quotesDeclined {
        current
        previous
        percentChange
      }
      ordersOpened {
        current
        previous
        percentChange
      }
      jobsCompleted {
        current
        previous
        percentChange
      }
      reportsSubmitted {
        current
        previous
        percentChange
      }
      openReports
      hiddenTasks
      disabledUsers
      tasksByStatus {
        status
        count
      }
    }
  }
`
