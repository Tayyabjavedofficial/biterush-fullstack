import { useState, useEffect } from "react";
import { ArrowLeft, Camera, Save, LogOut } from "lucide-react";
import { useAuth } from "./context/AuthContext";

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
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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

    if (token && user) fetchProfile();
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

  if (loading)
    return (
      <div className={`${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50"} min-h-screen flex items-center justify-center`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4">Loading profile...</p>
        </div>
      </div>
    );

  return (
    <div className={`${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50"} min-h-screen pb-20`}>
      {/* Header */}
      <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} sticky top-0 z-40 flex items-center justify-between p-4 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
        <button onClick={() => go("home")} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">My Profile</h1>
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition">
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Profile Picture Section */}
        <div className="text-center">
          <div className="relative inline-block">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"} overflow-hidden border-4 border-orange-500`}>
              {formData.picture ? (
                <img src={formData.picture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="text-6xl">👤</div>
              )}
            </div>
            {editing && (
              <label className="absolute bottom-0 right-0 bg-orange-500 text-white p-3 rounded-full cursor-pointer hover:bg-orange-600 transition">
                <Camera size={20} />
                <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </label>
            )}
          </div>
          <h2 className="text-2xl font-bold mt-4">{formData.name}</h2>
          <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>{formData.email}</p>
        </div>

        {/* Role Badge */}
        <div className="flex justify-center">
          <span className={`px-4 py-2 rounded-full text-white font-semibold ${
            formData.role === "admin" ? "bg-red-500" :
            formData.role === "delivery_rider" ? "bg-blue-500" :
            "bg-green-500"
          }`}>
            {formData.role === "delivery_rider" ? "🚴 Delivery Rider" :
             formData.role === "admin" ? "👨‍💼 Admin" :
             "👤 Customer"}
          </span>
        </div>

        {/* Profile Form */}
        <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg p-6 space-y-4`}>
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!editing}
              className={`w-full p-3 rounded-lg border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-gray-50 border-gray-300"
              } ${editing ? "cursor-text" : "cursor-not-allowed opacity-60"} transition`}
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-semibold mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className={`w-full p-3 rounded-lg border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-gray-400"
                  : "bg-gray-100 border-gray-300 text-gray-500"
              } cursor-not-allowed`}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!editing}
              placeholder="Enter phone number"
              className={`w-full p-3 rounded-lg border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-gray-50 border-gray-300"
              } ${editing ? "cursor-text" : "cursor-not-allowed opacity-60"} transition`}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold mb-2">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={!editing}
              placeholder="Enter your address"
              rows="3"
              className={`w-full p-3 rounded-lg border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-gray-50 border-gray-300"
              } ${editing ? "cursor-text" : "cursor-not-allowed opacity-60"} transition resize-none`}
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2">User Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              disabled={!editing}
              className={`w-full p-3 rounded-lg border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-gray-50 border-gray-300"
              } ${editing ? "cursor-pointer" : "cursor-not-allowed opacity-60"} transition`}
            >
              <option value="customer">👤 Customer</option>
              <option value="delivery_rider">🚴 Delivery Rider</option>
              <option value="admin">👨‍💼 Admin</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              ✏️ Edit Profile
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Save size={20} />
                {saving ? "Saving..." : "Save Changes"}
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
                className={`flex-1 ${theme === "dark" ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-300 hover:bg-gray-400"} font-semibold py-3 rounded-lg transition`}
              >
                Cancel
              </button>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>

        {/* Account Info */}
        <div className={`${theme === "dark" ? "bg-gray-800" : "bg-gray-100"} rounded-lg p-4`}>
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            <strong>Account ID:</strong> {profile?.id}
          </p>
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            <strong>Member since:</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
