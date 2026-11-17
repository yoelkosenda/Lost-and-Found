export const CAMPUS_CENTER = { lat: 1.4175, lng: 124.9840 }

export const CAMPUS_LOCATIONS = {
  GK1: { lat: 1.4178, lng: 124.9838, label: 'Gedung Kuliah 1 (GK1)' },
  GK2: { lat: 1.4182, lng: 124.9844, label: 'Gedung Kuliah 2 (GK2)' },
  GK3: { lat: 1.4186, lng: 124.9849, label: 'Gedung Kuliah 3 (GK3)' },
  Perpustakaan: { lat: 1.4173, lng: 124.9835, label: 'Perpustakaan UNKLAB' },
  'Student Center': { lat: 1.4170, lng: 124.9841, label: 'Student Center' },
  Cafeteria: { lat: 1.4167, lng: 124.9846, label: 'Cafeteria UNKLAB' },
  'Pioneer Chapel': { lat: 1.4176, lng: 124.9847, label: 'Pioneer Chapel' },
  'Auditorium UNKLAB': { lat: 1.4171, lng: 124.9831, label: 'Auditorium UNKLAB' },
  'Gedung Rektorat': { lat: 1.4174, lng: 124.9827, label: 'Gedung Rektorat / Administrasi' },
  'Lab Komputer FIK': { lat: 1.4184, lng: 124.9841, label: 'Lab Komputer (FIK)' },
  'Klinik UNKLAB': { lat: 1.4165, lng: 124.9834, label: 'Klinik Kesehatan UNKLAB' },
  'Lapangan Olahraga': { lat: 1.4189, lng: 124.9837, label: 'Lapangan Olahraga UNKLAB' },
  'Parkiran Fakultas': { lat: 1.4180, lng: 124.9832, label: 'Parkiran Fakultas' },
  'Gerbang Utama UNKLAB': { lat: 1.4172, lng: 124.9821, label: 'Gerbang Utama & Pos Keamanan' },
  'Asrama Putra': { lat: 1.4161, lng: 124.9853, label: 'Area Asrama Putra' },
  'Asrama Putri': { lat: 1.4164, lng: 124.9859, label: 'Area Asrama Putri' },
  'Bookstore / Koperasi': { lat: 1.4169, lng: 124.9844, label: 'Bookstore & Koperasi UNKLAB' },
  'Taman Kampus': { lat: 1.4175, lng: 124.9840, label: 'Taman / Area Terbuka Kampus' },
}

export const CAMPUS_LOCATION_NAMES = Object.keys(CAMPUS_LOCATIONS)

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

export function findNearestCampusLocation(lat, lng) {
  let nearestName = CAMPUS_LOCATION_NAMES[0]
  let minDistance = Infinity
  for (const [name, coords] of Object.entries(CAMPUS_LOCATIONS)) {
    const dLat = coords.lat - lat
    const dLng = coords.lng - lng
    const dist = dLat * dLat + dLng * dLng
    if (dist < minDistance) {
      minDistance = dist
      nearestName = name
    }
  }
  return nearestName
}
