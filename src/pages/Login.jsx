import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (snap.data()?.role !== "admin") {
        await auth.signOut();
        setError("Access denied — this account is not an administrator.");
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.code === "auth/invalid-credential"
          ? "Invalid email or password."
          : err.message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-surface px-4"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(12,143,225,0.12) 0%, transparent 70%)",
      }}
    >
      <div className="w-full max-w-[380px] animate-slide-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mb-4 shadow-lg shadow-brand-600/30">
            <svg
              className="w-7 h-7 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">PowerLink</h1>
          <p className="text-slate-500 text-sm mt-1">Admin Console</p>
        </div>

        <div className="card p-8">
          <h2 className="text-base font-semibold text-white mb-6">Sign in</h2>
          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@powerlink.lk"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input"
              />
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          PowerLink Admin Panel · v1.0.0
        </p>
      </div>
    </div>
  );
}
