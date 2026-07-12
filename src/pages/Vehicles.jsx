import { useEffect, useState } from "react";
import { Plus, Truck, CheckCircle2, AlertCircle, X, MapPin, DollarSign, Activity } from "lucide-react";
import { supabase } from "../supabaseClient";
import PageHeader from "../components/PageHeader";

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [type, setType] = useState("bus");
  const [status, setStatus] = useState("available");
  const [region, setRegion] = useState("north");
  const [maxLoadCapacity, setMaxLoadCapacity] = useState("");
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
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-sm font-semibold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:scale-[1.03] transition-default cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </button>
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
        <div className="glass overflow-hidden animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Name", "Registration No.", "Type", "Region", "Max Load (kg)", "Acquisition Cost", "Status"].map((col) => (
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
                    <option value="active">Active</option>
                    <option value="on_trip">On Trip</option>
                    <option value="in_shop">In Shop</option>
                    <option value="in_maintenance">In Mnt</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Max Load Capacity */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Max Load Capacity (kg) *
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

                {/* Acquisition Cost */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Acquisition Cost (₹) *
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
