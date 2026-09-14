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

const TASK_ADMIN_FIELDS = gql`
  fragment TaskAdminFields on Task {
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

const TASK_PUBLIC_FIELDS = gql`
  fragment TaskPublicFields on Task {
    id
    title
    description
    category
    status
    views
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

export const AdminTasks = gql`
  ${TASK_ADMIN_FIELDS}
  query AdminTasks($search: String, $id: ID) {
    adminTasks(search: $search, id: $id) {
      ...TaskAdminFields
    }
  }
`

export const AdminWorkers = gql`
  ${WORKER_FIELDS}
  query AdminWorkers($search: String, $id: ID) {
    adminWorkers(search: $search, id: $id) {
      ...WorkerAdminFields
    }
  }
`

export const AdminUpdateTask = gql`
  ${TASK_ADMIN_FIELDS}
  mutation AdminUpdateTask($id: ID!, $input: AdminUpdateTaskInput!) {
    adminUpdateTask(id: $id, input: $input) {
      ...TaskAdminFields
    }
  }
`

export const Tasks = gql`
  ${TASK_PUBLIC_FIELDS}
  query Tasks($filter: TaskFilter) {
    tasks(filter: $filter) {
      ...TaskPublicFields
    }
  }
`

export const Task = gql`
  ${TASK_PUBLIC_FIELDS}
  query Task($id: ID!) {
    task(id: $id) {
      ...TaskPublicFields
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
