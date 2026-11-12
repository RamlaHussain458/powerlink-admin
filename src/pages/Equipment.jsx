import { useEffect, useState, useMemo } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  collectionGroup,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useToast } from "../context/ToastContext";
import {
  Confirm,
  SkeletonRows,
  SearchInput,
  Select,
  Table,
  Empty,
} from "../components/UI";

export default function Equipment() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [confirm, setConfirm] = useState(null);
  const toast = useToast();

  useEffect(() => {
    // The app saves equipment as providers/{id}/equipment/{id}, with the kind of
    // equipment in "type" (older/admin data may use "category"). No orderBy so
    // items without createdAt are not hidden and no extra index is needed.
    Promise.all([
      getDocs(collectionGroup(db, "equipment")),
      getDocs(collection(db, "providers")),
    ])
      .then(([eqSnap, provSnap]) => {
        const names = {};
        provSnap.forEach((p) => {
          names[p.id] = p.data().businessName ?? p.data().name;
        });
        const list = eqSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            category: data.type ?? data.category,
            providerName: data.providerName ?? names[data.providerId],
          };
        });
        list.sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0),
        );
        setItems(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load equipment:", err);
        toast.add("Could not load equipment", "error");
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    return [...new Set(items.map((i) => i.category).filter(Boolean))].sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (category !== "all" && i.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          i.name?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q) ||
          i.providerName?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, search, category]);

  const toggleAvail = async (item) => {
    await updateDoc(
      doc(db, "providers", item.providerId, "equipment", item.id),
      { available: !item.available },
    );
    setItems((its) =>
      its.map((i) =>
        i.id === item.id ? { ...i, available: !i.available } : i,
      ),
    );
    toast.add(
      `${item.name} marked as ${!item.available ? "available" : "unavailable"}`,
      "info",
    );
  };

  const deleteItem = async (item) => {
    await deleteDoc(
      doc(db, "providers", item.providerId, "equipment", item.id),
    );
    setItems((its) => its.filter((i) => i.id !== item.id));
    toast.add(`"${item.name}" deleted`, "error");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search equipment…"
        />
        <Select value={category} onChange={setCategory} className="w-44">
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <span className="ml-auto text-xs text-slate-500">
          {filtered.length} items
        </span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <Table>
          <thead>
            <tr className="border-b border-surface-border bg-surface-hover/50">
              <th className="th">Image</th>
              <th className="th">Name</th>
              <th className="th">Category</th>
              <th className="th">Provider</th>
              <th className="th">Price / Day</th>
              <th className="th">Available</th>
              <th className="th">Listed</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {loading ? (
              <SkeletonRows cols={8} rows={8} />
            ) : filtered.length === 0 ? (
              <Empty message="No equipment found" />
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="tr-hover">
                  <td className="td">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        className="w-10 h-10 rounded-lg object-cover bg-surface-border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-surface-border flex items-center justify-center text-xl">
                        🔧
                      </div>
                    )}
                  </td>
                  <td className="td font-semibold text-white">{item.name}</td>
                  <td className="td">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      {item.category ?? "—"}
                    </span>
                  </td>
                  <td className="td text-slate-400 text-xs">
                    {item.providerName ?? item.providerId?.slice(0, 8)}
                  </td>
                  <td className="td font-mono text-sm text-white">
                    LKR {(item.pricePerDay ?? 0).toLocaleString()}
                  </td>
                  <td className="td">
                    <button
                      onClick={() => toggleAvail(item)}
                      className={`relative inline-flex w-10 h-5 rounded-full transition-colors shrink-0 ${item.available ? "bg-green-500" : "bg-slate-600"}`}
                    >
                      <span
                        className={`absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${item.available ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </button>
                  </td>
                  <td className="td text-slate-500 text-xs">
                    {item.createdAt?.toDate
                      ? item.createdAt.toDate().toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="td">
                    <button
                      onClick={() => setConfirm(item)}
                      className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <Confirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => deleteItem(confirm)}
        title="Delete Equipment"
        message={`Permanently delete "${confirm?.name}"? This cannot be undone.`}
        danger
      />
    </div>
  );
}
