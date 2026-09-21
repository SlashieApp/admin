import { formatMoney } from '@/lib/dossier'
import { parseCoord } from '@/lib/geo'

export type TaskMapPinSource = {
  id: string
  title: string
  status?: string | null
  hidden?: boolean | null
  budget?: {
    amount?: number | null
    currency?: string | null
  } | null
  location?: {
    lat?: number | null
    lng?: number | null
    name?: string | null
    address?: string | null
  } | null
}

export type TaskMapPin = {
  id: string
  title: string
  status: string
  hidden: boolean
  lat: number
  lng: number
  priceLabel: string
  locationLabel: string
}

export function pinsFromTasks(rows: TaskMapPinSource[]): TaskMapPin[] {
  const pins: TaskMapPin[] = []
  for (const row of rows) {
    const lat = parseCoord(row.location?.lat)
    const lng = parseCoord(row.location?.lng)
    if (lat == null || lng == null) continue
    pins.push({
      id: row.id,
      title: row.title,
      status: row.status || 'OPEN',
      hidden: Boolean(row.hidden),
      lat,
      lng,
      priceLabel: formatMoney(row.budget?.amount, row.budget?.currency),
      locationLabel:
        row.location?.name?.trim() || row.location?.address?.trim() || '—',
    })
  }
  return pins
}

export function pinAriaLabel(pin: TaskMapPin): string {
  return `${pin.title}, ${pin.priceLabel}, ${pin.status}. Select task.`
}
