import { useState, useEffect } from "react";
import { UserCheck, Search, Plus, Filter, MoreHorizontal, Phone, FileSignature, X } from "lucide-react";
import { supabase } from "../lib/supabase";

const getStatusBadge = (status) => {
  if (!status) return 'badge-neutral';
  const normalized = status.toLowerCase();
  if (['on_duty', 'available'].includes(normalized)) return 'badge-active';
  if (['on_leave', 'suspended'].includes(normalized)) return 'badge-warning';
  if (['on_trip'].includes(normalized)) return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30';
  return 'badge-neutral';
};

const formatStatus = (s) => (s ? s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '');

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '', phone: '', license: '', status: 'available', vehicle: '', expiry: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('drivers').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error("Error fetching drivers:", error);
    } else {
      setDrivers(data || []);
    }
    setLoading(false);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const payload = {
      name: formData.name,
      contact_number: formData.phone,
      license_number: formData.license,
      status: formData.status,
      license_expiry_date: formData.expiry || null
    };

    const { error } = await supabase.from('drivers').insert([payload]);
    if (error) {
      console.error("Error inserting driver:", error);
      alert("Failed to add driver: " + error.message);
    } else {
      setShowAddModal(false);
      setFormData({ name: '', phone: '', license: '', status: 'available', vehicle: '', expiry: '' });
      fetchDrivers();
    }
    setSubmitting(false);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Add Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-card w-full max-w-md p-6 relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">Add New Driver</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Driver Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-slate-900/50 border border-white/[0.08] rounded pl-3 py-2 text-sm focus:border-teal-500 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Phone</label>
                  <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full bg-slate-900/50 border border-white/[0.08] rounded pl-3 py-2 text-sm text-white focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} 
                    className="w-full bg-slate-900/50 border border-white/[0.08] rounded pl-3 py-2 text-sm text-white focus:border-teal-500">
                    <option value="available">Available</option>
                    <option value="off_duty">Off Duty</option>
                    <option value="on_leave">On Leave</option>
                    <option value="on_trip">On Trip</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">License Number</label>
                <input required type="text" value={formData.license} onChange={e => setFormData({...formData, license: e.target.value})} 
                  className="w-full bg-slate-900/50 border border-white/[0.08] rounded pl-3 py-2 text-sm text-white focus:border-teal-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">License Expiry</label>
                  <input required type="date" value={formData.expiry} onChange={e => setFormData({...formData, expiry: e.target.value})} 
                    className="w-full bg-slate-900/50 border border-white/[0.08] rounded pl-3 py-2 text-sm text-white focus:border-teal-500 [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Vehicle Assignment</label>
                  <input type="text" placeholder="e.g. BUS-1042" value={formData.vehicle} onChange={e => setFormData({...formData, vehicle: e.target.value})} 
                    className="w-full bg-slate-900/50 border border-white/[0.08] rounded pl-3 py-2 text-sm text-white focus:border-teal-500" />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full mt-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              >
                {submitting ? 'Adding...' : 'Save Driver'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Main View ── */}
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Drivers</h1>
          <p className="text-slate-400">Manage personnel, licenses, and current assignments safely through Supabase.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 border-none transition-all px-4 py-2 rounded-lg text-white font-semibold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
        >
          <Plus className="w-4 h-4" /> Add Driver
        </button>
      </header>
      
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-500 w-full min-h-[300px]">Loading Drivers from Supabase...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">No drivers exist in the database. Add one to begin!</div>
          )}
          {drivers.map((d, i) => (
            <div key={d.id} className="glass-card p-5 group flex flex-col" style={{ animationDelay: `${(i % 10) * 50}ms` }}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                    <UserCheck className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 leading-tight">{d.name}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${getStatusBadge(d.status)}`}>
                      {formatStatus(d.status)}
                    </span>
                  </div>
                </div>
                <button className="text-slate-500 hover:text-white transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3 mt-auto pt-4 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Phone className="w-4 h-4" /> Phone
                  </span>
                  <span className="text-slate-300">{d.contact_number || d.phone}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-500">
                    <FileSignature className="w-4 h-4" /> Expiry
                  </span>
                  <span className={`font-mono ${(d.license_expiry_date || d.expiry) && new Date(d.license_expiry_date || d.expiry) < new Date() ? 'text-red-400' : 'text-slate-300'}`}>
                    {d.license_expiry_date || d.expiry || 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 bg-black/20 rounded-lg p-3 border border-white/[0.04]">
                {d.vehicle_id || d.vehicle ? (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Current Assignment</span>
                    <span className="font-semibold text-teal-300">{d.vehicle_id || d.vehicle}</span>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 italic text-center">No active assignment</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
