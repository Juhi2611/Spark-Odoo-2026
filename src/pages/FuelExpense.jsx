import { useEffect, useState } from "react";
import { IndianRupee, Plus, Fuel, CreditCard, X, AlertCircle } from "lucide-react";
import { supabase } from "../supabaseClient";
import PageHeader from "../components/PageHeader";

const EXPENSE_CATEGORIES = {
  toll: "Toll Charges",
  parking: "Parking Fees",
  driver_allowance: "Driver Allowance",
  insurance: "Insurance",
  other: "Other",
};

export default function FuelExpense() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenseLogs, setExpenseLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [fuelModalOpen, setFuelModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  // Shared vehicles fetched for dropdowns
  const [vehicleId, setVehicleId] = useState("");

  // Fuel form state
  const [fuelLiters, setFuelLiters] = useState("");
  const [fuelCost, setFuelCost] = useState("");
  const [fuelDate, setFuelDate] = useState(new Date().toISOString().slice(0, 10));
  const [fuelError, setFuelError] = useState("");
  const [fuelLoading, setFuelLoading] = useState(false);

  // Expense form state
  const [expenseCategory, setExpenseCategory] = useState("other");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenseError, setExpenseError] = useState("");
  const [expenseLoading, setExpenseLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch fuel logs
      const { data: fuelData, error: fuelErr } = await supabase
        .from("fuel_logs")
        .select("*, vehicles(id, name, registration_number)")
        .order("log_date", { ascending: false });
      if (fuelErr) throw fuelErr;
      setFuelLogs(fuelData || []);

      // 2. Fetch expenses
      const { data: expData, error: expErr } = await supabase
        .from("expenses")
        .select("*, vehicles(id, name, registration_number)")
        .order("expense_date", { ascending: false });
      if (expErr) throw expErr;
      setExpenseLogs(expData || []);
    } catch (err) {
      console.error("Error fetching fuel or expense logs:", err.message);
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
    fetchData();
    fetchVehicles();
  }, []);

  const handleAddFuel = async (e) => {
    e.preventDefault();
    setFuelError("");
    setFuelLoading(true);

    if (!vehicleId) {
      setFuelError("Please select a vehicle");
      setFuelLoading(false);
      return;
    }
    if (!fuelLiters || parseFloat(fuelLiters) <= 0) {
      setFuelError("Please enter a valid liters quantity");
      setFuelLoading(false);
      return;
    }
    if (!fuelCost || parseFloat(fuelCost) <= 0) {
      setFuelError("Please enter a valid cost");
      setFuelLoading(false);
      return;
    }

    try {
      const payload = {
        vehicle_id: vehicleId,
        liters: parseFloat(fuelLiters),
        cost: parseFloat(fuelCost),
        log_date: fuelDate,
      };

      const { error } = await supabase.from("fuel_logs").insert(payload);
      if (error) throw error;

      // Reset & close
      setFuelLiters("");
      setFuelCost("");
      setFuelModalOpen(false);
      fetchData();
    } catch (err) {
      setFuelError(err.message);
    } finally {
      setFuelLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setExpenseError("");
    setExpenseLoading(true);

    if (!vehicleId) {
      setExpenseError("Please select a vehicle");
      setExpenseLoading(false);
      return;
    }
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      setExpenseError("Please enter a valid amount");
      setExpenseLoading(false);
      return;
    }

    try {
      const payload = {
        vehicle_id: vehicleId,
        category: expenseCategory,
        amount: parseFloat(expenseAmount),
        expense_date: expenseDate,
      };

      const { error } = await supabase.from("expenses").insert(payload);
      if (error) throw error;

      // Reset & close
      setExpenseAmount("");
      setExpenseCategory("other");
      setExpenseModalOpen(false);
      fetchData();
    } catch (err) {
      setExpenseError(err.message);
    } finally {
      setExpenseLoading(false);
    }
  };

  // Calculate dynamic monthly cost (current month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthFuelCost = fuelLogs
    .filter((log) => {
      const d = new Date(log.log_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, log) => acc + (log.cost || 0), 0);

  const thisMonthExpenseCost = expenseLogs
    .filter((log) => {
      const d = new Date(log.expense_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, log) => acc + (log.amount || 0), 0);

  const totalMonthlyCost = thisMonthFuelCost + thisMonthExpenseCost;

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
        title="Fuel & Expense"
        subtitle="Consolidated view of fuel consumption and operational expenses"
      >
        <div className="flex gap-3">
          <button
            onClick={() => setFuelModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-350 text-sm font-semibold hover:bg-teal-500/25 transition-default cursor-pointer"
          >
            <Fuel className="w-4 h-4" />
            Add Fuel Log
          </button>
          <button
            onClick={() => setExpenseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-sm font-semibold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:scale-[1.03] transition-default cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Expense Log
          </button>
        </div>
      </PageHeader>

      {/* ── Total cost summary ──────────────────────────── */}
      <div
        className="glass glow p-6 mb-8 flex items-center gap-4 animate-fade-in"
        style={{ animationDelay: "60ms" }}
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 border border-teal-500/20 animate-pulse duration-4000">
          <IndianRupee className="w-7 h-7 text-teal-400" />
        </div>
        <div>
          <p className="text-3xl font-extrabold text-slate-100">
            ₹{totalMonthlyCost.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total Operational Cost (This Month)
          </p>
        </div>
      </div>

      {/* ── Side-by-side tables ─────────────────────────── */}
      {loading ? (
        <div className="glass p-12 flex flex-col items-center justify-center gap-3">
          <span className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></span>
          <p className="text-slate-400 text-sm font-medium">Loading fuel and expense logs...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: "160ms" }}>
          {/* Fuel Logs Table */}
          <div className="glass overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
              <Fuel className="w-4 h-4 text-teal-400" />
              <h2 className="text-base font-semibold text-slate-200">Fuel Logs</h2>
            </div>
            <div className="overflow-x-auto">
              {fuelLogs.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-500">No fuel fill-ups logged yet.</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {["Vehicle", "Liters", "Cost (₹)", "Date"].map((col) => (
                        <th key={col} className="px-6 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fuelLogs.map((row, i) => (
                      <tr
                        key={row.id}
                        className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                          i === fuelLogs.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        <td className="px-6 py-4 font-medium text-slate-200">
                          {row.vehicles?.name || "Deleted Vehicle"}
                        </td>
                        <td className="px-6 py-4 text-slate-300">{row.liters} L</td>
                        <td className="px-6 py-4 text-slate-300">₹{row.cost?.toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4 text-slate-400">{formatDate(row.log_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Expense Logs Table */}
          <div className="glass overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-semibold text-slate-200">Expense Logs</h2>
            </div>
            <div className="overflow-x-auto">
              {expenseLogs.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-500">No expenses logged yet.</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {["Vehicle", "Type", "Cost (₹)", "Date"].map((col) => (
                        <th key={col} className="px-6 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expenseLogs.map((row, i) => (
                      <tr
                        key={row.id}
                        className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                          i === expenseLogs.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        <td className="px-6 py-4 font-medium text-slate-200">
                          {row.vehicles?.name || "Deleted Vehicle"}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {EXPENSE_CATEGORIES[row.category] || row.category}
                        </td>
                        <td className="px-6 py-4 text-slate-300">₹{row.amount?.toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4 text-slate-400">{formatDate(row.expense_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Fuel Log Modal ─────────────────────────── */}
      {fuelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md glass border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Fuel className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-slate-200">Add Fuel Log</h3>
              </div>
              <button
                onClick={() => {
                  setFuelModalOpen(false);
                  setFuelError("");
                }}
                className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFuel} className="p-6 space-y-4">
              {fuelError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{fuelError}</span>
                </div>
              )}

              {/* Vehicle dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Vehicle
                </label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/[0.08] text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.registration_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Liters */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Liters Filled
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 50"
                  value={fuelLiters}
                  onChange={(e) => setFuelLiters(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
              </div>

              {/* Cost */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Fuel Cost (₹)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 4500"
                  value={fuelCost}
                  onChange={(e) => setFuelCost(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Log Date
                </label>
                <input
                  type="date"
                  required
                  value={fuelDate}
                  onChange={(e) => setFuelDate(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all text-slate-300"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/[0.06] mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setFuelModalOpen(false);
                    setFuelError("");
                  }}
                  className="flex-1 px-5 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] font-semibold text-sm transition-default cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fuelLoading}
                  className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-sm hover:scale-[1.02] transition-default disabled:opacity-50 disabled:scale-100 cursor-pointer"
                >
                  {fuelLoading ? "Logging..." : "Log Fuel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Expense Modal ──────────────────────────── */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md glass border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-200">Add Expense Log</h3>
              </div>
              <button
                onClick={() => {
                  setExpenseModalOpen(false);
                  setExpenseError("");
                }}
                className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              {expenseError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{expenseError}</span>
                </div>
              )}

              {/* Vehicle selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Vehicle
                </label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/[0.08] text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.registration_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Expense Category
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-white/[0.08] text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                >
                  {Object.entries(EXPENSE_CATEGORIES).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cost/Amount */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Cost (₹)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1200"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Log Date
                </label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all text-slate-300"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/[0.06] mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setExpenseModalOpen(false);
                    setExpenseError("");
                  }}
                  className="flex-1 px-5 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] font-semibold text-sm transition-default cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={expenseLoading}
                  className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-sm hover:scale-[1.02] transition-default disabled:opacity-50 disabled:scale-100 cursor-pointer"
                >
                  {expenseLoading ? "Logging..." : "Log Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
