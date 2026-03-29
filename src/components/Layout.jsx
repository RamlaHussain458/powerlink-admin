import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import logo from "../assets/powerlink_logo.png";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: IconDash },
  {
    to: "/providers",
    label: "Providers",
    icon: IconProv,
    badge: "pendingProviders",
  },
  { to: "/users", label: "Users", icon: IconUser },
  { to: "/bookings", label: "Bookings", icon: IconBook },
  { to: "/equipment", label: "Equipment", icon: IconEquip },
  { to: "/analytics", label: "Analytics", icon: IconChart },
  { to: "/settings", label: "Settings", icon: IconCog },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingProviders, setPendingProviders] = useState(0);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    const q = query(
      collection(db, "providers"),
      where("status", "==", "pending"),
    );
    return onSnapshot(q, (snap) => setPendingProviders(snap.size));
  }, []);

  const badges = { pendingProviders };

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
        fixed lg:relative z-50 h-full flex flex-col
        bg-surface-card border-r border-surface-border
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-[68px]" : "w-60"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-border min-h-[65px]">
          <img
            src={logo}
            alt="PowerLink"
            className="w-8 h-8 object-contain rounded-lg shrink-0"
          />
          {!collapsed && (
            <div>
              <div className="text-sm font-bold text-white tracking-tight">
                PowerLink
              </div>
              <div className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">
                Admin
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="ml-auto p-1 rounded-lg text-slate-500 hover:text-white hover:bg-surface-hover transition-colors hidden lg:flex"
          >
            {collapsed ? (
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            ) : (
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            )}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative
                ${
                  isActive
                    ? "bg-brand-600/15 text-brand-400 border border-brand-500/20"
                    : "text-slate-400 hover:text-white hover:bg-surface-hover"
                }
              `}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span className="flex-1">{label}</span>}
              {badge && badges[badge] > 0 && (
                <span
                  className={`
                  ${collapsed ? "absolute -top-1 -right-1" : ""}
                  min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center
                `}
                >
                  {badges[badge]}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-surface-border p-3">
          {collapsed ? (
            <button
              onClick={logout}
              title="Sign out"
              className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <IconLogout className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600/30 border border-brand-500/30 flex items-center justify-center text-brand-400 text-sm font-bold shrink-0">
                {user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {user?.email}
                </div>
                <div className="text-[10px] text-slate-500">Administrator</div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <IconLogout className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-[65px] bg-surface-card border-b border-surface-border flex items-center px-4 lg:px-6 gap-4 shrink-0">
          <button
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface-hover transition-colors"
            onClick={() => setMobileOpen((m) => !m)}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <PageTitle />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:block">
              v1.0.0
            </span>
            <div
              className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow"
              title="Firebase connected"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function PageTitle() {
  const location = useLocation();
  const titles = {
    "/dashboard": "Dashboard",
    "/providers": "Provider Management",
    "/users": "User Management",
    "/bookings": "Bookings",
    "/equipment": "Equipment",
    "/analytics": "Analytics",
    "/settings": "Settings",
  };
  return (
    <h1 className="text-base font-semibold text-white">
      {titles[location.pathname] ?? "PowerLink Admin"}
    </h1>
  );
}

function IconDash({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}
function IconProv({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}
function IconUser({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
function IconBook({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
function IconEquip({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
function IconChart({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}
function IconCog({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
      />
    </svg>
  );
}
function IconLogout({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}
