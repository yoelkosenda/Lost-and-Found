// Pusat kampus mengikuti titik "Universitas Klabat Airmadidi" pada OpenStreetMap.
export const CAMPUS_CENTER = { lat: 1.41752, lng: 124.98394 }
export const CAMPUS_MAX_RADIUS_METERS = 600

/**
 * Daftar lokasi di lingkungan Kampus Universitas Klabat (UNKLAB) Airmadidi.
 * Koordinat diselaraskan langsung dengan titik bangunan dan label pada peta OpenStreetMap / Google Maps.
 */
export const CAMPUS_LOCATIONS = {
  'Gedung Rektorat': {
    lat: 1.41752,
    lng: 124.98394,
    label: 'Universitas Klabat / Gedung Rektorat & Administrasi',
  },
  'Pioneer Chapel': {
    lat: 1.41878,
    lng: 124.98385,
    label: 'Pioneer Chapel',
  },
  GK1: {
    lat: 1.41814,
    lng: 124.98458,
    label: 'Gedung Kuliah 1 (GK1)',
  },
  GK2: {
    lat: 1.41857,
    lng: 124.98455,
    label: 'Gedung Kuliah 2 (GK2)',
  },
  GK3: {
    lat: 1.419,
    lng: 124.98451,
    label: 'Gedung Kuliah 3 (GK3)',
  },
  'Yayasan UNKLAB': {
    lat: 1.41626,
    lng: 124.98402,
    label: 'Yayasan UNKLAB',
  },
  Perpustakaan: {
    lat: 1.41758,
    lng: 124.98332,
    label: 'Perpustakaan UNKLAB',
  },
  'Student Center': {
    lat: 1.41702,
    lng: 124.98395,
    label: 'Student Center',
  },
  Cafeteria: {
    lat: 1.41678,
    lng: 124.98468,
    label: 'Cafeteria UNKLAB',
  },
  'Auditorium UNKLAB': {
    lat: 1.41825,
    lng: 124.98335,
    label: 'Auditorium UNKLAB',
  },
  'Lab Komputer FIK': {
    lat: 1.41838,
    lng: 124.98492,
    label: 'Lab Komputer (FIK)',
  },
  'Taman Kampus': {
    lat: 1.41785,
    lng: 124.9839,
    label: 'Taman / Plaza Tengah Kampus',
  },
  'Bookstore / Koperasi': {
    lat: 1.41718,
    lng: 124.98465,
    label: 'Bookstore & Koperasi UNKLAB',
  },
  'Parkiran Fakultas': {
    lat: 1.41775,
    lng: 124.98485,
    label: 'Parkiran Fakultas',
  },
  'Gerbang Utama UNKLAB': {
    lat: 1.41715,
    lng: 124.9852,
    label: 'Gerbang Utama & Pos Keamanan',
  },
  'Klinik UNKLAB': {
    lat: 1.41645,
    lng: 124.98495,
    label: 'Klinik Kesehatan UNKLAB',
  },
  'Asrama Putra': {
    lat: 1.41675,
    lng: 124.98315,
    label: 'Area Asrama Putra',
  },
  'Asrama Putri': {
    lat: 1.41835,
    lng: 124.98255,
    label: 'Area Asrama Putri',
  },
  'SD Advent UNKLAB': {
    lat: 1.41587,
    lng: 124.98369,
    label: 'SD Advent Universitas Klabat',
  },
  'SMP Advent UNKLAB': {
    lat: 1.41495,
    lng: 124.98346,
    label: 'SMP Advent Universitas Klabat',
  },
  'Lapangan Olahraga': {
    lat: 1.41476,
    lng: 124.98238,
    label: 'Lapangan Olahraga / Sepak Bola UNKLAB',
  },
  'Lapangan Tenis': {
    lat: 1.41451,
    lng: 124.98282,
    label: 'Lapangan Tenis UNKLAB',
  },
}

export const CAMPUS_LOCATION_NAMES = Object.keys(CAMPUS_LOCATIONS)

export function getLocationLabel(location) {
  return CAMPUS_LOCATIONS[location]?.label || location || ''
}

export function getCoordinatesForLocation(location) {
  return CAMPUS_LOCATIONS[location] || CAMPUS_CENTER
}

export function getCoordinatesForReport(report) {
  if (
    report &&
    typeof report.latitude === 'number' &&
    typeof report.longitude === 'number' &&
    !Number.isNaN(report.latitude) &&
    !Number.isNaN(report.longitude)
  ) {
    return { lat: report.latitude, lng: report.longitude }
  }
  return getCoordinatesForLocation(report?.location)
}

/** Jarak haversine dalam meter antara dua titik koordinat. */
export function distanceMeters(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => typeof v !== 'number' || Number.isNaN(v))) {
    return Infinity
  }
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371000 * 2 * Math.asin(Math.sqrt(a))
}

export function distanceFromCampusCenter(lat, lng) {
  return distanceMeters(CAMPUS_CENTER.lat, CAMPUS_CENTER.lng, lat, lng)
}

export function isWithinCampusBounds(lat, lng) {
  return distanceFromCampusCenter(lat, lng) <= CAMPUS_MAX_RADIUS_METERS
}

/**
 * Mencari nama lokasi kampus terdekat dari koordinat yang diklik di peta.
 * Menggunakan jarak Haversine sebenarnya (meter) agar akurat.
 */
export function findNearestCampusLocation(lat, lng) {
  let nearestName = CAMPUS_LOCATION_NAMES[0]
  let minDistance = Infinity
  for (const [name, coords] of Object.entries(CAMPUS_LOCATIONS)) {
    const dist = distanceMeters(lat, lng, coords.lat, coords.lng)
    if (dist < minDistance) {
      minDistance = dist
      nearestName = name
    }
  }
  return nearestName
}
