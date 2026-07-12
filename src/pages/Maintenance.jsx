import { useEffect, useState } from "react";
import { Plus, Wrench, Clock, CheckCircle2, X, AlertCircle } from "lucide-react";
import { supabase } from "../supabaseClient";
import PageHeader from "../components/PageHeader";

export default function Maintenance() {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [vehicleId, setVehicleId] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [cost, setCost] = useState("0");
  const [photoUrl, setPhotoUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("maintenance_logs")
        .select("*, vehicles(id, name, registration_number)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error("Error fetching maintenance logs:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, name, registration_number")
        .order("name", { ascending: true });

      if (error) throw error;
      setVehicles(data || []);
      if (data && data.length > 0) {
        setVehicleId(data[0].id);
      }
    } catch (err) {
      console.error("Error fetching vehicles:", err.message);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchVehicles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitLoading(true);

    if (!vehicleId) {
      setFormError("Please select a vehicle");
      setSubmitLoading(false);
      return;
    }
    if (!issueDescription.trim()) {
      setFormError("Please enter an issue description");
      setSubmitLoading(false);
      return;
    }

    try {
      const parsedCost = parseFloat(cost) || 0;
      const payload = {
        vehicle_id: vehicleId,
        issue_description: issueDescription.trim(),
        status,
        cost: parsedCost,
        photo_url: photoUrl.trim() || null,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
      };

      const { error } = await supabase.from("maintenance_logs").insert(payload);
      if (error) throw error;

      // Reset form and refetch
      setIssueDescription("");
      setStatus("pending");
      setCost("0");
      setPhotoUrl("");
      setModalOpen(false);
      fetchRecords();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <section>
      <PageHeader
        title="Maintenance"
        subtitle="Track and manage vehicle maintenance schedules and resolutions"
      >
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-sm font-semibold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:scale-[1.03] transition-default cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Maintenance Record
        </button>
      </PageHeader>

      {/* ── Table / Content ───────────────────────────────── */}
      {loading ? (
        <div className="glass p-12 flex flex-col items-center justify-center gap-3">
          <span className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></span>
          <p className="text-slate-400 text-sm font-medium">Fetching maintenance logs...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="glass p-12 text-center text-slate-500">
          <Wrench className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="text-base font-semibold text-slate-350">No maintenance records found</p>
          <p className="text-sm text-slate-500 mt-1">Create one to start tracking vehicle issues.</p>
        </div>
      ) : (
        <div className="glass overflow-hidden animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Vehicle", "Registration No.", "Issue Description", "Cost (₹)", "Date Opened", "Status"].map((col) => (
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
                {records.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                      i === records.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {r.vehicles?.name || "Deleted Vehicle"}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {r.vehicles?.registration_number || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-300 max-w-xs truncate" title={r.issue_description}>
                      {r.issue_description}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      ₹{r.cost?.toLocaleString("en-IN") || "0"}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{formatDate(r.created_at)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          r.status === "resolved" ? "badge-closed" : "badge-open"
                        }`}
                      >
                        {r.status === "resolved" ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Resolved</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending</span>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add Record Modal ────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg glass border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-slate-200">Add Maintenance Record</h3>
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

              {/* Vehicle Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Vehicle
                </label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/[0.08] text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                >
                  {vehicles.length === 0 ? (
                    <option value="">No vehicles available</option>
                  ) : (
                    vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.registration_number})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Issue Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Issue Description
                </label>
                <textarea
                  required
                  placeholder="Describe the vehicle's issue (e.g. Engine oil leakage, brake pads worn out)"
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all placeholder-slate-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Cost */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Maintenance Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-white/[0.08] text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {/* Photo URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Photo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/receipt-or-photo.jpg"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all placeholder-slate-550"
                />
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
                  {submitLoading ? "Adding..." : "Add Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
