export type GeoPoint = {
  lat: number
  lng: number
}

export type GeoBBox = {
  swLat: number
  swLng: number
  neLat: number
  neLng: number
}

const BBOX_DIGITS = 5

function roundCoord(value: number, digits = BBOX_DIGITS): number {
  return Number(value.toFixed(digits))
}

export function roundBBox(bbox: GeoBBox, digits = BBOX_DIGITS): GeoBBox {
  return {
    swLat: roundCoord(bbox.swLat, digits),
    swLng: roundCoord(bbox.swLng, digits),
    neLat: roundCoord(bbox.neLat, digits),
    neLng: roundCoord(bbox.neLng, digits),
  }
}

export function isValidBBox(bbox: GeoBBox): boolean {
  return (
    Number.isFinite(bbox.swLat) &&
    Number.isFinite(bbox.swLng) &&
    Number.isFinite(bbox.neLat) &&
    Number.isFinite(bbox.neLng) &&
    bbox.swLat >= -90 &&
    bbox.neLat <= 90 &&
    bbox.swLat < bbox.neLat &&
    Math.abs(bbox.neLng - bbox.swLng) > 0
  )
}

export function parseBBoxParam(
  value: string | null | undefined,
): GeoBBox | null {
  const raw = value?.trim() ?? ''
  if (!raw) return null
  const parts = raw.split(',').map((part) => Number(part.trim()))
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return null
  }
  const bbox = {
    swLat: parts[0] as number,
    swLng: parts[1] as number,
    neLat: parts[2] as number,
    neLng: parts[3] as number,
  }
  return isValidBBox(bbox) ? roundBBox(bbox) : null
}

export function bboxToParam(bbox: GeoBBox): string {
  const rounded = roundBBox(bbox)
  return `${rounded.swLat},${rounded.swLng},${rounded.neLat},${rounded.neLng}`
}

export function bboxesEqual(
  left: GeoBBox | null | undefined,
  right: GeoBBox | null | undefined,
): boolean {
  if (!left && !right) return true
  if (!left || !right) return false
  return bboxToParam(left) === bboxToParam(right)
}

export function pointInBBox(point: GeoPoint, bbox: GeoBBox): boolean {
  const west = Math.min(bbox.swLng, bbox.neLng)
  const east = Math.max(bbox.swLng, bbox.neLng)
  return (
    point.lat >= bbox.swLat &&
    point.lat <= bbox.neLat &&
    point.lng >= west &&
    point.lng <= east
  )
}

/** Skip missing/zero-zero placeholders that are not real marketplace pins. */
export function taskCoordinates(
  location:
    | { lat?: number | null; lng?: number | null }
    | null
    | undefined,
): GeoPoint | null {
  const lat = location?.lat
  const lng = location?.lng
  if (lat == null || lng == null) return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat === 0 && lng === 0) return null
  return { lat, lng }
}

export const UK_MAP_CENTER: GeoPoint = { lat: 54.2, lng: -2.5 }
export const UK_MAP_ZOOM = 5.2
