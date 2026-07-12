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
} from "lucide-react";
import PageHeader from "../components/PageHeader";

// ── Configuration details for mock modules ─────────────────
const MODULE_CONFIGS = {
  "/users": {
    title: "User Management",
    subtitle: "Manage manager profiles, verify user login sessions, and audit permissions",
    icon: UserCheck,
    color: "text-teal-400",
    kpis: [
      { label: "Active Admins", value: "3", desc: "Super admin role" },
      { label: "Registered Managers", value: "14", desc: "Fleet & Operations" },
      { label: "Active Drivers Profiles", value: "27", desc: "Verified drivers" },
    ],
    tableHeaders: ["User Name", "Email", "Role Profile", "Branch Office", "Last Login Status"],
    tableRows: [
      ["Snehi Patel", "snehi.patel@transitops.com", "Fleet Manager", "Gujarat North", "Active Now"],
      ["Rajesh Sharma", "rajesh.sharma@transitops.com", "Driver", "Vadodara East", "2 hours ago"],
      ["Juhi Vanjara", "juhi.vanjara@transitops.com", "Safety Officer", "Mumbai South", "Yesterday"],
      ["Yashvi Sanghvi", "yashvi.sanghvi@transitops.com", "Financial Analyst", "Delhi West", "Active Now"],
    ],
    actionLabel: "Add User",
  },
  "/branches": {
    title: "Branch Management",
    subtitle: "Coordinate fleet operations and depots across regional branches",
    icon: MapPin,
    color: "text-indigo-400",
    kpis: [
      { label: "Active Branches", value: "6", desc: "Major metropolitan hubs" },
      { label: "Total Dispatch Depots", value: "18", desc: "Local vehicle parks" },
      { label: "Fleet Capacity Limit", value: "100%", desc: "Optimal allocation" },
    ],
    tableHeaders: ["Branch Name", "Branch Manager", "Fleet Count", "Active Trips", "Maintenance Status"],
    tableRows: [
      ["Ahmedabad Main", "Snehi Patel", "24 vehicles", "8 active", "1 in maintenance"],
      ["Surat Hub", "Amit Patel", "18 vehicles", "5 active", "0 in maintenance"],
      ["Mumbai South", "Priya Shah", "15 vehicles", "4 active", "2 in maintenance"],
      ["Delhi West", "Harpreet Singh", "12 vehicles", "3 active", "1 in maintenance"],
    ],
    actionLabel: "Add Branch Hub",
  },
  "/settings": {
    title: "Company Settings",
    subtitle: "Configure global thresholds, operational parameters, and API integration keys",
    icon: Shield,
    color: "text-teal-350",
    kpis: [
      { label: "System Status", value: "Operational", desc: "All servers online" },
      { label: "API Integrations", value: "Active (5)", desc: "OSRM, Supabase, Maps" },
      { label: "Backup Cron", value: "Every 24h", desc: "Automated backup" },
    ],
    tableHeaders: ["Setting Key", "Operational Category", "Config Value", "Last Modified By", "Status"],
    tableRows: [
      ["fleet_speed_limit_kmh", "Compliance", "70", "Super Admin", "Active"],
      ["avg_fuel_price_inr", "Finance", "96.5", "Yashvi Sanghvi", "Active"],
      ["maintenance_frequency_km", "Operations", "5000", "Snehi Patel", "Active"],
      ["supabase_realtime_sync", "Telemetry", "Enabled", "System Cron", "Active"],
    ],
    actionLabel: "Save Config Settings",
  },
  "/audit-logs": {
    title: "System Audit Logs",
    subtitle: "Complete immutable audit logs tracking actions, database commits, and role changes",
    icon: FileText,
    color: "text-amber-400",
    kpis: [
      { label: "Logged Events (Today)", value: "142", desc: "Audit logs recorded" },
      { label: "Security Warnings", value: "0", desc: "Optimal status" },
      { label: "Integrity Verification", value: "Passed", desc: "SHA-256 Verified" },
    ],
    tableHeaders: ["Timestamp", "User Operator", "Role Profile", "Operation Description", "IP Address"],
    tableRows: [
      ["10:20:15 AM", "Snehi Patel", "Fleet Manager", "Dispatched Trip TRP-0001", "192.168.1.45"],
      ["09:58:30 AM", "Yashvi Sanghvi", "Financial Analyst", "Added Fuel Log Cost ₹4,500", "192.168.1.52"],
      ["09:35:10 AM", "System Auto", "System Worker", "Vehicle BUS-1042 status → In Maintenance", "127.0.0.1"],
      ["08:50:00 AM", "Amit Patel", "Driver", "Completed Trip TRP-0003", "192.168.1.99"],
    ],
    actionLabel: "Export Audit Ledger",
  },
  "/backup-restore": {
    title: "Database Backup & Restore",
    subtitle: "Initiate snapshot points, query ledger backups, or trigger schema restores",
    icon: RefreshCw,
    color: "text-cyan-400",
    kpis: [
      { label: "Last Successful Backup", value: "4 hours ago", desc: "Standard schedule" },
      { label: "Snapshot Database Size", value: "48.2 MB", desc: "Postgres schema" },
      { label: "Mirror Redundancy", value: "3 Nodes", desc: "Supabase cloud" },
    ],
    tableHeaders: ["Snapshot ID", "Created Timestamp", "Size File", "Checksum Integrity", "Restore Action"],
    tableRows: [
      ["SNAP-20260712-A", "Today 10:00 AM", "48.2 MB", "PASS (SHA256)", "Click to Restore"],
      ["SNAP-20260711-B", "Yesterday 10:00 AM", "48.1 MB", "PASS (SHA256)", "Click to Restore"],
      ["SNAP-20260710-C", "10-Jul-2026 10:00 AM", "47.9 MB", "PASS (SHA256)", "Click to Restore"],
    ],
    actionLabel: "Create Database Snapshot",
  },
  "/cargo": {
    title: "Cargo Management Center",
    subtitle: "Oversee cargo weight restrictions, check delivery manifests, and verify loading capacity",
    icon: Box,
    color: "text-teal-400",
    kpis: [
      { label: "Cargo Load Today", value: "32.4 tons", desc: "Active on road" },
      { label: "Capacity Limit Margin", value: "14%", desc: "Optimal allocation" },
      { label: "Pending Shipments", value: "4", desc: "Awaiting dispatch" },
    ],
    tableHeaders: ["Shipment ID", "Trip Ref", "Cargo Manifest Details", "Weight Load (kg)", "Load Compliance Status"],
    tableRows: [
      ["SHP-1289", "TRP-0001", "Industrial Machinery Components", "8,200 kg", "Compliant"],
      ["SHP-1304", "TRP-0002", "Passengers Baggage & Parcels", "4,500 kg", "Compliant"],
      ["SHP-1322", "TRP-0003", "Medical Supplies & Refrigerated Vaccines", "1,200 kg", "Compliant"],
    ],
    actionLabel: "Add Cargo Shipment",
  },
  "/scheduling": {
    title: "Fleet Scheduling Board",
    subtitle: "Plan operational calendars, schedule driver shifts, and block vehicle availability slots",
    icon: Clock,
    color: "text-indigo-400",
    kpis: [
      { label: "Scheduled Trips (Week)", value: "34", desc: "Trips scheduled" },
      { label: "Active Driver Roster", value: "22 Drivers", desc: "Assigned roster" },
      { label: "Schedule Conflicts", value: "0 Conflict", desc: "Safe capacity" },
    ],
    tableHeaders: ["Shift Schedule Date", "Vehicle Asset", "Assigned Operator", "Route Source → Dest", "Shift Status"],
    tableRows: [
      ["14-Jul-2026", "BUS-1042", "Rajesh Kumar", "Ahmedabad → Vadodara", "Scheduled"],
      ["15-Jul-2026", "TRK-0883", "Amit Patel", "Surat → Mumbai", "Scheduled"],
      ["16-Jul-2026", "VAN-0217", "Priya Shah", "Rajkot → Ahmedabad", "Scheduled"],
    ],
    actionLabel: "Add Schedule Shift",
  },
  "/incident-reports": {
    title: "Incident Reports Ledger",
    subtitle: "Log breakdowns, accidents, compliance warnings, or road delays in real-time",
    icon: AlertTriangle,
    color: "text-rose-455",
    kpis: [
      { label: "Pending Investigations", value: "1", desc: "Under review" },
      { label: "Resolved Incidents", value: "8", desc: "Closed insurance" },
      { label: "Insurance Claims Status", value: "98%", desc: "Claim success rate" },
    ],
    tableHeaders: ["Incident Ref ID", "Vehicle Asset", "Operator Driver", "Description Issue", "Status Audit"],
    tableRows: [
      ["INC-092", "BUS-1042", "Suresh Pillai", "Minor engine radiator overheating", "Closed"],
      ["INC-095", "TRK-0883", "Alex Fernandez", "Left side mirror damaged by tree branch", "Under Review"],
    ],
    actionLabel: "Report Incident",
  },
  "/documents": {
    title: "Fleet Documents Center",
    subtitle: "Manage driver licenses, vehicle registration certificates, and insurance policies",
    icon: FolderOpen,
    color: "text-cyan-400",
    kpis: [
      { label: "Verified Documents", value: "94%", desc: "All files valid" },
      { label: "Expiring soon (30d)", value: "3 Files", desc: "Action required" },
      { label: "Pending Upload Validation", value: "1 File", desc: "Awaiting review" },
    ],
    tableHeaders: ["Document File Title", "Asset Attachment", "Expiration Date", "Verification Status", "Download Link"],
    tableRows: [
      ["GJ-01-XX-4422 Registration", "Ahmedabad Shuttle", "12-Dec-2029", "Verified", "Download PDF"],
      ["Suresh Pillai HMV License", "Suresh Pillai", "20-Aug-2027", "Verified", "Download PDF"],
      ["TransitOps Insurance Policy", "Global Fleet policy", "30-Sep-2026", "Expiring soon", "Download PDF"],
    ],
    actionLabel: "Upload Document File",
  },
  "/profile": {
    title: "Driver Profile",
    subtitle: "Review personal stats, safety rankings, salary allowances, and compliance records",
    icon: User,
    color: "text-teal-400",
    kpis: [
      { label: "Safety Rating", value: "98/100", desc: "Optimal status index" },
      { label: "Total Trips Completed", value: "87 Trips", desc: "Lifetime stats" },
      { label: "Compliance Index Score", value: "100%", desc: "No violations logged" },
    ],
    tableHeaders: ["Profile Metric Category", "Current Roster Value", "Target Threshold", "Performance Evaluation", "Status Update"],
    tableRows: [
      ["Weekly Driving Hours", "32 hours", "48 hours limit", "Compliant", "Good"],
      ["Average Fuel Efficiency", "14.2 km/L", "12.0 km/L threshold", "Excellent", "Bonus Earned"],
      ["Base Salary Allowance", "₹38,500 / mo", "Calculated standard", "Disbursed", "Pending Approval"],
    ],
    actionLabel: "Edit Profile Details",
  },
  "/license-management": {
    title: "License Compliance Center",
    subtitle: "Audit operator credentials, renew expirations, and track license compliance",
    icon: ShieldCheck,
    color: "text-emerald-450",
    kpis: [
      { label: "Active Licenses Audited", value: "27", desc: "Drivers pool" },
      { label: "Expired Licenses", value: "0", desc: "Safety compliant" },
      { label: "Pending Verifications", value: "1", desc: "New driver check" },
    ],
    tableHeaders: ["Driver Operator Name", "License Number ID", "License Category", "Expiration Date", "Compliance Warning"],
    tableRows: [
      ["Alex Fernandez", "KA-DL-2019-001", "HMV", "30-Jun-2028", "Valid"],
      ["Suresh Pillai", "TN-DL-2017-005", "HMV", "20-Aug-2027", "Valid"],
      ["Rajan Kumar", "KA-DL-2018-003", "HMV", "30-Nov-2026", "Expires soon"],
    ],
    actionLabel: "Audit New License",
  },
  "/compliance": {
    title: "Regulatory Compliance Auditor",
    subtitle: "Track state taxes, vehicle permits, and pollution certificates",
    icon: CheckCircle2,
    color: "text-indigo-400",
    kpis: [
      { label: "Compliance Pass Index", value: "96.4%", desc: "Target 95%" },
      { label: "Active Permits", value: "18 Permits", desc: "Interstate operation" },
      { label: "Pending Pollution Checks", value: "2", desc: "Due this week" },
    ],
    tableHeaders: ["Vehicle Asset registration", "Permit Type ID", "Expiry Date", "Auditor Rating", "Compliance Status"],
    tableRows: [
      ["GJ-01-XX-4422 (Bus)", "National Interstate Permit", "30-Nov-2027", "Pass", "Valid"],
      ["MH-04-YY-9900 (Truck)", "State Transport Permit", "15-Aug-2026", "Pass", "Valid"],
      ["DL-01-AB-1234 (Truck)", "Pollution Under Control (PUC)", "22-Jul-2026", "Warning", "Expires soon"],
    ],
    actionLabel: "Add Compliance Permit",
  },
  "/inspections": {
    title: "Vehicle Inspections Logs",
    subtitle: "Document physical checks, tire wear inspection checklists, and fluid level tests",
    icon: Wrench,
    color: "text-amber-400",
    kpis: [
      { label: "Inspections Conducted (Month)", value: "24", desc: "Inspections logged" },
      { label: "Defects Identified", value: "2 Defects", desc: "Flagged to Maintenance" },
      { label: "Clean Inspector Passes", value: "22", desc: "Optimal fleet health" },
    ],
    tableHeaders: ["Inspection Reference ID", "Vehicle registration", "Inspector Officer", "Inspection Date", "Report Output"],
    tableRows: [
      ["ISP-440", "BUS-1042", "Juhi Vanjara", "Yesterday", "Defect: Oil leakage detected"],
      ["ISP-442", "TRK-0883", "Juhi Vanjara", "Today", "Clean Pass: Tires and brakes OK"],
    ],
    actionLabel: "Log Vehicle Inspection",
  },
  "/export": {
    title: "Data Exporter Tool",
    subtitle: "Export full operational ledgers, expenses summaries, and driver roster grids",
    icon: Download,
    color: "text-teal-350",
    kpis: [
      { label: "Ledgers Ready for Export", value: "6 Ledgers", desc: "Complete sync" },
      { label: "Available formats", value: "CSV, PDF, JSON", desc: "Full reports" },
      { label: "Last Data Dump Export", value: "Yesterday", desc: "Financial Backup" },
    ],
    tableHeaders: ["Ledger Data Source", "Date Scope", "Record Count", "Format Size", "Trigger Action"],
    tableRows: [
      ["Operational Expenses Ledger", "July 2026", "142 logs", "48 KB", "Download CSV"],
      ["Fuel Cost Consumption Reports", "Q2 2026", "680 logs", "125 KB", "Download PDF"],
      ["Maintenance Resolution Ledgers", "YTD 2026", "95 logs", "88 KB", "Download CSV"],
    ],
    actionLabel: "Trigger Global Export",
  },
};

export default function ModuleFeature() {
  const { pathname } = useLocation();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const activeConfig = MODULE_CONFIGS[pathname] || MODULE_CONFIGS["/users"];
    setConfig(activeConfig);
  }, [pathname]);

  if (!config) return null;

  const Icon = config.icon || FileText;

  const handleAction = () => {
    alert(`Action: "${config.actionLabel}" triggered. Initiating mock payload write...`);
  };

  return (
    <section className="flex flex-col gap-8 animate-fade-in">
      <PageHeader title={config.title} subtitle={config.subtitle} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {config.kpis.map((kpi, idx) => (
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
            <div className={`p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] ${config.color}`}>
              <Icon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-200">Interactive Registry</h4>
              <p className="text-xs text-slate-500">Live operational ledger logs</p>
            </div>
          </div>

          <button
            onClick={handleAction}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 text-xs font-bold hover:scale-105 transition-all shadow-md shadow-teal-500/10 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {config.actionLabel}
          </button>
        </div>

        {/* Database Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {config.tableHeaders.map((head, idx) => (
                  <th key={idx} className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {config.tableRows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${
                    rowIdx === config.tableRows.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  {row.map((val, cellIdx) => (
                    <td key={cellIdx} className="px-4 py-3.5 font-medium text-slate-350">
                      {val === "Active Now" || val === "Verified" || val === "Compliant" || val === "Good" || val === "Valid" || val === "Active" ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase">
                          {val}
                        </span>
                      ) : val === "Under Review" || val === "Warning" || val === "Expiring soon" ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20 uppercase">
                          {val}
                        </span>
                      ) : (
                        val
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
