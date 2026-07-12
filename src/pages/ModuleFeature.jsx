import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  FileText,
  UserCheck,
  MapPin,
  Shield,
  RefreshCw,
  Box,
  Clock,
  AlertTriangle,
  FolderOpen,
  User,
  ShieldCheck,
  CheckCircle2,
  Wrench,
  Download,
  Plus,
  Loader2,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { supabase } from "../supabaseClient";

// ── Module metadata (titles, icons, colors) ─────────────────
const MODULE_META = {
  "/users":              { title: "User Management",              subtitle: "Manage driver & operator profiles registered in the system",        icon: UserCheck,    color: "text-teal-400"    },
  "/branches":           { title: "Branch Management",            subtitle: "Fleet distribution across operational city hubs",                    icon: MapPin,       color: "text-indigo-400"  },
  "/settings":           { title: "Company Settings",             subtitle: "System configuration and integration status",                       icon: Shield,       color: "text-teal-350"    },
  "/audit-logs":         { title: "System Audit Logs",            subtitle: "Real-time operational audit trail from database activity",           icon: FileText,     color: "text-amber-400"   },
  "/backup-restore":     { title: "Database Backup & Restore",    subtitle: "Database snapshot overview and table statistics",                    icon: RefreshCw,    color: "text-cyan-400"    },
  "/cargo":              { title: "Cargo Management Center",      subtitle: "Active cargo loads from dispatched trips",                          icon: Box,          color: "text-teal-400"    },
  "/scheduling":         { title: "Fleet Scheduling Board",       subtitle: "Upcoming and planned trip schedules from the database",              icon: Clock,        color: "text-indigo-400"  },
  "/incident-reports":   { title: "Incident Reports Ledger",      subtitle: "Maintenance incidents and breakdown records",                       icon: AlertTriangle,color: "text-rose-455"    },
  "/documents":          { title: "Fleet Documents Center",       subtitle: "Driver licenses and vehicle registration documents",                icon: FolderOpen,   color: "text-cyan-400"    },
  "/profile":            { title: "Driver Profile",               subtitle: "Personal driver statistics and performance metrics",                icon: User,         color: "text-teal-400"    },
  "/license-management": { title: "License Compliance Center",    subtitle: "Driver license validity and expiration tracking",                   icon: ShieldCheck,  color: "text-emerald-450" },
  "/compliance":         { title: "Regulatory Compliance Auditor",subtitle: "Vehicle fleet status and operational compliance overview",           icon: CheckCircle2, color: "text-indigo-400"  },
  "/inspections":        { title: "Vehicle Inspections Logs",     subtitle: "Maintenance inspection records from the database",                  icon: Wrench,       color: "text-amber-400"   },
  "/export":             { title: "Data Export Tool",             subtitle: "Export real operational data from all database tables",              icon: Download,     color: "text-teal-350"    },
};

// ── Helpers ──────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";
const fmtCurrency = (n) => `₹${(n || 0).toLocaleString("en-IN")}`;

// ── Data builders: each returns { kpis, tableHeaders, tableRows, actionLabel } ──

async function buildUsersData() {
  const { data: drivers } = await supabase.from("drivers").select("*").order("name");
  const d = drivers || [];
  const active = d.filter(x => x.status === "available").length;
  const onTrip = d.filter(x => x.status === "on_trip").length;
  const suspended = d.filter(x => x.status === "suspended").length;
  return {
    kpis: [
      { label: "Total Registered Drivers", value: String(d.length), desc: "From drivers table" },
      { label: "Active / Available", value: String(active), desc: "Ready for assignment" },
      { label: "Currently On Trip", value: String(onTrip), desc: "Dispatched fleet operators" },
    ],
    tableHeaders: ["Driver Name", "License Number", "License Expiry", "Status", "Safety Score"],
    tableRows: d.map(dr => [
      dr.name || "—",
      dr.license_number || "—",
      fmtDate(dr.license_expiry_date),
      dr.status || "available",
      String(dr.safety_score ?? 100),
    ]),
    actionLabel: "Add Driver",
  };
}

async function buildBranchesData() {
  const { data: vehicles } = await supabase.from("vehicles").select("*");
  const { data: trips } = await supabase.from("trips").select("*");
  const v = vehicles || []; const t = trips || [];
  // Group vehicles by first word of name or registration state
  const branches = {};
  v.forEach(veh => {
    const city = (veh.name || "Unknown").split(" ")[0];
    if (!branches[city]) branches[city] = { vehicles: 0, active: 0, maint: 0 };
    branches[city].vehicles++;
    if (veh.status === "on_trip" || veh.status === "active") branches[city].active++;
    if (veh.status === "in_shop" || veh.status === "in_maintenance") branches[city].maint++;
  });
  const branchEntries = Object.entries(branches);
  return {
    kpis: [
      { label: "Fleet Hubs Detected", value: String(branchEntries.length), desc: "From vehicle names" },
      { label: "Total Fleet Assets", value: String(v.length), desc: "All registered vehicles" },
      { label: "Active Trips System-Wide", value: String(t.filter(x => x.status === "dispatched").length), desc: "Currently dispatched" },
    ],
    tableHeaders: ["Hub / Branch", "Fleet Count", "Active Vehicles", "In Maintenance", "Utilization %"],
    tableRows: branchEntries.map(([name, data]) => [
      name,
      `${data.vehicles} vehicles`,
      `${data.active} active`,
      `${data.maint} in maint.`,
      data.vehicles > 0 ? `${Math.round((data.active / data.vehicles) * 100)}%` : "0%",
    ]),
    actionLabel: "Register Branch",
  };
}

async function buildAuditLogsData() {
  const { data: trips } = await supabase.from("trips").select("*, drivers(name), vehicles(name)").order("created_at", { ascending: false }).limit(20);
  const { data: fuel } = await supabase.from("fuel_logs").select("*").order("created_at", { ascending: false }).limit(10);
  const { data: maint } = await supabase.from("maintenance_logs").select("*").order("created_at", { ascending: false }).limit(10);
  const logs = [];
  (trips || []).forEach(t => {
    logs.push({ time: t.created_at, user: t.drivers?.name || "System", role: "Operator", desc: `Trip ${t.source}→${t.destination} [${t.status}]`, ip: "DB Event" });
    if (t.dispatched_at) logs.push({ time: t.dispatched_at, user: t.drivers?.name || "System", role: "Dispatcher", desc: `Dispatched trip to ${t.destination}`, ip: "DB Event" });
  });
  (fuel || []).forEach(f => { logs.push({ time: f.created_at, user: "Fleet Operator", role: "Fleet Manager", desc: `Fuel log: ${f.liters}L @ ${fmtCurrency(f.cost)}`, ip: "DB Event" }); });
  (maint || []).forEach(m => { logs.push({ time: m.created_at, user: "Maint. Officer", role: "Operations", desc: `Maintenance: ${m.description || "Service log"}`, ip: "DB Event" }); });
  logs.sort((a, b) => new Date(b.time) - new Date(a.time));
  const topLogs = logs.slice(0, 15);
  return {
    kpis: [
      { label: "Logged Events", value: String(logs.length), desc: "From all DB tables" },
      { label: "Trip Events", value: String((trips || []).length), desc: "Trip lifecycle logs" },
      { label: "Operations Events", value: String((fuel || []).length + (maint || []).length), desc: "Fuel + Maintenance" },
    ],
    tableHeaders: ["Timestamp", "User", "Role", "Operation", "Source"],
    tableRows: topLogs.map(l => [fmtTime(l.time), l.user, l.role, l.desc, l.ip]),
    actionLabel: "Export Audit Ledger",
  };
}

async function buildBackupData() {
  const counts = {};
  for (const tbl of ["vehicles", "drivers", "trips", "fuel_logs", "expenses", "maintenance_logs"]) {
    const { count } = await supabase.from(tbl).select("*", { count: "exact", head: true });
    counts[tbl] = count || 0;
  }
  const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);
  return {
    kpis: [
      { label: "Total DB Records", value: String(totalRecords), desc: "Across all tables" },
      { label: "Database Tables", value: "6 Tables", desc: "Core operational schema" },
      { label: "Cloud Provider", value: "Supabase", desc: "PostgreSQL managed" },
    ],
    tableHeaders: ["Table Name", "Record Count", "Schema Type", "Realtime Sync", "Status"],
    tableRows: Object.entries(counts).map(([tbl, cnt]) => [
      tbl, String(cnt), "PostgreSQL", "Enabled", "Active",
    ]),
    actionLabel: "Export All Data",
  };
}

async function buildCargoData() {
  const { data: trips } = await supabase.from("trips").select("*, vehicles(name, registration_number), drivers(name)").order("created_at", { ascending: false });
  const t = (trips || []).filter(x => x.cargo_weight && x.cargo_weight > 0);
  const totalCargo = t.reduce((a, x) => a + (x.cargo_weight || 0), 0);
  const dispatched = t.filter(x => x.status === "dispatched");
  return {
    kpis: [
      { label: "Total Cargo Moved", value: `${(totalCargo / 1000).toFixed(1)} tons`, desc: "All trips combined" },
      { label: "Active Cargo On Road", value: `${(dispatched.reduce((a, x) => a + (x.cargo_weight || 0), 0) / 1000).toFixed(1)} tons`, desc: "Currently dispatched" },
      { label: "Shipments Logged", value: String(t.length), desc: "Trips with cargo weight" },
    ],
    tableHeaders: ["Trip Route", "Vehicle", "Driver", "Cargo (kg)", "Status"],
    tableRows: t.slice(0, 15).map(x => [
      `${x.source} → ${x.destination}`,
      x.vehicles?.name || "—",
      x.drivers?.name || "—",
      `${(x.cargo_weight || 0).toLocaleString("en-IN")} kg`,
      x.status || "draft",
    ]),
    actionLabel: "View All Trips",
  };
}

async function buildSchedulingData() {
  const { data: trips } = await supabase.from("trips").select("*, vehicles(name, registration_number), drivers(name)").order("created_at", { ascending: false });
  const t = trips || [];
  const drafts = t.filter(x => x.status === "draft");
  const dispatched = t.filter(x => x.status === "dispatched");
  return {
    kpis: [
      { label: "Total Trips", value: String(t.length), desc: "All trip records" },
      { label: "Pending / Draft", value: String(drafts.length), desc: "Awaiting dispatch" },
      { label: "Currently Dispatched", value: String(dispatched.length), desc: "On the road now" },
    ],
    tableHeaders: ["Created Date", "Vehicle", "Driver", "Route", "Status"],
    tableRows: t.slice(0, 15).map(x => [
      fmtDate(x.created_at),
      x.vehicles?.name || "—",
      x.drivers?.name || "—",
      `${x.source} → ${x.destination}`,
      x.status || "draft",
    ]),
    actionLabel: "Create Trip Schedule",
  };
}

async function buildIncidentData() {
  const { data: maint } = await supabase.from("maintenance_logs").select("*, vehicles(name, registration_number)").order("created_at", { ascending: false });
  const m = maint || [];
  const pending = m.filter(x => x.status === "pending").length;
  const completed = m.filter(x => x.status === "completed").length;
  return {
    kpis: [
      { label: "Total Incident Logs", value: String(m.length), desc: "From maintenance table" },
      { label: "Pending Resolution", value: String(pending), desc: "Needs attention" },
      { label: "Resolved / Completed", value: String(completed), desc: "Issues fixed" },
    ],
    tableHeaders: ["Date Logged", "Vehicle", "Description", "Cost", "Status"],
    tableRows: m.slice(0, 15).map(x => [
      fmtDate(x.created_at),
      x.vehicles?.name || "—",
      x.description || "Service incident",
      fmtCurrency(x.cost),
      x.status || "pending",
    ]),
    actionLabel: "Report Incident",
  };
}

async function buildDocumentsData() {
  const { data: drivers } = await supabase.from("drivers").select("*").order("name");
  const { data: vehicles } = await supabase.from("vehicles").select("*").order("name");
  const d = drivers || []; const v = vehicles || [];
  const today = new Date().toISOString().split("T")[0];
  const expiringSoon = d.filter(dr => dr.license_expiry_date && dr.license_expiry_date <= new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0] && dr.license_expiry_date >= today).length;
  const rows = [];
  d.forEach(dr => rows.push([`${dr.name} — Driving License`, dr.license_number || "—", fmtDate(dr.license_expiry_date), dr.license_expiry_date && dr.license_expiry_date < today ? "Expired" : "Valid", "Driver Document"]));
  v.forEach(ve => rows.push([`${ve.name} — Registration`, ve.registration_number || "—", "—", ve.status === "retired" ? "Expired" : "Valid", "Vehicle Document"]));
  return {
    kpis: [
      { label: "Total Documents", value: String(rows.length), desc: "Licenses + Registrations" },
      { label: "Expiring Soon (30d)", value: String(expiringSoon), desc: "Driver licenses" },
      { label: "Active Vehicles", value: String(v.length), desc: "Registration records" },
    ],
    tableHeaders: ["Document Title", "Reference ID", "Expiry Date", "Status", "Category"],
    tableRows: rows.slice(0, 15),
    actionLabel: "Upload Document",
  };
}

async function buildProfileData() {
  const { data: drivers } = await supabase.from("drivers").select("*").order("name").limit(1);
  const { data: trips } = await supabase.from("trips").select("*");
  const { data: fuel } = await supabase.from("fuel_logs").select("*");
  const dr = (drivers || [])[0] || { name: "No Driver", safety_score: 0 };
  const t = trips || []; const f = fuel || [];
  const drTrips = t.filter(x => x.driver_id === dr.id);
  const completed = drTrips.filter(x => x.status === "completed").length;
  const totalDist = drTrips.reduce((a, x) => a + (x.planned_distance || 0), 0);
  const fuelUsed = f.reduce((a, x) => a + (x.liters || 0), 0);
  return {
    kpis: [
      { label: "Safety Score", value: `${dr.safety_score || 100}/100`, desc: dr.name },
      { label: "Trips Completed", value: String(completed), desc: "Lifetime completed trips" },
      { label: "Total Distance", value: `${totalDist} km`, desc: "Aggregate distance" },
    ],
    tableHeaders: ["Metric", "Current Value", "Target", "Evaluation", "Status"],
    tableRows: [
      ["Safety Score", `${dr.safety_score || 100}/100`, "90+", dr.safety_score >= 90 ? "Excellent" : "Needs Improvement", dr.safety_score >= 90 ? "Good" : "Warning"],
      ["Trips Completed", String(completed), "50+", completed >= 50 ? "Experienced" : "Building", completed >= 50 ? "Active" : "Active"],
      ["Total Distance Covered", `${totalDist} km`, "5000+ km", totalDist >= 5000 ? "Senior" : "Junior", "Active"],
      ["Fuel Consumption Tracked", `${fuelUsed} L`, "—", "Tracked", "Active"],
      ["License Status", fmtDate(dr.license_expiry_date), "Valid", dr.license_expiry_date && dr.license_expiry_date < new Date().toISOString().split("T")[0] ? "Expired" : "Valid", dr.license_expiry_date && dr.license_expiry_date < new Date().toISOString().split("T")[0] ? "Expired" : "Valid"],
    ],
    actionLabel: "Edit Profile",
  };
}

async function buildLicenseData() {
  const { data: drivers } = await supabase.from("drivers").select("*").order("name");
  const d = drivers || [];
  const today = new Date().toISOString().split("T")[0];
  const expired = d.filter(dr => dr.license_expiry_date && dr.license_expiry_date < today).length;
  const soon = d.filter(dr => {
    if (!dr.license_expiry_date) return false;
    const exp = dr.license_expiry_date;
    const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    return exp >= today && exp <= in30;
  }).length;
  return {
    kpis: [
      { label: "Total Licensed Drivers", value: String(d.length), desc: "All registered" },
      { label: "Expired Licenses", value: String(expired), desc: "Needs renewal" },
      { label: "Expiring in 30 Days", value: String(soon), desc: "Action required" },
    ],
    tableHeaders: ["Driver Name", "License Number", "Expiry Date", "Safety Score", "Compliance"],
    tableRows: d.map(dr => {
      const exp = dr.license_expiry_date;
      const isExpired = exp && exp < today;
      const isSoon = exp && !isExpired && exp <= new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
      return [dr.name || "—", dr.license_number || "—", fmtDate(exp), String(dr.safety_score ?? 100), isExpired ? "Expired" : isSoon ? "Expiring soon" : "Valid"];
    }),
    actionLabel: "Audit License",
  };
}

async function buildComplianceData() {
  const { data: vehicles } = await supabase.from("vehicles").select("*").order("name");
  const v = vehicles || [];
  const compliant = v.filter(x => !["in_shop", "in_maintenance", "retired"].includes(x.status)).length;
  const pct = v.length > 0 ? Math.round((compliant / v.length) * 100) : 100;
  return {
    kpis: [
      { label: "Compliance Index", value: `${pct}%`, desc: `${compliant} of ${v.length} compliant` },
      { label: "Total Fleet Assets", value: String(v.length), desc: "All registered" },
      { label: "Non-Compliant", value: String(v.length - compliant), desc: "In maintenance/retired" },
    ],
    tableHeaders: ["Vehicle Name", "Registration", "Type", "Status", "Compliance"],
    tableRows: v.map(x => [
      x.name || "—",
      x.registration_number || "—",
      x.type || "truck",
      x.status || "available",
      ["in_shop", "in_maintenance", "retired"].includes(x.status) ? "Warning" : "Valid",
    ]),
    actionLabel: "Add Compliance Record",
  };
}

async function buildInspectionsData() {
  const { data: maint } = await supabase.from("maintenance_logs").select("*, vehicles(name, registration_number)").order("created_at", { ascending: false });
  const m = maint || [];
  const completed = m.filter(x => x.status === "completed").length;
  const pending = m.filter(x => x.status === "pending").length;
  return {
    kpis: [
      { label: "Total Inspections", value: String(m.length), desc: "From maintenance logs" },
      { label: "Completed / Clean", value: String(completed), desc: "Resolved inspections" },
      { label: "Pending Review", value: String(pending), desc: "Awaiting action" },
    ],
    tableHeaders: ["Date", "Vehicle", "Registration", "Description", "Status"],
    tableRows: m.slice(0, 15).map(x => [
      fmtDate(x.created_at),
      x.vehicles?.name || "—",
      x.vehicles?.registration_number || "—",
      x.description || "Routine inspection",
      x.status || "pending",
    ]),
    actionLabel: "Log Inspection",
  };
}

async function buildExportData() {
  const tables = ["vehicles", "drivers", "trips", "fuel_logs", "expenses", "maintenance_logs"];
  const rows = [];
  for (const tbl of tables) {
    const { count } = await supabase.from(tbl).select("*", { count: "exact", head: true });
    rows.push([tbl.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), "All Time", String(count || 0), "CSV", "Ready"]);
  }
  const totalRecords = rows.reduce((a, r) => a + parseInt(r[2]), 0);
  return {
    kpis: [
      { label: "Total Exportable Records", value: String(totalRecords), desc: "Across 6 tables" },
      { label: "Tables Available", value: "6 Tables", desc: "Full operational schema" },
      { label: "Export Format", value: "CSV", desc: "Downloadable format" },
    ],
    tableHeaders: ["Data Source", "Date Scope", "Record Count", "Format", "Status"],
    tableRows: rows,
    actionLabel: "Trigger Export",
  };
}

async function buildSettingsData() {
  // Settings are system config — we pull live counts to show real numbers
  const { count: vCount } = await supabase.from("vehicles").select("*", { count: "exact", head: true });
  const { count: dCount } = await supabase.from("drivers").select("*", { count: "exact", head: true });
  const { count: tCount } = await supabase.from("trips").select("*", { count: "exact", head: true });
  return {
    kpis: [
      { label: "System Status", value: "Operational", desc: "All services online" },
      { label: "Database Records", value: String((vCount || 0) + (dCount || 0) + (tCount || 0)), desc: "Core tables total" },
      { label: "Realtime Sync", value: "Enabled", desc: "PostgreSQL channels" },
    ],
    tableHeaders: ["Config Key", "Category", "Value", "Source", "Status"],
    tableRows: [
      ["total_vehicles", "Fleet", String(vCount || 0), "Database", "Active"],
      ["total_drivers", "Operations", String(dCount || 0), "Database", "Active"],
      ["total_trips", "Logistics", String(tCount || 0), "Database", "Active"],
      ["realtime_sync", "Telemetry", "Enabled", "Supabase", "Active"],
      ["map_provider", "Mapping", "OSRM + OpenStreetMap", "External API", "Active"],
      ["auth_provider", "Security", "Supabase Auth", "Cloud", "Active"],
    ],
    actionLabel: "Save Config",
  };
}

// ── Router: path → data builder ─────────────────────────────
const DATA_BUILDERS = {
  "/users": buildUsersData,
  "/branches": buildBranchesData,
  "/settings": buildSettingsData,
  "/audit-logs": buildAuditLogsData,
  "/backup-restore": buildBackupData,
  "/cargo": buildCargoData,
  "/scheduling": buildSchedulingData,
  "/incident-reports": buildIncidentData,
  "/documents": buildDocumentsData,
  "/profile": buildProfileData,
  "/license-management": buildLicenseData,
  "/compliance": buildComplianceData,
  "/inspections": buildInspectionsData,
  "/export": buildExportData,
};

export default function ModuleFeature() {
  const { pathname } = useLocation();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState([]);
  const [tableHeaders, setTableHeaders] = useState([]);
  const [tableRows, setTableRows] = useState([]);
  const [actionLabel, setActionLabel] = useState("Action");

  const meta = MODULE_META[pathname] || MODULE_META["/users"];
  const Icon = meta.icon || FileText;

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      const builder = DATA_BUILDERS[pathname];
      if (builder) {
        try {
          const result = await builder();
          if (!cancelled) {
            setKpis(result.kpis);
            setTableHeaders(result.tableHeaders);
            setTableRows(result.tableRows);
            setActionLabel(result.actionLabel);
          }
        } catch (err) {
          console.error(`ModuleFeature [${pathname}] load error:`, err.message);
        }
      }
      if (!cancelled) setLoading(false);
    };
    loadData();
    return () => { cancelled = true; };
  }, [pathname]);

  const handleAction = () => {
    alert(`Action: "${actionLabel}" triggered.`);
  };

  return (
    <section className="flex flex-col gap-8 animate-fade-in">
      <PageHeader title={meta.title} subtitle={meta.subtitle} />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
            <p className="text-xs font-semibold text-slate-400 tracking-wider">Loading data from database...</p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="glass p-5 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                  {kpi.label}
                </span>
                <p className="text-2xl font-extrabold text-slate-100">{kpi.value}</p>
                <p className="text-[10px] text-slate-500">{kpi.desc}</p>
              </div>
            ))}
          </div>

          {/* Feature Details Panel */}
          <div className="glass p-6 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] ${meta.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Live Database Registry</h4>
                  <p className="text-xs text-slate-500">Real-time data from Supabase PostgreSQL</p>
                </div>
              </div>

              <button
                onClick={handleAction}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-xs font-bold hover:scale-105 transition-all shadow-md shadow-teal-500/10 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {actionLabel}
              </button>
            </div>

            {/* Database Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {tableHeaders.map((head, idx) => (
                      <th key={idx} className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length === 0 ? (
                    <tr>
                      <td colSpan={tableHeaders.length} className="px-4 py-8 text-center text-slate-500">
                        No records found in database
                      </td>
                    </tr>
                  ) : (
                    tableRows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${
                          rowIdx === tableRows.length - 1 ? "border-b-0" : ""
                        }`}
                      >
                        {row.map((val, cellIdx) => (
                          <td key={cellIdx} className="px-4 py-3.5 font-medium text-slate-350">
                            {val === "Active" || val === "Verified" || val === "Compliant" || val === "Good" || val === "Valid" || val === "available" || val === "completed" || val === "Excellent" || val === "Ready" ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase">
                                {val}
                              </span>
                            ) : val === "Under Review" || val === "Warning" || val === "Expiring soon" || val === "pending" || val === "on_trip" || val === "in_maintenance" || val === "in_shop" || val === "draft" || val === "Junior" ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20 uppercase">
                                {val}
                              </span>
                            ) : val === "Expired" || val === "suspended" || val === "cancelled" || val === "retired" ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20 uppercase">
                                {val}
                              </span>
                            ) : val === "dispatched" ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 uppercase">
                                {val}
                              </span>
                            ) : (
                              val
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
