import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  LayoutDashboard,
  Map,
  Wrench,
  Fuel,
  BarChart3,
  Bus,
  LogOut,
  Truck,
  Route,
} from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/live-map", label: "Live Map", icon: Map },
  { to: "/vehicles", label: "Vehicles", icon: Truck },
  { to: "/trips", label: "Trips", icon: Route },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/fuel-expense", label: "Fuel & Expense", icon: Fuel },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Sidebar() {
  const [userProfile, setUserProfile] = useState({ name: "User", role: "Manager" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const fullName = user.user_metadata?.full_name || "User";
        const rawRole = user.user_metadata?.role || "manager";
        const formattedRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1);
        setUserProfile({
          name: fullName,
          role: formattedRole,
        });
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className="fixed top-0 left-0 z-40 h-screen w-64 glass border-r border-white/[0.06] flex flex-col">
      {/* ── Brand ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/[0.06]">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg shadow-teal-500/20">
          <Bus className="w-5 h-5 text-slate-950" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-teal-300 to-cyan-400 bg-clip-text text-transparent">
            TransitOps
          </h1>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
            Fleet Manager
          </p>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────── */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-default
              ${
                isActive
                  ? "nav-active"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`
            }
          >
            <Icon className="w-[18px] h-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ── Footer ─────────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-white/[0.06] flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-slate-950">
            {userProfile.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-300 truncate">{userProfile.name}</p>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider">{userProfile.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-default cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}

