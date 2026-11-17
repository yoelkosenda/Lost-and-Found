// Label teks dan varian badge untuk status klaim. Status selalu tampil sebagai teks, bukan hanya warna.
const CLAIM_STATUS = {
  pending: { label: 'Menunggu Verifikasi', badge: 'pending', note: 'Penemu barang sedang memeriksa bukti Anda.' },
  approved: { label: 'Klaim Diterima', badge: 'found', note: 'Bukti cocok. Silakan atur pengambilan barang.' },
  rejected: { label: 'Klaim Ditolak', badge: 'closed', note: 'Bukti belum cocok dengan barang ini.' },
}
CLAIM_STATUS.accepted = CLAIM_STATUS.approved

export const claimStatus = (status) => CLAIM_STATUS[status] ?? { label: status, badge: 'pending', note: '' }

// Laporan dengan status ini sudah selesai dan tidak menerima klaim baru.
export const CLOSED_REPORT_STATUSES = ['Sudah dikembalikan', 'Dibatalkan / Ditutup']
