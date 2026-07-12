/**
 * Trips.jsx — Trip Management Page
 * Owner: Yashvi Sanghvi (TransitOps Hackathon 2026)
 *
 * Features:
 *  - Trip creation: source, destination, vehicle, driver, cargo weight, planned distance
 *  - Trip lifecycle: Draft → Dispatched → Completed → Cancelled
 *  - Validation: cargo weight ≤ vehicle max_load_capacity
 *  - Validation: vehicle/driver already on_trip cannot be reassigned
 *  - Status cascade on Dispatch  → vehicle + driver → 'on_trip'
 *  - Status cascade on Complete  → vehicle + driver → 'available'
 *  - Status cascade on Cancel    → vehicle + driver → 'available' (if dispatched)
 *
 * Database tables used (Supabase):
 *  trips    — id, source, destination, vehicle_id, driver_id, cargo_weight,
 *             planned_distance, final_odometer, fuel_consumed, status,
 *             created_at, dispatched_at, completed_at
 *  vehicles — id, name, registration_number, status, max_load_capacity
 *  drivers  — id, name, license_number, license_expiry_date, status
 */

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Truck,
  X,
  AlertCircle,
  Route,
  CheckCircle2,
  Clock,
  Ban,
  Play,
  Flag,
  RotateCcw,
  Package,
  User,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { supabase } from "../supabaseClient";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const GRID_COLOR = "rgba(148,163,184,0.08)";
const TICK_COLOR = "#64748b";

const darkScales = {
  x: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { family: "Inter", size: 11 } }, border: { color: "transparent" } },
  y: { grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR, font: { family: "Inter", size: 11 } }, border: { color: "transparent" } },
};

const darkLegend = {
  labels: { color: "#cbd5e1", font: { family: "Inter", size: 12 }, padding: 16, usePointStyle: true, pointStyleWidth: 10 },
};
import PageHeader from "../components/PageHeader";

// ── Status helpers ───────────────────────────────────────────────────────────

const STATUS_META = {
  draft:      { label: "Draft",      color: "bg-slate-500/20 border-slate-500/40 text-slate-300" },
  dispatched: { label: "Dispatched", color: "bg-amber-500/15 border-amber-500/30 text-amber-300" },
  completed:  { label: "Completed",  color: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" },
  cancelled:  { label: "Cancelled",  color: "bg-rose-500/15 border-rose-500/30 text-rose-300" },
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.draft;
  const Icon =
    status === "completed" ? CheckCircle2
    : status === "dispatched" ? Play
    : status === "cancelled" ? Ban
    : Clock;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${meta.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {meta.label}
    </span>
  );
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

// ── Input / Label helpers (keep styling consistent with Snehi's pages) ───────

const Label = ({ children }) => (
  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
    {children}
  </label>
);

const inputCls =
  "w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all placeholder-slate-500";

const selectCls =
  "w-full bg-slate-900 border border-white/[0.08] text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer";

// ── Main Component ───────────────────────────────────────────────────────────

export default function Trips() {
  const [trips, setTrips]       = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Complete-trip modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeTrip, setCompleteTrip] = useState(null);
  const [finalOdometer, setFinalOdometer] = useState("");
  const [fuelConsumed, setFuelConsumed] = useState("");

  // New trip form
  const [form, setForm] = useState({
    source: "", destination: "", vehicle_id: "", driver_id: "",
    cargo_weight: "", planned_distance: "",
  });
  const [formError, setFormError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Action loading state (per trip row)
  const [actionLoading, setActionLoading] = useState({});

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          vehicles ( id, name, registration_number, status, max_load_capacity ),
          drivers  ( id, name, license_number, status )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTrips(data || []);
    } catch (err) {
      console.error("fetchTrips:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, name, registration_number, status, max_load_capacity")
        .order("name", { ascending: true });
      if (error) throw error;
      setVehicles(data || []);
    } catch (err) {
      console.error("fetchVehicles:", err.message);
    }
  }, []);

  const fetchDrivers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("drivers")
        .select("id, name, license_number, license_expiry_date, status")
        .order("name", { ascending: true });
      if (error) throw error;
      setDrivers(data || []);
    } catch (err) {
      console.error("fetchDrivers:", err.message);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      let role = localStorage.getItem("active_role");
      if (!role && user) {
        role = user.user_metadata?.role || "fleet_manager";
      }
      if (role === "manager" || !role) role = "fleet_manager";
      setUserRole(role);
    });
    fetchTrips();
    fetchVehicles();
    fetchDrivers();
  }, [fetchTrips, fetchVehicles, fetchDrivers]);

  // ── Derived filtered lists for dropdowns ──────────────────────────────────

  // Available vehicles = not on_trip, not in_shop/in_maintenance, not retired
  const availableVehicles = vehicles.filter(
    (v) => !["on_trip", "in_shop", "in_maintenance", "retired"].includes(v.status)
  );

  // Available drivers = not on_trip, not suspended + license not expired
  const today = new Date().toISOString().split("T")[0];
  const availableDrivers = drivers.filter(
    (d) =>
      !["on_trip", "suspended"].includes(d.status) &&
      (!d.license_expiry_date || d.license_expiry_date >= today)
  );

  // ── Selected vehicle capacity (for live validation hint) ──────────────────
  const selectedVehicle = vehicles.find((v) => v.id === form.vehicle_id);
  const cargoExceedsCapacity =
    selectedVehicle &&
    form.cargo_weight !== "" &&
    parseFloat(form.cargo_weight) > selectedVehicle.max_load_capacity;

  // ── Create Trip ────────────────────────────────────────────────────────────

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitLoading(true);

    const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance } = form;

    // Frontend validations
    if (!source.trim() || !destination.trim() || !vehicle_id || !driver_id || !cargo_weight || !planned_distance) {
      setFormError("All fields are required.");
      setSubmitLoading(false);
      return;
    }

    // Re-fetch vehicle to get latest status & capacity
    const { data: vData } = await supabase.from("vehicles").select("status, max_load_capacity").eq("id", vehicle_id).single();
    if (vData?.status === "on_trip") {
      setFormError("This vehicle is already On Trip. Choose another vehicle.");
      setSubmitLoading(false);
      return;
    }
    if (["in_shop", "in_maintenance", "retired"].includes(vData?.status)) {
      setFormError(`Vehicle status is '${vData.status}' — cannot dispatch.`);
      setSubmitLoading(false);
      return;
    }
    if (vData?.max_load_capacity && parseFloat(cargo_weight) > vData.max_load_capacity) {
      setFormError(
        `Cargo weight (${cargo_weight} kg) exceeds vehicle's max load capacity (${vData.max_load_capacity} kg).`
      );
      setSubmitLoading(false);
      return;
    }

    // Re-fetch driver to get latest status
    const { data: dData } = await supabase.from("drivers").select("status, license_expiry_date").eq("id", driver_id).single();
    if (dData?.status === "on_trip") {
      setFormError("This driver is already On Trip. Choose another driver.");
      setSubmitLoading(false);
      return;
    }
    if (dData?.status === "suspended") {
      setFormError("This driver is suspended and cannot be assigned.");
      setSubmitLoading(false);
      return;
    }
    if (dData?.license_expiry_date && dData.license_expiry_date < today) {
      setFormError(`Driver's license expired on ${dData.license_expiry_date}.`);
      setSubmitLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from("trips").insert({
        source: source.trim(),
        destination: destination.trim(),
        vehicle_id,
        driver_id,
        cargo_weight: parseFloat(cargo_weight),
        planned_distance: parseFloat(planned_distance),
        status: "draft",
      });
      if (error) throw error;

      setForm({ source: "", destination: "", vehicle_id: "", driver_id: "", cargo_weight: "", planned_distance: "" });
      setModalOpen(false);
      fetchTrips();
      fetchVehicles();
      fetchDrivers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Dispatch Trip ──────────────────────────────────────────────────────────
  // Draft → Dispatched: cascade vehicle + driver → 'on_trip'

  const handleDispatch = async (trip) => {
    setActionLoading((prev) => ({ ...prev, [trip.id]: "dispatching" }));
    try {
      // Re-validate before writing
      const { data: vData } = await supabase.from("vehicles").select("status, max_load_capacity").eq("id", trip.vehicle_id).single();
      if (vData?.status === "on_trip") throw new Error("Vehicle just went On Trip — refresh and try again.");
      if (["in_shop", "in_maintenance", "retired"].includes(vData?.status))
        throw new Error(`Vehicle status is '${vData.status}' — cannot dispatch.`);
      if (vData?.max_load_capacity && trip.cargo_weight > vData.max_load_capacity)
        throw new Error(`Cargo ${trip.cargo_weight} kg exceeds vehicle capacity ${vData.max_load_capacity} kg.`);

      const { data: dData } = await supabase.from("drivers").select("status, license_expiry_date").eq("id", trip.driver_id).single();
      if (dData?.status === "on_trip") throw new Error("Driver just went On Trip — refresh and try again.");
      if (dData?.status === "suspended") throw new Error("Driver is suspended.");
      if (dData?.license_expiry_date && dData.license_expiry_date < today)
        throw new Error(`Driver license expired on ${dData.license_expiry_date}.`);

      // Status cascade: trip → dispatched
      const { error: tripErr } = await supabase
        .from("trips")
        .update({ status: "dispatched", dispatched_at: new Date().toISOString() })
        .eq("id", trip.id);
      if (tripErr) throw tripErr;

      // Cascade: vehicle → on_trip
      const { error: vErr } = await supabase.from("vehicles").update({ status: "on_trip" }).eq("id", trip.vehicle_id);
      if (vErr) throw vErr;

      // Cascade: driver → on_trip
      const { error: dErr } = await supabase.from("drivers").update({ status: "on_trip" }).eq("id", trip.driver_id);
      if (dErr) throw dErr;

      fetchTrips();
      fetchVehicles();
      fetchDrivers();
    } catch (err) {
      alert(`Dispatch failed: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [trip.id]: null }));
    }
  };

  // ── Complete Trip ──────────────────────────────────────────────────────────
  // Dispatched → Completed: restore vehicle + driver → 'available'

  const openCompleteModal = (trip) => {
    setCompleteTrip(trip);
    setFinalOdometer("");
    setFuelConsumed("");
    setCompleteModalOpen(true);
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    if (!completeTrip) return;
    setActionLoading((prev) => ({ ...prev, [completeTrip.id]: "completing" }));
    try {
      const { error: tripErr } = await supabase
        .from("trips")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          final_odometer: finalOdometer ? parseFloat(finalOdometer) : null,
          fuel_consumed: fuelConsumed ? parseFloat(fuelConsumed) : null,
        })
        .eq("id", completeTrip.id);
      if (tripErr) throw tripErr;

      // Cascade: vehicle → available
      if (completeTrip.vehicles?.status === "on_trip") {
        await supabase.from("vehicles").update({ status: "available" }).eq("id", completeTrip.vehicle_id);
      }
      // Cascade: driver → available
      if (completeTrip.drivers?.status === "on_trip") {
        await supabase.from("drivers").update({ status: "available" }).eq("id", completeTrip.driver_id);
      }

      setCompleteModalOpen(false);
      setCompleteTrip(null);
      fetchTrips();
      fetchVehicles();
      fetchDrivers();
    } catch (err) {
      alert(`Complete failed: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [completeTrip?.id]: null }));
    }
  };

  // ── Cancel Trip ────────────────────────────────────────────────────────────
  // Draft/Dispatched → Cancelled; if dispatched → restore vehicle + driver

  const handleCancel = async (trip) => {
    if (!window.confirm(`Cancel trip ${trip.id.slice(0, 8)}…? This cannot be undone.`)) return;
    setActionLoading((prev) => ({ ...prev, [trip.id]: "cancelling" }));
    try {
      const { error: tripErr } = await supabase
        .from("trips")
        .update({ status: "cancelled" })
        .eq("id", trip.id);
      if (tripErr) throw tripErr;

      // Only restore if trip was dispatched (vehicle/driver were flipped)
      if (trip.status === "dispatched") {
        if (trip.vehicles?.status === "on_trip") {
          await supabase.from("vehicles").update({ status: "available" }).eq("id", trip.vehicle_id);
        }
        if (trip.drivers?.status === "on_trip") {
          await supabase.from("drivers").update({ status: "available" }).eq("id", trip.driver_id);
        }
      }

      fetchTrips();
      fetchVehicles();
      fetchDrivers();
    } catch (err) {
      alert(`Cancel failed: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [trip.id]: null }));
    }
  };

  // ── Reset to Draft ─────────────────────────────────────────────────────────

  const handleResetDraft = async (trip) => {
    setActionLoading((prev) => ({ ...prev, [trip.id]: "resetting" }));
    try {
      const { error } = await supabase
        .from("trips")
        .update({ status: "draft", dispatched_at: null, completed_at: null })
        .eq("id", trip.id);
      if (error) throw error;
      fetchTrips();
    } catch (err) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [trip.id]: null }));
    }
  };

  // ── Stats bar ──────────────────────────────────────────────────────────────

  const stats = {
    draft:      trips.filter((t) => t.status === "draft").length,
    dispatched: trips.filter((t) => t.status === "dispatched").length,
    completed:  trips.filter((t) => t.status === "completed").length,
    cancelled:  trips.filter((t) => t.status === "cancelled").length,
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section>
      <PageHeader
        title="Trip Management"
        subtitle="Create trips, manage lifecycle, and track vehicle & driver assignments"
      >
        {(userRole === "fleet_manager" || userRole === "driver") && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-sm font-semibold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:scale-[1.03] transition-default cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Trip
          </button>
        )}
      </PageHeader>

      {/* ── Stats row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 animate-fade-in">
        {[
          { label: "Draft",      count: stats.draft,      color: "from-slate-500/20 to-slate-600/10",    border: "border-slate-500/30", text: "text-slate-300" },
          { label: "Dispatched", count: stats.dispatched,  color: "from-amber-500/20 to-amber-600/10",   border: "border-amber-500/30",  text: "text-amber-300" },
          { label: "Completed",  count: stats.completed,   color: "from-emerald-500/20 to-emerald-600/10", border: "border-emerald-500/30", text: "text-emerald-300" },
          { label: "Cancelled",  count: stats.cancelled,   color: "from-rose-500/20 to-rose-600/10",     border: "border-rose-500/30",   text: "text-rose-300" },
        ].map(({ label, count, color, border, text }) => (
          <div
            key={label}
            className={`rounded-2xl bg-gradient-to-br ${color} border ${border} px-5 py-4 flex flex-col gap-1`}
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
            <span className={`text-3xl font-extrabold tracking-tight ${text}`}>{count}</span>
          </div>
        ))}
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="glass p-12 flex flex-col items-center justify-center gap-3">
          <span className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading trips…</p>
        </div>
      ) : trips.length === 0 ? (
        <div className="glass p-12 text-center text-slate-500">
          <Route className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="text-base font-semibold text-slate-350">No trips yet</p>
          <p className="text-sm text-slate-500 mt-1">Create your first trip using the button above.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
          
          {/* ── Charts Section ───────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-5 flex flex-col gap-4">
              <h4 className="text-sm font-bold text-slate-200">Trip Status</h4>
              <div className="h-48 relative">
                <Doughnut
                  data={{
                    labels: ["Draft", "Dispatched", "Completed", "Cancelled"],
                    datasets: [{
                      data: [stats.draft, stats.dispatched, stats.completed, stats.cancelled],
                      backgroundColor: ["rgba(100,116,139,0.5)", "rgba(245,158,11,0.85)", "rgba(16,185,129,0.85)", "rgba(244,63,94,0.85)"],
                      borderColor: ["#64748b", "#f59e0b", "#10b981", "#f43f5e"],
                      borderWidth: 2,
                    }]
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { ...darkLegend, position: 'right' } } }}
                />
              </div>
            </div>

            <div className="glass p-5 flex flex-col gap-4">
              <h4 className="text-sm font-bold text-slate-200">Distance Distribution</h4>
              <div className="h-48">
                <Bar
                  data={{
                    labels: ["<100km", "100-500km", "500-1000km", ">1000km"],
                    datasets: [{
                      label: "Trips",
                      data: [
                        trips.filter(t => t.planned_distance < 100).length,
                        trips.filter(t => t.planned_distance >= 100 && t.planned_distance <= 500).length,
                        trips.filter(t => t.planned_distance > 500 && t.planned_distance <= 1000).length,
                        trips.filter(t => t.planned_distance > 1000).length,
                      ],
                      backgroundColor: "rgba(45,212,191,0.7)",
                      borderColor: "#2dd4bf",
                      borderWidth: 1,
                      borderRadius: 4,
                    }]
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, scales: darkScales, plugins: { legend: { display: false } } }}
                />
              </div>
            </div>

            <div className="glass p-5 flex flex-col gap-4">
              <h4 className="text-sm font-bold text-slate-200">Cargo Utilization</h4>
              <div className="h-48">
                <Bar
                  data={{
                    labels: ["0-25%", "26-50%", "51-75%", "76-100%", "Overload"],
                    datasets: [{
                      label: "Trips",
                      data: [
                        trips.filter(t => { const cap = t.vehicles?.max_load_capacity || 1; const ratio = (t.cargo_weight / cap) * 100; return ratio <= 25; }).length,
                        trips.filter(t => { const cap = t.vehicles?.max_load_capacity || 1; const ratio = (t.cargo_weight / cap) * 100; return ratio > 25 && ratio <= 50; }).length,
                        trips.filter(t => { const cap = t.vehicles?.max_load_capacity || 1; const ratio = (t.cargo_weight / cap) * 100; return ratio > 50 && ratio <= 75; }).length,
                        trips.filter(t => { const cap = t.vehicles?.max_load_capacity || 1; const ratio = (t.cargo_weight / cap) * 100; return ratio > 75 && ratio <= 100; }).length,
                        trips.filter(t => { const cap = t.vehicles?.max_load_capacity || 1; const ratio = (t.cargo_weight / cap) * 100; return ratio > 100; }).length,
                      ],
                      backgroundColor: "rgba(168,85,247,0.7)",
                      borderColor: "#a855f7",
                      borderWidth: 1,
                      borderRadius: 4,
                    }]
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, scales: darkScales, plugins: { legend: { display: false } } }}
                />
              </div>
            </div>
          </div>

          <div className="glass overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Origin → Destination", "Vehicle", "Driver", "Cargo (kg)", "Distance (km)", "Status", "Dispatched", "Actions"].map((col) => (
                    <th key={col} className="px-5 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trips.map((trip, i) => {
                  const busy = actionLoading[trip.id];
                  return (
                    <tr
                      key={trip.id}
                      className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${i === trips.length - 1 ? "border-b-0" : ""}`}
                    >
                      {/* Route */}
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-200">{trip.source}</div>
                        <div className="text-xs text-slate-400 mt-0.5">→ {trip.destination}</div>
                      </td>

                      {/* Vehicle */}
                      <td className="px-5 py-4">
                        <div className="text-slate-300 font-medium">{trip.vehicles?.name ?? "—"}</div>
                        <div className="text-xs text-slate-500 font-mono">{trip.vehicles?.registration_number ?? ""}</div>
                      </td>

                      {/* Driver */}
                      <td className="px-5 py-4 text-slate-300">{trip.drivers?.name ?? "—"}</td>

                      {/* Cargo */}
                      <td className="px-5 py-4 text-slate-300">
                        <span className={trip.cargo_weight > (trip.vehicles?.max_load_capacity ?? Infinity) ? "text-rose-400 font-bold" : ""}>
                          {trip.cargo_weight?.toLocaleString("en-IN")}
                        </span>
                        {trip.vehicles?.max_load_capacity && (
                          <div className="text-[10px] text-slate-500">/ {trip.vehicles.max_load_capacity.toLocaleString("en-IN")} max</div>
                        )}
                      </td>

                      {/* Distance */}
                      <td className="px-5 py-4 text-slate-400">{trip.planned_distance} km</td>

                      {/* Status */}
                      <td className="px-5 py-4"><StatusBadge status={trip.status} /></td>

                      {/* Dispatched At */}
                      <td className="px-5 py-4 text-slate-400 text-xs">{formatDate(trip.dispatched_at)}</td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {(userRole === "fleet_manager" || userRole === "driver") ? (
                            <>
                              {trip.status === "draft" && (
                                <>
                                  <button
                                    title="Dispatch trip"
                                    disabled={!!busy}
                                    onClick={() => handleDispatch(trip)}
                                    className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-default cursor-pointer disabled:opacity-40"
                                  >
                                    {busy === "dispatching" ? <span className="inline-block w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    title="Cancel trip"
                                    disabled={!!busy}
                                    onClick={() => handleCancel(trip)}
                                    className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-default cursor-pointer disabled:opacity-40"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              {trip.status === "dispatched" && (
                                <>
                                  <button
                                    title="Mark as completed"
                                    disabled={!!busy}
                                    onClick={() => openCompleteModal(trip)}
                                    className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-default cursor-pointer disabled:opacity-40"
                                  >
                                    {busy === "completing" ? <span className="inline-block w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    title="Cancel trip (restores vehicle & driver)"
                                    disabled={!!busy}
                                    onClick={() => handleCancel(trip)}
                                    className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-default cursor-pointer disabled:opacity-40"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              {trip.status === "cancelled" && (
                                <button
                                  title="Reset to Draft"
                                  disabled={!!busy}
                                  onClick={() => handleResetDraft(trip)}
                                  className="p-2 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-400 hover:bg-slate-500/20 transition-default cursor-pointer disabled:opacity-40"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {trip.status === "completed" && (
                                <span className="text-xs text-slate-500 italic">—</span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 italic">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* ── Create Trip Modal ──────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-xl glass border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Route className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-slate-200">Create New Trip</h3>
              </div>
              <button
                onClick={() => { setModalOpen(false); setFormError(""); }}
                className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleCreateTrip} className="p-6 space-y-4">
              {formError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Route */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Origin *</Label>
                  <input
                    required
                    placeholder="e.g. Bangalore Depot"
                    value={form.source}
                    onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Destination *</Label>
                  <input
                    required
                    placeholder="e.g. Mysore Hub"
                    value={form.destination}
                    onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Vehicle */}
              <div className="flex flex-col gap-1.5">
                <Label>Vehicle * (available only)</Label>
                <select
                  required
                  value={form.vehicle_id}
                  onChange={(e) => setForm((f) => ({ ...f, vehicle_id: e.target.value }))}
                  className={selectCls}
                >
                  <option value="">— Select vehicle —</option>
                  {availableVehicles.length === 0 ? (
                    <option disabled>No available vehicles right now</option>
                  ) : (
                    availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.registration_number}) — max {v.max_load_capacity} kg
                      </option>
                    ))
                  )}
                </select>
                {selectedVehicle && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    <Truck className="inline w-3 h-3 mr-1" />
                    Max load: <span className="text-slate-300 font-medium">{selectedVehicle.max_load_capacity} kg</span>
                  </p>
                )}
              </div>

              {/* Driver */}
              <div className="flex flex-col gap-1.5">
                <Label>Driver *</Label>
                <select
                  required
                  value={form.driver_id}
                  onChange={(e) => setForm((f) => ({ ...f, driver_id: e.target.value }))}
                  className={selectCls}
                >
                  <option value="">— Select driver —</option>
                  {drivers.length === 0 ? (
                    <option disabled>No drivers found in database</option>
                  ) : (
                    drivers.map((d) => {
                      const isOnTrip = d.status === "on_trip";
                      const isSuspended = d.status === "suspended";
                      const isExpired = d.license_expiry_date && d.license_expiry_date < today;
                      const tag = isOnTrip ? " [On Trip]" : isSuspended ? " [Suspended]" : isExpired ? " [License Expired]" : "";
                      return (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.license_number}){tag}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              {/* Cargo + Distance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Cargo Weight (kg) *</Label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 450"
                    value={form.cargo_weight}
                    onChange={(e) => setForm((f) => ({ ...f, cargo_weight: e.target.value }))}
                    className={`${inputCls} ${cargoExceedsCapacity ? "border-rose-500/60 focus:border-rose-500/80 focus:ring-rose-500/20" : ""}`}
                  />
                  {cargoExceedsCapacity && (
                    <p className="text-xs text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Exceeds vehicle capacity ({selectedVehicle.max_load_capacity} kg)!
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Planned Distance (km) *</Label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 140"
                    value={form.planned_distance}
                    onChange={(e) => setForm((f) => ({ ...f, planned_distance: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 pt-4 border-t border-white/[0.06] mt-2">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); setFormError(""); }}
                  className="flex-1 px-5 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] font-semibold text-sm transition-default cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading || cargoExceedsCapacity}
                  className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-sm hover:scale-[1.02] transition-default disabled:opacity-50 disabled:scale-100 cursor-pointer"
                >
                  {submitLoading ? "Creating…" : "Create Trip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Complete Trip Modal ─────────────────────────────────────── */}
      {completeModalOpen && completeTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md glass border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-200">Complete Trip</h3>
              </div>
              <button
                onClick={() => setCompleteModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleComplete} className="p-6 space-y-4">
              <p className="text-sm text-slate-400">
                Completing this trip will restore <span className="text-teal-300 font-medium">{completeTrip.vehicles?.name}</span> and{" "}
                <span className="text-teal-300 font-medium">{completeTrip.drivers?.name}</span> back to{" "}
                <span className="text-emerald-300 font-medium">Available</span>.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Final Odometer (km)</Label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Optional"
                    value={finalOdometer}
                    onChange={(e) => setFinalOdometer(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Fuel Consumed (L)</Label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Optional"
                    value={fuelConsumed}
                    onChange={(e) => setFuelConsumed(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="flex-1 px-5 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] font-semibold text-sm transition-default cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm hover:scale-[1.02] transition-default cursor-pointer"
                >
                  Confirm Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
