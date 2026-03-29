import { createContext, useContext, useState, useCallback } from "react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={{ add, remove }}>
      {children}
      <ToastContainer toasts={toasts} remove={remove} />
    </ToastCtx.Provider>
  );
}

function ToastContainer({ toasts, remove }) {
  const icons = {
    success: (
      <svg
        className="w-4 h-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    error: (
      <svg
        className="w-4 h-4 shrink-0"
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
    ),
    info: (
      <svg
        className="w-4 h-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01"
        />
      </svg>
    ),
  };
  const colors = {
    success: "border-green-500/40 bg-green-500/10 text-green-300",
    error: "border-red-500/40   bg-red-500/10   text-red-300",
    info: "border-brand-500/40 bg-brand-500/10 text-brand-300",
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => remove(t.id)}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium cursor-pointer animate-slide-in backdrop-blur-md ${colors[t.type] ?? colors.info}`}
        >
          {icons[t.type]}
          <span className="flex-1 leading-snug">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

export const useToast = () => useContext(ToastCtx);
