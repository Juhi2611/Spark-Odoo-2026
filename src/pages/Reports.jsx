import { useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Download, Fuel, Gauge, TrendingUp, IndianRupee } from "lucide-react";
import PageHeader from "../components/PageHeader";

/* ── Register Chart.js components ────────────────────────── */
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend
);

/* ── Shared chart styling for dark theme ─────────────────── */
const GRID_COLOR = "rgba(148,163,184,0.08)";
const TICK_COLOR = "#64748b";

const darkScales = {
  x: {
    grid: { color: GRID_COLOR },
    ticks: { color: TICK_COLOR, font: { family: "Inter", size: 11 } },
    border: { color: "transparent" },
  },
  y: {
    grid: { color: GRID_COLOR },
    ticks: { color: TICK_COLOR, font: { family: "Inter", size: 11 } },
    border: { color: "transparent" },
  },
};

const darkLegend = {
  labels: {
    color: "#cbd5e1",
    font: { family: "Inter", size: 12 },
    padding: 16,
    usePointStyle: true,
    pointStyleWidth: 10,
  },
};

/* ═══════════════════════════════════════════════════════════════
   DUMMY REPORT DATA
   ═══════════════════════════════════════════════════════════════ */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

/* ── Fuel Efficiency (km/L per vehicle per month) ──────────── */
const fuelEfficiencyData = {
  labels: MONTHS,
  datasets: [
    {
      label: "BUS-1042",
      data: [4.2, 4.5, 4.1, 4.8, 4.6, 4.3, 4.7],
      borderColor: "#2dd4bf",
      backgroundColor: "rgba(45,212,191,0.1)",
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 7,
    },
    {
      label: "VAN-0217",
      data: [12.1, 11.8, 12.5, 12.0, 11.5, 12.3, 12.8],
      borderColor: "#818cf8",
      backgroundColor: "rgba(129,140,248,0.1)",
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 7,
    },
    {
      label: "TRK-0883",
      data: [5.8, 5.5, 5.9, 5.2, 5.7, 5.4, 5.6],
      borderColor: "#fb923c",
      backgroundColor: "rgba(251,146,60,0.1)",
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 7,
    },
  ],
};

/* ── Fleet Utilization % (doughnut) ────────────────────────── */
const fleetUtilData = {
  labels: ["Active", "Available", "In Maintenance", "Retired"],
  datasets: [
    {
      data: [42, 18, 7, 3],
      backgroundColor: [
        "rgba(45,212,191,0.85)",
        "rgba(129,140,248,0.85)",
        "rgba(251,191,36,0.85)",
        "rgba(100,116,139,0.5)",
      ],
      borderColor: [
        "#2dd4bf",
        "#818cf8",
        "#fbbf24",
        "#64748b",
      ],
      borderWidth: 2,
      hoverOffset: 8,
    },
  ],
};

/* ── Operational Cost Trend (₹ per month, stacked bar) ─────── */
const costTrendData = {
  labels: MONTHS,
  datasets: [
    {
      label: "Fuel",
      data: [85000, 92000, 78000, 95000, 88000, 91000, 87000],
      backgroundColor: "rgba(45,212,191,0.7)",
      borderColor: "#2dd4bf",
      borderWidth: 1,
      borderRadius: 4,
    },
    {
      label: "Maintenance",
      data: [25000, 18000, 42000, 15000, 30000, 22000, 28000],
      backgroundColor: "rgba(251,146,60,0.7)",
      borderColor: "#fb923c",
      borderWidth: 1,
      borderRadius: 4,
    },
    {
      label: "Other Expenses",
      data: [12000, 14000, 11000, 16000, 13000, 15000, 12500],
      backgroundColor: "rgba(129,140,248,0.7)",
      borderColor: "#818cf8",
      borderWidth: 1,
      borderRadius: 4,
    },
  ],
};

/* ── Summary cards data ─────────────────────────────────────── */
const summaryCards = [
  {
    label: "Avg Fuel Efficiency",
    value: "7.4 km/L",
    change: "+3.2%",
    positive: true,
    icon: Fuel,
    color: "text-teal-400",
    bg: "from-teal-500/20 to-teal-500/5",
  },
  {
    label: "Fleet Utilization",
    value: "78%",
    change: "+5.1%",
    positive: true,
    icon: Gauge,
    color: "text-indigo-400",
    bg: "from-indigo-500/20 to-indigo-500/5",
  },
  {
    label: "Monthly Operational Cost",
    value: "₹1,27,500",
    change: "-2.8%",
    positive: true,
    icon: IndianRupee,
    color: "text-emerald-400",
    bg: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    label: "Cost Trend",
    value: "Declining",
    change: "↓ 3 months",
    positive: true,
    icon: TrendingUp,
    color: "text-cyan-400",
    bg: "from-cyan-500/20 to-cyan-500/5",
  },
];

/* ═══════════════════════════════════════════════════════════════
   CSV EXPORT — builds a CSV from the dummy data and downloads it
   ═══════════════════════════════════════════════════════════════ */
function exportCSV() {
  const rows = [
    ["TransitOps — Fleet Report", "", "", "", "", ""],
    ["Generated", new Date().toLocaleString("en-IN"), "", "", "", ""],
    [],
    ["=== FUEL EFFICIENCY (km/L) ==="],
    ["Vehicle", ...MONTHS],
    ["BUS-1042", ...fuelEfficiencyData.datasets[0].data],
    ["VAN-0217", ...fuelEfficiencyData.datasets[1].data],
    ["TRK-0883", ...fuelEfficiencyData.datasets[2].data],
    [],
    ["=== FLEET UTILIZATION ==="],
    ["Category", "Count"],
    ...fleetUtilData.labels.map((l, i) => [l, fleetUtilData.datasets[0].data[i]]),
    [],
    ["=== OPERATIONAL COST (₹) ==="],
    ["Category", ...MONTHS],
    ...costTrendData.datasets.map((ds) => [ds.label, ...ds.data]),
    [],
    ["=== SUMMARY ==="],
    ...summaryCards.map((c) => [c.label, c.value, c.change]),
  ];

  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `TransitOps_Report_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════════════
   REPORTS PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function Reports() {
  return (
    <section>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Fleet performance metrics, fuel efficiency, and cost analysis"
      >
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-sm font-semibold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:scale-[1.03] transition-default"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </PageHeader>

      {/* ── Summary Cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="glass p-5 flex items-start gap-4 animate-fade-in group"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-slate-100">{card.value}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {card.label}
                </p>
                <p
                  className={`mt-1 text-xs font-semibold ${
                    card.positive ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {card.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Grid ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Fuel Efficiency — Line Chart */}
        <div className="glass p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-2 mb-5">
            <Fuel className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-semibold text-slate-200">
              Fuel Efficiency
            </h2>
            <span className="ml-auto text-[10px] font-medium text-slate-500 uppercase tracking-widest">
              km / liter
            </span>
          </div>
          <div className="h-64">
            <Line
              data={fuelEfficiencyData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: darkLegend },
                scales: darkScales,
                interaction: { intersect: false, mode: "index" },
              }}
            />
          </div>
        </div>

        {/* Fleet Utilization — Doughnut */}
        <div className="glass p-6 animate-fade-in" style={{ animationDelay: "280ms" }}>
          <div className="flex items-center gap-2 mb-5">
            <Gauge className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-200">
              Fleet Utilization
            </h2>
            <span className="ml-auto text-[10px] font-medium text-slate-500 uppercase tracking-widest">
              70 vehicles
            </span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="w-56 h-56 relative">
              <Doughnut
                data={fleetUtilData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "65%",
                  plugins: {
                    legend: {
                      ...darkLegend,
                      position: "bottom",
                    },
                  },
                }}
              />
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold text-slate-100">78%</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">utilized</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Cost Trend — Full-width stacked bar */}
      <div className="glass p-6 animate-fade-in" style={{ animationDelay: "360ms" }}>
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-orange-400" />
          <h2 className="text-base font-semibold text-slate-200">
            Operational Cost Trend
          </h2>
          <span className="ml-auto text-[10px] font-medium text-slate-500 uppercase tracking-widest">
            ₹ monthly breakdown
          </span>
        </div>
        <div className="h-72">
          <Bar
            data={costTrendData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: darkLegend },
              scales: {
                ...darkScales,
                x: { ...darkScales.x, stacked: true },
                y: {
                  ...darkScales.y,
                  stacked: true,
                  ticks: {
                    ...darkScales.y.ticks,
                    callback: (v) => `₹${(v / 1000).toFixed(0)}k`,
                  },
                },
              },
              interaction: { intersect: false, mode: "index" },
            }}
          />
        </div>
      </div>

      {/* ── Vehicle-wise Cost Breakdown Table ───────────── */}
      <div className="glass overflow-hidden mt-6 animate-fade-in" style={{ animationDelay: "440ms" }}>
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-emerald-400" />
          <h2 className="text-base font-semibold text-slate-200">
            Vehicle-wise Operational Cost & ROI
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Vehicle", "Fuel (₹)", "Maintenance (₹)", "Other (₹)", "Total Cost (₹)", "Revenue (₹)", "Acquisition (₹)", "ROI %"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-6 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {[
                { v: "BUS-1042", fuel: 87000, maint: 28000, other: 12500, rev: 180000, acq: 2500000 },
                { v: "VAN-0217", fuel: 32000, maint: 4200, other: 8500, rev: 65000, acq: 800000 },
                { v: "TRK-0883", fuel: 128000, maint: 3200, other: 14000, rev: 220000, acq: 3200000 },
              ].map((r, i) => {
                const total = r.fuel + r.maint + r.other;
                const roi = (((r.rev - total) / r.acq) * 100).toFixed(1);
                return (
                  <tr
                    key={r.v}
                    className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                      i === 2 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-slate-200">{r.v}</td>
                    <td className="px-6 py-4 text-slate-300">₹{r.fuel.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4 text-slate-300">₹{r.maint.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4 text-slate-300">₹{r.other.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4 font-semibold text-slate-200">₹{total.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4 text-emerald-400">₹{r.rev.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4 text-slate-400">₹{r.acq.toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          parseFloat(roi) > 0
                            ? "badge-closed"
                            : "badge-open"
                        }`}
                      >
                        {roi}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
