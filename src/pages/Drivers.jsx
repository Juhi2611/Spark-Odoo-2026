/**
 * Drivers.jsx — Driver Management Page
 * Owner: Juhi Vanjara (TransitOps Hackathon 2026)
 *
 * Features:
 *  - CRUD for drivers with Supabase
 *  - Fields: Name, License Number, License Category, License Expiry Date,
 *            Contact Number, Safety Score, Status
 *  - Status values: Available, On Trip, Off Duty, Suspended
 *  - Expired-license and suspended drivers highlighted
 */

import { useEffect, useState } from "react";
import { Plus, UserCheck, AlertCircle, X, Phone, FileSignature, ShieldCheck } from "lucide-react";
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

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Form state
  const [name, setName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseCategory, setLicenseCategory] = useState("LMV");
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [safetyScore, setSafetyScore] = useState("");
  const [status, setStatus] = useState("available");
  const [formError, setFormError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDrivers(data || []);
    } catch (err) {
      console.error("Error fetching drivers:", err.message);
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
    fetchDrivers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitLoading(true);

    if (!name.trim() || !licenseNumber.trim() || !contactNumber.trim() || !licenseExpiryDate) {
      setFormError("All required fields must be filled");
      setSubmitLoading(false);
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        license_number: licenseNumber.trim(),
        license_category: licenseCategory,
        license_expiry_date: licenseExpiryDate,
        contact_number: contactNumber.trim(),
        safety_score: safetyScore ? parseFloat(safetyScore) : 100,
        status,
      };

      const { error } = await supabase.from("drivers").insert(payload);
      if (error) throw error;

      // Reset form
      setName("");
      setLicenseNumber("");
      setLicenseCategory("LMV");
      setLicenseExpiryDate("");
      setContactNumber("");
      setSafetyScore("");
      setStatus("available");
      setModalOpen(false);
      fetchDrivers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusBadgeClass = (statusStr) => {
    switch (statusStr) {
      case "available":
        return "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300";
      case "on_trip":
        return "bg-cyan-500/15 border border-cyan-500/30 text-cyan-300";
      case "off_duty":
        return "bg-slate-500/15 border border-slate-500/30 text-slate-300";
      case "suspended":
        return "bg-rose-500/15 border border-rose-500/30 text-rose-300";
      default:
        return "bg-slate-500/15 border border-slate-500/30 text-slate-300";
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <section>
      <PageHeader
        title="Drivers"
        subtitle="Manage driver profiles, licenses, safety scores, and current assignments"
      >
        {(userRole === "fleet_manager" || userRole === "safety_officer") && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-sm font-semibold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:scale-[1.03] transition-default cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Driver
          </button>
        )}
      </PageHeader>

      {/* ── Table of Drivers ─────────────────────────────── */}
      {loading ? (
        <div className="glass p-12 flex flex-col items-center justify-center gap-3">
          <span className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></span>
          <p className="text-slate-400 text-sm font-medium">Loading drivers...</p>
        </div>
      ) : drivers.length === 0 ? (
        <div className="glass p-12 text-center text-slate-500">
          <UserCheck className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="text-base font-semibold text-slate-350">No drivers registered yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Add a driver to start managing assignments and trips.
          </p>
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
                    labels: ["Available", "On Trip", "Off Duty", "Suspended"],
                    datasets: [{
                      data: [
                        drivers.filter(d => d.status === "available").length,
                        drivers.filter(d => d.status === "on_trip" || d.status === "active").length,
                        drivers.filter(d => d.status === "off_duty").length,
                        drivers.filter(d => d.status === "suspended").length,
                      ],
                      backgroundColor: ["rgba(45,212,191,0.85)", "rgba(56,189,248,0.85)", "rgba(100,116,139,0.5)", "rgba(244,63,94,0.85)"],
                      borderColor: ["#2dd4bf", "#38bdf8", "#64748b", "#f43f5e"],
                      borderWidth: 2,
                    }]
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { ...darkLegend, position: 'right' } } }}
                />
              </div>
            </div>

            <div className="glass p-5 flex flex-col gap-4">
              <h4 className="text-sm font-bold text-slate-200">Safety Score Breakdown</h4>
              <div className="h-48">
                <Bar
                  data={{
                    labels: ["90-100", "80-89", "70-79", "<70"],
                    datasets: [{
                      label: "Drivers",
                      data: [
                        drivers.filter(d => (d.safety_score ?? 100) >= 90).length,
                        drivers.filter(d => (d.safety_score ?? 100) >= 80 && (d.safety_score ?? 100) < 90).length,
                        drivers.filter(d => (d.safety_score ?? 100) >= 70 && (d.safety_score ?? 100) < 80).length,
                        drivers.filter(d => (d.safety_score ?? 100) < 70).length,
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
              <h4 className="text-sm font-bold text-slate-200">License Categories</h4>
              <div className="h-48 relative">
                <Doughnut
                  data={{
                    labels: ["LMV", "HMV", "HGMV", "TRANS"],
                    datasets: [{
                      data: [
                        drivers.filter(d => d.license_category === "LMV").length,
                        drivers.filter(d => d.license_category === "HMV").length,
                        drivers.filter(d => d.license_category === "HGMV").length,
                        drivers.filter(d => d.license_category === "TRANS").length,
                      ],
                      backgroundColor: ["rgba(45,212,191,0.85)", "rgba(251,191,36,0.85)", "rgba(56,189,248,0.85)", "rgba(129,140,248,0.85)"],
                      borderColor: ["#2dd4bf", "#fbbf24", "#38bdf8", "#818cf8"],
                      borderWidth: 2,
                    }]
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { ...darkLegend, position: 'right' } } }}
                />
              </div>
            </div>
          </div>

          <div className="glass overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Name", "License No.", "Category", "Expiry Date", "Contact", "Safety Score", "Status"].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-6 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {drivers.map((d, i) => {
                  const isExpired = d.license_expiry_date && d.license_expiry_date < today;
                  return (
                    <tr
                      key={d.id}
                      className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                        i === drivers.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-slate-200">{d.name}</td>
                      <td className="px-6 py-4 text-slate-300 font-mono text-xs">{d.license_number}</td>
                      <td className="px-6 py-4 text-slate-350 uppercase text-xs font-semibold">
                        {d.license_category || "—"}
                      </td>
                      <td className={`px-6 py-4 font-mono text-xs ${isExpired ? "text-rose-400 font-bold" : "text-slate-400"}`}>
                        {d.license_expiry_date || "—"}
                        {isExpired && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-300 uppercase font-bold">
                            Expired
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-300">{d.contact_number || "—"}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                (d.safety_score ?? 100) >= 80
                                  ? "bg-emerald-400"
                                  : (d.safety_score ?? 100) >= 50
                                  ? "bg-amber-400"
                                  : "bg-rose-400"
                              }`}
                              style={{ width: `${d.safety_score ?? 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-300 font-medium">{d.safety_score ?? 100}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusBadgeClass(
                            d.status
                          )}`}
                        >
                          {d.status?.replace("_", " ") || "—"}
                        </span>
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

      {/* ── Add Driver Modal ──────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg glass border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-slate-200">Register New Driver</h3>
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
                {/* Driver Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Driver Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                </div>

                {/* Contact Number */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Contact Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* License Number */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    License No. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GJ01-2024-12345"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                </div>

                {/* License Category */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    License Category
                  </label>
                  <select
                    value={licenseCategory}
                    onChange={(e) => setLicenseCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-white/[0.08] text-slate-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                  >
                    <option value="LMV">LMV</option>
                    <option value="HMV">HMV</option>
                    <option value="HGMV">HGMV</option>
                    <option value="TRANS">Transport</option>
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
                    <option value="off_duty">Off Duty</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* License Expiry Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    License Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={licenseExpiryDate}
                    onChange={(e) => setLicenseExpiryDate(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all [color-scheme:dark]"
                  />
                </div>

                {/* Safety Score */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Safety Score (0–100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 95"
                    value={safetyScore}
                    onChange={(e) => setSafetyScore(e.target.value)}
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
