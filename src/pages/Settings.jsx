import { useState } from "react";
import { auth } from "../lib/firebase";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Settings() {
  const { user } = useAuth();
  const toast = useToast();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePw = async (e) => {
    e.preventDefault();
    setError("");
    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (next.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, next);
      toast.add("Password updated successfully ✓", "success");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setError(
        err.code === "auth/wrong-password" ||
          err.code === "auth/invalid-credential"
          ? "Current password is incorrect."
          : err.message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      {/* Account info */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Account</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-2xl font-bold">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-base font-semibold text-white">
              {user?.email}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Administrator · UID: {user?.uid?.slice(0, 16)}…
            </div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-white mb-4">
          Change Password
        </h2>
        <form onSubmit={handlePw} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              className="input"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              className="input"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="input"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </div>

      {/* App info */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-white mb-4">App Info</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            ["App Name", "PowerLink Admin"],
            ["Version", "1.0.0"],
            ["React", "18.x"],
            ["Firebase SDK", "10.x"],
            ["Tailwind CSS", "3.x"],
            ["Vite", "5.x"],
            ["Environment", import.meta.env.MODE],
            ["Build Target", "Web / Mobile Browser"],
          ].map(([k, v]) => (
            <div
              key={k}
              className="p-3 rounded-xl bg-surface-hover border border-surface-border"
            >
              <div className="text-xs text-slate-500 mb-0.5">{k}</div>
              <div className="text-white font-medium text-xs font-mono">
                {v}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Firebase Collections */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-white mb-4">
          Firebase Collections
        </h2>
        <div className="space-y-2 text-xs font-mono">
          {["users", "providers", "bookings", "equipment"].map((col) => (
            <div
              key={col}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-hover"
            >
              <span className="text-brand-400">/</span>
              <span className="text-white">{col}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
