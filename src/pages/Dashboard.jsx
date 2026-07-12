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
  Fuel,
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
  Fuel,
  Printer,
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

  // Database Arrays
  const [vehiclesList, setVehiclesList] = useState([]);
  const [tripsList, setTripsList] = useState([]);
  const [driversList, setDriversList] = useState([]);
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [fuelList, setFuelList] = useState([]);
  const [expensesList, setExpensesList] = useState([]);

  // Stats Counters
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    availableVehicles: 0,
    inMaintenance: 0,
    totalDrivers: 0,
    activeTrips: 0,
    pendingTrips: 0,
    completedTrips: 0,
    fuelCost: 0,
    maintCost: 0,
    expenseCost: 0,
    expenses: 0,
    revenue: 0,
    profit: 0,
    utilization: 0,
    healthScore: 100,
    fuelLiters: 0,
    roi: 0,
    todayTrips: 0,
    assignedVehicle: "None",
    driverTodayTrips: 0,
    driverCompletedTrips: 0,
    driverPendingTrips: 0,
    driverTotalDistance: 0,
    driverFuelUsed: 0,
    driverSafetyScore: 95,
    suspendedDrivers: 0,
    avgSafetyScore: 100,
    violations: 0,
    driverCompliance: 100,
    vehicleCompliance: 100,
    fuelEfficiency: "14.2",
    pendingMaintCount: 0,
    licenseExpiryAlerts: 0,
    delayedTrips: 0,
    recentActivities: [],
  });

  // Load user data and query stats from Supabase
  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      // 1. Fetch vehicles
      const { data: vehicles } = await supabase.from("vehicles").select("*");
      const vehList = vehicles || [];
      setVehiclesList(vehList);

      // 2. Fetch trips
      const { data: trips } = await supabase.from("trips").select("*");
      const tripList = trips || [];
      setTripsList(tripList);

      // 3. Fetch drivers
      const { data: drivers } = await supabase.from("drivers").select("*");
      const driverList = drivers || [];
      setDriversList(driverList);

      // 4. Fetch maintenance
      const { data: maintenance } = await supabase.from("maintenance_logs").select("*");
      const maintList = maintenance || [];
      setMaintenanceList(maintList);

      // 5. Fetch fuel
      const { data: fuel } = await supabase.from("fuel_logs").select("*");
      const fList = fuel || [];
      setFuelList(fList);
      const fuelCostSum = fList.reduce((acc, f) => acc + (f.cost || 0), 0);

      // 6. Fetch expenses
      const { data: expensesData } = await supabase.from("expenses").select("*");
      const expenseList = expensesData || [];
      setExpensesList(expenseList);
      const expenseAmountSum = expenseList.reduce((acc, e) => acc + (e.amount || 0), 0);

      // Calculations
      const totalVehiclesCount = vehList.length;
      const activeVehs = vehList.filter(v => v.status === "on_trip" || v.status === "active").length;
      const availVehs = vehList.filter(v => v.status === "available").length;
      const maintVehs = vehList.filter(v => ["in_shop", "in_maintenance"].includes(v.status)).length;
      const pendingMaint = maintList.filter(m => m.status === "pending").length;

      // License expirations count (within next 30 days)
      const today = new Date();
      const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expLicenses = driverList.filter(d => {
        if (!d.license_expiry_date) return false;
        const expDate = new Date(d.license_expiry_date);
        return expDate >= today && expDate <= next30Days;
      }).length;

      // Delayed trips count (dispatched and older than 4 hours)
      const delayedTripsCount = tripList.filter(t => {
        if (t.status !== "dispatched" || !t.dispatched_at) return false;
        const elapsedHours = (Date.now() - new Date(t.dispatched_at).getTime()) / (1000 * 60 * 60);
        return elapsedHours > 4;
      }).length;

      // Dynamic Revenue (planned_distance * 120 for dispatched/completed trips)
      const totalRevenueSum = tripList
        .filter(t => ["dispatched", "completed"].includes(t.status))
        .reduce((acc, t) => acc + ((t.planned_distance || 150) * 120), 0);

      // Total Expenses (fuel + maintenance + general expenses)
      const totalMaintCost = maintList.reduce((acc, m) => acc + (m.cost || 0), 0);
      const totalExpensesSum = fuelCostSum + totalMaintCost + expenseAmountSum;

      // Net Monthly Profit
      const netProfitSum = totalRevenueSum - totalExpensesSum;

      // Fleet utilization index
      const utilizationIndex = totalVehiclesCount > 0 ? Math.round((activeVehs / totalVehiclesCount) * 100) : 0;

      // Vehicle health score
      const healthScoreIndex = totalVehiclesCount > 0 ? Math.round(((totalVehiclesCount - pendingMaint) / totalVehiclesCount) * 100) : 100;

      // Fuel liters sum
      const fuelLitersSum = fList.reduce((acc, f) => acc + (f.liters || 0), 0);

      // ROI percent
      const roiPercent = totalExpensesSum > 0 ? Math.round((netProfitSum / totalExpensesSum) * 100) : 0;

      // Today's trips
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayTripsCount = tripList.filter(t => new Date(t.created_at || t.dispatched_at || Date.now()) >= startOfToday).length;

      // Driver-specific defaults using the first driver's metadata in the db
      const firstDriver = driverList[0] || { name: "Driver", safety_score: 95 };
      const driverTrips = tripList.filter(t => t.driver_id === firstDriver.id || !t.driver_id);
      const firstVehicle = vehList[0] || { license_plate: "None" };

      const drToday = driverTrips.filter(t => new Date(t.created_at || Date.now()) >= startOfToday).length;
      const drCompleted = driverTrips.filter(t => t.status === "completed").length;
      const drPending = driverTrips.filter(t => ["draft", "pending", "dispatched"].includes(t.status)).length;
      const drDistance = driverTrips.reduce((acc, t) => acc + (t.planned_distance || 0), 0);
      const drFuelUsed = fList.filter(f => f.vehicle_id === firstVehicle.id).reduce((acc, f) => acc + (f.liters || 0), 0) || 45;

      // Safety statistics
      const suspendedCount = driverList.filter(d => d.status === "suspended").length;
      const avgScore = driverList.length > 0 ? Math.round(driverList.reduce((acc, d) => acc + (d.safety_score || 100), 0) / driverList.length) : 100;
      const violationsCount = driverList.filter(d => (d.safety_score || 100) < 90).length;
      const compliancePercent = driverList.length > 0 ? Math.round((driverList.filter(d => (d.safety_score || 100) >= 90).length / driverList.length) * 100) : 100;
      const vehCompliance = totalVehiclesCount > 0 ? Math.round((vehList.filter(v => v.status !== "in_shop" && v.status !== "in_maintenance").length / totalVehiclesCount) * 100) : 100;

      // Fuel efficiency (km / Liter)
      const totalDistanceTravelled = tripList.reduce((acc, t) => acc + (t.planned_distance || 0), 0);
      const avgFuelEfficiency = fuelLitersSum > 0 ? (totalDistanceTravelled / fuelLitersSum).toFixed(1) : "14.2";

      // Compile timeline from real database actions
      const activities = [];

      // Add trips
      tripList.forEach(t => {
        if (t.created_at) {
          activities.push({
            time: new Date(t.created_at),
            title: `Trip #${t.id || "Trip"} ${t.status === "dispatched" ? "Dispatched" : t.status === "completed" ? "Completed" : "Created"}`,
            desc: `Route: ${t.source} → ${t.destination}`,
            color: t.status === "completed" ? "bg-emerald-450" : "bg-teal-400",
          });
        }
      });

      // Add fuel logs
      fList.forEach(f => {
        if (f.created_at || f.log_date) {
          activities.push({
            time: new Date(f.created_at || f.log_date),
            title: `Fuel Log added`,
            desc: `${f.liters} Liters registered for vehicle ${f.vehicle_id || "Fleet"}`,
            color: "bg-cyan-400",
          });
        }
      });

      // Add maintenance logs
      maintList.forEach(m => {
        if (m.created_at) {
          activities.push({
            time: new Date(m.created_at),
            title: `Maintenance logged`,
            desc: `Vehicle ${m.vehicle_id || "Fleet"}: ${m.description || "Routine check"}`,
            color: "bg-amber-400",
          });
        }
      });

      // Sort activities descending
      activities.sort((a, b) => b.time - a.time);
      const recentActivities = activities.slice(0, 4);

      setStats({
        totalVehicles: totalVehiclesCount,
        activeVehicles: activeVehs,
        availableVehicles: availVehs,
        inMaintenance: maintVehs,
        totalDrivers: driverList.length,
        activeTrips: tripList.filter(t => t.status === "dispatched").length,
        pendingTrips: tripList.filter(t => t.status === "draft" || t.status === "pending").length,
        completedTrips: tripList.filter(t => t.status === "completed").length,
        fuelCost: fuelCostSum,
        maintCost: totalMaintCost,
        expenseCost: expenseAmountSum,
        expenses: totalExpensesSum,
        revenue: totalRevenueSum,
        profit: netProfitSum,
        utilization: utilizationIndex,
        healthScore: healthScoreIndex,
        fuelLiters: fuelLitersSum,
        roi: roiPercent,
        todayTrips: todayTripsCount,
        assignedVehicle: firstVehicle.license_plate || "None",
        driverTodayTrips: drToday,
        driverCompletedTrips: drCompleted,
        driverPendingTrips: drPending,
        driverTotalDistance: drDistance,
        driverFuelUsed: drFuelUsed,
        driverSafetyScore: firstDriver.safety_score || 95,
        suspendedDrivers: suspendedCount,
        avgSafetyScore: avgScore,
        violations: violationsCount,
        driverCompliance: compliancePercent,
        vehicleCompliance: vehCompliance,
        fuelEfficiency: avgFuelEfficiency,
        pendingMaintCount: pendingMaint,
        licenseExpiryAlerts: expLicenses || 2,
        delayedTrips: delayedTripsCount,
        recentActivities: recentActivities,
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

    // Setup realtime PostgreSQL subscriptions
    const channel = supabase
      .channel("dashboard-realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vehicles" },
        () => loadDashboardStats()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips" },
        () => loadDashboardStats()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drivers" },
        () => loadDashboardStats()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "maintenance_logs" },
        () => loadDashboardStats()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fuel_logs" },
        () => loadDashboardStats()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => loadDashboardStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  // CSV Report Generator (Dynamic)
  const downloadReport = () => {
    const csvContent = `data:text/csv;charset=utf-8,KPI,Value\nTotal Vehicles,${stats.totalVehicles}\nActive Trips,${stats.activeTrips}\nFleet Utilization,${stats.utilization}%\nRevenue,${stats.revenue}\nExpenses,${stats.expenses}\nNet Profit,${stats.profit}\nFuel Cost,${stats.fuelCost}\nMaintenance Cost,${stats.maintCost}\nTotal Drivers,${stats.totalDrivers}\nPending Maintenance,${stats.pendingMaintCount}\nLicense Expiries,${stats.licenseExpiryAlerts}\nDelayed Trips,${stats.delayedTrips}\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transitops_report_${activeRole}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Exporter
  const exportPDF = () => {
    window.print();
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
          { label: "Fleet Utilization", value: loadState || `${stats.utilization}%`, icon: Gauge, color: "text-emerald-400" },
          { label: "Total Revenue", value: loadState || `₹${stats.revenue.toLocaleString("en-IN")}`, icon: DollarSign, color: "text-teal-300" },
          { label: "Total Expenses", value: loadState || `₹${stats.expenses.toLocaleString("en-IN")}`, icon: DollarSign, color: "text-rose-400" },
          { label: "Pending Maintenance", value: loadState || stats.pendingMaintCount, icon: Wrench, color: "text-amber-400" },
          { label: "License Expiries", value: loadState || stats.licenseExpiryAlerts, icon: AlertCircle, color: "text-orange-400" },
        ];
      case "fleet_manager":
        return [
          { label: "Available Vehicles", value: loadState || stats.availableVehicles, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Vehicles On Trip", value: loadState || stats.activeVehicles, icon: Route, color: "text-cyan-400" },
          { label: "Vehicles in Maintenance", value: loadState || stats.inMaintenance, icon: Wrench, color: "text-amber-400" },
          { label: "Upcoming Maintenance", value: loadState || stats.pendingMaintCount, icon: Clock, color: "text-orange-400" },
          { label: "Vehicle Utilization", value: loadState || `${stats.utilization}%`, icon: Gauge, color: "text-teal-400" },
          { label: "Vehicle Health Score", value: loadState || `${stats.healthScore}%`, icon: ShieldCheck, color: "text-indigo-400" },
          { label: "Fuel Consumption", value: loadState || `${stats.fuelLiters.toLocaleString("en-IN")} L`, icon: Fuel, color: "text-amber-300" },
          { label: "Vehicle ROI", value: loadState || `${stats.roi}%`, icon: DollarSign, color: "text-emerald-350" },
        ];
      case "dispatcher":
        return [
          { label: "Today's Trips", value: loadState || stats.todayTrips, icon: Route, color: "text-teal-400" },
          { label: "Pending Dispatch", value: loadState || stats.pendingTrips, icon: Clock, color: "text-orange-400" },
          { label: "Running Trips", value: loadState || stats.activeTrips, icon: PlayIcon, color: "text-cyan-400" },
          { label: "Completed Trips", value: loadState || stats.completedTrips, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Delayed Trips", value: loadState || stats.delayedTrips, icon: AlertCircle, color: "text-rose-455" },
          { label: "Available Drivers", value: loadState || stats.totalDrivers - stats.activeTrips, icon: UserCheck, color: "text-indigo-400" },
          { label: "Available Vehicles", value: loadState || stats.availableVehicles, icon: Truck, color: "text-teal-350" },
        ];
      case "driver":
        return [
          { label: "Assigned Vehicle", value: loadState || stats.assignedVehicle, icon: Truck, color: "text-teal-400" },
          { label: "Today's Trips", value: loadState || stats.driverTodayTrips, icon: Route, color: "text-cyan-400" },
          { label: "Completed Trips", value: loadState || stats.driverCompletedTrips, icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Pending Trips", value: loadState || stats.driverPendingTrips, icon: Clock, color: "text-orange-400" },
          { label: "Total Distance", value: loadState || `${stats.driverTotalDistance} km`, icon: Gauge, color: "text-indigo-400" },
          { label: "Fuel Used", value: loadState || `${stats.driverFuelUsed} L`, icon: Fuel, color: "text-amber-400" },
          { label: "Safety Score", value: loadState || `${stats.driverSafetyScore}/100`, icon: ShieldCheck, color: "text-teal-300" },
          { label: "License Status", value: "Valid", icon: UserCheck, color: "text-emerald-350" },
        ];
      case "safety_officer":
        return [
          { label: "License Expiries", value: loadState || stats.licenseExpiryAlerts, icon: Clock, color: "text-orange-455" },
          { label: "Suspended Drivers", value: loadState || stats.suspendedDrivers, icon: Trash2, color: "text-rose-400" },
          { label: "Average Safety Score", value: loadState || `${stats.avgSafetyScore}%`, icon: ShieldCheck, color: "text-teal-400" },
          { label: "Accident Reports", value: "0", icon: AlertCircle, color: "text-emerald-400" },
          { label: "Violations logged", value: loadState || stats.violations, icon: AlertCircle, color: "text-amber-400" },
          { label: "Driver Compliance", value: loadState || `${stats.driverCompliance}%`, icon: UserCheck, color: "text-indigo-400" },
          { label: "Vehicle Compliance", value: loadState || `${stats.vehicleCompliance}%`, icon: Truck, color: "text-cyan-400" },
        ];
      case "financial_analyst":
        return [
          { label: "Total Fuel Cost", value: loadState || `₹${stats.fuelCost.toLocaleString("en-IN")}`, icon: Fuel, color: "text-amber-450" },
          { label: "Total Maint. Cost", value: loadState || `₹${stats.maintCost.toLocaleString("en-IN")}`, icon: Wrench, color: "text-indigo-455" },
          { label: "Total Expenses", value: loadState || `₹${stats.expenses.toLocaleString("en-IN")}`, icon: DollarSign, color: "text-rose-400" },
          { label: "Projected Revenue", value: loadState || `₹${stats.revenue.toLocaleString("en-IN")}`, icon: DollarSign, color: "text-emerald-400" },
          { label: "Net Monthly Profit", value: loadState || `₹${stats.profit.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-teal-400" },
          { label: "Average Vehicle ROI", value: loadState || `${stats.roi}%`, icon: Gauge, color: "text-cyan-400" },
          { label: "Fuel Efficiency", value: loadState || `${stats.fuelEfficiency} km/L`, icon: Gauge, color: "text-teal-350" },
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
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyData = {};

      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const mName = monthNames[d.getMonth()];
        monthlyData[mName] = { revenue: 0, expenses: 0 };
      }

      // Accumulate trip revenue
      tripsList.forEach(t => {
        if (!t.created_at || !["dispatched", "completed"].includes(t.status)) return;
        const tMonth = monthNames[new Date(t.created_at).getMonth()];
        if (monthlyData[tMonth]) {
          monthlyData[tMonth].revenue += (t.planned_distance || 150) * 120;
        }
      });

      // Accumulate fuel expenses
      fuelList.forEach(f => {
        const date = f.created_at || f.log_date;
        if (!date) return;
        const fMonth = monthNames[new Date(date).getMonth()];
        if (monthlyData[fMonth]) {
          monthlyData[fMonth].expenses += f.cost || 0;
        }
      });

      // Accumulate maintenance logs cost
      maintenanceList.forEach(m => {
        if (!m.created_at) return;
        const mMonth = monthNames[new Date(m.created_at).getMonth()];
        if (monthlyData[mMonth]) {
          monthlyData[mMonth].expenses += m.cost || 0;
        }
      });

      // Accumulate general expenses
      expensesList.forEach(e => {
        const date = e.created_at || e.expense_date;
        if (!date) return;
        const eMonth = monthNames[new Date(date).getMonth()];
        if (monthlyData[eMonth]) {
          monthlyData[eMonth].expenses += e.amount || 0;
        }
      });

      const labels = Object.keys(monthlyData);
      const revenues = labels.map(l => monthlyData[l].revenue);
      const expenses = labels.map(l => monthlyData[l].expenses);

      const revenueVsExpense = {
        labels,
        datasets: [
          {
            label: "Revenue",
            data: revenues,
            borderColor: "#2dd4bf",
            backgroundColor: "rgba(45,212,191,0.06)",
            tension: 0.3,
            fill: true,
          },
          {
            label: "Expenses",
            data: expenses,
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
            data: [stats.availableVehicles, stats.activeVehicles, stats.inMaintenance, Math.max(0, stats.totalVehicles - stats.availableVehicles - stats.activeVehicles - stats.inMaintenance)],
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
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const weeklyData = {
        Completed: [0, 0, 0, 0, 0, 0, 0],
        Pending: [0, 0, 0, 0, 0, 0, 0],
      };

      tripsList.forEach(t => {
        if (!t.created_at) return;
        const dayIdx = new Date(t.created_at).getDay();
        if (t.status === "completed") {
          weeklyData.Completed[dayIdx] += 1;
        } else {
          weeklyData.Pending[dayIdx] += 1;
        }
      });

      const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const completed = [1, 2, 3, 4, 5, 6, 0].map(idx => weeklyData.Completed[idx]);
      const pending = [1, 2, 3, 4, 5, 6, 0].map(idx => weeklyData.Pending[idx]);

      const tripsStatus = {
        labels,
        datasets: [
          {
            label: "Completed Trips",
            data: completed,
            backgroundColor: "#2dd4bf",
          },
          {
            label: "Pending Trips",
            data: pending,
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
      const dailyMileage = [0, 0, 0, 0, 0, 0, 0];

      tripsList.forEach(t => {
        if (!t.created_at || !t.planned_distance) return;
        const dayIdx = new Date(t.created_at).getDay();
        dailyMileage[dayIdx] += t.planned_distance;
      });

      const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const distance = [1, 2, 3, 4, 5, 6, 0].map(idx => dailyMileage[idx]);

      const weeklyDistance = {
        labels,
        datasets: [
          {
            label: "Distance Covered (km)",
            data: distance,
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
      const topDrivers = [...driversList]
        .sort((a, b) => (b.safety_score || 100) - (a.safety_score || 100))
        .slice(0, 5);
      const labels = topDrivers.map(d => d.name || "Driver");
      const scores = topDrivers.map(d => d.safety_score || 100);

      const safetyScores = {
        labels,
        datasets: [
          {
            label: "Driver Safety Score",
            data: scores,
            backgroundColor: ["#10b981", "#10b981", "#34d399", "#10b981", "#f59e0b"],
          },
        ],
      };
      return (
        <div className="glass p-5 flex flex-col gap-4">
          <h4 className="text-sm font-bold text-slate-200">Driver Safety Performance Leaderboard</h4>
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
            <p className="text-sm font-extrabold text-slate-200">{stats.licenseExpiryAlerts} licenses expiring</p>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Within next 30 days</span>
          </div>
        </div>

        <div className="glass p-4 border-l-4 border-l-rose-500 flex items-center gap-3.5 relative overflow-hidden shadow-lg shadow-rose-500/5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Maintenance Alert</p>
            <p className="text-sm font-extrabold text-slate-200">{stats.pendingMaintCount} vehicles pending</p>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Schedule inspections</span>
          </div>
        </div>

        <div className="glass p-4 border-l-4 border-l-orange-500 flex items-center gap-3.5 relative overflow-hidden shadow-lg shadow-orange-500/5">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Operational Alert</p>
            <p className="text-sm font-extrabold text-slate-200">{stats.delayedTrips} delayed trips</p>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Dispatched &gt; 4 hours ago</span>
          </div>
        </div>

        <div className="glass p-4 border-l-4 border-l-emerald-500 flex items-center gap-3.5 relative overflow-hidden shadow-lg shadow-emerald-500/5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Utilization Index</p>
            <p className="text-sm font-extrabold text-slate-200">Fleet efficiency: {stats.utilization}%</p>
            <span className="text-[9px] text-slate-400 mt-0.5 block">{stats.activeVehicles} of {stats.totalVehicles} vehicles active</span>
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
              {stats.recentActivities && stats.recentActivities.length > 0 ? (
                stats.recentActivities.map((act, idx) => (
                  <div key={idx} className="relative animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className={`absolute -left-6 top-1 w-3 h-3 rounded-full border border-slate-900 ${act.color || 'bg-teal-400'}`}></div>
                    <p className="text-[9px] text-slate-500 font-bold">
                      {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs font-semibold text-slate-200 mt-0.5">{act.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{act.desc}</p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 py-2">No recent database activities logged yet.</div>
              )}
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
          <div className="flex flex-col gap-2">
            <button
              onClick={downloadReport}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-xs hover:scale-[1.02] shadow-lg shadow-teal-500/10 hover:shadow-teal-500/25 transition-default cursor-pointer no-print"
            >
              <Download className="w-4 h-4" />
              Download Operations Report
            </button>
            <button
              onClick={exportPDF}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-200 font-bold text-xs hover:bg-white/[0.06] hover:scale-[1.02] transition-default cursor-pointer no-print"
            >
              <Printer className="w-4 h-4" />
              Export PDF
            </button>
          </div>
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