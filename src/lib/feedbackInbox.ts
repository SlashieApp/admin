import {
  AdminFeedbackDraftReply,
  AdminFeedbackDraftReplyMutation,
  AdminFeedbackSummary,
  AdminFeedbacks,
  AdminUpdateFeedbackStatus,
} from '@/graphql/operations'
import { apolloClient } from '@/lib/apollo'
import { graphqlErrorMessage, isMissingAdminFieldError } from '@/lib/graphqlErrors'
import {
  MAX_FEEDBACK_PAGES,
  feedbackFromApi,
  sortFeedbacksOpenFirst,
  toAdminFeedbacksVariables,
  type FeedbackApiPayload,
  type FeedbackCategoryFilter,
  type FeedbackDraftReply,
  type FeedbackPage,
  type FeedbackRow,
  type FeedbackStatus,
  type FeedbackStatusFilter,
  type FeedbackSummary,
} from '@/lib/feedback'
import type {
  AdminFeedbackDraftReplyMutationMutation,
  AdminFeedbackDraftReplyQuery,
  AdminFeedbackSummaryQuery,
  AdminFeedbacksQuery,
  AdminUpdateFeedbackStatusMutation,
} from '@codegen/schema'

export type FeedbackListResult = {
  items: FeedbackRow[]
  nextCursor: string | null
  banner: string | null
}

const MISSING_API =
  'adminFeedbacks is not on this Apollo yet (BE-48). Product feedback inbox will appear when that API lands.'

function asFeedbackRow(row: FeedbackApiPayload): FeedbackRow {
  return feedbackFromApi(row)
}

async function queryAdminFeedbacks(
  variables: ReturnType<typeof toAdminFeedbacksVariables>,
): Promise<FeedbackPage> {
  const result = await apolloClient.query<AdminFeedbacksQuery>({
    query: AdminFeedbacks,
    variables,
    fetchPolicy: 'network-only',
  })
  const page = result.data?.adminFeedbacks
  return {
    items: (page?.items ?? []).map(asFeedbackRow),
    nextCursor: page?.nextCursor ?? null,
  }
}

async function drainPages(
  fetchPage: (after?: string) => Promise<FeedbackPage>,
  after?: string | null,
): Promise<FeedbackPage> {
  const items: FeedbackRow[] = []
  let cursor = after ?? undefined
  let nextCursor: string | null = null

  for (let i = 0; i < MAX_FEEDBACK_PAGES; i++) {
    const page = await fetchPage(cursor)
    items.push(...page.items)
    nextCursor = page.nextCursor ?? null
    if (!nextCursor) break
    cursor = nextCursor
  }

  return { items, nextCursor }
}

function decorateList(
  items: FeedbackRow[],
  status: FeedbackStatusFilter,
): FeedbackRow[] {
  if (status === 'ALL') return sortFeedbacksOpenFirst(items)
  return items
}

export async function listAdminFeedbacks(input: {
  status: FeedbackStatusFilter
  category: FeedbackCategoryFilter
  after?: string | null
}): Promise<FeedbackListResult> {
  const base = toAdminFeedbacksVariables(input)

  try {
    const page = await drainPages(
      (after) => queryAdminFeedbacks({ ...base, after }),
      input.after,
    )
    return {
      items: decorateList(page.items, input.status),
      nextCursor: page.nextCursor ?? null,
      banner: null,
    }
  } catch (error) {
    if (isMissingAdminFieldError(error)) {
      throw new Error(MISSING_API)
    }
    throw new Error(graphqlErrorMessage(error))
  }
}

export async function loadFeedbackSummary(): Promise<FeedbackSummary | null> {
  try {
    const result = await apolloClient.query<AdminFeedbackSummaryQuery>({
      query: AdminFeedbackSummary,
      fetchPolicy: 'network-only',
    })
    const summary = result.data?.adminFeedbackSummary
    if (!summary) return null
    return {
      total: summary.total,
      open: summary.open,
      reviewed: summary.reviewed,
      replied: summary.replied,
    }
  } catch (error) {
    if (isMissingAdminFieldError(error)) return null
    throw new Error(graphqlErrorMessage(error))
  }
}

export async function updateAdminFeedbackStatus(
  id: string,
  status: FeedbackStatus,
): Promise<FeedbackRow> {
  try {
    const result =
      await apolloClient.mutate<AdminUpdateFeedbackStatusMutation>({
        mutation: AdminUpdateFeedbackStatus,
        variables: { id, status },
      })
    const updated = result.data?.adminUpdateFeedbackStatus
    if (!updated) throw new Error('adminUpdateFeedbackStatus returned no feedback')
    return asFeedbackRow(updated)
  } catch (error) {
    if (isMissingAdminFieldError(error)) {
      throw new Error(
        'adminUpdateFeedbackStatus is not on this Apollo yet (BE-48).',
      )
    }
    throw error
  }
}

export async function loadFeedbackDraftReply(
  id: string,
): Promise<FeedbackDraftReply> {
  try {
    const result = await apolloClient.query<AdminFeedbackDraftReplyQuery>({
      query: AdminFeedbackDraftReply,
      variables: { id },
      fetchPolicy: 'network-only',
    })
    const draft = result.data?.adminFeedbackDraftReply
    if (!draft) throw new Error('adminFeedbackDraftReply returned no draft')
    return {
      subject: draft.subject,
      bodyText: draft.bodyText,
      bodyHtml: draft.bodyHtml,
    }
  } catch (error) {
    if (!isMissingAdminFieldError(error)) throw error
  }

  try {
    const result =
      await apolloClient.mutate<AdminFeedbackDraftReplyMutationMutation>({
        mutation: AdminFeedbackDraftReplyMutation,
        variables: { id },
      })
    const draft = result.data?.adminFeedbackDraftReply
    if (!draft) throw new Error('adminFeedbackDraftReply returned no draft')
    return {
      subject: draft.subject,
      bodyText: draft.bodyText,
      bodyHtml: draft.bodyHtml,
    }
  } catch (error) {
    if (isMissingAdminFieldError(error)) {
      throw new Error(
        'adminFeedbackDraftReply is not on this Apollo yet (BE-48).',
      )
    }
    throw error
  }
}
