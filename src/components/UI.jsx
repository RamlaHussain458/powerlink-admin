export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-2xl",
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative z-10 card w-full ${maxWidth} max-h-[90vh] flex flex-col animate-slide-in`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-hover transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({ open, onClose, onConfirm, title, message, danger }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 card w-full max-w-sm p-6 animate-slide-in">
        <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={danger ? "btn-danger" : "btn-primary"}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export function SkeletonRows({ cols = 5, rows = 6 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i}>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-4 py-3">
          <div
            className="skeleton h-4 rounded"
            style={{ width: `${60 + Math.random() * 30}%` }}
          />
        </td>
      ))}
    </tr>
  ));
}

export function StatusBadge({ status }) {
  const cls = `badge-${status}`;
  return <span className={cls}>{status}</span>;
}

export function Empty({ message = "No results found" }) {
  return (
    <tr>
      <td
        colSpan={99}
        className="px-4 py-16 text-center text-slate-500 text-sm"
      >
        {message}
      </td>
    </tr>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-9"
      />
    </div>
  );
}

export function Select({ value, onChange, children, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`input appearance-none pr-8 cursor-pointer ${className}`}
    >
      {children}
    </select>
  );
}

export function StatCard({ label, value, icon, sub, accent }) {
  const colors = {
    blue: "from-brand-600/20 to-transparent border-brand-500/20 text-brand-400",
    green:
      "from-green-500/20  to-transparent border-green-500/20  text-green-400",
    amber:
      "from-amber-500/20  to-transparent border-amber-500/20  text-amber-400",
    purple:
      "from-purple-500/20 to-transparent border-purple-500/20 text-purple-400",
  };
  return (
    <div
      className={`card p-5 bg-gradient-to-br ${colors[accent] ?? colors.blue}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-2.5 rounded-xl bg-current/10 ${colors[accent]?.split(" ").find((c) => c.startsWith("text-"))}`}
        >
          {icon}
        </div>
        {sub && <span className="text-xs text-slate-500">{sub}</span>}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value ?? "—"}</div>
      <div className="text-xs text-slate-400 font-medium">{label}</div>
    </div>
  );
}

export function Table({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">{children}</table>
    </div>
  );
}
