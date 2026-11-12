import { useEffect, useState, useMemo } from "react";
import { db } from "../lib/firebase";
import { collection, collectionGroup, getDocs } from "firebase/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const STATUS_COLORS = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  completed: "#14b8a6",
  delivered: "#a855f7",
  cancelled: "#64748b",
};

export default function Analytics() {
  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, "bookings")),
      getDocs(collection(db, "providers")),
      getDocs(collectionGroup(db, "equipment")), // equipment lives under providers/{id}/equipment
    ])
      .then(([b, p, e]) => {
        setBookings(b.docs.map((d) => ({ id: d.id, ...d.data() })));
        setProviders(p.docs.map((d) => ({ id: d.id, ...d.data() })));
        setEquipment(e.docs.map((d) => ({ id: d.id, ...d.data() })));
      })
      .catch((err) => console.error("Failed to load analytics:", err))
      .finally(() => setLoading(false));
  }, []);

  const revenueByMonth = useMemo(() => {
    const now = new Date();
    const data = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return {
        month: MONTHS[d.getMonth()],
        year: d.getFullYear(),
        revenue: 0,
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      };
    });
    bookings.forEach((b) => {
      const ts = b.createdAt?.toDate ? b.createdAt.toDate() : null;
      if (!ts) return;
      const key = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, "0")}`;
      const slot = data.find((d) => d.key === key);
      if (slot) slot.revenue += b.totalAmount ?? 0;
    });
    return data;
  }, [bookings]);

  //bookings by status
  const byStatus = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      map[b.status] = (map[b.status] ?? 0) + 1;
    });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [bookings]);

  //top5 providers by revenue
  const topProviders = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      if (!b.providerId) return;
      map[b.providerId] = map[b.providerId] ?? {
        name: b.providerName ?? b.providerId.slice(0, 8),
        revenue: 0,
        bookings: 0,
      };
      map[b.providerId].revenue += b.totalAmount ?? 0;
      map[b.providerId].bookings += 1;
    });
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [bookings]);

  //top 5 most booked equipment
  const topEquipment = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      if (!b.equipmentId) return;
      map[b.equipmentId] = map[b.equipmentId] ?? {
        name: b.equipmentName ?? "—",
        count: 0,
      };
      map[b.equipmentId].count++;
    });
    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [bookings]);

  const totalRevenue = bookings.reduce((s, b) => s + (b.totalAmount ?? 0), 0);

  const tooltipStyle = {
    contentStyle: {
      background: "#161b27",
      border: "1px solid #1e2535",
      borderRadius: 12,
      fontSize: 12,
    },
    labelStyle: { color: "#94a3b8" },
  };

  if (loading)
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-6 h-72 skeleton" />
        ))}
      </div>
    );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: `LKR ${totalRevenue.toLocaleString("en-LK", { maximumFractionDigits: 0 })}`,
          },
          { label: "Total Bookings", value: bookings.length },
          {
            label: "Active Providers",
            value: providers.filter((p) => p.status === "approved").length,
          },
          { label: "Equipment Listed", value: equipment.length },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4">
            <div className="text-xs text-slate-500 mb-1">{label}</div>
            <div className="text-xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* //--revenue bar chart-- */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-white mb-6">
            Revenue by Month
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={revenueByMonth}
              margin={{ top: 0, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(v) => [`LKR ${v.toLocaleString()}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#0c8fe1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings donut */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-white mb-6">
            Bookings by Status
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={byStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
              >
                {byStatus.map(({ status }) => (
                  <Cell
                    key={status}
                    fill={STATUS_COLORS[status] ?? "#64748b"}
                  />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v, n) => [v, n]} />
              <Legend
                formatter={(v) => (
                  <span style={{ color: "#94a3b8", fontSize: 11 }}>{v}</span>
                )}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top providers */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-white mb-4">
            Top Providers by Revenue
          </h2>
          <div className="space-y-3">
            {topProviders.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-600 w-4 shrink-0">
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">
                    {p.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {p.bookings} booking(s)
                  </div>
                </div>
                <span className="text-sm font-mono text-brand-400 shrink-0">
                  LKR{" "}
                  {p.revenue.toLocaleString("en-LK", {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            ))}
            {topProviders.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">
                No data yet
              </p>
            )}
          </div>
        </div>

        {/* Top equipment */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-white mb-4">
            Most Booked Equipment
          </h2>
          <div className="space-y-3">
            {topEquipment.map((e, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-600 w-4 shrink-0">
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">
                    {e.name}
                  </div>
                </div>
                <span className="text-sm font-bold text-white shrink-0">
                  {e.count}×
                </span>
              </div>
            ))}
            {topEquipment.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">
                No data yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
