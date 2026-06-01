import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Camera, Save, LogOut, UserPlus, LogIn, Sparkles, LayoutDashboard,
  Receipt, ShoppingBag, ChevronRight, User, Store, Bike, ShieldCheck,
  Pencil, MapPin, LocateFixed, X, ZoomIn, ZoomOut,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { ThemeToggle } from "./components.jsx";

const FRAME = 256; // crop viewport + output size

export function ProfileScreen({ go, theme, setTheme }) {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "", role: "customer", picture: "", lat: null, lng: null,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [gettingLoc, setGettingLoc] = useState(false);

  // photo-crop modal state
  const [cropSrc, setCropSrc] = useState(null);
  const [cropDims, setCropDims] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!token || !user) { setLoading(false); return; }
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfile(data);
        setFormData({
          name: data.name || "", email: data.email || "", phone: data.phone || "",
          address: data.address || "", role: data.role || "customer", picture: data.picture || "",
          lat: data.lat ?? null, lng: data.lng ?? null,
        });
      } catch (e) {
        console.error("Failed to fetch profile:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token, user]);

  /* ---- photo: pick → adjust (crop modal) → apply ---- */
  const onPickFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // pre-shrink source so the cropper stays snappy
        const max = 1024;
        const sc = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * sc), h = Math.round(img.height * sc);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        setCropDims({ w, h });
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setCropSrc(c.toDataURL("image/jpeg", 0.92));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // allow re-selecting the same file
  };

  const geom = (z, off) => {
    if (!cropDims) return { dw: FRAME, dh: FRAME, x: 0, y: 0 };
    const s = (FRAME / Math.min(cropDims.w, cropDims.h)) * z;
    const dw = cropDims.w * s, dh = cropDims.h * s;
    let x = (FRAME - dw) / 2 + off.x;
    let y = (FRAME - dh) / 2 + off.y;
    x = Math.min(0, Math.max(FRAME - dw, x));
    y = Math.min(0, Math.max(FRAME - dh, y));
    return { dw, dh, x, y };
  };

  const clampOffset = (off, z) => {
    if (!cropDims) return off;
    const s = (FRAME / Math.min(cropDims.w, cropDims.h)) * z;
    const maxX = (cropDims.w * s - FRAME) / 2;
    const maxY = (cropDims.h * s - FRAME) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, off.x)),
      y: Math.max(-maxY, Math.min(maxY, off.y)),
    };
  };

  const onDragStart = (e) => {
    drag.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onDragMove = (e) => {
    if (!drag.current) return;
    const next = { x: drag.current.ox + (e.clientX - drag.current.px), y: drag.current.oy + (e.clientY - drag.current.py) };
    setOffset(clampOffset(next, zoom));
  };
  const onDragEnd = () => { drag.current = null; };
  const onZoom = (z) => { setZoom(z); setOffset((o) => clampOffset(o, z)); };

  const applyCrop = () => {
    const { dw, dh, x, y } = geom(zoom, offset);
    const canvas = document.createElement("canvas");
    canvas.width = FRAME; canvas.height = FRAME;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, x, y, dw, dh);
      setFormData((f) => ({ ...f, picture: canvas.toDataURL("image/jpeg", 0.85) }));
      setCropSrc(null);
    };
    img.src = cropSrc;
  };

  /* ---- live location + reverse geocode ---- */
  const useLiveLocation = () => {
    if (!navigator.geolocation) { setErr("Geolocation isn't supported on this device."); return; }
    setGettingLoc(true); setErr("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = +pos.coords.latitude.toFixed(6);
        const lng = +pos.coords.longitude.toFixed(6);
        setFormData((f) => ({ ...f, lat, lng }));
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, { headers: { Accept: "application/json" } });
          const d = await r.json();
          if (d?.display_name) setFormData((f) => ({ ...f, address: d.display_name }));
          else setFormData((f) => ({ ...f, address: `${lat}, ${lng}` }));
        } catch {
          setFormData((f) => ({ ...f, address: `${lat}, ${lng}` }));
        }
        setGettingLoc(false);
      },
      (e) => { setErr(e.code === 1 ? "Location permission denied." : "Couldn't get your location."); setGettingLoc(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    setSaving(true); setErr(""); setSaved(false);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: formData.name, phone: formData.phone, address: formData.address,
          picture: formData.picture, lat: formData.lat, lng: formData.lng,
        }),
      });
      if (res.ok) {
        setProfile(await res.json());
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2800);
      } else {
        const e = await res.json().catch(() => ({}));
        setErr(e.error || "Failed to save changes");
      }
    } catch (e) {
      setErr("Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setErr("");
    setEditing(false);
    setFormData({
      name: profile.name || "", email: profile.email || "", phone: profile.phone || "",
      address: profile.address || "", role: profile.role || "customer", picture: profile.picture || "",
      lat: profile.lat ?? null, lng: profile.lng ?? null,
    });
  };

  const handleLogout = () => { logout(); go("home"); };

  /* ---- unauthenticated ---- */
  if (!user || !token) {
    const goAuth = () => go("auth", { next: "profile" });
    return (
      <div className="page">
        <div className="page-head">
          <button className="icon-btn" onClick={() => go("home")}><ArrowLeft size={19} /></button>
          <h1>Your Profile</h1>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
        <div className="profile-cta-wrap">
          <div className="profile-cta-card glass reveal">
            <div className="profile-cta-icon">
              <UserPlus size={42} strokeWidth={1.8} />
              <span className="profile-cta-spark"><Sparkles size={16} strokeWidth={2.2} /></span>
            </div>
            <h2 className="profile-cta-title">Create your BiteRush profile</h2>
            <p className="profile-cta-sub">Sign up to manage your orders, saved addresses, favorites, and faster checkout.</p>
            <div className="profile-cta-actions">
              <button className="cta" onClick={goAuth}><UserPlus size={18} /> Sign up</button>
              <button className="profile-cta-secondary" onClick={goAuth}><LogIn size={18} /> Log in</button>
            </div>
            <p className="profile-cta-note">
              Already have an account? <button className="profile-cta-link" onClick={goAuth}>Log in</button> to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const ROLE_META = {
    customer: { label: "Customer", Icon: User },
    owner: { label: "Restaurant Owner", Icon: Store },
    delivery_rider: { label: "Delivery Rider", Icon: Bike },
    admin: { label: "Admin", Icon: ShieldCheck },
  };
  const role = ROLE_META[formData.role] || ROLE_META.customer;
  const RoleIcon = role.Icon;

  if (loading)
    return (
      <div className="page">
        <div className="page-head">
          <button className="icon-btn" onClick={() => go("home")}><ArrowLeft size={19} /></button>
          <h1>Your Profile</h1>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
        <div className="loading">Loading your profile…</div>
      </div>
    );

  const initial = (formData.name || formData.email || "?").trim().charAt(0).toUpperCase();
  const avatarInner = formData.picture
    ? <img src={formData.picture} alt="Profile" />
    : (formData.name ? <span className="pa-fallback">{initial}</span> : <User size={46} strokeWidth={1.6} className="pa-fallback-icon" />);

  const hasLoc = formData.lat != null && formData.lng != null;
  const d = 0.004;
  const mapSrc = hasLoc
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${formData.lng - d}%2C${formData.lat - d}%2C${formData.lng + d}%2C${formData.lat + d}&layer=mapnik&marker=${formData.lat}%2C${formData.lng}`
    : null;

  const g = geom(zoom, offset);

  return (
    <div className="page">
      <div className="page-head">
        <button className="icon-btn" onClick={() => go("home")}><ArrowLeft size={19} /></button>
        <h1>Your Profile</h1>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>

      {/* Identity */}
      <div className="profile-view">
        {editing ? (
          <label className="profile-avatar" title="Upload & adjust photo">
            {avatarInner}
            <span className="profile-cam"><Camera size={16} /></span>
            <input type="file" accept="image/*" onChange={onPickFile} />
          </label>
        ) : (
          <div className="profile-avatar view">{avatarInner}</div>
        )}
        <div className="profile-name">{formData.name || "Your name"}</div>
        <div className="profile-email">{formData.email}</div>
        <span className="role-badge"><RoleIcon size={14} strokeWidth={2.2} /> {role.label}</span>
        {editing && <div className="profile-photo-hint">Tap the photo to upload &amp; adjust</div>}
        {saved && !editing && <div className="profile-saved"><Save size={14} /> Profile saved</div>}
      </div>

      {/* Quick actions */}
      <div className="profile-section">
        <h3>Quick actions</h3>
        <button className="glass profile-action" onClick={() => go("orders")}>
          <Receipt size={18} /><span>My orders</span><ChevronRight size={16} className="pa-arrow" />
        </button>
        <button className="glass profile-action" onClick={() => go("home")}>
          <ShoppingBag size={18} /><span>Browse menu</span><ChevronRight size={16} className="pa-arrow" />
        </button>
      </div>

      {/* Personal information */}
      <div className="profile-section">
        <h3>Personal information</h3>
        <div className="glass profile-card">
          <div className="field">
            <label>Full name</label>
            <input type="text" value={formData.name} disabled={!editing}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter your full name" />
          </div>
          <div className="field">
            <label>Email address <span className="field-note">(can't be changed)</span></label>
            <input type="email" value={formData.email} disabled />
          </div>
          <div className="field">
            <label>Phone number</label>
            <input type="tel" value={formData.phone} disabled={!editing}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="e.g. +1 555 0100" />
          </div>
          <div className="field">
            <label>Delivery address</label>
            <textarea value={formData.address} rows="3" disabled={!editing}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="House, street, area, city…" />
          </div>
          <div className="field">
            <label>Role <span className="field-note">(set by admin)</span></label>
            <input type="text" value={role.label} disabled />
          </div>
        </div>
      </div>

      {/* Delivery location + map */}
      <div className="profile-section">
        <h3>Delivery location</h3>
        <div className="glass profile-card" style={{ paddingBottom: 16 }}>
          {editing && (
            <button className="profile-cta-secondary" onClick={useLiveLocation} disabled={gettingLoc} style={{ marginBottom: hasLoc ? 14 : 0 }}>
              <LocateFixed size={18} /> {gettingLoc ? "Locating…" : "Use my live location"}
            </button>
          )}
          {hasLoc ? (
            <>
              <div className="profile-map">
                <iframe title="Your location" src={mapSrc} loading="lazy" />
              </div>
              <div className="profile-coords"><MapPin size={13} /> {formData.lat}, {formData.lng}</div>
            </>
          ) : (
            !editing && <p style={{ color: "var(--muted)", fontSize: 13 }}>No saved location yet. Tap <b>Edit profile</b> → <b>Use my live location</b>.</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="profile-btns">
        {err && <div className="err">{err}</div>}
        {!editing ? (
          <button className="cta" onClick={() => setEditing(true)}><Pencil size={18} /> Edit profile</button>
        ) : (
          <div className="two">
            <button className="cta" onClick={handleSave} disabled={saving}>
              <Save size={18} /> {saving ? "Saving…" : "Save"}
            </button>
            <button className="profile-cta-secondary" onClick={cancelEdit}>Cancel</button>
          </div>
        )}

        {formData.role !== "customer" && (
          <button className="profile-cta-secondary" onClick={() => go(
            formData.role === "owner" ? "owner-dashboard" :
            formData.role === "admin" ? "admin-dashboard" : "delivery-dashboard"
          )}>
            <LayoutDashboard size={18} /> Go to dashboard
          </button>
        )}

        <button className="profile-cta-secondary btn-danger" onClick={handleLogout}>
          <LogOut size={18} /> Sign out
        </button>
      </div>

      {/* Account info */}
      <div className="glass profile-info">
        <div className="row"><span>Account ID</span><b>#{String(profile?.id || "").slice(-8)}</b></div>
        <div className="row"><span>Member since</span><b>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}</b></div>
      </div>

      {/* Photo adjust modal */}
      {cropSrc && (
        <div className="crop-overlay" onClick={(e) => { if (e.target === e.currentTarget) setCropSrc(null); }}>
          <div className="crop-modal glass">
            <div className="crop-head">
              <h3>Adjust photo</h3>
              <button className="icon-btn" onClick={() => setCropSrc(null)}><X size={18} /></button>
            </div>
            <div
              className="crop-frame"
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerLeave={onDragEnd}
            >
              <img src={cropSrc} alt="" draggable="false"
                style={{ width: g.dw, height: g.dh, transform: `translate(${g.x}px, ${g.y}px)` }} />
              <div className="crop-ring" />
            </div>
            <div className="crop-zoom">
              <ZoomOut size={16} />
              <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => onZoom(parseFloat(e.target.value))} />
              <ZoomIn size={16} />
            </div>
            <div className="crop-actions">
              <button className="profile-cta-secondary" onClick={() => setCropSrc(null)}>Cancel</button>
              <button className="cta" onClick={applyCrop}>Apply photo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
