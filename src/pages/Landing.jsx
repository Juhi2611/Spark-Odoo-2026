import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Hero3D from "../components/Hero3D";
import { ArrowRight, Truck, Route as RouteIcon, Wrench, BarChart3, UserCheck, Fuel, Map, Shield, Globe, Users, DollarSign, Activity } from "lucide-react";

const FEATURES = [
  { icon: Truck, title: "Vehicle management", body: "Register buses, vans, trucks & sedans with real-time status tracking — available, on trip, in maintenance or retired. Monitor odometer, load capacity & acquisition cost per asset." },
  { icon: RouteIcon, title: "Trip lifecycle", body: "Full trip orchestration from Draft → Dispatched → Completed with cargo-weight validation, automatic vehicle & driver status cascading, and route tracking." },
  { icon: UserCheck, title: "Driver management", body: "Track license categories (LMV/HMV/HGMV), expiry dates, safety scores & availability. Expired or suspended drivers are flagged instantly." },
  { icon: Wrench, title: "Maintenance tracking", body: "Log maintenance work orders per vehicle with issue descriptions, cost tracking & photo evidence. Track resolution status from pending → resolved." },
  { icon: Fuel, title: "Fuel & expense logs", body: "Record fuel fill-ups with liters & cost per vehicle. Track operational expenses — tolls, parking, driver allowance, insurance — with monthly cost rollups." },
  { icon: BarChart3, title: "Reports & analytics", body: "Live fuel efficiency trends (km/L), fleet utilization doughnuts, monthly operational cost breakdowns & per-vehicle ROI calculations — all from Supabase data." },
];

const STATS = [
  ["6", "Role profiles", true],
  ["7", "Core modules", true, "+"],
  ["Live", "GPS map tracking", false],
  ["100", "Analytics uptime", true, "%"],
];

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fc-visible');
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll('.fc-scroll-reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

const AnimatedCounter = ({ value, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const target = parseInt(value, 10);
    if (isNaN(target)) return;
    
    const increment = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  
  return <span className="fc-counter">{count}{suffix}</span>;
};

const TiltCard = ({ children, className = "" }) => {
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    e.currentTarget.style.setProperty("--tilt-x", `${-(y / 20)}deg`);
    e.currentTarget.style.setProperty("--tilt-y", `${x / 20}deg`);
  };
  const handleMouseLeave = (e) => {
    e.currentTarget.style.setProperty("--tilt-x", "0deg");
    e.currentTarget.style.setProperty("--tilt-y", "0deg");
  };
  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`fc-tilt-card ${className}`}
    >
      {children}
    </div>
  );
};

const ParticleBackground = () => {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    setParticles(Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 10}s`,
      animationDuration: `${10 + Math.random() * 20}s`,
      opacity: Math.random() * 0.4 + 0.1,
      size: `${Math.random() * 3 + 2}px`
    })));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map(p => (
        <div 
          key={p.id}
          className="fc-particle"
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.animationDelay,
            animationDuration: p.animationDuration,
            opacity: p.opacity,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  );
};

export default function Landing() {
  const navigate = useNavigate();
  useScrollReveal();

  return (
    <div className="min-h-screen relative overflow-hidden fc-landing-bg">
      <ParticleBackground />
      {/* Nav */}
      <nav className="relative z-30 h-16 px-6 md:px-10 flex items-center justify-between border-b border-white/[0.08] backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[oklch(0.66_0.19_255)] to-[oklch(0.7_0.17_300)] grid place-items-center fc-glow-primary">
            <Truck className="h-4 w-4 text-white" />
          </div>
          <span className="font-display font-bold tracking-tight text-[oklch(0.97_0.005_250)]">TransitOps</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-[oklch(0.7_0.02_260)]">
          <a href="#features" className="hover:text-[oklch(0.97_0.005_250)] transition-colors">Features</a>
          <a href="#roles" className="hover:text-[oklch(0.97_0.005_250)] transition-colors">Roles</a>
          <a href="#cta" className="hover:text-[oklch(0.97_0.005_250)] transition-colors">Get Started</a>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-[oklch(0.7_0.02_260)] hover:text-[oklch(0.97_0.005_250)] transition-colors cursor-pointer"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate("/login")}
            className="text-sm px-3.5 py-1.5 rounded-md bg-[oklch(0.66_0.19_255)] text-white font-medium fc-glow-primary hover:opacity-90 transition cursor-pointer"
          >
            Launch console
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[calc(100vh-4rem)] fc-grid-bg">
        <Hero3D />
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.17_0.028_265/0.6)] via-transparent to-[oklch(0.17_0.028_265)] pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 md:pt-32 pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.66_0.19_255/0.3)] bg-[oklch(0.66_0.19_255/0.1)] px-3 py-1 text-xs text-[oklch(0.66_0.19_255)] mb-6 fc-scroll-reveal">
            <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.66_0.19_255)] fc-pulse-dot" />
            Vehicles · Drivers · Trips · Maintenance · Fuel · Analytics
          </div>
          <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-8xl tracking-tighter leading-[0.95] text-[oklch(0.97_0.005_250)] fc-scroll-reveal fc-reveal-delay-1">
            Manage your fleet.<br />
            <span className="bg-gradient-to-r from-[oklch(0.66_0.19_255)] via-[oklch(0.7_0.17_300)] to-[oklch(0.78_0.16_70)] bg-clip-text text-transparent fc-text-glow">
              End to end.
            </span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-[oklch(0.7_0.02_260)] max-w-2xl mx-auto fc-scroll-reveal fc-reveal-delay-2">
            TransitOps unifies vehicle registration, driver profiles, trip dispatch, maintenance work orders,
            fuel & expense tracking, and operational analytics in one dark-themed command center — powered by Supabase
            with 6 role-based access profiles.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 justify-center fc-scroll-reveal fc-reveal-delay-3">
            <button
              onClick={() => navigate("/login")}
              className="group inline-flex items-center gap-2 rounded-lg bg-[oklch(0.66_0.19_255)] px-5 py-3 text-sm font-semibold text-white fc-glow-primary hover:shadow-[0_0_40px_-8px_oklch(0.66_0.19_255/0.55)] transition cursor-pointer"
            >
              Open command center
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[oklch(0.21_0.028_265/0.6)] backdrop-blur px-5 py-3 text-sm font-semibold text-[oklch(0.97_0.005_250)] hover:border-[oklch(0.66_0.19_255/0.4)] transition cursor-pointer"
            >
              Try role simulator
            </button>
          </div>

          {/* Stat strip */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto fc-scroll-reveal fc-reveal-delay-4">
            {STATS.map(([v, l, isAnim, suffix]) => (
              <div key={l} className="fc-glass-card p-4">
                <div className="font-display text-2xl font-bold text-[oklch(0.97_0.005_250)] fc-metric-glow">
                  {isAnim ? <AnimatedCounter value={v} suffix={suffix} /> : v}
                </div>
                <div className="text-xs text-[oklch(0.7_0.02_260)] mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Data Ticker */}
      <div className="w-full bg-[oklch(0.66_0.19_255/0.05)] border-y border-[oklch(0.66_0.19_255/0.15)] py-3 overflow-hidden flex items-center relative z-20">
        <div className="flex animate-[pulse_4s_ease-in-out_infinite] whitespace-nowrap px-4 font-mono text-[10px] uppercase tracking-widest text-[oklch(0.66_0.19_255/0.8)] gap-16 w-max mx-auto opacity-70">
          <span className="flex items-center gap-2"><Activity className="w-3 h-3" /> Live GPS Active</span>
          <span className="flex items-center gap-2"><RouteIcon className="w-3 h-3" /> Real-time route telemetry</span>
          <span className="flex items-center gap-2"><Globe className="w-3 h-3" /> Supabase Connection: Stable</span>
          <span className="flex items-center gap-2"><Fuel className="w-3 h-3" /> Engine Diagnostic: Online</span>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="relative py-24 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 fc-scroll-reveal">
          <div className="text-xs uppercase tracking-widest text-[oklch(0.66_0.19_255)] mb-3">Platform modules</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-[oklch(0.97_0.005_250)]">Everything your fleet needs.</h2>
          <p className="mt-4 text-[oklch(0.7_0.02_260)]">From vehicle registration to ROI analytics — every module connects to your live Supabase database.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <TiltCard key={f.title} className={`fc-glass-card fc-glass-card-hover p-6 fc-scroll-reveal fc-reveal-delay-${(i % 3) + 1}`}>
              <div className="h-10 w-10 rounded-lg bg-[oklch(0.66_0.19_255/0.1)] border border-[oklch(0.66_0.19_255/0.3)] grid place-items-center text-[oklch(0.66_0.19_255)] mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold text-lg text-[oklch(0.97_0.005_250)]">{f.title}</h3>
              <p className="mt-2 text-sm text-[oklch(0.7_0.02_260)]">{f.body}</p>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* Role-based access section */}
      <section id="roles" className="relative py-24 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 fc-scroll-reveal">
          <div className="text-xs uppercase tracking-widest text-[oklch(0.66_0.19_255)] mb-3">Access control</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-[oklch(0.97_0.005_250)]">One platform, six perspectives.</h2>
          <p className="mt-4 text-[oklch(0.7_0.02_260)]">Each role sees a tailored dashboard, navigation & feature set — switch between them with the built-in role simulator.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { role: "Super Admin", desc: "Full system control, user management & audit logs", icon: Shield },
            { role: "Fleet Manager", desc: "Vehicle CRUD, dispatch, maintenance & fuel entries", icon: Truck },
            { role: "Dispatcher", desc: "Trip creation, driver assignment & live route map", icon: RouteIcon },
            { role: "Driver", desc: "My trips, fuel logs, incident reports & profile", icon: Users },
            { role: "Safety Officer", desc: "License verification, compliance & safety scores", icon: UserCheck },
            { role: "Finance Analyst", desc: "Expense tracking, cost analysis & ROI reports", icon: DollarSign },
          ].map((r, i) => (
            <TiltCard key={r.role} className={`fc-glass-card fc-glass-card-hover p-5 text-center fc-scroll-reveal fc-reveal-delay-${(i % 3) + 1}`}>
              <div className="h-10 w-10 rounded-lg bg-[oklch(0.66_0.19_255/0.1)] border border-[oklch(0.66_0.19_255/0.3)] grid place-items-center text-[oklch(0.66_0.19_255)] mb-3 mx-auto">
                <r.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold text-sm text-[oklch(0.97_0.005_250)]">{r.role}</h3>
              <p className="mt-1.5 text-xs text-[oklch(0.7_0.02_260)] leading-relaxed">{r.desc}</p>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* Additional capability badges */}
      <section className="relative py-16 px-6 md:px-10 max-w-5xl mx-auto fc-scroll-reveal">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Map, label: "Live GPS map", sub: "Dark CartoCDN tiles with real-time vehicle markers & route polylines" },
            { icon: Globe, label: "Supabase backend", sub: "PostgreSQL with Row-Level Security, real-time subscriptions & auth" },
            { icon: Shield, label: "Role simulator", sub: "Switch between 6 roles to preview each user's dashboard & navigation" },
            { icon: BarChart3, label: "Chart.js analytics", sub: "Line, bar & doughnut charts with live data from your fleet tables" },
          ].map((c, i) => (
            <div key={c.label} className={`fc-glass-card p-5 fc-scroll-reveal fc-reveal-delay-${(i % 4) + 1}`}>
              <c.icon className="h-5 w-5 text-[oklch(0.66_0.19_255)] mb-2" />
              <div className="font-display font-semibold text-sm text-[oklch(0.97_0.005_250)]">{c.label}</div>
              <p className="mt-1 text-xs text-[oklch(0.7_0.02_260)] leading-relaxed">{c.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="relative py-24 px-6 fc-scroll-reveal">
        <div className="max-w-4xl mx-auto fc-glass-card p-10 md:p-16 text-center relative overflow-hidden fc-gradient-border">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[oklch(0.66_0.19_255/0.2)] blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[oklch(0.78_0.16_70/0.15)] blur-3xl" />
          <Globe className="h-10 w-10 text-[oklch(0.66_0.19_255)] mx-auto mb-4 fc-timeline-dot p-2 rounded-full box-content" />
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-[oklch(0.97_0.005_250)]">
            Ready to manage your fleet?
          </h2>
          <p className="mt-4 text-[oklch(0.7_0.02_260)] max-w-xl mx-auto">
            Sign up and start managing vehicles, dispatching trips, tracking maintenance & analyzing costs — all in one console.
            Use the role simulator to experience every user perspective.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[oklch(0.66_0.19_255)] px-6 py-3 text-sm font-semibold text-white fc-glow-primary hover:shadow-[0_0_40px_-8px_oklch(0.66_0.19_255/0.55)] transition cursor-pointer"
          >
            Launch console <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <footer className="border-t border-white/[0.08] py-8 px-6 text-center text-xs text-[oklch(0.7_0.02_260)] relative z-20">
        © 2026 TransitOps · Vehicles · Drivers · Trips · Maintenance · Fuel & Expenses · Reports & Analytics
      </footer>
    </div>
  );
}
