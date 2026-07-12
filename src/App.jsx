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
import Trips from "./pages/Trips";
import SeedDrivers from "./pages/SeedDrivers";

/** Map each role to its default landing page */
const ROLE_DEFAULT_PAGE = {
  fleet_manager: "/dashboard",
  driver: "/trips",
  safety_officer: "/drivers",
  financial_analyst: "/fuel-expense",
  // Legacy fallbacks
  manager: "/dashboard",
  dispatcher: "/trips",
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

  if (!session) {
    return <Login />;
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
          <Route path="*" element={<Navigate to={defaultPage} replace />} />
        </Routes>
      </main>
    </div>
  );
}
