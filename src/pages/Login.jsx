import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Lock, Mail, User, Shield, AlertCircle, ArrowRight } from "lucide-react";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("fleet_manager");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          setError("Full name is required");
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role: role,
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
        } else {
          setMessage("Registration successful! You can now sign in.");
          setIsSignUp(false);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 bg-radial-[circle_at_top] from-slate-900/60 to-slate-950 p-4">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-5000"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-7000"></div>

      <div className="w-full max-w-md glass p-8 rounded-2xl border border-white/[0.08] relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
            TransitOps
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            {isSignUp ? "Create an account to join the fleet" : "Sign in to manage fleet operations"}
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name (Sign Up only) */}
          {isSignUp && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Juhi Vanjara"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all placeholder-slate-500"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="juhi@transitops.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all placeholder-slate-500"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all placeholder-slate-500"
              />
            </div>
          </div>

          {/* Role selection (Sign Up only) */}
          {isSignUp && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                System Role
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-900 border border-white/[0.08] text-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer appearance-none"
                >
                  <option value="fleet_manager">Fleet Manager</option>
                  <option value="driver">Driver (Trips & Dispatch)</option>
                  <option value="safety_officer">Safety Officer</option>
                  <option value="financial_analyst">Financial Analyst</option>
                </select>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 mt-4 px-5 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/10 hover:shadow-teal-500/25 hover:scale-[1.01] transition-default disabled:opacity-50 disabled:scale-100 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{isSignUp ? "Sign Up" : "Sign In"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-8 text-center border-t border-white/[0.04] pt-6">
          <p className="text-xs text-slate-500">
            {isSignUp ? "Already have an account?" : "Need an account for your module?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setMessage("");
              }}
              className="text-teal-400 font-semibold hover:text-teal-300 transition-colors cursor-pointer"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
