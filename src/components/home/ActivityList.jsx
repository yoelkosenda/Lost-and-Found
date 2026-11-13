export default function ActivityList({ items }) {
  return <div className="activity-list">{items.map((item) => <div className="activity-item" key={item.title}><span className="activity-icon">{item.icon}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div><time>{item.time}</time></div>)}</div>
}
