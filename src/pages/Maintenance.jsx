import { Plus } from "lucide-react";
import PageHeader from "../components/PageHeader";

/* ── Dummy maintenance records ───────────────────────────── */
const records = [
  { id: 1, vehicle: "BUS-1042",  type: "Engine Overhaul",     date: "2026-06-28", status: "Open"   },
  { id: 2, vehicle: "VAN-0217",  type: "Brake Pad Replacement", date: "2026-07-01", status: "Closed" },
  { id: 3, vehicle: "TRK-0883",  type: "Oil Change & Filter",  date: "2026-07-10", status: "Open"   },
];

const columns = ["Vehicle", "Maintenance Type", "Date Opened", "Status"];

export default function Maintenance() {
  return (
    <section>
      <PageHeader
        title="Maintenance"
        subtitle="Track and manage vehicle maintenance schedules"
      >
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-sm font-semibold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:scale-[1.03] transition-default">
          <Plus className="w-4 h-4" />
          Add Maintenance Record
        </button>
      </PageHeader>

      {/* ── Table ───────────────────────────────────────── */}
      <div className="glass overflow-hidden animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {columns.map((col) => (
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
                  <td className="px-6 py-4 font-medium text-slate-200">{r.vehicle}</td>
                  <td className="px-6 py-4 text-slate-300">{r.type}</td>
                  <td className="px-6 py-4 text-slate-400">{r.date}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        r.status === "Open" ? "badge-open" : "badge-closed"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
