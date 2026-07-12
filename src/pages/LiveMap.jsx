import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Truck, MapPin, Navigation, Clock, Route } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   DUMMY TRIP DATA — replace with real API data later
   Each trip has origin/destination with coordinates and a progress %
   that simulates where the vehicle currently is on the route.
   ═══════════════════════════════════════════════════════════════ */
const TRIPS = [
  {
    id: "TRP-0001",
    vehicle: "BUS-1042",
    driver: "Rajesh Kumar",
    origin: { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
    destination: { name: "Vadodara", lat: 22.3072, lng: 73.1812 },
    status: "active",
    progress: 0.45,
    cargo: "Passengers (42)",
    departureTime: "08:30 AM",
    eta: "11:15 AM",
    color: "#2dd4bf",
  },
  {
    id: "TRP-0002",
    vehicle: "TRK-0883",
    driver: "Amit Patel",
    origin: { name: "Surat", lat: 21.1702, lng: 72.8311 },
    destination: { name: "Mumbai", lat: 19.076, lng: 72.8777 },
    status: "active",
    progress: 0.65,
    cargo: "Industrial Parts (8.2 tons)",
    departureTime: "06:00 AM",
    eta: "12:30 PM",
    color: "#818cf8",
  },
  {
    id: "TRP-0003",
    vehicle: "VAN-0217",
    driver: "Priya Shah",
    origin: { name: "Rajkot", lat: 22.3039, lng: 70.8022 },
    destination: { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
    status: "active",
    progress: 0.3,
    cargo: "Medical Supplies",
    departureTime: "09:15 AM",
    eta: "01:00 PM",
    color: "#fb923c",
  },
];

/* ── India center for initial map view ─────────────────────── */
const INDIA_CENTER = [22.0, 72.5];
const INITIAL_ZOOM = 7;

/* ── Custom vehicle icon using SVG ──────────────────────────── */
function createVehicleIcon(color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <circle cx="20" cy="20" r="18" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>
      <circle cx="20" cy="20" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="20" cy="20" r="4" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
}

/* ── Marker icons for origin/destination ────────────────────── */
function createPinIcon(type) {
  const color = type === "origin" ? "#34d399" : "#f87171";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

/* ── Fetch real road route from OSRM (free, no API key) ────── */
async function fetchRoute(origin, destination) {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    }
  } catch (err) {
    console.warn("OSRM route fetch failed, falling back to straight line:", err);
  }
  // Fallback: straight line
  return [
    [origin.lat, origin.lng],
    [destination.lat, destination.lng],
  ];
}

/* ── Interpolate position along a route at given progress ──── */
function getPositionOnRoute(route, progress) {
  if (!route || route.length === 0) return [0, 0];
  if (progress <= 0) return route[0];
  if (progress >= 1) return route[route.length - 1];

  // Calculate total distance
  let totalDist = 0;
  const segDists = [];
  for (let i = 1; i < route.length; i++) {
    const d = Math.sqrt(
      Math.pow(route[i][0] - route[i - 1][0], 2) +
      Math.pow(route[i][1] - route[i - 1][1], 2)
    );
    segDists.push(d);
    totalDist += d;
  }

  const targetDist = totalDist * progress;
  let accumulated = 0;
  for (let i = 0; i < segDists.length; i++) {
    if (accumulated + segDists[i] >= targetDist) {
      const frac = (targetDist - accumulated) / segDists[i];
      return [
        route[i][0] + frac * (route[i + 1][0] - route[i][0]),
        route[i][1] + frac * (route[i + 1][1] - route[i][1]),
      ];
    }
    accumulated += segDists[i];
  }
  return route[route.length - 1];
}

/* ── Component to auto-fit map bounds ──────────────────────── */
function FitBounds({ routes }) {
  const map = useMap();
  useEffect(() => {
    if (routes.length > 0) {
      const allPoints = routes.flat();
      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [routes, map]);
  return null;
}

/* ── Animated vehicle marker ──────────────────────────────── */
function AnimatedVehicle({ route, trip }) {
  const [progress, setProgress] = useState(trip.progress);
  const markerRef = useRef(null);

  // Slowly animate the vehicle along the route
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + 0.002;
        return next >= 1 ? trip.progress : next; // loop back
      });
    }, 200);
    return () => clearInterval(interval);
  }, [trip.progress]);

  const position = getPositionOnRoute(route, progress);

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={createVehicleIcon(trip.color)}
    >
      <Popup>
        <div style={{ minWidth: 200, fontFamily: "Inter, sans-serif" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: "#0f172a" }}>
            {trip.vehicle}
          </div>
          <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.7 }}>
            <strong>Trip:</strong> {trip.id}<br />
            <strong>Driver:</strong> {trip.driver}<br />
            <strong>Route:</strong> {trip.origin.name} → {trip.destination.name}<br />
            <strong>Cargo:</strong> {trip.cargo}<br />
            <strong>Departed:</strong> {trip.departureTime}<br />
            <strong>ETA:</strong> {trip.eta}<br />
            <strong>Progress:</strong> {Math.round(progress * 100)}%
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LIVE MAP PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function LiveMap() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Fetch real road routes on mount
  useEffect(() => {
    async function loadRoutes() {
      const fetched = await Promise.all(
        TRIPS.map((t) => fetchRoute(t.origin, t.destination))
      );
      setRoutes(fetched);
      setLoading(false);
    }
    loadRoutes();
  }, []);

  return (
    <section className="flex flex-col h-[calc(100vh-4rem)] -m-8 animate-fade-in">
      {/* ── Header bar ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-500/15 text-teal-400">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Live Fleet Map</h1>
            <p className="text-xs text-slate-400">Real-time vehicle tracking across routes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {TRIPS.length} Active Trips
          </span>
        </div>
      </div>

      {/* ── Map + side panel ────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Trip list panel ─────────────────────────── */}
        <div className="w-80 border-r border-white/[0.06] bg-slate-950/60 backdrop-blur-sm overflow-y-auto flex-shrink-0">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Active Vehicles
            </p>
          </div>
          {TRIPS.map((trip, i) => (
            <button
              key={trip.id}
              onClick={() => setSelectedTrip(selectedTrip === i ? null : i)}
              className={`w-full text-left px-4 py-4 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                selectedTrip === i ? "bg-white/[0.05]" : ""
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${trip.color}20`, color: trip.color }}
                >
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{trip.vehicle}</p>
                  <p className="text-[11px] text-slate-500">{trip.id}</p>
                </div>
                <span
                  className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${trip.color}20`,
                    color: trip.color,
                    border: `1px solid ${trip.color}40`,
                  }}
                >
                  {Math.round(trip.progress * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                <MapPin className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{trip.origin.name}</span>
                <span className="text-slate-600">→</span>
                <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                <span className="truncate">{trip.destination.name}</span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ETA {trip.eta}
                </span>
                <span className="flex items-center gap-1">
                  <Route className="w-3 h-3" />
                  {trip.driver}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${trip.progress * 100}%`,
                    backgroundColor: trip.color,
                  }}
                />
              </div>
            </button>
          ))}
        </div>

        {/* ── Map container ───────────────────────────── */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-teal-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-400">Loading routes...</p>
              </div>
            </div>
          )}

          <MapContainer
            center={INDIA_CENTER}
            zoom={INITIAL_ZOOM}
            className="w-full h-full"
            style={{ background: "#0f172a" }}
            zoomControl={false}
          >
            {/* ── Dark map tiles ─────────────────────── */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Auto-fit bounds */}
            {routes.length > 0 && <FitBounds routes={routes} />}

            {/* ── Render each trip ───────────────────── */}
            {TRIPS.map((trip, i) => {
              const route = routes[i];
              if (!route) return null;

              return (
                <span key={trip.id}>
                  {/* Route glow (wider, translucent) */}
                  <Polyline
                    positions={route}
                    pathOptions={{
                      color: trip.color,
                      weight: 6,
                      opacity: 0.2,
                    }}
                  />
                  {/* Route line */}
                  <Polyline
                    positions={route}
                    pathOptions={{
                      color: trip.color,
                      weight: 3,
                      opacity: 0.8,
                      dashArray: "8 12",
                    }}
                  />

                  {/* Origin marker */}
                  <Marker
                    position={[trip.origin.lat, trip.origin.lng]}
                    icon={createPinIcon("origin")}
                  >
                    <Popup>
                      <strong style={{ color: "#0f172a" }}>📍 {trip.origin.name}</strong>
                      <br />
                      <span style={{ fontSize: 12, color: "#475569" }}>
                        Origin — {trip.vehicle}
                      </span>
                    </Popup>
                  </Marker>

                  {/* Destination marker */}
                  <Marker
                    position={[trip.destination.lat, trip.destination.lng]}
                    icon={createPinIcon("destination")}
                  >
                    <Popup>
                      <strong style={{ color: "#0f172a" }}>🏁 {trip.destination.name}</strong>
                      <br />
                      <span style={{ fontSize: 12, color: "#475569" }}>
                        Destination — {trip.vehicle}
                      </span>
                    </Popup>
                  </Marker>

                  {/* Animated vehicle */}
                  <AnimatedVehicle route={route} trip={trip} />
                </span>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </section>
  );
}
