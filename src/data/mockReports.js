export const reportStats = [
  { label: 'Total laporan', value: '128', change: '+12%', tone: 'blue' },
  { label: 'Barang hilang', value: '74', change: 'Aktif', tone: 'peach' },
  { label: 'Barang ditemukan', value: '54', change: 'Aktif', tone: 'mint' },
]

export const recentReports = [
  {
    id: 1,
    type: 'Lost',
    title: 'Dompet kulit hitam',
    category: 'Aksesoris',
    location: 'Perpustakaan UNKLAB',
    date: 'Hari ini, 09:40',
    status: 'Masih Dicari',
    color: 'navy',
    icon: '▣',
  },
  {
    id: 2,
    type: 'Found',
    title: 'Kunci motor dengan gantungan',
    category: 'Kunci',
    location: 'Student Center',
    date: 'Kemarin, 16:20',
    status: 'Menunggu Pemilik',
    color: 'yellow',
    icon: '⌁',
  },
  {
    id: 3,
    type: 'Lost',
    title: 'Kartu mahasiswa UNKLAB',
    category: 'Identitas',
    location: 'Gedung A',
    date: '12 Nov 2026, 13:05',
    status: 'Dalam Verifikasi',
    color: 'lavender',
    icon: '▤',
  },
  {
    id: 4,
    type: 'Found',
    title: 'Tumbler warna hijau',
    category: 'Lainnya',
    location: 'Lapangan olahraga',
    date: '11 Nov 2026, 10:15',
    status: 'Sudah Dikembalikan',
    color: 'sage',
    icon: '◒',
  },
]

export const activity = [
  { title: 'Laporan baru ditambahkan', detail: 'Dompet kulit hitam', time: '09:40', icon: '+' },
  { title: 'Status laporan diperbarui', detail: 'Tumbler warna hijau', time: 'Kemarin', icon: '↻' },
  { title: 'Klaim sedang diverifikasi', detail: 'Kartu mahasiswa UNKLAB', time: '12 Nov', icon: '✓' },
]
