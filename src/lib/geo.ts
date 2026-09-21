export type GeoBBox = {
  swLat: number
  swLng: number
  neLat: number
  neLng: number
}

export const DEFAULT_MAP_CENTER = { lat: 51.5074, lng: -0.1278 }
export const DEFAULT_MAP_ZOOM = 9

export function parseCoord(value: unknown): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.trim())
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function roundCoord(value: number, digits = 4): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export function roundBBox(bbox: GeoBBox, digits = 4): GeoBBox {
  return {
    swLat: roundCoord(bbox.swLat, digits),
    swLng: roundCoord(bbox.swLng, digits),
    neLat: roundCoord(bbox.neLat, digits),
    neLng: roundCoord(bbox.neLng, digits),
  }
}

export function isValidBBox(bbox: GeoBBox | null | undefined): bbox is GeoBBox {
  if (!bbox) return false
  const { swLat, swLng, neLat, neLng } = bbox
  if (![swLat, swLng, neLat, neLng].every((n) => Number.isFinite(n))) {
    return false
  }
  if (swLat < -90 || neLat > 90 || swLat >= neLat) return false
  if (swLng < -180 || neLng > 180 || swLng === neLng) return false
  return true
}

export function bboxEquals(
  left: GeoBBox | null | undefined,
  right: GeoBBox | null | undefined,
  digits = 4,
): boolean {
  if (!left && !right) return true
  if (!left || !right) return false
  const a = roundBBox(left, digits)
  const b = roundBBox(right, digits)
  return (
    a.swLat === b.swLat &&
    a.swLng === b.swLng &&
    a.neLat === b.neLat &&
    a.neLng === b.neLng
  )
}

export function pointInBBox(
  lat: number,
  lng: number,
  bbox: GeoBBox,
): boolean {
  if (lat < bbox.swLat || lat > bbox.neLat) return false
  if (bbox.swLng <= bbox.neLng) {
    return lng >= bbox.swLng && lng <= bbox.neLng
  }
  return lng >= bbox.swLng || lng <= bbox.neLng
}

export function bboxFromCorners(input: {
  south: number
  west: number
  north: number
  east: number
}): GeoBBox | null {
  const bbox: GeoBBox = {
    swLat: input.south,
    swLng: input.west,
    neLat: input.north,
    neLng: input.east,
  }
  return isValidBBox(bbox) ? roundBBox(bbox) : null
}

export const PROPOSED_ADMIN_TASK_FILTER_KEYS = [
  'bbox',
  'category',
  'posterSearch',
  'posterId',
  'budgetMin',
  'budgetMax',
  'budgetType',
  'createdAfter',
  'createdBefore',
] as const

export type ProposedAdminTaskFilterKey =
  (typeof PROPOSED_ADMIN_TASK_FILTER_KEYS)[number]

export function proposedFilterKeyFromError(
  message: string,
): ProposedAdminTaskFilterKey | null {
  const lower = message.toLowerCase()
  for (const key of PROPOSED_ADMIN_TASK_FILTER_KEYS) {
    if (lower.includes(key.toLowerCase())) return key
  }
  return null
}

export function presentProposedFilterKeys(
  filter: Record<string, unknown> | null | undefined,
): ProposedAdminTaskFilterKey[] {
  if (!filter) return []
  return PROPOSED_ADMIN_TASK_FILTER_KEYS.filter(
    (key) => filter[key] != null && filter[key] !== '',
  )
}

export function nextDeniedFilterKeys(
  presentKeys: Iterable<string>,
  errorMessage: string,
  alreadyDenied: Iterable<string> = [],
): string[] {
  const denied = new Set(alreadyDenied)
  const named = proposedFilterKeyFromError(errorMessage)
  if (named) {
    denied.add(named)
    return [...denied]
  }
  for (const key of presentKeys) denied.add(key)
  return [...denied]
}

export function omitFilterKeys<T extends Record<string, unknown>>(
  filter: T,
  keys: Iterable<string>,
): T {
  const deny = new Set(keys)
  const next = { ...filter }
  for (const key of deny) {
    delete next[key]
  }
  return next
}
