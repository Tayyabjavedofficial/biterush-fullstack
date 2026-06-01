import { useState, useEffect } from "react";
import { ArrowLeft, Camera, Save, LogOut, UserPlus, LogIn, Sparkles, LayoutDashboard } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { ThemeToggle } from "./components.jsx";

export function ProfileScreen({ go, theme, setTheme }) {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    role: "customer",
    picture: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);

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
      reader.onload = (event) => {
        setFormData({ ...formData, picture: event.target.result });
        setSelectedFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
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
          role: formData.role,
          picture: formData.picture,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setEditing(false);
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Error saving profile");
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

  if (loading)
    return (
      <div className={`${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50"} w-full min-h-screen flex items-center justify-center`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-lg">Loading profile...</p>
        </div>
      </div>
    );

  return (
    <div className={`${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50"} w-full min-h-screen pb-24`}>
      {/* Header */}
      <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} sticky top-0 z-40 flex items-center justify-between p-4 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
        <button onClick={() => go("home")} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">My Profile</h1>
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition text-xl">
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>

      <div className="w-full px-4 py-6">
        {/* Profile Picture Section - Centered */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="relative">
            <div className={`w-40 h-40 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"} overflow-hidden border-4 border-orange-500 flex-shrink-0`}>
              {formData.picture ? (
                <img src={formData.picture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="text-7xl">👤</div>
              )}
            </div>
            {editing && (
              <label className="absolute bottom-0 right-0 bg-orange-500 text-white p-3 rounded-full cursor-pointer hover:bg-orange-600 transition shadow-lg">
                <Camera size={24} />
                <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </label>
            )}
          </div>
          <h2 className="text-3xl font-bold mt-6 text-center">{formData.name}</h2>
          <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"} text-lg mt-1 text-center`}>{formData.email}</p>
        </div>

        {/* Role Badge - Centered */}
        <div className="flex justify-center mb-8">
          <span className={`px-6 py-2 rounded-full text-white font-bold text-lg ${
            formData.role === "admin" ? "bg-red-500" :
            formData.role === "delivery_rider" ? "bg-blue-500" :
            "bg-green-500"
          }`}>
            {formData.role === "delivery_rider" ? "🚴 Delivery Rider" :
             formData.role === "admin" ? "👨‍💼 Admin" :
             "👤 Customer"}
          </span>
        </div>

        {/* Profile Form - Full Width but organized */}
        <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-xl p-6 mb-6 shadow-lg`}>
          <h3 className="text-xl font-bold mb-6">Personal Information</h3>

          <div className="grid grid-cols-1 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold mb-3">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!editing}
                className={`w-full p-4 rounded-lg border text-base ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-300"
                } ${editing ? "cursor-text" : "cursor-not-allowed opacity-60"} transition`}
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-semibold mb-3">Email Address</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className={`w-full p-4 rounded-lg border text-base ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-400"
                    : "bg-gray-100 border-gray-300 text-gray-500"
                } cursor-not-allowed`}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold mb-3">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!editing}
                placeholder="Enter phone number"
                className={`w-full p-4 rounded-lg border text-base ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                    : "bg-gray-50 border-gray-300 placeholder-gray-400"
                } ${editing ? "cursor-text" : "cursor-not-allowed opacity-60"} transition`}
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold mb-3">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!editing}
                placeholder="Enter your address"
                rows="4"
                className={`w-full p-4 rounded-lg border text-base ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                    : "bg-gray-50 border-gray-300 placeholder-gray-400"
                } ${editing ? "cursor-text" : "cursor-not-allowed opacity-60"} transition resize-none`}
              />
            </div>

            {/* Role (read-only — managed by admins) */}
            <div>
              <label className="block text-sm font-semibold mb-3">User Role</label>
              <select
                value={formData.role}
                disabled
                className={`w-full p-4 rounded-lg border text-base ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-400"
                    : "bg-gray-100 border-gray-300 text-gray-500"
                } cursor-not-allowed`}
              >
                <option value="customer">👤 Customer - Order food</option>
                <option value="owner">🏪 Restaurant Owner - Manage a menu</option>
                <option value="delivery_rider">🚴 Delivery Rider - Deliver orders</option>
                <option value="admin">👨‍💼 Admin - Manage platform</option>
              </select>
              <p className="text-xs mt-2 opacity-60">Your role is managed by an administrator.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2 text-lg"
            >
              ✏️ Edit Profile
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2 text-base"
              >
                <Save size={20} />
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    name: profile.name || "",
                    email: profile.email || "",
                    phone: profile.phone || "",
                    address: profile.address || "",
                    role: profile.role || "customer",
                    picture: profile.picture || "",
                  });
                }}
                className={`${theme === "dark" ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-300 hover:bg-gray-400"} text-black font-bold py-4 rounded-lg transition text-base`}
              >
                Cancel
              </button>
            </div>
          )}

          {formData.role !== "customer" && (
            <button
              onClick={() => go(
                formData.role === "owner" ? "owner-dashboard" :
                formData.role === "admin" ? "admin-dashboard" :
                "delivery-dashboard"
              )}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2 text-lg"
            >
              <LayoutDashboard size={20} />
              Go to Dashboard
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2 text-lg"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>

        {/* Account Info */}
        <div className={`${theme === "dark" ? "bg-gray-800" : "bg-gray-100"} rounded-lg p-6 mb-4`}>
          <h4 className="font-bold mb-4">Account Information</h4>
          <div className="space-y-3">
            <p className={`text-base ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              <strong>Account ID:</strong> #{profile?.id}
            </p>
            <p className={`text-base ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              <strong>Member since:</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
