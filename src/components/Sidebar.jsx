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
  UserCheck,
  Shield,
  MapPin,
  FileText,
  RefreshCw,
  Box,
  Clock,
  AlertTriangle,
  FolderOpen,
  User,
  ShieldCheck,
  CheckCircle2,
  Download,
  DollarSign,
  TrendingUp,
} from "lucide-react";

// Define the exact links array configuration per role as requested
const roleLinks = {
  super_admin: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/users", label: "User Management", icon: UserCheck },
    { to: "/vehicles", label: "Vehicles", icon: Truck },
    { to: "/drivers", label: "Drivers", icon: UserCheck },
    { to: "/trips", label: "Trips", icon: Route },
    { to: "/live-map", label: "Live Map", icon: Map },
    { to: "/maintenance", label: "Maintenance", icon: Wrench },
    { to: "/fuel-expense", label: "Fuel Logs & Expenses", icon: Fuel },
    { to: "/reports", label: "Reports & Analytics", icon: BarChart3 },
    { to: "/branches", label: "Branches", icon: MapPin },
    { to: "/settings", label: "Company Settings", icon: Shield },
    { to: "/audit-logs", label: "Audit Logs", icon: FileText },
    { to: "/backup-restore", label: "Backup & Restore", icon: RefreshCw },
  ],
  fleet_manager: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/vehicles", label: "Vehicles", icon: Truck },
    { to: "/drivers", label: "Drivers", icon: UserCheck },
    { to: "/trips", label: "Trips", icon: Route },
    { to: "/live-map", label: "Live Map", icon: Map },
    { to: "/maintenance", label: "Maintenance", icon: Wrench },
    { to: "/fuel-expense", label: "Fuel Logs", icon: Fuel },
    { to: "/fuel-expense", label: "Expenses", icon: DollarSign },
    { to: "/reports", label: "Reports", icon: BarChart3 },
  ],
  dispatcher: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/trips", label: "Trip Management", icon: Route },
    { to: "/live-map", label: "Live Map", icon: Map },
    { to: "/vehicles", label: "Vehicles", icon: Truck },
    { to: "/drivers", label: "Drivers", icon: UserCheck },
    { to: "/cargo", label: "Cargo", icon: Box },
    { to: "/scheduling", label: "Scheduling", icon: Clock },
    { to: "/audit-logs", label: "Trip History", icon: FileText },
  ],
  driver: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/trips", label: "My Trips", icon: Route },
    { to: "/live-map", label: "Live Map", icon: Map },
    { to: "/vehicles", label: "My Vehicle", icon: Truck },
    { to: "/fuel-expense", label: "Fuel Logs", icon: Fuel },
    { to: "/incident-reports", label: "Incident Reports", icon: AlertTriangle },
    { to: "/documents", label: "Documents", icon: FolderOpen },
    { to: "/profile", label: "My Profile", icon: User },
  ],
  safety_officer: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/drivers", label: "Drivers", icon: UserCheck },
    { to: "/license-management", label: "License Management", icon: ShieldCheck },
    { to: "/compliance", label: "Compliance", icon: CheckCircle2 },
    { to: "/incident-reports", label: "Incident Reports", icon: AlertTriangle },
    { to: "/inspections", label: "Vehicle Inspections", icon: Wrench },
    { to: "/reports", label: "Safety Reports", icon: BarChart3 },
  ],
  financial_analyst: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/fuel-expense", label: "Expenses", icon: DollarSign },
    { to: "/fuel-expense", label: "Fuel Costs", icon: Fuel },
    { to: "/maintenance", label: "Maintenance Costs", icon: Wrench },
    { to: "/reports", label: "Revenue", icon: DollarSign },
    { to: "/reports", label: "Analytics", icon: TrendingUp },
    { to: "/reports", label: "Reports", icon: BarChart3 },
    { to: "/export", label: "Export Data", icon: Download },
  ],
};

const roleDisplayNames = {
  super_admin: "Super Admin",
  fleet_manager: "Fleet Manager",
  dispatcher: "Dispatcher / Ops",
  driver: "Driver",
  safety_officer: "Safety Officer",
  financial_analyst: "Financial Analyst",
};

export default function Sidebar() {
  const [activeRole, setActiveRole] = useState("fleet_manager");
  const [userProfile, setUserProfile] = useState({ name: "User", role: "fleet_manager" });

  useEffect(() => {
    // Read simulated role from localStorage or fallback to profile
    let savedRole = localStorage.getItem("active_role");

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const fullName = user.user_metadata?.full_name || "User";
        const rawRole = user.user_metadata?.role || "fleet_manager";
        let normalizedRole = rawRole;
        if (normalizedRole === "manager") normalizedRole = "fleet_manager";

        setUserProfile({
          name: fullName,
          role: normalizedRole,
        });

        if (!savedRole) {
          savedRole = normalizedRole;
          localStorage.setItem("active_role", normalizedRole);
        }
        setActiveRole(savedRole);
      }
    });
  }, []);

  const handleRoleChange = (newRole) => {
    localStorage.setItem("active_role", newRole);
    setActiveRole(newRole);
    // Reload the page to cleanly trigger re-renders on the dashboard and other components
    window.location.reload();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Get active links for the simulated role
  const visibleLinks = roleLinks[activeRole] || roleLinks.fleet_manager;
  const displayRole = roleDisplayNames[activeRole] || activeRole;

  return (
    <aside className="fixed top-0 left-0 z-40 h-screen w-64 glass border-r border-white/[0.06] flex flex-col justify-between">
      <div className="flex flex-col h-[calc(100vh-180px)]">
        {/* ── Brand ──────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg shadow-teal-500/20">
            <Bus className="w-5 h-5 text-slate-950" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-teal-300 to-cyan-400 bg-clip-text text-transparent">
              TransitOps
            </h1>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Shield className="w-3 h-3 text-teal-400" />
              Simulator
            </p>
          </div>
        </div>

        {/* ── Navigation ─────────────────────────────────── */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto min-h-0">
          {visibleLinks.map((link, idx) => (
            <NavLink
              key={`${link.to}-${link.label}-${idx}`}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-default
                ${
                  isActive
                    ? "nav-active"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`
              }
            >
              <link.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex flex-col shrink-0">
        {/* ── Role Switcher Dropdown (Simulator) ─────────── */}
        <div className="px-5 py-4 border-t border-white/[0.06] bg-slate-950/20">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
            Simulation Role Profile
          </label>
          <select
            value={activeRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full bg-slate-900 border border-white/[0.08] text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500/40 cursor-pointer appearance-none"
          >
            <option value="super_admin">Super Admin</option>
            <option value="fleet_manager">Fleet Manager</option>
            <option value="dispatcher">Dispatcher / Operations</option>
            <option value="driver">Driver</option>
            <option value="safety_officer">Safety Officer</option>
            <option value="financial_analyst">Financial Analyst</option>
          </select>
        </div>

        {/* ── User Profile Footer ────────────────────────── */}
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
              <p className="text-sm font-medium text-slate-350 truncate">{userProfile.name}</p>
              <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">{displayRole}</p>
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
      </div>
    </aside>
  );
}
