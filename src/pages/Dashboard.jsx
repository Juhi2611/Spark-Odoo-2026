import {
  Truck,
  CheckCircle2,
  Wrench,
  Route,
  Clock,
  UserCheck,
  Gauge,
} from "lucide-react";
import KPICard from "../components/KPICard";
import PageHeader from "../components/PageHeader";

/* ── Static KPI data ─────────────────────────────────────── */
const kpis = [
  { label: "Active Vehicles",       value: "42",   icon: Truck,        accent: "text-teal-400"    },
  { label: "Available Vehicles",    value: "18",   icon: CheckCircle2, accent: "text-emerald-400" },
  { label: "In Maintenance",        value: "7",    icon: Wrench,       accent: "text-amber-400"   },
  { label: "Active Trips",          value: "23",   icon: Route,        accent: "text-cyan-400"    },
  { label: "Pending Trips",         value: "9",    icon: Clock,        accent: "text-orange-400"  },
  { label: "Drivers On Duty",       value: "31",   icon: UserCheck,    accent: "text-indigo-400"  },
  { label: "Fleet Utilization %",   value: "78%",  icon: Gauge,        accent: "text-rose-400"    },
];

/* ── Filter bar options (non-functional) ─────────────────── */
const filters = [
  { id: "vehicle-type", label: "Vehicle Type",  options: ["All Types", "Bus", "Van", "Truck", "Sedan"] },
  { id: "status",       label: "Status",        options: ["All Statuses", "Active", "Idle", "In Maintenance"] },
  { id: "region",       label: "Region",        options: ["All Regions", "North", "South", "East", "West"] },
];

export default function Dashboard() {
  return (
    <section>
      <PageHeader
        title="Dashboard"
        subtitle="Fleet overview at a glance — real-time metrics placeholder"
      />

      {/* ── Filter bar ──────────────────────────────────── */}
      <div className="glass-sm p-4 mb-8 flex flex-wrap items-center gap-4 animate-fade-in" style={{ animationDelay: "60ms" }}>
        {filters.map(({ id, label, options }) => (
          <div key={id} className="flex flex-col gap-1">
            <label htmlFor={id} className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              {label}
            </label>
            <select
              id={id}
              className="bg-white/[0.05] border border-white/[0.08] text-sm text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer appearance-none min-w-[160px]"
              defaultValue={options[0]}
            >
              {options.map((opt) => (
                <option key={opt} className="bg-slate-900 text-slate-200">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        ))}

        <button className="ml-auto mt-auto px-5 py-2 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 text-sm font-medium hover:bg-teal-500/25 transition-default">
          Apply Filters
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
