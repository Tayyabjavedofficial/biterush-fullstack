import { useState, useEffect } from "react";
import { ArrowLeft, Camera, Save, LogOut, UserPlus, LogIn, Sparkles, LayoutDashboard, Receipt, ShoppingBag, ChevronRight } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { ThemeToggle } from "./components.jsx";

export function ProfileScreen({ go, theme, setTheme }) {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    role: "customer",
    picture: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!token || !user) {
          setLoading(false);
          return;
        }

        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await res.json();
        setProfile(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          role: data.role || "customer",
          picture: data.picture || "",
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, user]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setFormData((f) => ({ ...f, picture: event.target.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErr("");
    setSaved(false);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          picture: formData.picture,
        }),
      });

      if (res.ok) {
        setProfile(await res.json());
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
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

  const handleLogout = () => {
    logout();
    go("home");
  };

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
            <p className="profile-cta-sub">
              Sign up to manage your orders, saved addresses, favorites, and faster checkout.
            </p>

            <div className="profile-cta-actions">
              <button className="cta" onClick={goAuth}>
                <UserPlus size={18} /> Sign up
              </button>
              <button className="profile-cta-secondary" onClick={goAuth}>
                <LogIn size={18} /> Log in
              </button>
            </div>

            <p className="profile-cta-note">
              Already have an account?{" "}
              <button className="profile-cta-link" onClick={goAuth}>Log in</button> to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const ROLE_LABELS = {
    customer: "👤 Customer",
    owner: "🏪 Restaurant Owner",
    delivery_rider: "🚴 Delivery Rider",
    admin: "👨‍💼 Admin",
  };

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

  return (
    <div className="page">
      <div className="page-head">
        <button className="icon-btn" onClick={() => go("home")}><ArrowLeft size={19} /></button>
        <h1>Your Profile</h1>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>

      {/* Identity */}
      <div className="profile-view">
        <div className="profile-avatar">
          {formData.picture ? <img src={formData.picture} alt="Profile" /> : <span className="pa-fallback">{initial}</span>}
          <label className="profile-cam" title="Change photo">
            <Camera size={17} />
            <input type="file" accept="image/*" onChange={handleFileSelect} />
          </label>
        </div>
        <div className="profile-name">{formData.name || "Your name"}</div>
        <div className="profile-email">{formData.email}</div>
        <span className="role-badge">{ROLE_LABELS[formData.role] || "👤 Customer"}</span>
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

      {/* Personal information — always editable */}
      <div className="profile-section">
        <h3>Personal information</h3>
        <div className="glass profile-card">
          <div className="field">
            <label>Full name</label>
            <input type="text" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter your full name" />
          </div>
          <div className="field">
            <label>Email address <span className="field-note">(can't be changed)</span></label>
            <input type="email" value={formData.email} disabled />
          </div>
          <div className="field">
            <label>Phone number</label>
            <input type="tel" value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="e.g. +1 555 0100" />
          </div>
          <div className="field">
            <label>Delivery address</label>
            <textarea value={formData.address} rows="3"
              onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="House, street, area, city…" />
          </div>
          <div className="field">
            <label>Role <span className="field-note">(set by admin)</span></label>
            <input type="text" value={ROLE_LABELS[formData.role] || "👤 Customer"} disabled />
          </div>

          {err && <div className="err" style={{ margin: "2px 0 12px" }}>{err}</div>}
          <button className="cta" onClick={handleSave} disabled={saving} style={{ marginBottom: 6 }}>
            <Save size={18} /> {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="profile-btns">
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
    </div>
  );
}
