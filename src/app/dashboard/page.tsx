import { AdminOpsSummary } from '@/graphql/operations'
import { isMissingAdminFieldError } from '@/lib/graphqlErrors'
import { parseAdminOpsRange } from '@/lib/opsRange'
import { DashboardReport } from '@/components/DashboardReport'
import { getServerAuthToken } from '@/server/auth'
import { serverGraphql } from '@/server/graphql'
import { fetchDashboardProductMetrics } from '@/server/posthog'
import type { AdminOpsSummaryQuery } from '@codegen/schema'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const params = await searchParams
  const range = parseAdminOpsRange(params.range)
  const token = await getServerAuthToken()

  const [opsResult, product] = await Promise.all([
    loadOpsSummary(range, token),
    fetchDashboardProductMetrics(range),
  ])

  return (
    <DashboardReport
      range={range}
      ops={opsResult.data}
      opsBanner={opsResult.banner}
      product={product}
    />
  )
}

async function loadOpsSummary(
  range: ReturnType<typeof parseAdminOpsRange>,
  token: string | null,
): Promise<{
  data: AdminOpsSummaryQuery['adminOpsSummary'] | null
  banner: string | null
}> {
  if (!token) {
    return {
      data: null,
      banner: 'Mongo ops counts need an admin session cookie.',
    }
  }
  try {
    const data = await serverGraphql<AdminOpsSummaryQuery>(
      AdminOpsSummary,
      { range },
      token,
    )
    return { data: data.adminOpsSummary, banner: null }
  } catch (error) {
    if (isMissingAdminFieldError(error)) {
      return {
        data: null,
        banner:
          'adminOpsSummary is not on this Apollo yet (BE-44). Mongo hard counts will appear when that API lands.',
      }
    }
    return {
      data: null,
      banner: error instanceof Error ? error.message : 'Failed to load ops summary',
    }
  }
}
