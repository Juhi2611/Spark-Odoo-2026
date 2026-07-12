/**
 * SeedDrivers.jsx — ONE-TIME USE PAGE
 * ====================================
 * Navigate to /seed-drivers while logged in to insert demo drivers.
 * This page ONLY works because it runs inside the authenticated session.
 * DELETE this file and its route once seeding is done.
 */
import { useState } from "react";
import { supabase } from "../supabaseClient";

const DEMO_DRIVERS = [
  { name: "Alex Fernandez",  license_number: "KA-DL-2019-001", license_category: "HMV", license_expiry_date: "2028-06-30", contact_number: "9900112233", safety_score: 98, status: "available" },
  { name: "Priya Nair",      license_number: "KA-DL-2020-002", license_category: "LMV", license_expiry_date: "2027-12-31", contact_number: "9911223344", safety_score: 95, status: "available" },
  { name: "Rajan Kumar",     license_number: "KA-DL-2018-003", license_category: "HMV", license_expiry_date: "2026-11-30", contact_number: "9922334455", safety_score: 92, status: "available" },
  { name: "Meena Sharma",    license_number: "MH-DL-2021-004", license_category: "LMV", license_expiry_date: "2029-03-15", contact_number: "9933445566", safety_score: 99, status: "available" },
  { name: "Suresh Pillai",   license_number: "TN-DL-2017-005", license_category: "HMV", license_expiry_date: "2027-08-20", contact_number: "9944556677", safety_score: 88, status: "available" },
];

export default function SeedDrivers() {
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);
  const [running, setRunning] = useState(false);

  const runSeed = async () => {
    setRunning(true);
    const log = [];

    for (const driver of DEMO_DRIVERS) {
      const { data, error } = await supabase
        .from("drivers")
        .upsert(driver, { onConflict: "license_number" })
        .select("id, name, status");

      if (error) {
        log.push({ name: driver.name, ok: false, msg: error.message });
      } else {
        log.push({ name: driver.name, ok: true, msg: `id: ${data?.[0]?.id?.slice(0, 8)}…` });
      }
    }

    setResults(log);
    setDone(true);
    setRunning(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-8">
      <div className="w-full max-w-lg glass border border-white/[0.08] rounded-2xl p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Seed Demo Drivers</h1>
          <p className="text-sm text-slate-400 mt-1">
            Inserts 5 demo drivers into the <code className="text-teal-300">drivers</code> table.
            Uses your authenticated session — safe to run while logged in.
          </p>
        </div>

        {!done ? (
          <button
            onClick={runSeed}
            disabled={running}
            className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-sm hover:scale-[1.02] transition-all disabled:opacity-60 cursor-pointer"
          >
            {running ? "Inserting drivers…" : "▶  Run Seed"}
          </button>
        ) : (
          <div className="space-y-3">
            {results.map((r) => (
              <div
                key={r.name}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm ${
                  r.ok
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                <span className="font-medium">{r.ok ? "✅" : "❌"} {r.name}</span>
                <span className="text-xs opacity-70">{r.msg}</span>
              </div>
            ))}
            <p className="text-xs text-slate-500 text-center pt-2">
              Done! Go to <a href="/trips" className="text-teal-400 underline">/trips</a> and create a trip.
              You can now delete this page from the code.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
