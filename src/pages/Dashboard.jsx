import { useEffect, useState, useRef } from "react";
import {
  Truck,
  CheckCircle2,
  Wrench,
  Route,
  Clock,
  UserCheck,
  Gauge,
  DollarSign,
  AlertCircle,
  FileText,
  Trash2,
  Calendar as CalendarIcon,
  Search,
  Download,
  ShieldCheck,
  TrendingUp,
  MapPin,
  RefreshCw,
  Bell,
  Eye,
  Lock,
  UserPlus,
} from "lucide-react";
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
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../supabaseClient";
import PageHeader from "../components/PageHeader";

// Register ChartJS elements
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

const roleDisplayNames = {
  super_admin: "Super Admin",
  fleet_manager: "Fleet Manager",
  dispatcher: "Dispatcher / Operations",
  driver: "Driver",
  safety_officer: "Safety Officer",
  financial_analyst: "Financial Analyst",
};

// ── Chart constants ──────────────────────────────────────────
const GRID_COLOR = "rgba(148,163,184,0.06)";
const TICK_COLOR = "#64748b";

const darkScales = {
  x: {
    grid: { color: GRID_COLOR },
    ticks: { color: TICK_COLOR, font: { family: "Inter", size: 10 } },
    border: { color: "transparent" },
  },
  y: {
    grid: { color: GRID_COLOR },
    ticks: { color: TICK_COLOR, font: { family: "Inter", size: 10 } },
    border: { color: "transparent" },
  },
};

const darkLegend = {
  labels: {
    color: "#cbd5e1",
    font: { family: "Inter", size: 11 },
    boxWidth: 8,
    usePointStyle: true,
  },
};

// ── Dispatcher Mini Map Config ──────────────────────────────
const DISPATCHER_MAP_CENTER = [22.3, 72.5]; // Gujarat area
const dispatcherRoutes = [
  {
    name: "Route A: Ahmedabad → Surat",
    color: "#2dd4bf",
    path: [[23.0225, 72.5714], [22.3072, 73.1812], [21.1702, 72.8311]],
  },
  {
    name: "Route B: Rajkot → Vadodara",
    color: "#818cf8",
    path: [[22.3039, 70.8022], [22.0, 71.8], [22.3072, 73.1812]],
  },
  {
    name: "Route C: Bhavnagar → Ahmedabad",
    color: "#fb923c",
    path: [[21.7645, 72.1519], [22.3, 72.3], [23.0225, 72.5714]],
  },
];

const miniMapPin = L.divIcon({
  html: `<div class="w-3.5 h-3.5 rounded-full border-2 border-slate-950 bg-teal-400 shadow-md"></div>`,
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function Dashboard() {
  const [activeRole, setActiveRole] = useState("fleet_manager");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");

  // Stats Counters
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    availableVehicles: 0,
    inMaintenance: 0,
    totalDrivers: 0,
    activeTrips: 0,
    pendingTrips: 0,
    fuelCost: 0,
    expenses: 0,
    pendingMaintCount: 0,
    licenseExpiryAlerts: 0,
  });

  // Load user data and query stats from Supabase
  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      // 1. Fetch vehicles
      const { data: vehicles } = await supabase.from("vehicles").select("*");
      const vehList = vehicles || [];

      // 2. Fetch trips
      const { data: trips } = await supabase.from("trips").select("*");
      const tripList = trips || [];

      // 3. Fetch drivers
      const { data: drivers } = await supabase.from("drivers").select("*");
      const driverList = drivers || [];

      // 4. Fetch maintenance
      const { data: maintenance } = await supabase.from("maintenance_logs").select("*");
      const maintList = maintenance || [];

      // 5. Fetch fuel
      const { data: fuel } = await supabase.from("fuel_logs").select("cost");
      const fuelCostSum = (fuel || []).reduce((acc, f) => acc + (f.cost || 0), 0);

      // Calculations
      const activeVehs = vehList.filter(v => v.status === "on_trip").length;
      const availVehs = vehList.filter(v => v.status === "available").length;
      const maintVehs = vehList.filter(v => ["in_shop", "in_maintenance"].includes(v.status)).length;
      const pendingMaint = maintList.filter(m => m.status === "pending").length;

      // License expirations count (within next 30 days)
      const todayStr = new Date().toISOString().split("T")[0];
      const nextWeek = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const expLicenses = driverList.filter(
        d => d.license_expiry_date && d.license_expiry_date >= todayStr && d.license_expiry_date <= nextWeek
      ).length;

      setStats({
        totalVehicles: vehList.length,
        activeVehicles: activeVehs,
        availableVehicles: availVehs,
        inMaintenance: maintVehs,
        totalDrivers: driverList.length,
        activeTrips: tripList.filter(t => t.status === "dispatched").length,
        pendingTrips: tripList.filter(t => t.status === "draft").length,
        fuelCost: fuelCostSum,
        expenses: fuelCostSum + maintList.reduce((acc, m) => acc + (m.cost || 0), 0),
        pendingMaintCount: pendingMaint,
        licenseExpiryAlerts: expLicenses || 2, // fallback indicator
      });
    } catch (err) {
      console.error("Dashboard data load failed:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Read active simulation role
    const simulatedRole = localStorage.getItem("active_role") || "fleet_manager";
    setActiveRole(simulatedRole);

    loadDashboardStats();
  }, []);

  // Listen to external role changes
  useEffect(() => {
    const handleRoleUpdate = () => {
      setActiveRole(localStorage.getItem("active_role") || "fleet_manager");
    };
    window.addEventListener("storage", handleRoleUpdate);
    return () => window.removeEventListener("storage", handleRoleUpdate);
  }, []);

  // Quick Action handler triggers
  const handleQuickAction = (action) => {
    alert(`Quick Action: "${action}" triggered. Redirecting/opening modal...`);
  };

  // CSV Report Generator (Mock)
  const downloadReport = () => {
    const csvContent = "data:text/csv;charset=utf-8,KPI,Value\nActive Fleet,86%\nRevenue,520000\nExpenses,180000\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transitops_report_${activeRole}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Role Specific Render Configurations ────────────────────

  const getRoleKPIs = () => {
    const loadState = loading ? "..." : "";
    switch (activeRole) {
      case "super_admin":
        return [
          { label: "Total Vehicles", value: loadState || stats.totalVehicles, icon: Truck, color: "text-teal-400" },
          { label: "Total Drivers", value: loadState || stats.totalDrivers, icon: UserCheck, color: "text-indigo-400" },
          { label: "Active Trips", value: loadState || stats.activeTrips, icon: Route, color: "text-cyan-400" },
          { label: "Fleet Utilization", value: "86%", icon: Gauge, color: "text-emerald-400" },
          { label: "Total Revenue", value: "₹5,20,000", icon: DollarSign, color: "text-teal-300" },
          { label: "Total Expenses", value: `₹${stats.expenses.toLocaleString("en-IN")}`, icon: DollarSign, color: "text-rose-400" },
          { label: "Pending Maintenance", value: loadState || stats.pendingMaintCount, icon: Wrench, color: "text-amber-400" },
          { label: "License Expiries", value: loadState || stats.licenseExpiryAlerts, icon: AlertCircle, color: "text-orange-400" },
        ];
      case "fleet_manager":
        return [
          { label: "Available Vehicles", value: loadState || stats.availableVehicles, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Vehicles On Trip", value: loadState || stats.activeVehicles, icon: Route, color: "text-cyan-400" },
          { label: "Vehicles in Maintenance", value: loadState || stats.inMaintenance, icon: Wrench, color: "text-amber-400" },
          { label: "Upcoming Maintenance", value: loadState || stats.pendingMaintCount, icon: Clock, color: "text-orange-400" },
          { label: "Vehicle Utilization", value: "82%", icon: Gauge, color: "text-teal-400" },
          { label: "Vehicle Health Score", value: "94%", icon: ShieldCheck, color: "text-indigo-400" },
          { label: "Fuel Consumption", value: "2,450 L", icon: Fuel, color: "text-amber-300" },
          { label: "Vehicle ROI", value: "18.4%", icon: DollarSign, color: "text-emerald-350" },
        ];
      case "dispatcher":
        return [
          { label: "Today's Trips", value: "12", icon: Route, color: "text-teal-400" },
          { label: "Pending Dispatch", value: loadState || stats.pendingTrips, icon: Clock, color: "text-orange-400" },
          { label: "Running Trips", value: loadState || stats.activeTrips, icon: PlayIcon, color: "text-cyan-400" },
          { label: "Completed Trips", value: "8", icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Delayed Trips", value: "3", icon: AlertCircle, color: "text-rose-450" },
          { label: "Available Drivers", value: loadState || stats.totalDrivers - stats.activeTrips, icon: UserCheck, color: "text-indigo-400" },
          { label: "Available Vehicles", value: loadState || stats.availableVehicles, icon: Truck, color: "text-teal-350" },
        ];
      case "driver":
        return [
          { label: "Assigned Vehicle", value: "BUS-1042", icon: Truck, color: "text-teal-400" },
          { label: "Today's Trips", value: "2", icon: Route, color: "text-cyan-400" },
          { label: "Completed Trips", value: "1", icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Pending Trips", value: "1", icon: Clock, color: "text-orange-400" },
          { label: "Total Distance", value: "185 km", icon: Gauge, color: "text-indigo-400" },
          { label: "Fuel Used", value: "38 L", icon: Fuel, color: "text-amber-400" },
          { label: "Safety Score", value: "98/100", icon: ShieldCheck, color: "text-teal-300" },
          { label: "License Status", value: "Valid", icon: UserCheck, color: "text-emerald-350" },
        ];
      case "safety_officer":
        return [
          { label: "License Expiries", value: loadState || stats.licenseExpiryAlerts, icon: Clock, color: "text-orange-455" },
          { label: "Suspended Drivers", value: "1", icon: Trash2, color: "text-rose-400" },
          { label: "Average Safety Score", value: "92.4%", icon: ShieldCheck, color: "text-teal-400" },
          { label: "Accident Reports", value: "0", icon: AlertCircle, color: "text-emerald-400" },
          { label: "Violations logged", value: "2", icon: AlertCircle, color: "text-amber-400" },
          { label: "Driver Compliance", value: "98.2%", icon: UserCheck, color: "text-indigo-400" },
          { label: "Vehicle Compliance", value: "95.0%", icon: Truck, color: "text-cyan-400" },
        ];
      case "financial_analyst":
        return [
          { label: "Total Fuel Cost", value: `₹${stats.fuelCost.toLocaleString("en-IN")}`, icon: Fuel, color: "text-amber-450" },
          { label: "Total Maint. Cost", value: `₹${(stats.expenses - stats.fuelCost).toLocaleString("en-IN")}`, icon: Wrench, color: "text-indigo-450" },
          { label: "Total Expenses", value: `₹${stats.expenses.toLocaleString("en-IN")}`, icon: DollarSign, color: "text-rose-400" },
          { label: "Projected Revenue", value: "₹5,20,000", icon: DollarSign, color: "text-emerald-400" },
          { label: "Net Monthly Profit", value: `₹${(520000 - stats.expenses).toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-teal-400" },
          { label: "Average Vehicle ROI", value: "18.4%", icon: Gauge, color: "text-cyan-400" },
          { label: "Fuel Efficiency", value: "14.2 km/L", icon: Gauge, color: "text-teal-350" },
        ];
      default:
        return [];
    }
  };

  const getRoleQuickActions = () => {
    switch (activeRole) {
      case "super_admin":
        return [
          { label: "Manage Users", action: "manage_users", icon: UserCheck },
          { label: "Create Manager", action: "create_manager", icon: UserPlus },
          { label: "Assign Roles", action: "assign_roles", icon: Lock },
          { label: "System Config", action: "system_config", icon: ShieldCheck },
        ];
      case "fleet_manager":
        return [
          { label: "Register Vehicle", action: "register_vehicle", icon: Truck },
          { label: "Schedule Maintenance", action: "schedule_maint", icon: Wrench },
          { label: "Fuel Entry", action: "fuel_entry", icon: Fuel },
        ];
      case "dispatcher":
        return [
          { label: "Create Trip", action: "create_trip", icon: Route },
          { label: "Assign Driver", action: "assign_driver", icon: UserCheck },
          { label: "Complete Trip", action: "complete_trip", icon: CheckCircle2 },
        ];
      case "driver":
        return [
          { label: "Start Trip", action: "start_trip", icon: Route },
          { label: "End Trip", action: "end_trip", icon: CheckCircle2 },
          { label: "Report Breakdown", action: "breakdown", icon: AlertCircle },
        ];
      case "safety_officer":
        return [
          { label: "Verify License", action: "verify_license", icon: ShieldCheck },
          { label: "Suspend Driver", action: "suspend_driver", icon: Trash2 },
        ];
      case "financial_analyst":
        return [
          { label: "Export Report", action: "export_report", icon: Download },
          { label: "Add Expense", action: "add_expense", icon: DollarSign },
        ];
      default:
        return [];
    }
  };

  const renderRoleChart = () => {
    if (activeRole === "super_admin" || activeRole === "financial_analyst") {
      const revenueVsExpense = {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Revenue",
            data: [310000, 390000, 420000, 480000, 490000, 520000],
            borderColor: "#2dd4bf",
            backgroundColor: "rgba(45,212,191,0.06)",
            tension: 0.3,
            fill: true,
          },
          {
            label: "Expenses",
            data: [120000, 150000, 140000, 160000, 175000, 180000],
            borderColor: "#f43f5e",
            backgroundColor: "rgba(244,63,94,0.06)",
            tension: 0.3,
            fill: true,
          },
        ],
      };
      return (
        <div className="glass p-5 flex flex-col gap-4">
          <h4 className="text-sm font-bold text-slate-200">Revenue vs Expense Trend (₹)</h4>
          <div className="h-64">
            <Line
              data={revenueVsExpense}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: darkScales,
                plugins: { legend: darkLegend },
              }}
            />
          </div>
        </div>
      );
    }

    if (activeRole === "fleet_manager") {
      const vehicleStatus = {
        labels: ["Available", "On Trip", "In Maintenance", "Retired"],
        datasets: [
          {
            data: [stats.availableVehicles || 8, stats.activeVehicles || 12, stats.inMaintenance || 2, 1],
            backgroundColor: ["#10b981", "#38bdf8", "#f59e0b", "#64748b"],
            borderWidth: 1,
            borderColor: "rgba(15,23,42,0.8)",
          },
        ],
      };
      return (
        <div className="glass p-5 flex flex-col gap-4">
          <h4 className="text-sm font-bold text-slate-200">Vehicle Status Allocation</h4>
          <div className="h-64 flex justify-center items-center">
            <div className="w-56 h-56">
              <Doughnut
                data={vehicleStatus}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: darkLegend },
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (activeRole === "dispatcher") {
      const tripsStatus = {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Completed Trips",
            data: [5, 8, 6, 9, 7, 4, 3],
            backgroundColor: "#2dd4bf",
          },
          {
            label: "Pending Trips",
            data: [2, 1, 3, 2, 1, 0, 1],
            backgroundColor: "#fb923c",
          },
        ],
      };
      return (
        <div className="glass p-5 flex flex-col gap-4">
          <h4 className="text-sm font-bold text-slate-200">Trips Dispatched vs Completed</h4>
          <div className="h-64">
            <Bar
              data={tripsStatus}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: darkScales,
                plugins: { legend: darkLegend },
              }}
            />
          </div>
        </div>
      );
    }

    if (activeRole === "driver") {
      const weeklyDistance = {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        datasets: [
          {
            label: "Distance Covered (km)",
            data: [42, 68, 55, 90, 72, 85],
            borderColor: "#818cf8",
            backgroundColor: "rgba(129,140,248,0.06)",
            tension: 0.35,
            fill: true,
          },
        ],
      };
      return (
        <div className="glass p-5 flex flex-col gap-4">
          <h4 className="text-sm font-bold text-slate-200">Weekly Mileage Performance</h4>
          <div className="h-64">
            <Line
              data={weeklyDistance}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: darkScales,
                plugins: { legend: darkLegend },
              }}
            />
          </div>
        </div>
      );
    }

    if (activeRole === "safety_officer") {
      const safetyScores = {
        labels: ["Alex F.", "Priya N.", "Rajan K.", "Meena S.", "Suresh P."],
        datasets: [
          {
            label: "Driver Safety Score",
            data: [98, 95, 92, 99, 88],
            backgroundColor: ["#10b981", "#10b981", "#34d399", "#10b981", "#f59e0b"],
          },
        ],
      };
      return (
        <div className="glass p-5 flex flex-col gap-4">
          <h4 className="text-sm font-bold text-slate-200">Driver Safety Performance leaderboard</h4>
          <div className="h-64">
            <Bar
              data={safetyScores}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: darkScales,
                plugins: { legend: darkLegend },
              }}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <PageHeader
        title="Operations Control Hub"
        subtitle={`Personalized telemetry dashboard compiled for simulated profile: ${roleDisplayNames[activeRole] || activeRole}`}
      />

      {/* ── 3. Top Section: Live Alert Cards ───────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-4 border-l-4 border-l-amber-500 flex items-center gap-3.5 relative overflow-hidden shadow-lg shadow-amber-500/5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Driver Alert</p>
            <p className="text-sm font-extrabold text-slate-200">5 licenses expiring</p>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Review renewal status</span>
          </div>
        </div>

        <div className="glass p-4 border-l-4 border-l-rose-500 flex items-center gap-3.5 relative overflow-hidden shadow-lg shadow-rose-500/5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Maintenance Alert</p>
            <p className="text-sm font-extrabold text-slate-200">2 vehicles overdue</p>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Schedule inspections</span>
          </div>
        </div>

        <div className="glass p-4 border-l-4 border-l-orange-500 flex items-center gap-3.5 relative overflow-hidden shadow-lg shadow-orange-500/5">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Operational Alert</p>
            <p className="text-sm font-extrabold text-slate-200">3 delayed trips today</p>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Estimated ETA exceeded</span>
          </div>
        </div>

        <div className="glass p-4 border-l-4 border-l-emerald-500 flex items-center gap-3.5 relative overflow-hidden shadow-lg shadow-emerald-500/5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Utilization Index</p>
            <p className="text-sm font-extrabold text-slate-200">Fleet efficiency: 86%</p>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Optimal capacity margin</span>
          </div>
        </div>
      </div>

      {/* ── Grid Layout ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Side (Dashboard main widgets) */}
        <div className="lg:col-span-3 flex flex-col gap-8">
          {/* KPIs grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {getRoleKPIs().map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="glass p-5 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                      {kpi.label}
                    </span>
                    <Icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                  <p className="text-2xl font-extrabold text-slate-100">{kpi.value}</p>
                </div>
              );
            })}
          </div>

          {/* Dynamic Chart */}
          {renderRoleChart()}

          {/* Dispatcher Mini Map Widget */}
          {activeRole === "dispatcher" && (
            <div className="glass p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-400 animate-bounce" />
                    Vehicles Running Today
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Static operational routing overview</p>
                </div>
                <span className="px-2.5 py-0.5 text-[10px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full">
                  3 Active Routes
                </span>
              </div>
              <div className="h-64 rounded-xl overflow-hidden border border-white/[0.08] relative z-0">
                <MapContainer
                  center={DISPATCHER_MAP_CENTER}
                  zoom={7}
                  className="w-full h-full"
                  style={{ background: "#0f172a" }}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />
                  {dispatcherRoutes.map((route, idx) => (
                    <span key={idx}>
                      <Polyline
                        positions={route.path}
                        pathOptions={{ color: route.color, weight: 3, opacity: 0.8 }}
                      />
                      <Marker position={route.path[0]} icon={miniMapPin}>
                        <Popup>
                          <span className="text-xs font-bold text-slate-900">{route.name} (Start)</span>
                        </Popup>
                      </Marker>
                      <Marker position={route.path[route.path.length - 1]} icon={miniMapPin}>
                        <Popup>
                          <span className="text-xs font-bold text-slate-900">{route.name} (End)</span>
                        </Popup>
                      </Marker>
                    </span>
                  ))}
                </MapContainer>
              </div>
            </div>
          )}

          {/* Role Specific Quick Actions */}
          <div className="glass p-5">
            <h4 className="text-sm font-bold text-slate-200 mb-4">Operations Quick Actions</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {getRoleQuickActions().map((qa) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={qa.label}
                    onClick={() => handleQuickAction(qa.label)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-xs font-semibold text-slate-300 hover:bg-white/[0.05] hover:text-slate-100 hover:scale-[1.02] transition-default cursor-pointer text-left"
                  >
                    <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{qa.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side (Common Side Utilities Panel) */}
        <div className="flex flex-col gap-8">
          {/* Search widget & Filters */}
          <div className="glass p-5 flex flex-col gap-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Search & Filter</h4>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-teal-500/50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Operating Region</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full bg-slate-900 border border-white/[0.08] text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="All Regions">All Regions</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
              </select>
            </div>
          </div>

          {/* Collapsible Notifications Widget */}
          <div className="glass p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-teal-400" />
                Live Notification Feed
              </h4>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px] text-slate-300 flex flex-col gap-1">
                <div className="flex justify-between font-semibold text-orange-400">
                  <span>License Expiration alert</span>
                  <span>Just now</span>
                </div>
                <p className="text-slate-400">Driver Rajan Kumar HMV license expires in 22 days.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px] text-slate-300 flex flex-col gap-1">
                <div className="flex justify-between font-semibold text-rose-400">
                  <span>Maintenance overdue</span>
                  <span>2 hours ago</span>
                </div>
                <p className="text-slate-400">Asset TRK-0883 odometer limits exceeded. Oil change required.</p>
              </div>
            </div>
          </div>

          {/* Recent Activity Timeline Widget */}
          <div className="glass p-5 flex flex-col gap-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity Log</h4>
            <div className="relative border-l border-white/[0.08] ml-2 pl-4 space-y-5 py-2">
              <div className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-teal-400 border border-slate-900"></div>
                <p className="text-[10px] text-slate-500 font-bold">10:20 AM</p>
                <p className="text-xs font-medium text-slate-200 mt-0.5">Trip #438 Dispatched</p>
                <p className="text-[10px] text-slate-500">Driver Priya Shah started route</p>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-cyan-400 border border-slate-900"></div>
                <p className="text-[10px] text-slate-500 font-bold">09:58 AM</p>
                <p className="text-xs font-medium text-slate-200 mt-0.5">Fuel Log added</p>
                <p className="text-[10px] text-slate-500">42 Liters registered to BUS-1042</p>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-amber-400 border border-slate-900"></div>
                <p className="text-[10px] text-slate-500 font-bold">09:35 AM</p>
                <p className="text-xs font-medium text-slate-200 mt-0.5">Vehicle entered maintenance</p>
                <p className="text-[10px] text-slate-500">Asset TRK-0883 logged with brake issue</p>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-400 border border-slate-900"></div>
                <p className="text-[10px] text-slate-500 font-bold">08:50 AM</p>
                <p className="text-xs font-medium text-slate-200 mt-0.5">Trip completed successfully</p>
                <p className="text-[10px] text-slate-500">Driver Amit Patel ended Trip #436</p>
              </div>
            </div>
          </div>

          {/* Mini-Calendar Panel */}
          <div className="glass p-5 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-teal-400" />
              Calendar Events
            </h4>
            <div className="p-3 bg-slate-950/40 rounded-xl border border-white/[0.04] text-[11px] space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                <span className="font-semibold text-slate-350">July 14</span>
                <span className="text-slate-500">—</span>
                <span className="text-slate-400 truncate">Suresh P. License renewal due</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span className="font-semibold text-slate-350">July 18</span>
                <span className="text-slate-500">—</span>
                <span className="text-slate-400 truncate">Scheduled Maintenance: BUS-1042</span>
              </div>
            </div>
          </div>

          {/* Download & Settings actions */}
          <button
            onClick={downloadReport}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-xs hover:scale-[1.02] shadow-lg shadow-teal-500/10 hover:shadow-teal-500/25 transition-default cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Operations Report
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple internal Play icon replacement
function PlayIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
