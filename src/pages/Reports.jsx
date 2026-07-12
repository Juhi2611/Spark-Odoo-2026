import { Download, Fuel, Gauge, TrendingUp } from "lucide-react";
import PageHeader from "../components/PageHeader";

/* ── Chart placeholders ──────────────────────────────────── */
const charts = [
  { label: "Fuel Efficiency",        icon: Fuel,       accent: "text-emerald-400", border: "border-emerald-500/20" },
  { label: "Fleet Utilization %",    icon: Gauge,      accent: "text-cyan-400",    border: "border-cyan-500/20" },
  { label: "Operational Cost Trend", icon: TrendingUp, accent: "text-rose-400",    border: "border-rose-500/20" },
];

export default function Reports() {
  return (
    <section>
      <PageHeader
        title="Reports"
        subtitle="Analytics & exportable reports — chart integrations coming soon"
      >
        <button
          disabled
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-slate-500 text-sm font-medium cursor-not-allowed opacity-60"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </PageHeader>

      {/* ── Chart placeholder grid ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {charts.map(({ label, icon: Icon, accent, border }, i) => (
          <div
            key={label}
            className={`glass flex flex-col items-center justify-center h-72 ${border} animate-fade-in group`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Decorative grid lines */}
            <div className="absolute inset-4 opacity-[0.04]">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id={`grid-${i}`} width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#grid-${i})`} />
              </svg>
            </div>

            <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.04] ${accent} mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-8 h-8" />
            </div>
            <p className="relative text-sm font-semibold text-slate-300">{label}</p>
            <p className="relative mt-1 text-xs text-slate-500">Chart placeholder</p>
          </div>
        ))}
      </div>
    </section>
  );
}
