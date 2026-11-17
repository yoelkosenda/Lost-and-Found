import { useEffect, useRef, useState } from 'react'
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

/**
 * Menampilkan peta Google Maps untuk satu titik lokasi atau daftar marker laporan.
 * Menggunakan Google Maps JavaScript API jika VITE_GOOGLE_MAPS_API_KEY tersedia,
 * dan otomatis fallback ke Google Maps Embed jika API key belum dikonfigurasi.
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
  const mapRef = useRef(null)
  const markerRefs = useRef([])
  const [sdkError, setSdkError] = useState(false)
  const hasApiKey = Boolean(GOOGLE_MAPS_API_KEY.trim())

  useEffect(() => {
    if (!hasApiKey || sdkError || !containerRef.current) return
    let cancelled = false

    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY)
      .then((maps) => {
        if (cancelled || !containerRef.current) return

        const center = { lat: Number(lat), lng: Number(lng) }
        if (!mapRef.current) {
          mapRef.current = new maps.Map(containerRef.current, {
            center,
            zoom,
            styles: DARK_MAP_STYLES,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          })
        } else {
          mapRef.current.setCenter(center)
          mapRef.current.setZoom(zoom)
        }

        // Clear previous markers
        for (const m of markerRefs.current) m.setMap(null)
        markerRefs.current = []

        const infoWindow = new maps.InfoWindow()
        const list =
          Array.isArray(markers) && markers.length > 0
            ? markers
            : [{ id: 'pin', lat: center.lat, lng: center.lng, title, subtitle, type }]

        for (const item of list) {
          const markerColor = item.type === 'Lost' ? '#ffc470' : '#9eff00'
          const marker = new maps.Marker({
            position: { lat: Number(item.lat), lng: Number(item.lng) },
            map: mapRef.current,
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
            if (onMarkerClick && item.id !== 'pin') {
              onMarkerClick(item)
              return
            }
            const safeTitle = String(item.title || '').replace(/</g, '&lt;')
            const safeSub = String(item.subtitle || '').replace(/</g, '&lt;')
            infoWindow.setContent(
              `<div style="color:#1a1a1a;font-family:Barlow,sans-serif;padding:2px 4px;">
                <strong>${safeTitle}</strong>${safeSub ? `<div style="font-size:12px;margin-top:2px;">${safeSub}</div>` : ''}
              </div>`,
            )
            infoWindow.open(mapRef.current, marker)
          })

          if (interactive && onSelect) {
            marker.addListener('dragend', (ev) => {
              onSelect({
                lat: Number(ev.latLng.lat().toFixed(6)),
                lng: Number(ev.latLng.lng().toFixed(6)),
              })
            })
          }

          markerRefs.current.push(marker)
        }

        if (interactive && onSelect) {
          maps.event.clearListeners(mapRef.current, 'click')
          mapRef.current.addListener('click', (ev) => {
            onSelect({
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
  }, [hasApiKey, sdkError, lat, lng, title, subtitle, type, zoom, interactive, onSelect, markers, onMarkerClick])

  const formattedCoords = `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
  const mapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=${zoom}&output=embed`

  return (
    <div className="sq-map-card">
      <div className="sq-map-frame" style={{ height: `${height}px` }}>
        {hasApiKey && !sdkError ? (
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
          {interactive && hasApiKey && !sdkError ? ' · Klik peta atau geser pin untuk menyesuaikan titik' : ''}
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
