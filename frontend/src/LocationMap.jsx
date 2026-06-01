import { useEffect, useRef, useState } from "react";
import { LocateFixed, Search, Route, X, Flag, MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const NOMINATIM = "https://nominatim.openstreetmap.org";
const OSRM = "https://router.project-osrm.org";

// A self-contained delivery-location map: search, live location, and shortest-route.
// `value` = saved destination {lat,lng}; `onChange(lat,lng,address?)` persists it upstream.
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
  const [results, setResults] = useState(null); // { for: 'dest'|'orig', items }
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

  // init map once
  useEffect(() => {
    if (map.current || !elRef.current) return;
    const start = dest || { lat: 39.5, lng: -98.35 };
    map.current = L.map(elRef.current, { zoomControl: true }).setView([start.lat, start.lng], dest ? 15 : 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map.current);
    map.current.attributionControl.setPrefix("");
    map.current.on("click", (e) => {
      if (!editingRef.current) return;
      setDestination(e.latlng.lat, e.latlng.lng, true);
    });
    if (dest) placeDest(dest.lat, dest.lng);
    setTimeout(() => map.current && map.current.invalidateSize(), 120);
    return () => { map.current?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reverseGeocode(lat, lng) {
    try {
      const r = await fetch(`${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}`, { headers: { Accept: "application/json" } });
      const d = await r.json();
      return d?.display_name || `${lat}, ${lng}`;
    } catch { return `${lat}, ${lng}`; }
  }

  async function setDestination(lat, lng, withAddress) {
    lat = +lat.toFixed(6); lng = +lng.toFixed(6);
    setDest({ lat, lng });
    placeDest(lat, lng);
    map.current?.setView([lat, lng], Math.max(map.current.getZoom(), 14));
    setResults(null);
    const address = withAddress ? await reverseGeocode(lat, lng) : undefined;
    onChange?.(lat, lng, address);
  }
  function setOrigin(lat, lng) {
    lat = +lat.toFixed(6); lng = +lng.toFixed(6);
    setOrig({ lat, lng });
    placeOrig(lat, lng);
    setResults(null);
  }

  async function search(query, target) {
    if (!query.trim()) return;
    setBusy(target); setErr("");
    try {
      const r = await fetch(`${NOMINATIM}/search?format=json&limit=5&q=${encodeURIComponent(query)}`, { headers: { Accept: "application/json" } });
      const items = await r.json();
      if (!items.length) setErr("No matching places found.");
      setResults({ for: target, items });
    } catch { setErr("Search failed. Try again."); }
    finally { setBusy(""); }
  }

  function liveLocation(target) {
    if (!navigator.geolocation) { setErr("Geolocation isn't supported on this device."); return; }
    setBusy("live-" + target); setErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (target === "dest") setDestination(latitude, longitude, true);
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
    } catch { setErr("Routing service unavailable. Try again."); }
    finally { setBusy(""); }
  }

  function clearRoute() {
    if (line.current) { line.current.remove(); line.current = null; }
    if (origMk.current) { origMk.current.remove(); origMk.current = null; }
    setOrig(null); setOq(""); setRouteInfo(null);
  }

  return (
    <div className="locmap">
      {editing && (
        <div className="map-search">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search(q, "dest"))}
            placeholder="Search a destination address or place…" />
          <button className="icon-btn" onClick={() => search(q, "dest")} title="Search">
            {busy === "dest" ? "…" : <Search size={16} />}
          </button>
          <button className="icon-btn" onClick={() => liveLocation("dest")} title="Use my live location">
            {busy === "live-dest" ? "…" : <LocateFixed size={16} />}
          </button>
        </div>
      )}

      {results?.for === "dest" && (
        <ul className="map-results">
          {results.items.map((it, i) => (
            <li key={i} onClick={() => { setQ(it.display_name); setDestination(+it.lat, +it.lon); onChange?.(+(+it.lat).toFixed(6), +(+it.lon).toFixed(6), it.display_name); }}>
              <MapPin size={13} /> {it.display_name}
            </li>
          ))}
        </ul>
      )}

      <div ref={elRef} className="locmap-canvas" />

      {dest && <div className="profile-coords"><MapPin size={13} /> Destination: {dest.lat}, {dest.lng}</div>}

      {/* Route analysis */}
      <div className="route-tools">
        <div className="map-search">
          <input value={oq} onChange={(e) => setOq(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search(oq, "orig"))}
            placeholder="Route start (origin)…" />
          <button className="icon-btn" onClick={() => search(oq, "orig")} title="Search start">
            {busy === "orig" ? "…" : <Search size={16} />}
          </button>
          <button className="icon-btn" onClick={() => liveLocation("orig")} title="Use my location as start">
            {busy === "live-orig" ? "…" : <LocateFixed size={16} />}
          </button>
        </div>
        {results?.for === "orig" && (
          <ul className="map-results">
            {results.items.map((it, i) => (
              <li key={i} onClick={() => { setOq(it.display_name); setOrigin(+it.lat, +it.lon); }}>
                <Flag size={13} /> {it.display_name}
              </li>
            ))}
          </ul>
        )}
        <div className="route-btns">
          <button className="cta" onClick={findRoute} disabled={!orig || !dest || busy === "route"} style={{ flex: 1 }}>
            <Route size={18} /> {busy === "route" ? "Finding…" : "Find shortest route"}
          </button>
          {routeInfo && <button className="icon-btn" onClick={clearRoute} title="Clear route"><X size={16} /></button>}
        </div>
        {routeInfo && (
          <div className="route-info"><Route size={15} /> Shortest route: <b>{routeInfo.km} km</b> · ~<b>{routeInfo.min} min</b> by road</div>
        )}
      </div>

      {err && <div className="err" style={{ marginTop: 10 }}>{err}</div>}
    </div>
  );
}
