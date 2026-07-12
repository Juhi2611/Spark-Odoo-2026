import { useEffect, useState } from "react";
import { Plus, Truck, CheckCircle2, AlertCircle, X, MapPin, DollarSign, Activity } from "lucide-react";
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

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [type, setType] = useState("bus");
  const [status, setStatus] = useState("available");
  const [region, setRegion] = useState("north");
  const [maxLoadCapacity, setMaxLoadCapacity] = useState("");
  const [odometer, setOdometer] = useState("");
  const [acquisitionCost, setAcquisitionCost] = useState("");
  const [formError, setFormError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (err) {
      console.error("Error fetching vehicles:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      let role = localStorage.getItem("active_role");
      if (!role && user) {
        role = user.user_metadata?.role || "fleet_manager";
      }
      if (role === "manager" || !role) role = "fleet_manager";
      setUserRole(role);
    });
    fetchVehicles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitLoading(true);

    if (!name.trim() || !registrationNumber.trim() || !maxLoadCapacity || !acquisitionCost) {
      setFormError("All required fields must be filled");
      setSubmitLoading(false);
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        registration_number: registrationNumber.trim(),
        type,
        status,
        region,
        max_load_capacity: parseFloat(maxLoadCapacity),
        odometer: odometer ? parseFloat(odometer) : 0,
        acquisition_cost: parseFloat(acquisitionCost),
      };

      const { error } = await supabase.from("vehicles").insert(payload);
      if (error) throw error;

      // Reset form
      setName("");
      setRegistrationNumber("");
      setType("bus");
      setStatus("available");
      setRegion("north");
      setMaxLoadCapacity("");
      setOdometer("");
      setAcquisitionCost("");
      setModalOpen(false);
      fetchVehicles();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusBadgeClass = (statusStr) => {
    switch (statusStr) {
      case "active":
      case "available":
        return "badge-closed"; // Emerald green
      case "on_trip":
        return "badge-open"; // Teal/cyan
      case "in_maintenance":
      case "in_shop":
        return "bg-amber-500/15 border border-amber-500/30 text-amber-350"; // Amber
      default:
        return "bg-slate-500/15 border border-slate-500/30 text-slate-350"; // Slate
    }
  };

  return (
    <section>
      <PageHeader
        title="Vehicles"
        subtitle="Manage fleet vehicles, monitor status, and add new assets to the database"
      >
        {userRole === "fleet_manager" && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-sm font-semibold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:scale-[1.03] transition-default cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Vehicle
          </button>
        )}
      </PageHeader>

      {/* ── Grid / Table of Vehicles ─────────────────────── */}
      {loading ? (
        <div className="glass p-12 flex flex-col items-center justify-center gap-3">
          <span className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></span>
          <p className="text-slate-400 text-sm font-medium">Loading fleet vehicles...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="glass p-12 text-center text-slate-500">
          <Truck className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="text-base font-semibold text-slate-350">No vehicles registered yet</p>
          <p className="text-sm text-slate-500 mt-1">Register a vehicle to start tracking maintenance and trips.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
          
          {/* ── Charts Section ───────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-5 flex flex-col gap-4">
              <h4 className="text-sm font-bold text-slate-200">Status Distribution</h4>
              <div className="h-48 relative">
                <Doughnut
                  data={{
                    labels: ["Available", "On Trip", "In Maintenance", "Retired"],
                    datasets: [{
                      data: [
                        vehicles.filter(v => v.status === "available").length,
                        vehicles.filter(v => v.status === "on_trip" || v.status === "active").length,
                        vehicles.filter(v => v.status === "in_maintenance" || v.status === "in_shop").length,
                        vehicles.filter(v => v.status === "retired").length,
                      ],
                      backgroundColor: ["rgba(45,212,191,0.85)", "rgba(56,189,248,0.85)", "rgba(251,191,36,0.85)", "rgba(100,116,139,0.5)"],
                      borderColor: ["#2dd4bf", "#38bdf8", "#fbbf24", "#64748b"],
                      borderWidth: 2,
                    }]
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { ...darkLegend, position: 'right' } } }}
                />
              </div>
            </div>

            <div className="glass p-5 flex flex-col gap-4">
              <h4 className="text-sm font-bold text-slate-200">Vehicle Type Breakdown</h4>
              <div className="h-48">
                <Bar
                  data={{
                    labels: ["Bus", "Van", "Truck", "Sedan"],
                    datasets: [{
                      label: "Asset Count",
                      data: [
                        vehicles.filter(v => v.type === "bus").length,
                        vehicles.filter(v => v.type === "van").length,
                        vehicles.filter(v => v.type === "truck").length,
                        vehicles.filter(v => v.type === "sedan").length,
                      ],
                      backgroundColor: "rgba(129,140,248,0.7)",
                      borderColor: "#818cf8",
                      borderWidth: 1,
                      borderRadius: 4,
                    }]
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, scales: darkScales, plugins: { legend: { display: false } } }}
                />
              </div>
            </div>

            <div className="glass p-5 flex flex-col gap-4">
              <h4 className="text-sm font-bold text-slate-200">Region Distribution</h4>
              <div className="h-48">
                <Bar
                  data={{
                    labels: ["North", "South", "East", "West"],
                    datasets: [{
                      label: "Vehicles",
                      data: [
                        vehicles.filter(v => v.region === "north").length,
                        vehicles.filter(v => v.region === "south").length,
                        vehicles.filter(v => v.region === "east").length,
                        vehicles.filter(v => v.region === "west").length,
                      ],
                      backgroundColor: "rgba(45,212,191,0.7)",
                      borderColor: "#2dd4bf",
                      borderWidth: 1,
                      borderRadius: 4,
                    }]
                  }}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: darkScales,
                    plugins: { legend: { display: false } }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="glass overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Name", "Registration No.", "Type", "Region", "Max Load (kg)", "Odometer (km)", "Acquisition Cost", "Status"].map((col) => (
                    <th
                      key={col}
                      className="px-6 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v, i) => (
                  <tr
                    key={v.id}
                    className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                      i === vehicles.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="px-6 py-4 font-bold text-slate-200">{v.name}</td>
                    <td className="px-6 py-4 text-slate-300 font-mono text-xs">{v.registration_number}</td>
                    <td className="px-6 py-4 text-slate-350 capitalize">{v.type}</td>
                    <td className="px-6 py-4 text-slate-400 capitalize">{v.region || "-"}</td>
                    <td className="px-6 py-4 text-slate-300">
                      {v.max_load_capacity?.toLocaleString("en-IN")} kg
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {v.odometer?.toLocaleString("en-IN") ?? 0} km
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      ₹{v.acquisition_cost?.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusBadgeClass(
                          v.status
                        )}`}
                      >
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* ── Add Vehicle Modal ───────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg glass border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-slate-200">Register New Vehicle</h3>
              </div>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setFormError("");
                }}
                className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Vehicle Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Vehicle Name/Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BUS-1042"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                </div>

                {/* Registration Number */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Registration No. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GJ-01-XX-1234"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-900 border border-white/[0.08] text-slate-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                  >
                    <option value="bus">Bus</option>
                    <option value="van">Van</option>
                    <option value="truck">Truck</option>
                    <option value="sedan">Sedan</option>
                  </select>
                </div>

                {/* Region */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Region
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-slate-900 border border-white/[0.08] text-slate-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                  >
                    <option value="north">North</option>
                    <option value="south">South</option>
                    <option value="east">East</option>
                    <option value="west">West</option>
                  </select>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-white/[0.08] text-slate-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                  >
                    <option value="available">Available</option>
                    <option value="on_trip">On Trip</option>
                    <option value="in_shop">In Shop</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Max Load Capacity */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Max Load (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000"
                    value={maxLoadCapacity}
                    onChange={(e) => setMaxLoadCapacity(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                </div>

                {/* Odometer */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Odometer (km)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 12500"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                </div>

                {/* Acquisition Cost */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Acq. Cost (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2500000"
                    value={acquisitionCost}
                    onChange={(e) => setAcquisitionCost(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4 border-t border-white/[0.06] mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setFormError("");
                  }}
                  className="flex-1 px-5 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] font-semibold text-sm transition-default cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-sm hover:scale-[1.02] transition-default disabled:opacity-50 disabled:scale-100 cursor-pointer"
                >
                  {submitLoading ? "Adding..." : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
