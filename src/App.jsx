import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import LiveMap from "./pages/LiveMap";
import Maintenance from "./pages/Maintenance";
import FuelExpense from "./pages/FuelExpense";
import Reports from "./pages/Reports";

export default function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/live-map" element={<LiveMap />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/fuel-expense" element={<FuelExpense />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
}
