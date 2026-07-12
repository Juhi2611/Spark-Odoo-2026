import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import LiveMap from "./pages/LiveMap";
import Maintenance from "./pages/Maintenance";
import FuelExpense from "./pages/FuelExpense";
import Reports from "./pages/Reports";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Trips from "./pages/Trips";
import SeedDrivers from "./pages/SeedDrivers";
import ModuleFeature from "./pages/ModuleFeature";

/** Map each role to its default landing page */
const ROLE_DEFAULT_PAGE = {
  super_admin: "/dashboard",
  fleet_manager: "/dashboard",
  dispatcher: "/trips",
  driver: "/trips",
  safety_officer: "/drivers",
  financial_analyst: "/fuel-expense",
  // Legacy fallbacks
  manager: "/dashboard",
};

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false);

      // When a new user signs in, redirect to their role's default page
      if (event === "SIGNED_IN" && session) {
        const role = session.user?.user_metadata?.role || "fleet_manager";
        const defaultPage = ROLE_DEFAULT_PAGE[role] || "/dashboard";
        window.location.hash = ""; // clear any stale hash
        // Use a small delay to ensure React Router has mounted
        setTimeout(() => {
          window.location.replace(defaultPage);
        }, 50);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <span className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></span>
          <p className="text-sm font-semibold tracking-wider text-teal-400">Loading TransitOps...</p>
        </div>
      </div>
    );
  }

  // Not logged in — show landing page, login page, or redirect to landing
  if (!session) {
    return (
      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    );
  }

  // Determine current user's role for the default redirect
  const userRole = session.user?.user_metadata?.role || "fleet_manager";
  const defaultPage = ROLE_DEFAULT_PAGE[userRole] || "/dashboard";

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to={defaultPage} replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/live-map" element={<LiveMap />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/seed-drivers" element={<SeedDrivers />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/fuel-expense" element={<FuelExpense />} />
          <Route path="/reports" element={<Reports />} />
          {/* Specialized dynamic features */}
          <Route path="/users" element={<ModuleFeature />} />
          <Route path="/branches" element={<ModuleFeature />} />
          <Route path="/settings" element={<ModuleFeature />} />
          <Route path="/audit-logs" element={<ModuleFeature />} />
          <Route path="/backup-restore" element={<ModuleFeature />} />
          <Route path="/cargo" element={<ModuleFeature />} />
          <Route path="/scheduling" element={<ModuleFeature />} />
          <Route path="/incident-reports" element={<ModuleFeature />} />
          <Route path="/documents" element={<ModuleFeature />} />
          <Route path="/profile" element={<ModuleFeature />} />
          <Route path="/license-management" element={<ModuleFeature />} />
          <Route path="/compliance" element={<ModuleFeature />} />
          <Route path="/inspections" element={<ModuleFeature />} />
          <Route path="/export" element={<ModuleFeature />} />
          {/* Redirect /landing and /login to dashboard when already logged in */}
          <Route path="/landing" element={<Navigate to={defaultPage} replace />} />
          <Route path="/login" element={<Navigate to={defaultPage} replace />} />
          <Route path="*" element={<Navigate to={defaultPage} replace />} />
        </Routes>
      </main>
    </div>
  );
}
