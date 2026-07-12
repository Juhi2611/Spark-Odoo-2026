import { IndianRupee } from "lucide-react";
import PageHeader from "../components/PageHeader";

/* ── Dummy fuel logs ─────────────────────────────────────── */
const fuelLogs = [
  { id: 1, vehicle: "BUS-1042", liters: 120, cost: "₹9,600",  date: "2026-07-08" },
  { id: 2, vehicle: "VAN-0217", liters: 45,  cost: "₹3,600",  date: "2026-07-09" },
  { id: 3, vehicle: "TRK-0883", liters: 200, cost: "₹16,000", date: "2026-07-10" },
];

/* ── Dummy expense logs ──────────────────────────────────── */
const expenseLogs = [
  { id: 1, vehicle: "BUS-1042", type: "Toll Charges",   cost: "₹1,200", date: "2026-07-07" },
  { id: 2, vehicle: "VAN-0217", type: "Parking Fees",   cost: "₹350",   date: "2026-07-08" },
  { id: 3, vehicle: "TRK-0883", type: "Driver Allowance", cost: "₹2,500", date: "2026-07-10" },
];

function DataTable({ title, columns, rows }) {
  return (
    <div className="glass overflow-hidden flex-1 min-w-0">
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <h2 className="text-base font-semibold text-slate-200">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id}
                className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                  i === rows.length - 1 ? "border-b-0" : ""
                }`}
              >
                {columns.map((col) => {
                  const key = col.toLowerCase();
                  return (
                    <td
                      key={col}
                      className={`px-6 py-4 ${
                        col === "Vehicle"
                          ? "font-medium text-slate-200"
                          : "text-slate-300"
                      }`}
                    >
                      {row[key]}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function FuelExpense() {
  return (
    <section>
      <PageHeader
        title="Fuel & Expense"
        subtitle="Consolidated view of fuel consumption and operational expenses"
      />

      {/* ── Total cost summary ──────────────────────────── */}
      <div
        className="glass glow p-6 mb-8 flex items-center gap-4 animate-fade-in"
        style={{ animationDelay: "60ms" }}
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 border border-teal-500/20">
          <IndianRupee className="w-7 h-7 text-teal-400" />
        </div>
        <div>
          <p className="text-3xl font-extrabold text-slate-100">₹33,250</p>
          <p className="mt-1 text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total Operational Cost (This Month)
          </p>
        </div>
      </div>

      {/* ── Side-by-side tables ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: "160ms" }}>
        <DataTable
          title="Fuel Logs"
          columns={["Vehicle", "Liters", "Cost", "Date"]}
          rows={fuelLogs}
        />
        <DataTable
          title="Expense Logs"
          columns={["Vehicle", "Type", "Cost", "Date"]}
          rows={expenseLogs}
        />
      </div>
    </section>
  );
}
