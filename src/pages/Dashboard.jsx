import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { StatCard, SkeletonRows, StatusBadge, Table } from "../components/UI";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const ts = Timestamp.fromDate(start);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "providers")),
      getDocs(
        query(collection(db, "providers"), where("status", "==", "pending")),
      ),
      getDocs(query(collection(db, "bookings"), where("createdAt", ">=", ts))),
      getDocs(
        query(
          collection(db, "bookings"),
          where("createdAt", ">=", Timestamp.fromDate(thirtyDaysAgo)),
        ),
      ),
      getDocs(
        query(
          collection(db, "bookings"),
          orderBy("createdAt", "desc"),
          limit(5),
        ),
      ),
    ])
      .then(([users, providers, pending, monthBook, last30Book, recentBook]) => {
      // Revenue this month
      let revenue = 0;
      monthBook.forEach((d) => {
        revenue += d.data().totalAmount ?? 0;
      });

      // Bookings per day last 30 days
      const dayMap = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dayMap[d.toISOString().slice(0, 10)] = 0;
      }
      last30Book.forEach((d) => {
        const date = d.data().createdAt?.toDate().toISOString().slice(0, 10);
        if (date && dayMap[date] !== undefined) dayMap[date]++;
      });
      const chartData = Object.entries(dayMap).map(([date, count]) => ({
        date: date.slice(5), // MM-DD
        bookings: count,
      }));

      setStats({
        users: users.size,
        providers: providers.size,
        pending: pending.size,
        bookings: monthBook.size,
        revenue,
      });
      setChart(chartData);
      setRecent(recentBook.docs.map((d) => ({ id: d.id, ...d.data() })));
    })
      .catch((err) => {
        console.error("Failed to load dashboard:", err);
        setStats({ users: 0, providers: 0, pending: 0, bookings: 0, revenue: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) =>
    `LKR ${(n ?? 0).toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 h-32 skeleton" />
          ))
        ) : (
          <>
            <StatCard
              label="Total Users"
              value={stats.users}
              accent="blue"
              sub="all time"
              icon={<IconUser />}
            />
            <StatCard
              label="Total Providers"
              value={stats.providers}
              accent="green"
              sub="all time"
              icon={<IconProv />}
            />
            <StatCard
              label="Pending Approvals"
              value={stats.pending}
              accent="amber"
              sub="action needed"
              icon={<IconAlert />}
            />
            <StatCard
              label="Revenue This Month"
              value={fmt(stats.revenue)}
              accent="purple"
              sub={`${stats.bookings} bookings`}
              icon={<IconMoney />}
            />
          </>
        )}
      </div>

      {/* Chart */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-white mb-6">
          Bookings — Last 30 Days
        </h2>
        {loading ? (
          <div className="skeleton h-52 rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={chart}
              margin={{ top: 0, right: 8, left: -28, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#161b27",
                  border: "1px solid #1e2535",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: "#36aaf5" }}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#0c8fe1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#0c8fe1" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent bookings */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-sm font-semibold text-white">Recent Bookings</h2>
        </div>
        <Table>
          <thead>
            <tr className="border-b border-surface-border">
              <th className="th">ID</th>
              <th className="th">Equipment</th>
              <th className="th">User</th>
              <th className="th">Amount</th>
              <th className="th">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {loading ? (
              <SkeletonRows cols={5} rows={5} />
            ) : (
              recent.map((b) => (
                <tr key={b.id} className="tr-hover">
                  <td className="td font-mono text-xs text-slate-500">
                    {b.bookingId?.slice(0, 8) ?? b.id.slice(0, 8)}…
                  </td>
                  <td className="td font-medium text-white">
                    {b.equipmentName}
                  </td>
                  <td className="td text-slate-400">{b.userEmail}</td>
                  <td className="td font-mono text-sm">
                    LKR {(b.totalAmount ?? 0).toLocaleString()}
                  </td>
                  <td className="td">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

function IconUser() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}
function IconProv() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"
      />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}
function IconMoney() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
