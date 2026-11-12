import { useEffect, useState, useMemo } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import {
  Modal,
  SkeletonRows,
  StatusBadge,
  SearchInput,
  Select,
  Table,
  Empty,
} from "../components/UI";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");
  const [provider, setProvider] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    getDocs(
      query(collection(db, "bookings"), orderBy("createdAt", "desc")),
    )
      .then((snap) => {
        setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      })
      .catch((err) => console.error("Failed to load bookings:", err))
      .finally(() => setLoading(false));
  }, []);

  const providers = useMemo(() => {
    const names = [
      ...new Set(bookings.map((b) => b.providerName).filter(Boolean)),
    ];
    return names.sort();
  }, [bookings]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (status !== "all" && b.status !== status) return false;
      if (payment !== "all" && b.paymentStatus !== payment) return false;
      if (provider !== "all" && b.providerName !== provider) return false;
      if (dateFrom && b.bookingDate < dateFrom) return false;
      if (dateTo && b.bookingDate > dateTo) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          b.equipmentName?.toLowerCase().includes(q) ||
          b.userEmail?.toLowerCase().includes(q) ||
          b.providerName?.toLowerCase().includes(q) ||
          b.bookingId?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bookings, search, status, payment, provider, dateFrom, dateTo]);

  const totalRevenue = filtered.reduce((s, b) => s + (b.totalAmount ?? 0), 0);
  const fmtDate = (ts) =>
    ts?.toDate ? ts.toDate().toLocaleDateString("en-LK") : "—";

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search bookings…"
        />
        <Select value={status} onChange={setStatus} className="w-36">
          <option value="all">All Status</option>
          {["pending", "confirmed", "cancelled", "completed", "delivered"].map(
            (s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ),
          )}
        </Select>
        <Select value={payment} onChange={setPayment} className="w-36">
          <option value="all">All Payments</option>
          {["PAID", "PENDING", "FAILED"].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Select value={provider} onChange={setProvider} className="w-48">
          <option value="all">All Providers</option>
          {providers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="input w-36 text-xs"
        />
        <span className="text-slate-600 text-xs">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="input w-36 text-xs"
        />
        <div className="ml-auto flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-500">
              {filtered.length} bookings
            </div>
            <div className="text-xs font-mono text-brand-400">
              LKR {totalRevenue.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <Table>
          <thead>
            <tr className="border-b border-surface-border bg-surface-hover/50">
              <th className="th">ID</th>
              <th className="th">Equipment</th>
              <th className="th">User</th>
              <th className="th">Provider</th>
              <th className="th">Dates</th>
              <th className="th">Days</th>
              <th className="th">Amount</th>
              <th className="th">Payment</th>
              <th className="th">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {loading ? (
              <SkeletonRows cols={9} rows={8} />
            ) : filtered.length === 0 ? (
              <Empty message="No bookings found" />
            ) : (
              filtered.map((b) => (
                <tr
                  key={b.id}
                  className="tr-hover"
                  onClick={() => setDetail(b)}
                >
                  <td className="td font-mono text-xs text-slate-500">
                    {(b.bookingId ?? b.id).slice(0, 8)}…
                  </td>
                  <td className="td font-semibold text-white max-w-[140px] truncate">
                    {b.equipmentName}
                  </td>
                  <td className="td text-slate-400 text-xs">{b.userEmail}</td>
                  <td className="td text-slate-400 text-xs">
                    {b.providerName}
                  </td>
                  <td className="td text-xs text-slate-400 whitespace-nowrap">
                    {b.bookingDate}
                    <br />
                    <span className="text-slate-600">{b.endDate ?? "—"}</span>
                  </td>
                  <td className="td text-center">{b.numberOfDays || 1}</td>
                  <td className="td font-mono text-sm text-white">
                    LKR {(b.totalAmount ?? 0).toLocaleString()}
                  </td>
                  <td className="td">
                    <StatusBadge status={b.paymentStatus ?? "PENDING"} />
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

      {/* Detail Modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Booking Details"
      >
        {detail && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Booking ID", detail.bookingId ?? detail.id],
                ["Equipment", detail.equipmentName],
                ["Equipment ID", detail.equipmentId],
                ["Provider", detail.providerName],
                ["User Email", detail.userEmail],
                ["User ID", detail.userId],
                ["Start Date", detail.bookingDate],
                ["End Date", detail.endDate ?? "—"],
                ["Days", detail.numberOfDays || 1],
                [
                  "Price/Day",
                  `LKR ${detail.pricePerDay?.toLocaleString() ?? "—"}`,
                ],
                ["Subtotal", `LKR ${detail.subtotal?.toLocaleString() ?? "—"}`],
                [
                  "Delivery",
                  `LKR ${detail.deliveryCharge?.toLocaleString() ?? "—"}`,
                ],
                ["Total", `LKR ${detail.totalAmount?.toLocaleString() ?? "—"}`],
                ["Payment", detail.paymentStatus ?? "—"],
                ["Status", detail.status],
                ["Created", fmtDate(detail.createdAt)],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs text-slate-500 mb-0.5">{k}</div>
                  <div className="text-white font-medium break-all text-xs leading-relaxed">
                    {String(v)}
                  </div>
                </div>
              ))}
            </div>
            {detail.deliveryAddress && (
              <div className="p-4 rounded-xl bg-surface-hover border border-surface-border">
                <div className="text-xs text-slate-500 mb-1">
                   Delivery Address
                </div>
                <div className="text-sm text-white">
                  {detail.deliveryAddress}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <StatusBadge status={detail.status} />
              <StatusBadge status={detail.paymentStatus ?? "PENDING"} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
