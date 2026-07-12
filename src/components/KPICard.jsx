/**
 * KPICard — Reusable card for dashboard KPI metrics.
 *
 * Props:
 *  - label  (string)  – metric name
 *  - value  (string)  – display value
 *  - icon   (Component) – lucide-react icon component
 *  - accent (string)  – Tailwind text-color class for the icon
 *  - delay  (number)  – animation delay index
 */
export default function KPICard({ label, value, icon: Icon, accent = "text-teal-400", delay = 0 }) {
  return (
    <div
      className="glass p-5 flex items-start gap-4 hover:glow transition-default animate-fade-in group"
      style={{ animationDelay: `${delay * 80}ms` }}
    >
      <div
        className={`flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.04] ${accent} group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-100 leading-none">{value}</p>
        <p className="mt-1 text-xs font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </p>
      </div>
    </div>
  );
}
