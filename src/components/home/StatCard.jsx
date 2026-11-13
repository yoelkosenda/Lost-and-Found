export default function StatCard({ label, value, change, tone }) {
  return <article className={`stat-card stat-${tone}`}><div className="stat-icon">{tone === 'blue' ? '↗' : tone === 'peach' ? '⌁' : '◒'}</div><div><p>{label}</p><strong>{value}</strong><span>{change}</span></div></article>
}
