import { useEffect, useState } from "react";
import { db, functions } from "../lib/firebase";
import { httpsCallable } from "firebase/functions";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { useToast } from "../context/ToastContext";
import {
  Modal,
  Confirm,
  SkeletonRows,
  StatusBadge,
  SearchInput,
  Table,
  Empty,
} from "../components/UI";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [bookModal, setBookModal] = useState(null); // user
  const [bookings, setBookings] = useState([]);
  const [bookLoading, setBookLoading] = useState(false);
  const [confirm, setConfirm] = useState(null); // user
  const [orphans, setOrphans] = useState(null); // result of the dry-run scan
  const [cleaning, setCleaning] = useState(false);

  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      // No orderBy here: it would silently hide any user document that has no
      // createdAt field (e.g. Google sign-ups). Sorted in the browser instead.
      const snap = await getDocs(collection(db, "users"));
      //booking counts
      const bookSnap = await getDocs(collection(db, "bookings"));
      const countMap = {};
      bookSnap.forEach((d) => {
        const uid = d.data().userId;
        countMap[uid] = (countMap[uid] ?? 0) + 1;
      });
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        bookingCount: countMap[d.id] ?? 0,
      }));
      list.sort(
        (a, b) =>
          (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0),
      );
      setUsers(list);
    } catch (err) {
      console.error("Failed to load users:", err);
      toast.add("Could not load users", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!search) {
      setFiltered(users);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      users.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q),
      ),
    );
  }, [users, search]);

  const openBookings = async (user) => {
    setBookModal(user);
    setBookLoading(true);
    setBookings([]);
    const snap = await getDocs(
      query(collection(db, "bookings"), where("userId", "==", user.id)),
    );
    setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setBookLoading(false);
  };

  // Deletes the Firebase Auth account AND the Firestore data (via Cloud Function)
  const deleteUser = async (user) => {
    try {
      await httpsCallable(functions, "adminDeleteAccount")({ uid: user.id });
      setUsers((us) => us.filter((u) => u.id !== user.id));
      toast.add(`User "${user.name ?? user.email}" deleted`, "error");
    } catch (err) {
      console.error(err);
      toast.add(`Delete failed: ${err.message}`, "error");
    }
  };

  // Step 1: scan for profiles whose Auth account no longer exists (nothing deleted yet)
  const scanOrphans = async () => {
    setCleaning(true);
    try {
      const res = await httpsCallable(
        functions,
        "cleanupOrphanedAccounts",
      )({ dryRun: true });
      if (res.data.count === 0) {
        toast.add("No orphaned accounts found", "success");
      } else {
        setOrphans(res.data.orphans);
      }
    } catch (err) {
      console.error(err);
      toast.add(`Scan failed: ${err.message}`, "error");
    }
    setCleaning(false);
  };

  // Step 2: after the admin confirms, actually remove them
  const removeOrphans = async () => {
    setCleaning(true);
    try {
      const res = await httpsCallable(
        functions,
        "cleanupOrphanedAccounts",
      )({ dryRun: false });
      toast.add(`${res.data.count} orphaned accounts removed`, "success");
      await load();
    } catch (err) {
      console.error(err);
      toast.add(`Clean-up failed: ${err.message}`, "error");
    }
    setOrphans(null);
    setCleaning(false);
  };

  const fmtDate = (ts) => (ts?.toDate ? ts.toDate().toLocaleDateString() : "—");

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search users…"
        />
        <button
          onClick={scanOrphans}
          disabled={cleaning}
          className="btn-ghost text-xs px-3 py-1.5"
          title="Find profiles whose Firebase Auth account was deleted"
        >
          {cleaning ? "Checking…" : "Clean up deleted accounts"}
        </button>
        <span className="ml-auto text-xs text-slate-500">
          {filtered.length} users
        </span>
      </div>

      <div className="card overflow-hidden">
        <Table>
          <thead>
            <tr className="border-b border-surface-border bg-surface-hover/50">
              <th className="th">Name</th>
              <th className="th">Email</th>
              <th className="th">Role</th>
              <th className="th">Registered</th>
              <th className="th">Bookings</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {loading ? (
              <SkeletonRows cols={6} rows={8} />
            ) : filtered.length === 0 ? (
              <Empty message="No users found" />
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="tr-hover">
                  <td className="td font-semibold text-white">
                    {u.name ?? "—"}
                  </td>
                  <td className="td text-slate-400">{u.email}</td>
                  <td className="td">
                    <span
                      className={
                        u.role === "admin"
                          ? "badge-confirmed"
                          : "badge-approved"
                      }
                    >
                      {u.role ?? "user"}
                    </span>
                  </td>
                  <td className="td text-slate-500 text-xs">
                    {fmtDate(u.createdAt)}
                  </td>
                  <td className="td">
                    <span className="font-mono text-sm text-white">
                      {u.bookingCount}
                    </span>
                  </td>
                  <td className="td">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openBookings(u)}
                        className="btn-ghost text-xs px-2 py-1"
                      >
                        View
                      </button>
                      {u.role !== "admin" && (
                        <button
                          onClick={() => setConfirm(u)}
                          className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Bookings Modal */}
      <Modal
        open={!!bookModal}
        onClose={() => setBookModal(null)}
        title={`${bookModal?.name ?? ""}'s Bookings`}
      >
        {bookLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">
            No bookings yet
          </p>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-surface-hover border border-surface-border"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {b.equipmentName}
                    </div>
                    <div className="text-xs text-slate-400">
                      {b.providerName}
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>
                    {b.bookingDate} → {b.endDate ?? "—"}
                  </span>
                  <span>{b.numberOfDays || 1} day(s)</span>
                  <span className="text-white font-semibold">
                    LKR {(b.totalAmount ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Confirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => deleteUser(confirm)}
        title="Delete User Account"
        message={`Permanently delete "${confirm?.name ?? confirm?.email}"? This removes their login (Firebase Auth) and their profile data. Their past bookings are kept.`}
        danger
      />

      <Confirm
        open={!!orphans}
        onClose={() => setOrphans(null)}
        onConfirm={removeOrphans}
        title="Remove deleted accounts"
        message={`${orphans?.length ?? 0} profile(s) have no Firebase Auth account anymore: ${(orphans ?? [])
          .slice(0, 5)
          .map((o) => o.email || o.name || o.uid)
          .join(", ")}${(orphans?.length ?? 0) > 5 ? ", …" : ""}. Remove their data from the app?`}
        danger
      />
    </div>
  );
}