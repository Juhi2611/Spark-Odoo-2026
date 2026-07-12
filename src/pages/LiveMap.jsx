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
import {
  Truck,
  MapPin,
  Navigation,
  Clock,
  Route,
  RefreshCw,
  Search,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { supabase } from "../supabaseClient";

// ── India center for initial map view ───────────────────────
const INDIA_CENTER = [22.0, 78.0];
const INITIAL_ZOOM = 5;

// ── Local Coordinates dictionary for common Indian cities ────
const INDIAN_CITIES = {
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  vadodara: { lat: 22.3072, lng: 73.1812 },
  surat: { lat: 21.1702, lng: 72.8311 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  rajkot: { lat: 22.3039, lng: 70.8022 },
  pune: { lat: 18.5204, lng: 73.8567 },
  delhi: { lat: 28.7041, lng: 77.1025 },
  newdelhi: { lat: 28.6139, lng: 77.209 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  gandhinagar: { lat: 23.2156, lng: 72.6369 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  indore: { lat: 22.7196, lng: 75.8577 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  nasik: { lat: 19.9975, lng: 73.7898 },
  nashik: { lat: 19.9975, lng: 73.7898 },
  goa: { lat: 15.2993, lng: 74.124 },
  panaji: { lat: 15.4909, lng: 73.8278 },
  mysore: { lat: 12.2958, lng: 76.6394 },
  mysuru: { lat: 12.2958, lng: 76.6394 },
};

// ── Geocoding cache to avoid repeated hits to Nominatim ──
const geocodeCache = {};

async function resolveCoordinates(cityName) {
  if (!cityName) return null;
  const cleanName = cityName.trim().toLowerCase().replace(/\s+/g, "");

  // 1. Check local dictionary
  if (INDIAN_CITIES[cleanName]) {
    return INDIAN_CITIES[cleanName];
  }

  // 2. Check memory cache
  if (geocodeCache[cleanName]) {
    return geocodeCache[cleanName];
  }

  // 3. Fallback to Nominatim OSM Geocoder
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      cityName
    )}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "TransitOps-FleetManager/1.0",
      },
    });
    const data = await res.json();
    if (data && data.length > 0) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
      geocodeCache[cleanName] = coords;
      return coords;
    }
  } catch (err) {
    console.warn(`Failed to geocode city "${cityName}":`, err);
  }

  // 4. Default fallback: random point in central India
  const fallback = {
    lat: 22.0 + (Math.random() - 0.5) * 3,
    lng: 78.0 + (Math.random() - 0.5) * 3,
  };
  geocodeCache[cleanName] = fallback;
  return fallback;
}

// ── Fetch real road routes from OSRM ───────────────────────
const routeCache = {};

async function fetchOSRMRoute(origin, destination) {
  const cacheKey = `${origin.lat},${origin.lng};${destination.lat},${destination.lng}`;
  if (routeCache[cacheKey]) {
    return routeCache[cacheKey];
  }

  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [
        lat,
        lng,
      ]);
      routeCache[cacheKey] = coords;
      return coords;
    }
  } catch (err) {
    console.warn("OSRM route fetch failed, using straight line:", err);
  }

  // Fallback: straight line
  const fallback = [
    [origin.lat, origin.lng],
    [destination.lat, destination.lng],
  ];
  routeCache[cacheKey] = fallback;
  return fallback;
}

// ── Calculate vehicle position along a polyline path ──────
function getPositionOnRoute(route, progress) {
  if (!route || route.length === 0) return [0, 0];
  if (progress <= 0) return route[0];
  if (progress >= 1) return route[route.length - 1];

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

// ── Leaflet Custom Icons using SVGs ────────────────────────
function createVehicleIcon(color, type = "truck") {
  let svgPath = "";
  if (type === "bus") {
    // Bus SVG Icon
    svgPath = `<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 .6.4 1 1 1h2m3 0h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8.5" cy="17" r="2.5" fill="currentColor"/><circle cx="16.5" cy="17" r="2.5" fill="currentColor"/>`;
  } else if (type === "van") {
    // Van SVG Icon
    svgPath = `<path d="M14 18H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="7.5" cy="18" r="2" fill="currentColor"/><circle cx="16.5" cy="18" r="2" fill="currentColor"/><path d="M13 6v6H4" fill="none" stroke="currentColor" stroke-width="2"/>`;
  } else {
    // Cargo Truck SVG Icon
    svgPath = `<path d="M14 18H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M18 18h2a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="7.5" cy="18" r="2.5" fill="currentColor"/><circle cx="16.5" cy="18" r="2.5" fill="currentColor"/>`;
  }

  const html = `
    <div class="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-950/90 border-2 shadow-lg hover:scale-110 transition-transform duration-200" style="border-color: ${color}; box-shadow: 0 0 12px ${color}50;">
      <div class="w-6 h-6 flex items-center justify-center" style="color: ${color};">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${svgPath}
        </svg>
      </div>
      <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-slate-950 flex items-center justify-center bg-emerald-500 shadow-md">
        <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
      </div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
}

function createPinIcon(type) {
  const color = type === "origin" ? "#10b981" : "#f43f5e";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#0f172a" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="4.5" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

// ── Leaflet controller to handle Map Bounds and Fly-To ───────
function MapController({ routes, focusedCoords }) {
  const map = useMap();

  // Fit bounds when routes change
  useEffect(() => {
    if (routes && routes.length > 0) {
      const allPoints = routes.flat();
      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
    }
  }, [routes, map]);

  // Smooth-fly to vehicle when focused
  useEffect(() => {
    if (focusedCoords) {
      map.setView(focusedCoords, 10, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [focusedCoords, map]);

  return null;
}

// ── Simulated Demo Data ──────────────────────────────────────
const SIMULATED_TRIPS = [
  {
    id: "SIM-0001",
    source: "Ahmedabad",
    destination: "Vadodara",
    cargo_weight: 4200,
    planned_distance: 110,
    status: "dispatched",
    dispatched_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(), // 40 mins ago
    color: "#2dd4bf", // teal
    vehicles: {
      name: "Ahmedabad Shuttle",
      registration_number: "GJ-01-XX-4422",
      type: "bus",
    },
    drivers: { name: "Rajesh Kumar" },
  },
  {
    id: "SIM-0002",
    source: "Surat",
    destination: "Mumbai",
    cargo_weight: 9800,
    planned_distance: 280,
    status: "dispatched",
    dispatched_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), // 1.5 hours ago
    color: "#818cf8", // indigo
    vehicles: {
      name: "Intercity Logistics",
      registration_number: "MH-04-YY-9900",
      type: "truck",
    },
    drivers: { name: "Amit Patel" },
  },
  {
    id: "SIM-0003",
    source: "Pune",
    destination: "Mumbai",
    cargo_weight: 1500,
    planned_distance: 150,
    status: "dispatched",
    dispatched_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
    color: "#fb923c", // orange
    vehicles: {
      name: "Express Delivery",
      registration_number: "MH-12-PQ-0883",
      type: "van",
    },
    drivers: { name: "Priya Shah" },
  },
  {
    id: "SIM-0004",
    source: "Delhi",
    destination: "Jaipur",
    cargo_weight: 12000,
    planned_distance: 270,
    status: "dispatched",
    dispatched_at: new Date(Date.now() - 2.2 * 60 * 60 * 1000).toISOString(), // 2.2 hours ago
    color: "#fb7185", // rose
    vehicles: {
      name: "Heavy Duty Transporter",
      registration_number: "DL-01-AB-1234",
      type: "truck",
    },
    drivers: { name: "Harpreet Singh" },
  },
];

export default function LiveMap() {
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState({}); // key: trip.id, value: array of [lat, lng]
  const [livePositions, setLivePositions] = useState({}); // key: trip.id, value: [lat, lng]
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedTripId, setFocusedTripId] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [syncTime, setSyncTime] = useState(new Date());

  const timerRef = useRef(null);

  // 1. Fetch Real Trips from Supabase
  const fetchActiveTrips = async () => {
    if (demoMode) return;
    try {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          vehicles ( id, name, registration_number, type, status ),
          drivers  ( id, name, license_number, status )
        `)
        .eq("status", "dispatched");

      if (error) throw error;

      // Assign a random color if not present for rendering
      const colors = [
        "#2dd4bf",
        "#818cf8",
        "#fb923c",
        "#f43f5e",
        "#38bdf8",
        "#c084fc",
        "#a3e635",
      ];
      const parsedTrips = (data || []).map((t, idx) => ({
        ...t,
        color: colors[idx % colors.length],
      }));

      setTrips(parsedTrips);
      setSyncTime(new Date());
    } catch (err) {
      console.error("Error fetching live map trips:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch OSRM Road Routes for each Trip
  const resolveRoutes = async (tripsToResolve) => {
    const routeObj = {};
    for (const trip of tripsToResolve) {
      const origin = await resolveCoordinates(trip.source);
      const dest = await resolveCoordinates(trip.destination);
      if (origin && dest) {
        const routeCoords = await fetchOSRMRoute(origin, dest);
        routeObj[trip.id] = {
          route: routeCoords,
          origin,
          dest,
        };
      }
    }
    setRoutes(routeObj);
  };

  // Trigger loading based on data source
  useEffect(() => {
    setLoading(true);
    setFocusedTripId(null);
    if (demoMode) {
      setTrips(SIMULATED_TRIPS);
      resolveRoutes(SIMULATED_TRIPS).then(() => setLoading(false));
    } else {
      fetchActiveTrips();
    }
  }, [demoMode]);

  // Resolve routes whenever trips changes
  useEffect(() => {
    if (trips.length > 0) {
      resolveRoutes(trips);
    } else {
      setRoutes({});
    }
  }, [trips]);

  // 3. Realtime Supabase Channel Subscription
  useEffect(() => {
    if (demoMode) return;

    const channel = supabase
      .channel("live-map-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips" },
        () => {
          fetchActiveTrips();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [demoMode]);

  // 4. Tick interval to compute live vehicle coordinate positions along the route
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const positions = {};
      const speedKmh = 70; // Assumed vehicle speed

      trips.forEach((trip) => {
        const routeDetails = routes[trip.id];
        if (!routeDetails) return;

        const { route } = routeDetails;
        const dispatchedTime = new Date(trip.dispatched_at).getTime();
        const elapsedMs = Date.now() - dispatchedTime;

        // Estimated trip duration
        const durationMs =
          (trip.planned_distance / speedKmh) * 60 * 60 * 1000;
        let progress = elapsedMs / durationMs;

        if (progress < 0) progress = 0;
        if (progress > 1) {
          // Loop simulated routes so the demo is continuously active
          if (trip.id.startsWith("SIM-")) {
            progress = (elapsedMs % durationMs) / durationMs;
          } else {
            progress = 1.0;
          }
        }

        positions[trip.id] = getPositionOnRoute(route, progress);
      });

      setLivePositions(positions);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [trips, routes]);

  // 5. Filter Trips based on search query
  const filteredTrips = trips.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      (t.vehicles?.name || "").toLowerCase().includes(q) ||
      (t.drivers?.name || "").toLowerCase().includes(q) ||
      t.source.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q)
    );
  });

  // Calculate live overall stats
  const totalCargo = trips.reduce((acc, t) => acc + (t.cargo_weight || 0), 0);
  const activeDistance = trips.reduce(
    (acc, t) => acc + (t.planned_distance || 0),
    0
  );

  // Build the list of active coordinates for bounding box calculation
  const mapRoutes = filteredTrips
    .map((t) => routes[t.id]?.route)
    .filter(Boolean);

  const focusedCoords = focusedTripId ? livePositions[focusedTripId] : null;

  return (
    <section className="flex flex-col h-[calc(100vh-4rem)] -m-8 animate-fade-in">
      {/* ── Header Dashboard Overview ──────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-8 py-4 border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500/15 text-teal-400">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Live Fleet Tracking
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {demoMode
                ? "Simulated operational sandbox"
                : "Real-time telemetry feeds synchronized via Supabase"}
            </p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="px-4 py-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col items-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Active Fleet
            </span>
            <span className="text-sm font-extrabold text-teal-400">
              {trips.length} Vehicles
            </span>
          </div>

          <div className="px-4 py-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col items-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Cargo Weight
            </span>
            <span className="text-sm font-extrabold text-indigo-400">
              {(totalCargo / 1000).toFixed(1)} tons
            </span>
          </div>

          <div className="px-4 py-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col items-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Operational Distance
            </span>
            <span className="text-sm font-extrabold text-amber-400">
              {activeDistance} km
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 border-l border-white/[0.1] pl-4">
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                demoMode
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                  : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-slate-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{demoMode ? "Simulation Mode" : "Run Simulation"}</span>
            </button>

            {!demoMode && (
              <button
                onClick={fetchActiveTrips}
                title="Sync database feed"
                className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Frame: Map + List Sidebar ────────────────────── */}
      <div className="flex flex-1 min-h-0 relative">
        {/* ── Left Sidebar: Fleet List ─────────────────────── */}
        <div className="w-80 border-r border-white/[0.06] bg-slate-950/60 backdrop-blur-sm flex flex-col flex-shrink-0 z-10">
          {/* Search bar */}
          <div className="p-4 border-b border-white/[0.06]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search active fleet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] text-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/25 transition-all"
              />
            </div>
          </div>

          {/* Trips list */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-2 border-b border-white/[0.03] flex justify-between items-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Telemetry Feeds
              </p>
              {!demoMode && (
                <span className="text-[9px] text-slate-500 font-mono">
                  Synced: {syncTime.toLocaleTimeString()}
                </span>
              )}
            </div>

            {filteredTrips.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-3">
                {demoMode ? (
                  <AlertCircle className="w-8 h-8 text-slate-600" />
                ) : (
                  <Route className="w-8 h-8 text-slate-600" />
                )}
                <div>
                  <p className="text-xs font-semibold text-slate-350">
                    No active trips tracked
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {demoMode
                      ? "Query yielded no matches."
                      : "Create active trips on the /trips page and dispatch them, or run the simulator!"}
                  </p>
                </div>
                {!demoMode && (
                  <button
                    onClick={() => setDemoMode(true)}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold text-[11px] hover:scale-105 transition-all cursor-pointer"
                  >
                    Activate Simulation Mode
                  </button>
                )}
              </div>
            ) : (
              filteredTrips.map((trip) => {
                const pos = livePositions[trip.id];
                const routeDetails = routes[trip.id];
                const isFocused = focusedTripId === trip.id;

                // Calculate progress %
                const dispatchedTime = new Date(trip.dispatched_at).getTime();
                const elapsedMs = Date.now() - dispatchedTime;
                const durationMs =
                  (trip.planned_distance / 70) * 60 * 60 * 1000;
                let progressPercent = Math.min(
                  100,
                  Math.max(
                    0,
                    Math.round(
                      (trip.id.startsWith("SIM-")
                        ? (elapsedMs % durationMs) / durationMs
                        : elapsedMs / durationMs) * 100
                    )
                  )
                );

                return (
                  <button
                    key={trip.id}
                    onClick={() =>
                      setFocusedTripId(isFocused ? null : trip.id)
                    }
                    className={`w-full text-left px-4 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors flex flex-col gap-2.5 ${
                      isFocused ? "bg-white/[0.04]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center border"
                        style={{
                          backgroundColor: `${trip.color}15`,
                          color: trip.color,
                          borderColor: `${trip.color}30`,
                        }}
                      >
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-200 truncate">
                          {trip.vehicles?.name || "Unassigned Vehicle"}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {trip.id.slice(0, 10)} • {trip.vehicles?.registration_number || "-"}
                        </p>
                      </div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${trip.color}15`,
                          color: trip.color,
                          border: `1px solid ${trip.color}30`,
                        }}
                      >
                        {progressPercent}%
                      </span>
                    </div>

                    {/* Locations */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-350">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate max-w-[90px]" title={trip.source}>
                        {trip.source}
                      </span>
                      <span className="text-slate-600 font-bold shrink-0">→</span>
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate max-w-[90px]" title={trip.destination}>
                        {trip.destination}
                      </span>
                    </div>

                    {/* Operator + Cargo */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        Dist: {trip.planned_distance} km
                      </span>
                      <span className="truncate max-w-[120px]">
                        Driver: {trip.drivers?.name || "Unknown"}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden w-full">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${progressPercent}%`,
                          backgroundColor: trip.color,
                        }}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: Map Container ───────────────────────── */}
        <div className="flex-1 relative bg-slate-950">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
              <div className="flex flex-col items-center gap-3">
                <div className="w-9 h-9 border-3 border-teal-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold tracking-wider text-slate-400">
                  Resolving Telemetry Feeds...
                </p>
              </div>
            </div>
          )}

          <MapContainer
            center={INDIA_CENTER}
            zoom={INITIAL_ZOOM}
            className="w-full h-full"
            style={{ background: "#020617" }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Bounds & Fly-To controller */}
            {mapRoutes.length > 0 && (
              <MapController
                routes={mapRoutes}
                focusedCoords={focusedCoords}
              />
            )}

            {/* Render active trips */}
            {filteredTrips.map((trip) => {
              const routeDetails = routes[trip.id];
              if (!routeDetails) return null;

              const { route, origin, dest } = routeDetails;
              const pos = livePositions[trip.id];

              return (
                <span key={trip.id}>
                  {/* Route Translucent Glow */}
                  <Polyline
                    positions={route}
                    pathOptions={{
                      color: trip.color,
                      weight: 6,
                      opacity: 0.12,
                    }}
                  />
                  {/* Route Path line */}
                  <Polyline
                    positions={route}
                    pathOptions={{
                      color: trip.color,
                      weight: 2.5,
                      opacity: 0.7,
                      dashArray: "6 10",
                    }}
                  />

                  {/* Start Depot Pin */}
                  <Marker position={[origin.lat, origin.lng]} icon={createPinIcon("origin")}>
                    <Popup>
                      <div className="text-slate-950 p-1 font-sans text-xs">
                        <strong className="text-emerald-700">📍 Origin Depot</strong>
                        <div className="mt-1 font-bold">{trip.source}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Trip: {trip.id.slice(0, 8)} • Vehicle: {trip.vehicles?.name}
                        </div>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Destination Hub Pin */}
                  <Marker position={[dest.lat, dest.lng]} icon={createPinIcon("destination")}>
                    <Popup>
                      <div className="text-slate-950 p-1 font-sans text-xs">
                        <strong className="text-rose-600">🏁 Destination Hub</strong>
                        <div className="mt-1 font-bold">{trip.destination}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Trip: {trip.id.slice(0, 8)} • Vehicle: {trip.vehicles?.name}
                        </div>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Live Animated Vehicle */}
                  {pos && (
                    <Marker
                      position={pos}
                      icon={createVehicleIcon(trip.color, trip.vehicles?.type)}
                    >
                      <Popup>
                        <div
                          className="font-sans text-xs p-2 text-slate-900"
                          style={{ minWidth: "220px", lineHeight: "1.7" }}
                        >
                          <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                            <span className="font-extrabold text-[13px] text-slate-900">
                              {trip.vehicles?.name || "Active Fleet Asset"}
                            </span>
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: `${trip.color}20`,
                                color: trip.color,
                              }}
                            >
                              {trip.vehicles?.type || "truck"}
                            </span>
                          </div>

                          <div className="space-y-1 text-slate-700">
                            <div>
                              <strong>Trip ID:</strong> {trip.id.slice(0, 8)}
                            </div>
                            <div>
                              <strong>Registration:</strong> {trip.vehicles?.registration_number || "-"}
                            </div>
                            <div>
                              <strong>Driver:</strong> {trip.drivers?.name || "-"}
                            </div>
                            <div>
                              <strong>Route:</strong> {trip.source} → {trip.destination}
                            </div>
                            <div>
                              <strong>Distance:</strong> {trip.planned_distance} km
                            </div>
                            <div>
                              <strong>Cargo Load:</strong> {(trip.cargo_weight || 0).toLocaleString("en-IN")} kg
                            </div>
                            <div>
                              <strong>Coordinates:</strong> {pos[0].toFixed(5)}, {pos[1].toFixed(5)}
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </span>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </section>
  );
}
