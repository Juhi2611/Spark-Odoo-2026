import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { Bus, UserCheck, LayoutDashboard } from "lucide-react";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";

function Sidebar() {
  const links = [
    { to: "/vehicles", label: "Vehicles", icon: Bus },
    { to: "/drivers", label: "Drivers", icon: UserCheck },
  ];

  return (
    <aside className="fixed top-0 left-0 z-40 h-screen w-64 glass border-r border-white/[0.06] flex flex-col">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/[0.06]">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg shadow-teal-500/20">
          <LayoutDashboard className="w-5 h-5 text-slate-950" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-teal-300 to-cyan-400 bg-clip-text text-transparent">
            TransitOps
          </h1>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
            Core Modules
          </p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-default ${
                isActive
                  ? "bg-white/[0.08] text-teal-300 pointer-events-none"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`
            }
          >
            <Icon className="w-[18px] h-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen text-slate-100 font-sans selection:bg-teal-500/30">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 overflow-y-auto w-full relative">
          <Routes>
            <Route path="/" element={<Navigate to="/vehicles" replace />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/drivers" element={<Drivers />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
