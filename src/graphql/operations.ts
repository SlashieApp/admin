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
      bio
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

const TASK_DOSSIER_FIELDS = gql`
  fragment TaskDossierFields on Task {
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
      emailVerified
      phoneVerified
      createdAt
      profile {
        name
        contactNumber
        avatarUrl
        bio
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
          avatarUrl
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
    }
    timeline {
      type
      timestamp
      actor {
        id
        email
        profile {
          name
        }
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
    tasksCompletedCount
    quotesSentCount
    phoneVerified
    emailVerified
    memberSince
    serviceAreaLabel
    averageResponseTime
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
      ...TaskDossierFields
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
    }
    activity {
      source
      type
      title
      body
      createdAt
      actorUserId
      recipientUserId
      quoteId
      orderId
    }
  }
`

export const AdminTasks = gql`
  ${TASK_LIST_FIELDS}
  query AdminTasks($filter: AdminTaskFilter, $first: Int) {
    adminTasks(filter: $filter, first: $first) {
      ...TaskListFields
    }
  }
`

export const AdminTasksLegacy = gql`
  ${TASK_LIST_FIELDS}
  query AdminTasksLegacy($search: String, $id: ID) {
    adminTasks(search: $search, id: $id) {
      ...TaskListFields
    }
  }
`

export const AdminTask = gql`
  ${TASK_DOSSIER_FIELDS}
  ${USER_ADMIN_FIELDS}
  ${WORKER_FIELDS}
  ${ADMIN_TASK_DOSSIER}
  query AdminTask($id: ID!) {
    adminTask(id: $id) {
      ...AdminTaskDossierFields
    }
  }
`

export const AdminTaskByFilter = gql`
  ${TASK_DOSSIER_FIELDS}
  query AdminTaskByFilter($filter: AdminTaskFilter, $first: Int) {
    adminTasks(filter: $filter, first: $first) {
      ...TaskDossierFields
    }
  }
`

export const AdminWorkers = gql`
  ${WORKER_FIELDS}
  query AdminWorkers($search: String, $id: ID, $first: Int) {
    adminWorkers(search: $search, id: $id, first: $first) {
      ...WorkerAdminFields
    }
  }
`

export const AdminUsers = gql`
  ${USER_ADMIN_FIELDS}
  query AdminUsers($search: String, $id: ID, $first: Int) {
    adminUsers(search: $search, id: $id, first: $first) {
      ...UserAdminFields
    }
  }
`

export const AdminUserDetail = gql`
  ${USER_ADMIN_FIELDS}
  query AdminUserDetail($id: ID, $first: Int) {
    adminUsers(id: $id, first: $first) {
      ...UserAdminFields
      tasksPosted {
        id
        title
        status
        category
      }
    }
  }
`

export const AdminUserDetailCore = gql`
  ${USER_ADMIN_FIELDS}
  query AdminUserDetailCore($id: ID, $first: Int) {
    adminUsers(id: $id, first: $first) {
      ...UserAdminFields
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
      jobsConfirmed {
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

export const Tasks = gql`
  ${TASK_LIST_FIELDS}
  query Tasks($filter: TaskFilter) {
    tasks(filter: $filter) {
      ...TaskListFields
    }
  }
`

export const Task = gql`
  ${TASK_DOSSIER_FIELDS}
  query Task($id: ID!) {
    task(id: $id) {
      ...TaskDossierFields
    }
  }
`

export const TaskCore = gql`
  ${TASK_LIST_FIELDS}
  query TaskCore($id: ID!) {
    task(id: $id) {
      ...TaskListFields
    }
  }
`

export const Workers = gql`
  ${WORKER_FIELDS}
  query Workers($filter: WorkerFilter) {
    workers(filter: $filter) {
      ...WorkerAdminFields
    }
  }
`

export const Worker = gql`
  ${WORKER_FIELDS}
  query Worker($id: ID!) {
    worker(id: $id) {
      ...WorkerAdminFields
    }
  }
`
