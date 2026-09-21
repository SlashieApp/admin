'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useLayoutEffect, useRef } from 'react'
import type { Map as MapboxMap, Marker } from 'mapbox-gl'

import { mapboxAccessToken, mapboxStyleUrl } from '@/lib/env'
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  bboxFromCorners,
  type GeoBBox,
} from '@/lib/geo'
import { pinAriaLabel, type TaskMapPin } from '@/lib/taskMapPins'

const MOVE_DEBOUNCE_MS = 400

type MapboxGl = typeof import('mapbox-gl').default

export function TasksMap({
  pins,
  selectedId,
  onSelect,
  onOpen,
  onUserBBox,
  lockCamera = false,
}: {
  pins: TaskMapPin[]
  selectedId: string | null
  onSelect: (id: string) => void
  onOpen: (id: string) => void
  onUserBBox: (bbox: GeoBBox) => void
  lockCamera?: boolean
}) {
  const token = mapboxAccessToken()
  const hostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapboxMap | null>(null)
  const markersRef = useRef<Marker[]>([])
  const pinsRef = useRef(pins)
  const selectedRef = useRef(selectedId)
  const onSelectRef = useRef(onSelect)
  const onOpenRef = useRef(onOpen)
  const onUserBBoxRef = useRef(onUserBBox)
  const lockCameraRef = useRef(lockCamera)
  const ignoreMoveRef = useRef(true)
  const fittedSigRef = useRef('')

  useLayoutEffect(() => {
    lockCameraRef.current = lockCamera
    pinsRef.current = pins
    selectedRef.current = selectedId
    onSelectRef.current = onSelect
    onOpenRef.current = onOpen
    onUserBBoxRef.current = onUserBBox
  })

  useEffect(() => {
    if (!token || !hostRef.current) return
    let cancelled = false
    let map: MapboxMap | null = null
    let debounce: ReturnType<typeof setTimeout> | undefined

    async function mount() {
      const mapboxgl = (await import('mapbox-gl')).default
      if (cancelled || !hostRef.current) return
      mapboxgl.accessToken = token
      const instance = new mapboxgl.Map({
        container: hostRef.current,
        style: mapboxStyleUrl(),
        center: [DEFAULT_MAP_CENTER.lng, DEFAULT_MAP_CENTER.lat],
        zoom: DEFAULT_MAP_ZOOM,
        attributionControl: true,
      })
      instance.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: false }),
        'top-right',
      )
      map = instance
      mapRef.current = instance

      const emitBBox = () => {
        if (ignoreMoveRef.current) {
          ignoreMoveRef.current = false
          return
        }
        const bounds = instance.getBounds()
        if (!bounds) return
        const sw = bounds.getSouthWest()
        const ne = bounds.getNorthEast()
        const bbox = bboxFromCorners({
          south: sw.lat,
          west: sw.lng,
          north: ne.lat,
          east: ne.lng,
        })
        if (bbox) onUserBBoxRef.current(bbox)
      }

      instance.on('moveend', () => {
        if (debounce) clearTimeout(debounce)
        debounce = setTimeout(emitBBox, MOVE_DEBOUNCE_MS)
      })

      instance.on('load', () => {
        syncMarkers(mapboxgl, {
          mapRef,
          markersRef,
          pinsRef,
          selectedRef,
          onSelectRef,
          onOpenRef,
        })
        fitPins(instance, pinsRef.current, true, {
          fittedSigRef,
          ignoreMoveRef,
          lockCameraRef,
        })
      })
    }

    void mount()
    return () => {
      cancelled = true
      if (debounce) clearTimeout(debounce)
      clearMarkers(markersRef)
      map?.remove()
      mapRef.current = null
    }
  }, [token])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    void import('mapbox-gl').then((mod) => {
      syncMarkers(mod.default, {
        mapRef,
        markersRef,
        pinsRef,
        selectedRef,
        onSelectRef,
        onOpenRef,
      })
      if (!lockCamera) {
        fitPins(map, pins, false, {
          fittedSigRef,
          ignoreMoveRef,
          lockCameraRef,
        })
      }
    })
  }, [pins, selectedId, lockCamera])

  if (!token) {
    return (
      <div className="ops-map ops-map-empty">
        <p className="muted">
          Set <code>NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to load the ops map.
        </p>
      </div>
    )
  }

  return (
    <div className="ops-map" aria-label="Tasks map">
      <div ref={hostRef} className="ops-map-canvas" />
    </div>
  )
}

function clearMarkers(markersRef: { current: Marker[] }) {
  for (const marker of markersRef.current) marker.remove()
  markersRef.current = []
}

function syncMarkers(
  mapboxgl: MapboxGl,
  refs: {
    mapRef: { current: MapboxMap | null }
    markersRef: { current: Marker[] }
    pinsRef: { current: TaskMapPin[] }
    selectedRef: { current: string | null }
    onSelectRef: { current: (id: string) => void }
    onOpenRef: { current: (id: string) => void }
  },
) {
  const map = refs.mapRef.current
  if (!map) return
  clearMarkers(refs.markersRef)
  for (const pin of refs.pinsRef.current) {
    const el = createPinElement(pin, pin.id === refs.selectedRef.current, {
      onSelect: () => refs.onSelectRef.current(pin.id),
      onOpen: () => refs.onOpenRef.current(pin.id),
    })
    const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([pin.lng, pin.lat])
      .addTo(map)
    refs.markersRef.current.push(marker)
  }
}

function fitPins(
  map: MapboxMap,
  nextPins: TaskMapPin[],
  force: boolean,
  refs: {
    fittedSigRef: { current: string }
    ignoreMoveRef: { current: boolean }
    lockCameraRef: { current: boolean }
  },
) {
  const sig = nextPins.map((pin) => pin.id).join('|')
  if (!force && refs.fittedSigRef.current === sig) return
  if (refs.lockCameraRef.current) return
  refs.fittedSigRef.current = sig
  refs.ignoreMoveRef.current = true
  if (nextPins.length === 0) {
    map.jumpTo({
      center: [DEFAULT_MAP_CENTER.lng, DEFAULT_MAP_CENTER.lat],
      zoom: DEFAULT_MAP_ZOOM,
    })
    return
  }
  if (nextPins.length === 1) {
    map.jumpTo({ center: [nextPins[0]!.lng, nextPins[0]!.lat], zoom: 12 })
    return
  }
  const lngs = nextPins.map((pin) => pin.lng)
  const lats = nextPins.map((pin) => pin.lat)
  map.fitBounds(
    [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ],
    { padding: 48, maxZoom: 12, duration: 0 },
  )
}

function createPinElement(
  pin: TaskMapPin,
  selected: boolean,
  handlers: { onSelect: () => void; onOpen: () => void },
): HTMLDivElement {
  const root = document.createElement('div')
  root.className = selected ? 'ops-pin is-selected' : 'ops-pin'

  const card = document.createElement('div')
  card.className = 'ops-pin-card'
  const title = document.createElement('strong')
  title.textContent = pin.title
  const meta = document.createElement('span')
  meta.className = 'ops-pin-meta'
  meta.textContent = `${pin.priceLabel} · ${pin.status}`
  const open = document.createElement('button')
  open.type = 'button'
  open.className = 'ops-pin-open'
  open.textContent = 'Open dossier'
  open.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    handlers.onOpen()
  })
  card.append(title, meta, open)

  const pill = document.createElement('span')
  pill.className = 'ops-pin-pill'
  pill.textContent = pin.priceLabel

  const dot = document.createElement('button')
  dot.type = 'button'
  dot.className = 'ops-pin-dot'
  dot.setAttribute('aria-label', pinAriaLabel(pin))
  dot.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    handlers.onSelect()
  })

  root.append(card, pill, dot)
  root.addEventListener('click', (event) => {
    event.stopPropagation()
    handlers.onSelect()
  })
  return root
}
