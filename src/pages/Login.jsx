import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Hero3D from "../components/Hero3D";
import { Lock, Mail, User, Shield, AlertCircle, ArrowRight, Truck } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
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
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] fc-landing-bg">
      {/* Left form panel */}
      <div className="flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md">
          {/* Logo */}
          <button
            onClick={() => navigate("/landing")}
            className="inline-flex items-center gap-2 mb-10 cursor-pointer"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[oklch(0.66_0.19_255)] to-[oklch(0.7_0.17_300)] grid place-items-center fc-glow-primary">
              <Truck className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-bold tracking-tight text-[oklch(0.97_0.005_250)]">TransitOps</span>
          </button>

          <h1 className="font-display text-4xl font-bold tracking-tight text-[oklch(0.97_0.005_250)]">
            {isSignUp ? "Create account." : "Welcome back."}
          </h1>
          <p className="mt-2 text-[oklch(0.7_0.02_260)] text-sm">
            {isSignUp ? "Join the fleet command center." : "Sign in to your fleet command center."}
          </p>

          {/* Notifications */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-[oklch(0.65_0.23_27/0.1)] border border-[oklch(0.65_0.23_27/0.2)] text-[oklch(0.75_0.15_27)] text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mt-6 p-4 rounded-xl bg-[oklch(0.72_0.17_160/0.1)] border border-[oklch(0.72_0.17_160/0.2)] text-[oklch(0.72_0.17_160)] text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {/* Full Name (Sign Up only) */}
            {isSignUp && (
              <div>
                <label className="text-xs font-medium text-[oklch(0.7_0.02_260)] uppercase tracking-widest">
                  Full Name
                </label>
                <div className="mt-2 flex items-center gap-2 h-11 px-3 rounded-lg fc-surface-input focus-within:border-[oklch(0.66_0.19_255/0.6)] focus-within:ring-2 focus-within:ring-[oklch(0.66_0.19_255/0.2)] transition">
                  <User className="h-4 w-4 text-[oklch(0.7_0.02_260)]" />
                  <input
                    type="text"
                    required
                    placeholder="Juhi Vanjara"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm text-[oklch(0.97_0.005_250)] placeholder-[oklch(0.5_0.02_260)]"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-xs font-medium text-[oklch(0.7_0.02_260)] uppercase tracking-widest">
                Email
              </label>
              <div className="mt-2 flex items-center gap-2 h-11 px-3 rounded-lg fc-surface-input focus-within:border-[oklch(0.66_0.19_255/0.6)] focus-within:ring-2 focus-within:ring-[oklch(0.66_0.19_255/0.2)] transition">
                <Mail className="h-4 w-4 text-[oklch(0.7_0.02_260)]" />
                <input
                  type="email"
                  required
                  placeholder="juhi@transitops.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-[oklch(0.97_0.005_250)] placeholder-[oklch(0.5_0.02_260)]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[oklch(0.7_0.02_260)] uppercase tracking-widest">
                  Password
                </label>
                {/* {!isSignUp && (
                  <span className="text-xs text-[oklch(0.66_0.19_255)] hover:underline cursor-pointer">Forgot?</span>
                )} */}  
              </div>
              <div className="mt-2 flex items-center gap-2 h-11 px-3 rounded-lg fc-surface-input focus-within:border-[oklch(0.66_0.19_255/0.6)] focus-within:ring-2 focus-within:ring-[oklch(0.66_0.19_255/0.2)] transition">
                <Lock className="h-4 w-4 text-[oklch(0.7_0.02_260)]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-[oklch(0.97_0.005_250)] placeholder-[oklch(0.5_0.02_260)]"
                />
              </div>
            </div>

            {/* Role selection (Sign Up only) */}
            {isSignUp && (
              <div>
                <label className="text-xs font-medium text-[oklch(0.7_0.02_260)] uppercase tracking-widest">
                  System Role
                </label>
                <div className="mt-2 flex items-center gap-2 h-11 px-3 rounded-lg fc-surface-input focus-within:border-[oklch(0.66_0.19_255/0.6)] focus-within:ring-2 focus-within:ring-[oklch(0.66_0.19_255/0.2)] transition">
                  <Shield className="h-4 w-4 text-[oklch(0.7_0.02_260)]" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm text-[oklch(0.97_0.005_250)] cursor-pointer appearance-none"
                  >
                    <option value="fleet_manager">Fleet Manager</option>
                    <option value="driver">Driver (Trips & Dispatch)</option>
                    <option value="safety_officer">Safety Officer</option>
                    <option value="financial_analyst">Financial Analyst</option>
                  </select>
                </div>
              </div>
            )}

            {/* Keep me signed in (Sign In only) */}
            {!isSignUp && (
              <div className="flex items-center gap-2 text-xs text-[oklch(0.7_0.02_260)]">
                <input type="checkbox" defaultChecked className="accent-[oklch(0.66_0.19_255)]" />
                Keep me signed in on this device
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full h-11 rounded-lg bg-[oklch(0.66_0.19_255)] text-white font-semibold text-sm fc-glow-primary hover:shadow-[0_0_40px_-8px_oklch(0.66_0.19_255/0.55)] transition inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? "Create account" : "Enter command center"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Role auto-detected info (Sign In only) */}
            {!isSignUp && (
              <div className="text-center text-xs text-[oklch(0.7_0.02_260)]">
                <span className="text-[oklch(0.66_0.19_255)] font-medium"></span>
              </div>
            )}
          </form>

          {/* Toggle mode */}
          <p className="mt-8 text-center text-xs text-[oklch(0.7_0.02_260)]">
            {isSignUp ? "Already have an account?" : "New to TransitOps?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setMessage("");
              }}
              className="text-[oklch(0.66_0.19_255)] font-semibold hover:underline cursor-pointer"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>

      {/* Right 3D panel */}
      <div className="relative hidden lg:block border-l border-white/[0.08] fc-grid-bg overflow-hidden">
        <Hero3D compact />
        <div className="absolute inset-0 bg-gradient-to-tr from-[oklch(0.17_0.028_265/0.7)] via-transparent to-[oklch(0.17_0.028_265/0.4)] pointer-events-none" />
        <div className="absolute bottom-10 left-10 right-10 z-10">
          <div className="fc-glass-card p-5 max-w-sm">
            <div className="text-xs text-[oklch(0.66_0.19_255)] uppercase tracking-widest mb-1">Live</div>
            <div className="font-display text-lg font-semibold text-[oklch(0.97_0.005_250)]">14 vehicles en route</div>
            <div className="text-xs text-[oklch(0.7_0.02_260)] mt-1">Global mesh · updated 3s ago</div>
          </div>
        </div>
      </div>
    </div>
  );
}
