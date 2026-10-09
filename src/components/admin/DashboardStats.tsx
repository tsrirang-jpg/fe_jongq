type Props = { stats: { title: string; count: number }[] }
export default function DashboardStats({ stats }: Props) {
  return <div className="stats">{stats.map(stat => (
    <div className="stat" key={stat.title}><span>{stat.title}</span><strong>{stat.count}</strong></div>
  ))}</div>
}
