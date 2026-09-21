'use client'

import mapboxgl from 'mapbox-gl'
import { useEffect, useLayoutEffect, useRef } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'

import { mapboxAccessToken, mapboxStyleUrl } from '@/lib/env'
import {
  UK_MAP_CENTER,
  UK_MAP_ZOOM,
  type GeoBBox,
  type GeoPoint,
} from '@/lib/geo'

export type TaskMapPin = {
  id: string
  title: string
  status: string
  lat: number
  lng: number
}

type Props = {
  pins: TaskMapPin[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onOpen: (id: string) => void
  initialBbox: GeoBBox | null
  onBboxChange: (bbox: GeoBBox) => void
  areaBrowseEnabled: boolean
}

function boundsToBBox(bounds: mapboxgl.LngLatBounds): GeoBBox {
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()
  return {
    swLat: sw.lat,
    swLng: sw.lng,
    neLat: ne.lat,
    neLng: ne.lng,
  }
}

function bboxToBounds(bbox: GeoBBox): [GeoPoint, GeoPoint] {
  return [
    { lat: bbox.swLat, lng: bbox.swLng },
    { lat: bbox.neLat, lng: bbox.neLng },
  ]
}

export function TasksMap({
  pins,
  selectedId,
  onSelect,
  onOpen,
  initialBbox,
  onBboxChange,
  areaBrowseEnabled,
}: Props) {
  const token = mapboxAccessToken()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const ignoreMoveRef = useRef(2)
  const onBboxChangeRef = useRef(onBboxChange)
  const onSelectRef = useRef(onSelect)
  const onOpenRef = useRef(onOpen)
  const areaBrowseRef = useRef(areaBrowseEnabled)
  const didFitRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialBboxRef = useRef(initialBbox)

  useLayoutEffect(() => {
    onBboxChangeRef.current = onBboxChange
    onSelectRef.current = onSelect
    onOpenRef.current = onOpen
    areaBrowseRef.current = areaBrowseEnabled
  }, [onBboxChange, onSelect, onOpen, areaBrowseEnabled])

  useEffect(() => {
    const node = containerRef.current
    if (!node || !token) return

    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: node,
      style: mapboxStyleUrl(),
      center: [UK_MAP_CENTER.lng, UK_MAP_CENTER.lat],
      zoom: UK_MAP_ZOOM,
      attributionControl: true,
    })
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'top-right',
    )
    mapRef.current = map

    const startBbox = initialBboxRef.current
    if (startBbox) {
      ignoreMoveRef.current += 2
      didFitRef.current = true
      const [sw, ne] = bboxToBounds(startBbox)
      map.fitBounds(
        [
          [sw.lng, sw.lat],
          [ne.lng, ne.lat],
        ],
        { padding: 24, duration: 0 },
      )
    }

    const emitBBox = () => {
      if (ignoreMoveRef.current > 0) {
        ignoreMoveRef.current -= 1
        return
      }
      if (!areaBrowseRef.current) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const bounds = map.getBounds()
        if (!bounds) return
        onBboxChangeRef.current(boundsToBBox(bounds))
      }, 400)
    }

    map.on('moveend', emitBBox)
    const markers = markersRef.current

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      for (const marker of markers.values()) marker.remove()
      markers.clear()
      map.remove()
      mapRef.current = null
    }
  }, [token])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const nextIds = new Set(pins.map((pin) => pin.id))
    for (const [id, marker] of markersRef.current) {
      if (!nextIds.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
      }
    }

    for (const pin of pins) {
      const existing = markersRef.current.get(pin.id)
      if (existing) {
        existing.setLngLat([pin.lng, pin.lat])
        continue
      }
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'map-pin'
      el.setAttribute('aria-label', pin.title)
      el.innerHTML =
        '<span class="map-pin-dot" aria-hidden="true"></span><span class="map-pin-label"></span>'
      const label = el.querySelector('.map-pin-label')
      if (label) label.textContent = pin.title
      el.addEventListener('click', (event) => {
        event.stopPropagation()
        onSelectRef.current(pin.id)
      })
      el.addEventListener('dblclick', (event) => {
        event.stopPropagation()
        event.preventDefault()
        onOpenRef.current(pin.id)
      })
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([pin.lng, pin.lat])
        .addTo(map)
      markersRef.current.set(pin.id, marker)
    }

    for (const [id, marker] of markersRef.current) {
      marker.getElement().classList.toggle('is-selected', id === selectedId)
    }

    if (!didFitRef.current && pins.length > 0) {
      didFitRef.current = true
      ignoreMoveRef.current += 2
      if (pins.length === 1) {
        const pin = pins[0]!
        map.jumpTo({ center: [pin.lng, pin.lat], zoom: 11 })
      } else {
        const bounds = new mapboxgl.LngLatBounds()
        for (const pin of pins) bounds.extend([pin.lng, pin.lat])
        map.fitBounds(bounds, { padding: 48, maxZoom: 12, duration: 0 })
      }
    }
  }, [pins, selectedId])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const pin = pins.find((row) => row.id === selectedId)
    if (!pin) return
    const bounds = map.getBounds()
    if (bounds?.contains([pin.lng, pin.lat])) return
    ignoreMoveRef.current += 2
    map.easeTo({
      center: [pin.lng, pin.lat],
      zoom: Math.max(map.getZoom(), 11),
    })
  }, [selectedId, pins])

  if (!token) {
    return (
      <div className="tasks-map tasks-map-placeholder" role="status">
        <p>
          Set <code>NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to show task pins
          (same Mapbox token as public Slashie).
        </p>
      </div>
    )
  }

  const selected = pins.find((pin) => pin.id === selectedId) ?? null
  const unlocatedNote =
    pins.length === 0
      ? 'No coordinates on this page of tasks.'
      : `${pins.length} pin${pins.length === 1 ? '' : 's'} on the map.`

  return (
    <div className="tasks-map-shell">
      <div
        ref={containerRef}
        className="tasks-map"
        role="application"
        aria-label="Tasks map"
      />
      <div className="tasks-map-meta">
        <p className="meta">{unlocatedNote}</p>
        {selected ? (
          <div className="tasks-map-selected">
            <strong>{selected.title}</strong>
            <span className="pill">{selected.status}</span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onOpen(selected.id)}
            >
              Open task
            </button>
          </div>
        ) : (
          <p className="meta">
            Select a pin to highlight the row. Double-click or Open for the
            dossier.
          </p>
        )}
      </div>
    </div>
  )
}
