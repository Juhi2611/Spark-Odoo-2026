import { useState, useEffect } from "react";
import { Bus, Search, Plus, Filter, MoreHorizontal, X } from "lucide-react";
import { supabase } from "../lib/supabase";

const getStatusBadge = (status) => {
  if (!status) return 'badge-neutral';
  const normalized = status.toLowerCase();
  if (['active', 'available', 'idle'].includes(normalized)) return 'badge-active';
  if (['in_maintenance', 'in_shop', 'suspended'].includes(normalized)) return 'badge-warning';
  if (['on_trip'].includes(normalized)) return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30';
  return 'badge-neutral';
};

const formatStatus = (s) => (s ? s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '');

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '', type: 'Bus', plate: '', status: 'active', region: 'North', cap: 0, maxLoad: 0
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error("Error fetching vehicles:", error);
    } else {
      setVehicles(data || []);
    }
    setLoading(false);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Convert string inputs to proper types
    const payload = {
      name: formData.name,
      vehicle_type: formData.type,
      license_plate: formData.plate,
      status: formData.status,
      region: formData.region,
      capacity: parseInt(formData.cap, 10),
      max_load_capacity: parseFloat(formData.maxLoad)
    };

    const { error } = await supabase.from('vehicles').insert([payload]);
    if (error) {
      console.error("Error inserting vehicle:", error);
      alert("Failed to add vehicle: " + error.message);
    } else {
      setShowAddModal(false);
      setFormData({ name: '', type: 'Bus', plate: '', status: 'active', region: 'North', cap: 0, maxLoad: 0 });
      fetchVehicles();
    }
    setSubmitting(false);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Add Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6 relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">Add New Vehicle</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Vehicle Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-slate-900/50 border border-white/[0.08] rounded pl-3 py-2 text-sm focus:border-teal-500 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} 
                    className="w-full bg-slate-900/50 border border-white/[0.08] rounded pl-3 py-2 text-sm text-white focus:border-teal-500">
                    <option>Bus</option><option>Van</option><option>Truck</option><option>Sedan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">License Plate</label>
                  <input required type="text" value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} 
                    className="w-full bg-slate-900/50 border border-white/[0.08] rounded pl-3 py-2 text-sm text-white focus:border-teal-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} 
                    className="w-full bg-slate-900/50 border border-white/[0.08] rounded pl-3 py-2 text-sm text-white focus:border-teal-500">
                    <option value="active">Active</option>
                    <option value="idle">Idle</option>
                    <option value="in_maintenance">In Maintenance</option>
                    <option value="on_trip">On Trip</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Region</label>
                  <select value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} 
                    className="w-full bg-slate-900/50 border border-white/[0.08] rounded pl-3 py-2 text-sm text-white focus:border-teal-500">
                    <option>North</option><option>South</option><option>East</option><option>West</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Capacity (Pax)</label>
                  <input required type="number" min="0" value={formData.cap} onChange={e => setFormData({...formData, cap: e.target.value})} 
                    className="w-full bg-slate-900/50 border border-white/[0.08] rounded pl-3 py-2 text-sm text-white focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Max Load (kg)</label>
                  <input required type="number" min="0" step="0.1" value={formData.maxLoad} onChange={e => setFormData({...formData, maxLoad: e.target.value})} 
                    className="w-full bg-slate-900/50 border border-white/[0.08] rounded pl-3 py-2 text-sm text-white focus:border-teal-500" />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full mt-4 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Save Vehicle'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Main View ── */}
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Vehicles</h1>
          <p className="text-slate-400">Manage your entire operational fleet via Supabase.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 border-none transition-all px-4 py-2 rounded-lg text-slate-900 font-semibold shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)]"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </header>
      
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search vehicles..." 
              className="w-full bg-slate-900/50 border border-white/[0.08] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-teal-500/50 text-white placeholder-slate-500"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white glass-sm border-transparent hover:border-white/[0.1] transition-all">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-500">Loading Supabase Data...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/30 border-b border-white/[0.06]">
                  <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-semibold text-slate-500">Vehicle</th>
                  <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-semibold text-slate-500">License Plate</th>
                  <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-semibold text-slate-500">Region</th>
                  <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-semibold text-slate-500">Cap / Load</th>
                  <th className="py-4 px-6 text-[10px] uppercase tracking-widest font-semibold text-slate-500 text-center">Status</th>
                  <th className="py-4 px-6 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">No vehicles found. Click Add Vehicle to create one.</td>
                  </tr>
                )}
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center border border-white/[0.08]">
                          <Bus className="w-4 h-4 text-slate-300" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">{v.name}</div>
                          <div className="text-xs text-slate-500">{v.vehicle_type || v.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-400 font-mono">{v.license_plate || v.plate}</td>
                    <td className="py-4 px-6 text-sm text-slate-400">{v.region}</td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-slate-300">{v.capacity || v.cap || 0} pax</div>
                      <div className="text-xs text-slate-500">{v.max_load_capacity || v.max_load ? (v.max_load_capacity || v.max_load).toLocaleString() : '0'} kg</div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(v.status)}`}>
                        {formatStatus(v.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-slate-500 hover:text-teal-400 transition-colors opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-5 h-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
