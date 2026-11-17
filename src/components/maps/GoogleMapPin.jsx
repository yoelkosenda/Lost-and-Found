import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CAMPUS_CENTER } from '../../lib/campusLocations.js'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1f1f1f' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#98989a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2b2b2b' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#b3b3b5' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1e281d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#14191f' }] },
]

let mapsLoaderPromise = null
function loadGoogleMapsScript(apiKey) {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'))
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (!mapsLoaderPromise) {
    mapsLoaderPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.google?.maps) resolve(window.google.maps)
        else reject(new Error('Google Maps gagal dimuat.'))
      }
      script.onerror = () => reject(new Error('Gagal memuat Google Maps API.'))
      document.head.appendChild(script)
    })
  }
  return mapsLoaderPromise
}

function createPinIcon(type) {
  const color = type === 'Lost' ? '#ffc470' : '#9eff00'
  return L.divIcon({
    className: 'sq-leaflet-pin',
    html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #1a1a1a;box-shadow:0 0 0 2px ${color}66;"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

/**
 * Menampilkan peta lokasi kampus UNKLAB.
 * - Menggunakan Google Maps JavaScript API jika VITE_GOOGLE_MAPS_API_KEY tersedia.
 * - Menggunakan peta interaktif Leaflet (dark theme) jika interactive=true atau markers disediakan tanpa API key,
 *   sehingga pengguna tetap bisa klik peta secara manual.
 * - Menggunakan Google Maps Embed untuk tampilan statis satu titik tanpa API key.
 */
export default function GoogleMapPin({
  lat = CAMPUS_CENTER.lat,
  lng = CAMPUS_CENTER.lng,
  title = 'Lokasi Kampus UNKLAB',
  subtitle = '',
  type = 'Found',
  zoom = 17,
  height = 280,
  interactive = false,
  onSelect,
  markers = null,
  onMarkerClick,
}) {
  const containerRef = useRef(null)
  const gMapRef = useRef(null)
  const gMarkerRefs = useRef([])
  const leafletMapRef = useRef(null)
  const leafletLayerRef = useRef(null)
  const onSelectRef = useRef(onSelect)
  const onMarkerClickRef = useRef(onMarkerClick)
  onSelectRef.current = onSelect
  onMarkerClickRef.current = onMarkerClick

  const [sdkError, setSdkError] = useState(false)
  const hasApiKey = Boolean(GOOGLE_MAPS_API_KEY.trim())
  const useGoogleSdk = hasApiKey && !sdkError
  const useLeafletInteractive = !useGoogleSdk && (interactive || (Array.isArray(markers) && markers.length > 0))

  // Mode 1: Google Maps JavaScript API
  useEffect(() => {
    if (!useGoogleSdk || !containerRef.current) return
    let cancelled = false

    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY)
      .then((maps) => {
        if (cancelled || !containerRef.current) return

        const center = { lat: Number(lat), lng: Number(lng) }
        if (!gMapRef.current) {
          gMapRef.current = new maps.Map(containerRef.current, {
            center,
            zoom,
            styles: DARK_MAP_STYLES,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          })
        } else {
          gMapRef.current.setCenter(center)
          gMapRef.current.setZoom(zoom)
        }

        for (const m of gMarkerRefs.current) m.setMap(null)
        gMarkerRefs.current = []

        const infoWindow = new maps.InfoWindow()
        const list =
          Array.isArray(markers) && markers.length > 0
            ? markers
            : [{ id: 'pin', lat: center.lat, lng: center.lng, title, subtitle, type }]

        for (const item of list) {
          const markerColor = item.type === 'Lost' ? '#ffc470' : '#9eff00'
          const marker = new maps.Marker({
            position: { lat: Number(item.lat), lng: Number(item.lng) },
            map: gMapRef.current,
            title: item.title,
            draggable: interactive,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: markerColor,
              fillOpacity: 1,
              strokeColor: '#1a1a1a',
              strokeWeight: 2,
            },
          })

          marker.addListener('click', () => {
            if (onMarkerClickRef.current && item.id !== 'pin') {
              onMarkerClickRef.current(item)
              return
            }
            const safeTitle = String(item.title || '').replace(/</g, '&lt;')
            const safeSub = String(item.subtitle || '').replace(/</g, '&lt;')
            infoWindow.setContent(
              `<div style="color:#1a1a1a;font-family:Barlow,sans-serif;padding:2px 4px;">
                <strong>${safeTitle}</strong>${safeSub ? `<div style="font-size:12px;margin-top:2px;">${safeSub}</div>` : ''}
              </div>`,
            )
            infoWindow.open(gMapRef.current, marker)
          })

          if (interactive) {
            marker.addListener('dragend', (ev) => {
              onSelectRef.current?.({
                lat: Number(ev.latLng.lat().toFixed(6)),
                lng: Number(ev.latLng.lng().toFixed(6)),
              })
            })
          }

          gMarkerRefs.current.push(marker)
        }

        if (interactive) {
          maps.event.clearListeners(gMapRef.current, 'click')
          gMapRef.current.addListener('click', (ev) => {
            onSelectRef.current?.({
              lat: Number(ev.latLng.lat().toFixed(6)),
              lng: Number(ev.latLng.lng().toFixed(6)),
            })
          })
        }
      })
      .catch(() => {
        if (!cancelled) setSdkError(true)
      })

    return () => {
      cancelled = true
    }
  }, [useGoogleSdk, lat, lng, title, subtitle, type, zoom, interactive, markers])

  // Mode 2: Interactive Leaflet Map (ketika API key Google Maps belum disetel)
  useEffect(() => {
    if (!useLeafletInteractive || !containerRef.current) return

    if (!leafletMapRef.current) {
      const map = L.map(containerRef.current, {
        center: [Number(lat), Number(lng)],
        zoom,
        zoomControl: true,
        attributionControl: false,
      })

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      const layerGroup = L.layerGroup().addTo(map)
      if (interactive) {
        map.on('click', (ev) => {
          onSelectRef.current?.({
            lat: Number(ev.latlng.lat.toFixed(6)),
            lng: Number(ev.latlng.lng.toFixed(6)),
          })
        })
      }

      leafletMapRef.current = map
      leafletLayerRef.current = layerGroup
    } else {
      leafletMapRef.current.setView([Number(lat), Number(lng)], zoom, { animate: true })
    }

    const layerGroup = leafletLayerRef.current
    layerGroup.clearLayers()

    const list =
      Array.isArray(markers) && markers.length > 0
        ? markers
        : [{ id: 'pin', lat: Number(lat), lng: Number(lng), title, subtitle, type }]

    for (const item of list) {
      const marker = L.marker([Number(item.lat), Number(item.lng)], {
        icon: createPinIcon(item.type),
        draggable: interactive,
      }).addTo(layerGroup)

      if (item.title && !interactive) {
        marker.bindTooltip(`${item.title}${item.subtitle ? ` · ${item.subtitle}` : ''}`, {
          direction: 'top',
        })
      }

      marker.on('click', () => {
        if (onMarkerClickRef.current && item.id !== 'pin') {
          onMarkerClickRef.current(item)
        }
      })

      if (interactive) {
        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          onSelectRef.current?.({
            lat: Number(pos.lat.toFixed(6)),
            lng: Number(pos.lng.toFixed(6)),
          })
        })
      }
    }
  }, [useLeafletInteractive, lat, lng, title, subtitle, type, zoom, interactive, markers])

  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
        leafletLayerRef.current = null
      }
    }
  }, [])

  const formattedCoords = `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
  const mapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=${zoom}&output=embed`

  return (
    <div className="sq-map-card">
      <div className="sq-map-frame" style={{ height: `${height}px` }}>
        {useGoogleSdk || useLeafletInteractive ? (
          <div ref={containerRef} className="sq-map-canvas" aria-label={`Peta lokasi ${title}`} />
        ) : (
          <iframe
            title={`Peta ${title}`}
            src={embedUrl}
            className="sq-map-iframe"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>
      <div className="sq-map-footer">
        <span className="sq-map-coords">
          Koordinat: <code>{formattedCoords}</code>
          {interactive ? ' · Klik peta atau geser pin untuk menandai lokasi' : ''}
        </span>
        <a
          href={mapsExternalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sq-map-ext-link"
        >
          Buka di Google Maps ↗
        </a>
      </div>
    </div>
  )
}
