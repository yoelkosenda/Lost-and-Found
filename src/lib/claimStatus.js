// Label teks dan varian badge untuk status klaim. Status selalu tampil sebagai teks, bukan hanya warna.
const CLAIM_STATUS = {
  pending: {
    label: 'Menunggu Verifikasi',
    badge: 'pending',
    note: 'Penemu barang sedang memeriksa bukti kepemilikan Anda.',
  },
  approved: {
    label: 'Tahap Serah Terima',
    badge: 'claim',
    note: 'Bukti cocok! Sepakati waktu & lokasi serah terima di kampus lewat ruang klaim.',
  },
  completed: {
    label: 'Sudah Dikembalikan',
    badge: 'found',
    note: 'Serah terima selesai. Barang telah dikembalikan kepada pemilik sah.',
  },
  rejected: {
    label: 'Klaim Ditolak',
    badge: 'closed',
    note: 'Bukti belum cocok dengan barang ini.',
  },
}
CLAIM_STATUS.accepted = CLAIM_STATUS.approved

export const claimStatus = (status) =>
  CLAIM_STATUS[status] ?? { label: status, badge: 'pending', note: '' }

// Laporan dengan status ini sudah selesai dan tidak menerima klaim baru.
export const CLOSED_REPORT_STATUSES = [
  'Sudah ditemukan',
  'Sudah dikembalikan',
  'Dibatalkan / Ditutup',
]
