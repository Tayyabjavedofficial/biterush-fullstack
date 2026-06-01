import { useEffect, useRef, useState } from "react";
import { LocateFixed, Search, Route, X, Flag, MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Photon (Komoot) — browser-friendly geocoding with reliable CORS.
const PHOTON = "https://photon.komoot.io";
const OSRM = "https://router.project-osrm.org";

function labelOf(p = {}) {
  const parts = [];
  if (p.name) parts.push(p.name);
  else if (p.street) parts.push((p.housenumber ? p.housenumber + " " : "") + p.street);
  [p.city || p.county, p.state, p.country].forEach((x) => x && parts.push(x));
  return [...new Set(parts)].join(", ");
}

// Self-contained delivery-location map: search, live location, shortest route.
// `value` = saved destination {lat,lng}; `onChange(lat,lng,address?)` persists upstream.
export function LocationMap({ value, editing, onChange }) {
  const elRef = useRef(null);
  const map = useRef(null);
  const editingRef = useRef(editing);
  const destMk = useRef(null);
  const origMk = useRef(null);
  const line = useRef(null);

  const [dest, setDest] = useState(value?.lat != null ? { lat: value.lat, lng: value.lng } : null);
  const [orig, setOrig] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [q, setQ] = useState("");
  const [oq, setOq] = useState("");
  const [results, setResults] = useState(null); // { for: 'dest'|'orig', items: [{label,lat,lng}] }
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => { editingRef.current = editing; }, [editing]);

  const dot = (color) => L.divIcon({
    className: "",
    html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></span>`,
    iconSize: [18, 18], iconAnchor: [9, 9],
  });

  const placeDest = (lat, lng) => {
    if (!map.current) return;
    if (destMk.current) destMk.current.setLatLng([lat, lng]);
    else destMk.current = L.marker([lat, lng], { icon: dot("#C6F035") }).addTo(map.current).bindTooltip("Destination");
  };
  const placeOrig = (lat, lng) => {
    if (!map.current) return;
    if (origMk.current) origMk.current.setLatLng([lat, lng]);
    else origMk.current = L.marker([lat, lng], { icon: dot("#3b82f6") }).addTo(map.current).bindTooltip("Start");
  };

  useEffect(() => {
    if (map.current || !elRef.current) return;
    const start = dest || { lat: 39.5, lng: -98.35 };
    map.current = L.map(elRef.current, { zoomControl: true }).setView([start.lat, start.lng], dest ? 15 : 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map.current);
    map.current.attributionControl.setPrefix("");
    map.current.on("click", (e) => { if (editingRef.current) setDestination(e.latlng.lat, e.latlng.lng, { reverse: true }); });
    if (dest) placeDest(dest.lat, dest.lng);
    setTimeout(() => map.current && map.current.invalidateSize(), 120);
    return () => { map.current?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reverseGeocode(lat, lng) {
    try {
      const r = await fetch(`${PHOTON}/reverse?lat=${lat}&lon=${lng}`);
      const d = await r.json();
      const f = d.features?.[0];
      return (f && labelOf(f.properties)) || `${lat}, ${lng}`;
    } catch { return `${lat}, ${lng}`; }
  }

  async function setDestination(lat, lng, { address, reverse } = {}) {
    lat = +(+lat).toFixed(6); lng = +(+lng).toFixed(6);
    setDest({ lat, lng });
    placeDest(lat, lng);
    map.current?.setView([lat, lng], Math.max(map.current.getZoom(), 14));
    setResults(null);
    let addr = address;
    if (!addr && reverse) addr = await reverseGeocode(lat, lng);
    onChange?.(lat, lng, addr);
  }
  function setOrigin(lat, lng) {
    lat = +(+lat).toFixed(6); lng = +(+lng).toFixed(6);
    setOrig({ lat, lng });
    placeOrig(lat, lng);
    setResults(null);
  }

  async function search(query, target) {
    if (!query.trim()) return;
    setBusy(target); setErr("");
    try {
      const bias = dest || orig;
      let url = `${PHOTON}/api/?q=${encodeURIComponent(query)}&limit=6`;
      if (bias) url += `&lat=${bias.lat}&lon=${bias.lng}`;
      const r = await fetch(url);
      const data = await r.json();
      const items = (data.features || [])
        .map((f) => ({ label: labelOf(f.properties), lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] }))
        .filter((x) => x.label);
      if (!items.length) setErr("No matching places found. Try a more specific search.");
      setResults({ for: target, items });
    } catch {
      setErr("Search failed. Check your connection and try again.");
    } finally {
      setBusy("");
    }
  }

  function liveLocation(target) {
    if (!navigator.geolocation) { setErr("Geolocation isn't supported on this device."); return; }
    setBusy("live-" + target); setErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (target === "dest") setDestination(latitude, longitude, { reverse: true });
        else setOrigin(latitude, longitude);
        setBusy("");
      },
      (e) => { setErr(e.code === 1 ? "Location permission denied." : "Couldn't get your location."); setBusy(""); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function findRoute() {
    if (!orig || !dest) return;
    setBusy("route"); setErr(""); setRouteInfo(null);
    try {
      const url = `${OSRM}/route/v1/driving/${orig.lng},${orig.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
      const r = await fetch(url);
      const data = await r.json();
      const route = data?.routes?.[0];
      if (!route) { setErr("No route found between these points."); return; }
      const latlngs = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      if (line.current) line.current.setLatLngs(latlngs);
      else line.current = L.polyline(latlngs, { color: "#C6F035", weight: 5, opacity: 0.85 }).addTo(map.current);
      map.current.fitBounds(line.current.getBounds(), { padding: [30, 30] });
      setRouteInfo({ km: (route.distance / 1000).toFixed(1), min: Math.round(route.duration / 60) });
    } catch {
      setErr("Routing service unavailable. Try again.");
    } finally {
      setBusy("");
    }
  }

  function clearRoute() {
    if (line.current) { line.current.remove(); line.current = null; }
    if (origMk.current) { origMk.current.remove(); origMk.current = null; }
    setOrig(null); setOq(""); setRouteInfo(null);
  }

  const Results = ({ which, icon: Icon, onPick }) =>
    results?.for === which && Array.isArray(results.items) && results.items.length > 0 ? (
      <ul className="map-results">
        {results.items.map((it, i) => (
          <li key={i} onClick={() => onPick(it)}><Icon size={13} /> {it.label}</li>
        ))}
      </ul>
    ) : null;

  return (
    <div className="locmap">
      {editing && (
        <div className="map-search">
          <input value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(q, "dest"); } }}
            placeholder="Search a destination address or place…" />
          <button className="icon-btn" onClick={() => search(q, "dest")} title="Search">{busy === "dest" ? "…" : <Search size={16} />}</button>
          <button className="icon-btn" onClick={() => liveLocation("dest")} title="Use my live location">{busy === "live-dest" ? "…" : <LocateFixed size={16} />}</button>
        </div>
      )}

      <Results which="dest" icon={MapPin} onPick={(it) => { setQ(it.label); setDestination(it.lat, it.lng, { address: it.label }); }} />

      <div ref={elRef} className="locmap-canvas" />
      {dest && <div className="profile-coords"><MapPin size={13} /> Destination: {dest.lat}, {dest.lng}</div>}

      {/* Route analysis */}
      <div className="route-tools">
        <div className="map-search">
          <input value={oq} onChange={(e) => setOq(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(oq, "orig"); } }}
            placeholder="Route start (origin)…" />
          <button className="icon-btn" onClick={() => search(oq, "orig")} title="Search start">{busy === "orig" ? "…" : <Search size={16} />}</button>
          <button className="icon-btn" onClick={() => liveLocation("orig")} title="Use my location as start">{busy === "live-orig" ? "…" : <LocateFixed size={16} />}</button>
        </div>
        <Results which="orig" icon={Flag} onPick={(it) => { setOq(it.label); setOrigin(it.lat, it.lng); }} />
        <div className="route-btns">
          <button className="cta" onClick={findRoute} disabled={!orig || !dest || busy === "route"} style={{ flex: 1 }}>
            <Route size={18} /> {busy === "route" ? "Finding…" : "Find shortest route"}
          </button>
          {routeInfo && <button className="icon-btn" onClick={clearRoute} title="Clear route"><X size={16} /></button>}
        </div>
        {!dest && <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>Set a destination above first, then a start point to see the route.</p>}
        {routeInfo && <div className="route-info"><Route size={15} /> Shortest route: <b>{routeInfo.km} km</b> · ~<b>{routeInfo.min} min</b> by road</div>}
      </div>

      {err && <div className="err" style={{ marginTop: 10 }}>{err}</div>}
    </div>
  );
}
