import {
  AdminFeedbackDraftReply,
  AdminFeedbackSummary,
  AdminFeedbacks,
  AdminUpdateFeedbackStatus,
} from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import {
  feedbackFromApi,
  sortFeedbacksOpenFirst,
  toAdminFeedbacksVariables,
  type FeedbackCategoryFilter,
  type FeedbackDraftReply,
  type FeedbackPage,
  type FeedbackRow,
  type FeedbackStatus,
  type FeedbackStatusFilter,
  type FeedbackSummary,
} from '@/lib/feedback'
import type {
  AdminFeedbackDraftReplyQuery,
  AdminFeedbackSummaryQuery,
  AdminFeedbacksQuery,
  AdminUpdateFeedbackStatusMutation,
} from '@codegen/schema'

export async function listAdminFeedbacks(input: {
  status: FeedbackStatusFilter
  category: FeedbackCategoryFilter
  after?: string | null
  first?: number
}): Promise<FeedbackPage> {
  const result = await apolloClient.query<AdminFeedbacksQuery>({
    query: AdminFeedbacks,
    variables: toAdminFeedbacksVariables(input),
    fetchPolicy: 'network-only',
  })
  const page = result.data?.adminFeedbacks
  const items = (page?.items ?? []).map(feedbackFromApi)
  return {
    items: input.status === 'ALL' ? sortFeedbacksOpenFirst(items) : items,
    nextCursor: page?.nextCursor ?? null,
  }
}

export async function loadFeedbackSummary(): Promise<FeedbackSummary | null> {
  const result = await apolloClient.query<AdminFeedbackSummaryQuery>({
    query: AdminFeedbackSummary,
    fetchPolicy: 'network-only',
  })
  return result.data?.adminFeedbackSummary ?? null
}

export async function updateAdminFeedbackStatus(
  id: string,
  status: FeedbackStatus,
): Promise<FeedbackRow> {
  const result = await apolloClient.mutate<AdminUpdateFeedbackStatusMutation>({
    mutation: AdminUpdateFeedbackStatus,
    variables: { id, status },
  })
  const updated = result.data?.adminUpdateFeedbackStatus
  if (!updated) throw new Error('adminUpdateFeedbackStatus returned no feedback')
  return feedbackFromApi(updated)
}

export async function loadFeedbackDraftReply(
  id: string,
): Promise<FeedbackDraftReply> {
  const result = await apolloClient.query<AdminFeedbackDraftReplyQuery>({
    query: AdminFeedbackDraftReply,
    variables: { id },
    fetchPolicy: 'network-only',
  })
  const draft = result.data?.adminFeedbackDraftReply
  if (!draft) throw new Error('adminFeedbackDraftReply returned no draft')
  return draft
}
