import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Providers from "./pages/Providers";
import Users from "./pages/Users";
import Bookings from "./pages/Bookings";
import Equipment from "./pages/Equipment";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

function RequireAdmin({ children }) {
  const { user, role, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== "admin") return <AccessDenied />;
  return children;
}

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    </div>
  );
}

function AccessDenied() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="card p-10 max-w-sm w-full text-center">
        <div className="text-4xl mb-4">🚫</div>
        <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 text-sm mb-6">
          Your account does not have admin privileges.
        </p>
        <button onClick={logout} className="btn-primary w-full justify-center">
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAdmin>
            <Layout />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="providers" element={<Providers />} />
        <Route path="users" element={<Users />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="equipment" element={<Equipment />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
