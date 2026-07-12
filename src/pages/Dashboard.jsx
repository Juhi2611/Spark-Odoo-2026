import { useEffect, useState } from "react";
import {
  Truck,
  CheckCircle2,
  Wrench,
  Route,
  Clock,
  UserCheck,
  Gauge,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import KPICard from "../components/KPICard";
import PageHeader from "../components/PageHeader";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeVehicles: 0,
    availableVehicles: 0,
    inMaintenance: 0,
    activeTrips: 0,
    pendingTrips: 0,
    driversOnDuty: 0,
    utilization: 0,
  });

  const [filterType, setFilterType] = useState("All Types");
  const [filterStatus, setFilterStatus] = useState("All Statuses");
  const [filterRegion, setFilterRegion] = useState("All Regions");

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch vehicles
      const { data: vehicles, error: vehErr } = await supabase.from("vehicles").select("*");
      if (vehErr) throw vehErr;

      // Apply client-side filters for dashboard lists or calculations if needed
      let filteredVehicles = vehicles || [];
      if (filterType !== "All Types") {
        filteredVehicles = filteredVehicles.filter(
          (v) => v.type?.toLowerCase() === filterType.toLowerCase()
        );
      }
      if (filterStatus !== "All Statuses") {
        filteredVehicles = filteredVehicles.filter(
          (v) => v.status?.toLowerCase() === filterStatus.toLowerCase()
        );
      }
      if (filterRegion !== "All Regions") {
        filteredVehicles = filteredVehicles.filter(
          (v) => v.region?.toLowerCase() === filterRegion.toLowerCase()
        );
      }

      const total = filteredVehicles.length;
      const active = filteredVehicles.filter(
        (v) => v.status === "active" || v.status === "on_trip"
      ).length;
      const available = filteredVehicles.filter((v) => v.status === "available").length;
      const maintenance = filteredVehicles.filter(
        (v) => v.status === "in_maintenance" || v.status === "in_shop"
      ).length;

      const utilizationPercent = total > 0 ? Math.round((active / total) * 100) : 0;

      // 2. Fetch trips
      const { data: trips, error: tripErr } = await supabase.from("trips").select("status");
      if (tripErr) throw tripErr;

      const activeTripsCount = (trips || []).filter(
        (t) => t.status === "active" || t.status === "dispatched"
      ).length;
      const pendingTripsCount = (trips || []).filter(
        (t) => t.status === "pending" || t.status === "draft"
      ).length;

      // 3. Fetch profiles to get drivers count
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("role", "driver");
      if (profErr) throw profErr;

      const driversCount = (profiles || []).length;

      setStats({
        activeVehicles: active,
        availableVehicles: available,
        inMaintenance: maintenance,
        activeTrips: activeTripsCount,
        pendingTrips: pendingTripsCount,
        driversOnDuty: driversCount || activeTripsCount, // fallback to active trips count if no drivers registered yet
        utilization: utilizationPercent,
      });
    } catch (err) {
      console.error("Error loading dashboard metrics:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [filterType, filterStatus, filterRegion]);

  const kpis = [
    {
      label: "Active Vehicles",
      value: loading ? "..." : stats.activeVehicles.toString(),
      icon: Truck,
      accent: "text-teal-400",
    },
    {
      label: "Available Vehicles",
      value: loading ? "..." : stats.availableVehicles.toString(),
      icon: CheckCircle2,
      accent: "text-emerald-400",
    },
    {
      label: "In Maintenance",
      value: loading ? "..." : stats.inMaintenance.toString(),
      icon: Wrench,
      accent: "text-amber-400",
    },
    {
      label: "Active Trips",
      value: loading ? "..." : stats.activeTrips.toString(),
      icon: Route,
      accent: "text-cyan-400",
    },
    {
      label: "Pending Trips",
      value: loading ? "..." : stats.pendingTrips.toString(),
      icon: Clock,
      accent: "text-orange-400",
    },
    {
      label: "Drivers On Duty",
      value: loading ? "..." : stats.driversOnDuty.toString(),
      icon: UserCheck,
      accent: "text-indigo-400",
    },
    {
      label: "Fleet Utilization %",
      value: loading ? "..." : `${stats.utilization}%`,
      icon: Gauge,
      accent: "text-rose-400",
    },
  ];

  const filters = [
    {
      id: "vehicle-type",
      label: "Vehicle Type",
      options: ["All Types", "Bus", "Van", "Truck", "Sedan"],
      value: filterType,
      setValue: setFilterType,
    },
    {
      id: "status",
      label: "Status",
      options: ["All Statuses", "Active", "Available", "On Trip", "In Shop", "Retired"],
      value: filterStatus,
      setValue: setFilterStatus,
    },
    {
      id: "region",
      label: "Region",
      options: ["All Regions", "North", "South", "East", "West"],
      value: filterRegion,
      setValue: setFilterRegion,
    },
  ];

  return (
    <section>
      <PageHeader
        title="Dashboard"
        subtitle="Fleet overview at a glance — real-time database-driven metrics"
      />

      {/* ── Filter bar ──────────────────────────────────── */}
      <div
        className="glass-sm p-4 mb-8 flex flex-wrap items-center gap-4 animate-fade-in"
        style={{ animationDelay: "60ms" }}
      >
        {filters.map(({ id, label, options, value, setValue }) => (
          <div key={id} className="flex flex-col gap-1">
            <label
              htmlFor={id}
              className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest"
            >
              {label}
            </label>
            <select
              id={id}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="bg-white/[0.05] border border-white/[0.08] text-sm text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer appearance-none min-w-[160px]"
            >
              {options.map((opt) => (
                <option key={opt} value={opt} className="bg-slate-900 text-slate-200">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        ))}

        <button
          onClick={loadDashboardData}
          className="ml-auto mt-auto px-5 py-2 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 text-sm font-medium hover:bg-teal-500/25 transition-default cursor-pointer"
        >
          Refresh Data
        </button>
      </div>

      {/* ── KPI grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} delay={i} />
        ))}
      </div>
    </section>
  );
}
