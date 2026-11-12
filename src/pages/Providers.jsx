import { useEffect, useState } from "react";
import { db, storage, functions } from "../lib/firebase";
import { httpsCallable } from "firebase/functions";
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import {
  collection,
  collectionGroup,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { useToast } from "../context/ToastContext";
import {
  Modal,
  Confirm,
  SkeletonRows,
  StatusBadge,
  SearchInput,
  Select,
  Table,
  Empty,
} from "../components/UI";

export default function Providers() {
  const [providers, setProviders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());

  const [viewModal, setViewModal] = useState(null); // provider obj
  const [equipModal, setEquipModal] = useState(null); // provider obj
  const [equipment, setEquipment] = useState([]);
  const [equipLoading, setEquipLoading] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type, provider }

  const [docsModal, setDocsModal] = useState(null); // provider obj
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      // No orderBy: it would hide providers without a createdAt field.
      const snap = await getDocs(collection(db, "providers"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort(
        (a, b) =>
          (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0),
      );
      setProviders(list);
    } catch (err) {
      console.error("Failed to load providers:", err);
      toast.add("Could not load providers", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let list = providers;
    if (status !== "all") list = list.filter((p) => p.status === status);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.businessName?.toLowerCase().includes(q) ||
          p.name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q),
      );
    }
    setFiltered(list);
  }, [providers, search, status]);

  const updateStatus = async (provider, newStatus) => {
    try {
      await updateDoc(doc(db, "providers", provider.uid ?? provider.id), {
        status: newStatus,
      });
    } catch (err) {
      console.error(err);
      toast.add(`Could not update ${provider.businessName}`, "error");
      return;
    }
    setProviders((ps) =>
      ps.map((p) =>
        p.id === (provider.uid ?? provider.id)
          ? { ...p, status: newStatus }
          : p,
      ),
    );
    toast.add(
      `${provider.businessName} ${newStatus === "approved" ? "approved ✓" : "suspended"}`,
      newStatus === "approved" ? "success" : "error",
    );
  };

  // Removes the provider's login (Firebase Auth) + profile, equipment and documents
  const deleteProvider = async (provider) => {
    const id = provider.uid ?? provider.id;
    try {
      await httpsCallable(functions, "adminDeleteAccount")({ uid: id });
      setProviders((ps) => ps.filter((p) => p.id !== id));
      toast.add(`${provider.businessName} deleted`, "error");
    } catch (err) {
      console.error(err);
      toast.add(`Delete failed: ${err.message}`, "error");
    }
  };

  const bulkApprove = async () => {
    for (const id of selected) {
      const p = providers.find((x) => x.id === id);
      if (p?.status === "pending") await updateStatus(p, "approved");
    }
    setSelected(new Set());
    toast.add(`${selected.size} providers approved`, "success");
  };

  const openEquip = async (provider) => {
    setEquipModal(provider);
    setEquipLoading(true);
    setEquipment([]);
    const providerId = provider.uid ?? provider.id;
    const snap = await getDocs(
      query(
        collectionGroup(db, "equipment"),
        where("providerId", "==", providerId),
      ),
    );
    setEquipment(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setEquipLoading(false);
  };

  const openDocs = async (provider) => {
    setDocsModal(provider);
    setDocsLoading(true);
    setDocs([]);
    try {
      const providerId = provider.uid ?? provider.id;
      const snap = await getDocs(
        collection(db, "providers", providerId, "documents"),
      );
      const items = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          let url = null;
          try {
            url = await getDownloadURL(storageRef(storage, data.storagePath));
          } catch (err) {
            console.error("Could not load document URL:", err);
          }
          return { id: d.id, ...data, url };
        }),
      );
      items.sort(
        (a, b) =>
          (a.uploadedAt?.toMillis?.() ?? 0) - (b.uploadedAt?.toMillis?.() ?? 0),
      );
      setDocs(items);
    } catch (err) {
      console.error("Failed to load documents:", err);
      toast.add("Could not load documents", "error");
    }
    setDocsLoading(false);
  };

  const fmtSize = (bytes) => {
    if (!bytes || bytes < 0) return "";
    return bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  const toggleSelect = (id) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const fmtDate = (ts) => (ts?.toDate ? ts.toDate().toLocaleDateString() : "—");

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search providers…"
        />
        <Select value={status} onChange={setStatus} className="w-40">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
        </Select>
        {selected.size > 0 && (
          <button onClick={bulkApprove} className="btn-primary">
            Approve Selected ({selected.size})
          </button>
        )}
        <span className="ml-auto text-xs text-slate-500">
          {filtered.length} providers
        </span>
      </div>

      <div className="card overflow-hidden">
        <Table>
          <thead>
            <tr className="border-b border-surface-border bg-surface-hover/50">
              <th className="th w-10">
                <input
                  type="checkbox"
                  className="accent-brand-500"
                  checked={
                    selected.size ===
                      filtered.filter((p) => p.status === "pending").length &&
                    filtered.some((p) => p.status === "pending")
                  }
                  onChange={(e) => {
                    if (e.target.checked)
                      setSelected(
                        new Set(
                          filtered
                            .filter((p) => p.status === "pending")
                            .map((p) => p.id),
                        ),
                      );
                    else setSelected(new Set());
                  }}
                />
              </th>
              <th className="th">Business</th>
              <th className="th">Owner</th>
              <th className="th">Email</th>
              <th className="th">Phone</th>
              <th className="th">Location</th>
              <th className="th">Docs</th>
              <th className="th">Status</th>
              <th className="th">Registered</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {loading ? (
              <SkeletonRows cols={10} rows={8} />
            ) : filtered.length === 0 ? (
              <Empty message="No providers found" />
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.id}
                  className={`tr-hover ${p.status === "pending" ? "bg-amber-500/5" : ""}`}
                >
                  <td className="td">
                    {p.status === "pending" && (
                      <input
                        type="checkbox"
                        className="accent-brand-500"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </td>
                  <td
                    className="td font-semibold text-white"
                    onClick={() => setViewModal(p)}
                  >
                    {p.businessName}
                  </td>
                  <td className="td">{p.name}</td>
                  <td className="td text-slate-400">{p.email}</td>
                  <td className="td text-slate-400">{p.phone}</td>
                  <td className="td text-slate-400 max-w-[140px] truncate">
                    {p.address ?? p.location ?? "—"}
                  </td>
                  <td className="td">
                    {p.documentCount > 0 ? (
                      <button
                        onClick={() => openDocs(p)}
                        className="text-xs px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                      >
                        {p.documentCount} file{p.documentCount === 1 ? "" : "s"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">None</span>
                    )}
                  </td>
                  <td className="td">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="td text-slate-500 text-xs">
                    {fmtDate(p.createdAt)}
                  </td>
                  <td className="td">
                    <div className="flex gap-1.5 items-center">
                      <button
                        onClick={() => openDocs(p)}
                        className="btn-ghost text-xs px-2 py-1"
                      >
                        Documents
                      </button>
                      <button
                        onClick={() => openEquip(p)}
                        className="btn-ghost text-xs px-2 py-1"
                      >
                        Equipment
                      </button>
                      {p.status !== "approved" && (
                        <button
                          onClick={() =>
                            setConfirm({ type: "approve", provider: p })
                          }
                          className="text-xs px-2 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => setConfirm({ type: "delete", provider: p })}
                        className="text-xs px-2 py-1 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                      {p.status !== "suspended" && (
                        <button
                          onClick={() =>
                            setConfirm({ type: "suspend", provider: p })
                          }
                          className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                        >
                          Suspend
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

      <Modal
        open={!!viewModal}
        onClose={() => setViewModal(null)}
        title="Provider Details"
      >
        {viewModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Business", viewModal.businessName],
                ["Owner", viewModal.name],
                ["Email", viewModal.email],
                ["Phone", viewModal.phone],
                ["Address", viewModal.address ?? viewModal.location],
                ["Status", viewModal.status],
                [
                  "Documents",
                  viewModal.documentCount > 0
                    ? `${viewModal.documentCount} submitted`
                    : "None submitted",
                ],
                [
                  "Rating",
                  viewModal.rating
                    ? `${viewModal.rating.toFixed(1)} (${viewModal.totalRatings} reviews)`
                    : "No ratings",
                ],
                [
                  "Joined",
                  viewModal.createdAt?.toDate
                    ? viewModal.createdAt
                        .toDate()
                        .toLocaleDateString("en-LK", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                    : "—",
                ],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs text-slate-500 mb-0.5">{k}</div>
                  <div className="text-white font-medium break-all">
                    {v ?? "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!docsModal}
        onClose={() => setDocsModal(null)}
        title={`${docsModal?.businessName ?? ""} - Verification Documents`}
      >
        {docsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-xl" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">
            This provider has not submitted any documents.
          </p>
        ) : (
          <div className="space-y-2">
            {docs.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-surface-hover border border-surface-border"
              >
                {d.contentType?.startsWith("image/") && d.url ? (
                  <a href={d.url} target="_blank" rel="noreferrer">
                    <img
                      src={d.url}
                      className="w-12 h-12 rounded-lg object-cover bg-surface-border"
                    />
                  </a>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-surface-border flex items-center justify-center text-slate-400 text-xs font-bold">
                    {d.contentType === "application/pdf" ? "PDF" : "FILE"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {d.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {fmtSize(d.size)}
                    {d.uploadedAt?.toDate
                      ? ` · ${d.uploadedAt.toDate().toLocaleDateString()}`
                      : ""}
                  </div>
                </div>
                {d.url ? (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost text-xs px-3 py-1"
                  >
                    Open
                  </a>
                ) : (
                  <span className="text-xs text-red-400">Unavailable</span>
                )}
              </div>
            ))}
          </div>
        )}
        {docsModal && docsModal.status !== "approved" && (
          <div className="flex gap-2 justify-end pt-4">
            <button
              onClick={() => {
                const p = docsModal;
                setDocsModal(null);
                setConfirm({ type: "approve", provider: p });
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
            >
              Approve
            </button>
          </div>
        )}
      </Modal>

      <Modal
        open={!!equipModal}
        onClose={() => setEquipModal(null)}
        title={`${equipModal?.businessName ?? ""} — Equipment`}
      >
        {equipLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-xl" />
            ))}
          </div>
        ) : equipment.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">
            No equipment listed
          </p>
        ) : (
          <div className="space-y-2">
            {equipment.map((eq) => (
              <div
                key={eq.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-surface-hover border border-surface-border"
              >
                {eq.imageUrl ? (
                  <img
                    src={eq.imageUrl}
                    className="w-12 h-12 rounded-lg object-cover bg-surface-border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-surface-border flex items-center justify-center text-slate-600 text-xl">
                    🔧
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">
                    {eq.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {eq.category} · LKR {eq.pricePerDay}/day
                  </div>
                </div>
                <span
                  className={
                    eq.available ? "badge-approved" : "badge-suspended"
                  }
                >
                  {eq.available ? "Available" : "Unavailable"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Confirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() =>
          confirm.type === "delete"
            ? deleteProvider(confirm.provider)
            : updateStatus(
                confirm.provider,
                confirm.type === "approve" ? "approved" : "suspended",
              )
        }
        title={
          confirm?.type === "approve"
            ? "Approve Provider"
            : confirm?.type === "delete"
              ? "Delete Provider"
              : "Suspend Provider"
        }
        message={`Are you sure you want to ${confirm?.type} "${confirm?.provider?.businessName}"?${
          confirm?.type === "delete"
            ? " This removes their login, equipment and documents permanently."
            : ""
        }${
          confirm?.type === "approve" && !(confirm?.provider?.documentCount > 0)
            ? " Note: this provider has not submitted any verification documents."
            : ""
        }`}
        danger={confirm?.type === "suspend" || confirm?.type === "delete"}
      />
    </div>
  );
}