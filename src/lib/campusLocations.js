export const CAMPUS_CENTER = { lat: 1.4175, lng: 124.9840 }

export const CAMPUS_LOCATIONS = {
  GK1: { lat: 1.4178, lng: 124.9838, label: 'Gedung Kuliah 1 (GK1)' },
  GK2: { lat: 1.4182, lng: 124.9844, label: 'Gedung Kuliah 2 (GK2)' },
  GK3: { lat: 1.4186, lng: 124.9849, label: 'Gedung Kuliah 3 (GK3)' },
  Perpustakaan: { lat: 1.4173, lng: 124.9835, label: 'Perpustakaan UNKLAB' },
  'Student Center': { lat: 1.4170, lng: 124.9841, label: 'Student Center' },
  Cafeteria: { lat: 1.4167, lng: 124.9846, label: 'Cafeteria UNKLAB' },
  'Parkiran Fakultas': { lat: 1.4180, lng: 124.9832, label: 'Parkiran Fakultas' },
  Asrama: { lat: 1.4162, lng: 124.9852, label: 'Area Asrama UNKLAB' },
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
