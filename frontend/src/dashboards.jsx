import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, RefreshCw, MapPin, Package, MessageCircle } from "lucide-react";
import { ThemeToggle } from "./components.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { api } from "./api.js";
import { OrderChat } from "./OrderChat.jsx";

/* shared bits ------------------------------------------------------------- */
function DashHead({ title, go, theme, setTheme }) {
  return (
    <div className="page-head">
      <button className="icon-btn" onClick={() => go("home")}><ArrowLeft size={19} /></button>
      <h1>{title}</h1>
      <ThemeToggle theme={theme} setTheme={setTheme} />
    </div>
  );
}

function SignInGate({ title, emoji, msg, go, theme, setTheme }) {
  return (
    <div className="page">
      <DashHead title={title} go={go} theme={theme} setTheme={setTheme} />
      <div className="empty">
        <div className="big">{emoji}</div>
        <h3>Sign in required</h3>
        <p>{msg}</p>
        <button className="cta inline" onClick={() => go("auth", { next: "profile" })}>Sign in</button>
      </div>
    </div>
  );
}

const statCard = (label, value) => (
  <div className="glass" style={{ padding: 16, borderRadius: 16, textAlign: "center" }}>
    <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, fontFamily: "var(--font-display)" }}>{value}</div>
  </div>
);

const ORDER_LABELS = {
  PLACED: "Placed", PREPARING: "Preparing", READY: "Ready",
  ON_THE_WAY: "On the way", DELIVERED: "Delivered", CANCELLED: "Cancelled",
};
const statusPill = (label, active) => (
  <span style={{
    padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
    background: active ? "var(--primary)" : "var(--glass-2)",
    color: active ? "var(--btn-text)" : "var(--muted)",
    border: "1px solid var(--border-soft)",
  }}>{label}</span>
);

const SignOutRow = ({ logout, go }) => (
  <div style={{ marginTop: 22 }}>
    <button className="cta" style={{ width: "100%" }}
      onClick={() => { logout(); go("home"); }}>Sign Out</button>
  </div>
);

/* -------------------------------- Admin Dashboard -------------------------------- */
export function AdminDashboard({ go, theme, setTheme }) {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("orders");
  const [stats, setStats] = useState({ totalOrders: 0, totalUsers: 0, totalRevenue: 0, totalRestaurants: 0 });
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promos, setPromos] = useState([]);
  const [err, setErr] = useState("");
  const [newRest, setNewRest] = useState({ name: "", address: "", cuisine: "", image: "🍽️" });
  const [newCat, setNewCat] = useState({ name: "", emoji: "" });
  const [newPromo, setNewPromo] = useState({ code: "", type: "percent", value: "", min_order: "" });

  const load = async () => {
    try {
      const [s, o, u, r, c, p] = await Promise.all([
        api.adminStats(), api.allOrders(), api.adminUsers(), api.restaurants(), api.categories(), api.promos(),
      ]);
      setStats(s); setOrders(o); setUsers(u); setRestaurants(r); setCategories(c); setPromos(p);
    } catch (e) { setErr(e.message); }
  };
  useEffect(() => { if (user) load(); }, [user]);

  if (!user) return <SignInGate title="Admin Dashboard" emoji="🔐" msg="Only admins can access this dashboard." go={go} theme={theme} setTheme={setTheme} />;

  const setRole = async (id, role) => { try { await api.updateUser(id, { role }); load(); } catch (e) { setErr(e.message); } };
  const delUser = async (id) => { try { await api.deleteUser(id); load(); } catch (e) { setErr(e.message); } };
  const setOrderStatus = async (id, status) => { try { await api.updateOrderStatus(id, status); load(); } catch (e) { setErr(e.message); } };
  const addRest = async () => { if (!newRest.name) return; try { await api.createRestaurant(newRest); setNewRest({ name: "", address: "", cuisine: "", image: "🍽️" }); load(); } catch (e) { setErr(e.message); } };
  const delRest = async (id) => { try { await api.deleteRestaurant(id); load(); } catch (e) { setErr(e.message); } };
  const addPromo = async () => {
    if (!newPromo.code || newPromo.value === "") { setErr("Promo code and value are required"); return; }
    try { await api.createPromo({ ...newPromo, value: Number(newPromo.value), min_order: Number(newPromo.min_order) || 0 }); setNewPromo({ code: "", type: "percent", value: "", min_order: "" }); setErr(""); load(); }
    catch (e) { setErr(e.message); }
  };
  const delPromo = async (id) => { try { await api.deletePromo(id); load(); } catch (e) { setErr(e.message); } };

  const TABS = [["orders", "Orders"], ["users", "Users"], ["restaurants", "Restaurants"], ["categories", "Categories"], ["promos", "Promos"]];

  return (
    <div className="page">
      <DashHead title="Admin Dashboard" go={go} theme={theme} setTheme={setTheme} />
      {err && <div className="err" style={{ marginBottom: 14 }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        {statCard("Total Orders", stats.totalOrders)}
        {statCard("Total Users", stats.totalUsers)}
        {statCard("Revenue", `$${stats.totalRevenue}`)}
        {statCard("Restaurants", stats.totalRestaurants)}
      </div>

      <div className="seg" style={{ marginBottom: 18, overflowX: "auto" }}>
        {TABS.map(([id, label]) => (
          <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)} style={{ flex: "0 0 auto", padding: "10px 14px" }}>{label}</button>
        ))}
      </div>

      {tab === "orders" && (orders.length === 0
        ? <p style={{ color: "var(--muted)", fontSize: 13 }}>No orders yet.</p>
        : orders.map((o) => (
          <div key={o.id} className="glass" style={{ padding: 14, borderRadius: 16, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <strong>Order #{o.id.slice(-5)}</strong>
              <span style={{ fontWeight: 700 }}>${o.total}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>{o.items?.length || 0} item(s) · {o.payment}</div>
            <select className="dash-select" value={o.status} onChange={(e) => setOrderStatus(o.id, e.target.value)}>
              {Object.entries(ORDER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        )))}

      {tab === "users" && users.map((u) => (
        <div key={u.id} className="glass" style={{ padding: 14, borderRadius: 16, marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
          </div>
          <select className="dash-select" style={{ width: 140 }} value={u.role} onChange={(e) => setRole(u.id, e.target.value)}>
            <option value="customer">Customer</option>
            <option value="owner">Owner</option>
            <option value="delivery_rider">Rider</option>
            <option value="admin">Admin</option>
          </select>
          <button className="icon-btn" title="Delete" onClick={() => delUser(u.id)}><Trash2 size={16} /></button>
        </div>
      ))}

      {tab === "restaurants" && (
        <>
          <div className="glass" style={{ padding: 14, borderRadius: 16, marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input className="dash-input" value={newRest.image} onChange={(e) => setNewRest({ ...newRest, image: e.target.value })} placeholder="🍔" style={{ width: 60, textAlign: "center" }} />
              <input className="dash-input" value={newRest.name} onChange={(e) => setNewRest({ ...newRest, name: e.target.value })} placeholder="Restaurant name" style={{ flex: 1 }} />
            </div>
            <div className="field" style={{ marginBottom: 8 }}>
              <input value={newRest.cuisine} onChange={(e) => setNewRest({ ...newRest, cuisine: e.target.value })} placeholder="Cuisine (e.g. Italian, Pizza)" /></div>
            <div className="field" style={{ marginBottom: 10 }}>
              <input value={newRest.address} onChange={(e) => setNewRest({ ...newRest, address: e.target.value })} placeholder="Address / area" /></div>
            <button className="cta" onClick={addRest}><Plus size={16} /> Add restaurant</button>
          </div>
          {restaurants.map((r) => (
            <div key={r.id} className="glass" style={{ padding: 14, borderRadius: 16, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontWeight: 700 }}>{r.name}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>{r.address || "—"} · ⭐ {r.rating}</div></div>
              <button className="icon-btn" onClick={() => delRest(r.id)}><Trash2 size={16} /></button>
            </div>
          ))}
        </>
      )}

      {tab === "categories" && (
        <>
          <div className="glass" style={{ padding: 14, borderRadius: 16, marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input className="dash-input" value={newCat.emoji} onChange={(e) => setNewCat({ ...newCat, emoji: e.target.value })} placeholder="🍔" style={{ width: 64, textAlign: "center" }} />
              <input className="dash-input" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} placeholder="Category name" style={{ flex: 1 }} />
            </div>
            <button className="cta" onClick={async () => { if (!newCat.name) return; try { await api.createCategory(newCat); setNewCat({ name: "", emoji: "" }); load(); } catch (e) { setErr(e.message); } }}><Plus size={16} /> Add category</button>
          </div>
          {categories.map((c) => (
            <div key={c.id} className="glass" style={{ padding: 14, borderRadius: 16, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700 }}>{c.emoji} {c.name}</div>
              <button className="icon-btn" onClick={async () => { try { await api.deleteCategory(c.id); load(); } catch (e) { setErr(e.message); } }}><Trash2 size={16} /></button>
            </div>
          ))}
        </>
      )}

      {tab === "promos" && (
        <>
          <div className="glass" style={{ padding: 14, borderRadius: 16, marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input className="dash-input" value={newPromo.code} onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })} placeholder="CODE" style={{ flex: 1 }} />
              <select className="dash-select" value={newPromo.type} onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value })} style={{ width: 110 }}>
                <option value="percent">% off</option>
                <option value="flat">$ off</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input className="dash-input" type="number" value={newPromo.value} onChange={(e) => setNewPromo({ ...newPromo, value: e.target.value })} placeholder={newPromo.type === "percent" ? "10 (%)" : "5 ($)"} style={{ flex: 1 }} />
              <input className="dash-input" type="number" value={newPromo.min_order} onChange={(e) => setNewPromo({ ...newPromo, min_order: e.target.value })} placeholder="Min order $" style={{ flex: 1 }} />
            </div>
            <button className="cta" onClick={addPromo}><Plus size={16} /> Add promo code</button>
          </div>
          {promos.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>No promo codes yet.</p>}
          {promos.map((p) => (
            <div key={p.id} className="glass" style={{ padding: 14, borderRadius: 16, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800, fontFamily: "var(--font-display)" }}>{p.code}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {p.type === "percent" ? `${p.value}% off` : `$${p.value} off`}{p.min_order > 0 ? ` · min $${p.min_order}` : ""}
                </div>
              </div>
              <button className="icon-btn" onClick={() => delPromo(p.id)}><Trash2 size={16} /></button>
            </div>
          ))}
        </>
      )}

      <SignOutRow logout={logout} go={go} />
    </div>
  );
}

/* -------------------------------- Owner Dashboard -------------------------------- */
export function OwnerDashboard({ go, theme, setTheme }) {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [err, setErr] = useState("");
  const [chatOrder, setChatOrder] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", price: "", description: "", emoji: "🍔", img: "" });

  const load = async () => {
    try {
      const [o, allFoods, c] = await Promise.all([api.restaurantOrders(), api.foods(), api.categories()]);
      setOrders(o);
      setFoods(allFoods.filter((f) => String(f.owner_id) === String(user.id)));
      setCategories(c);
    } catch (e) { setErr(e.message); }
  };
  useEffect(() => { if (user) load(); }, [user]);

  if (!user) return <SignInGate title="Restaurant Dashboard" emoji="🏪" msg="Only restaurant owners can access this." go={go} theme={theme} setTheme={setTheme} />;

  const revenue = Math.round(orders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.total, 0) * 100) / 100;
  const next = { PLACED: "PREPARING", PREPARING: "READY" };
  const advance = async (o) => { const n = next[o.status]; if (!n) return; try { await api.updateOrderStatus(o.id, n); load(); } catch (e) { setErr(e.message); } };
  const addFood = async () => {
    if (!form.name || form.price === "") { setErr("Name and price are required"); return; }
    try { await api.createFood({ ...form, price: Number(form.price) }); setForm({ name: "", category: "", price: "", description: "", emoji: "🍔", img: "" }); setErr(""); load(); }
    catch (e) { setErr(e.message); }
  };
  const delFood = async (id) => { try { await api.deleteFood(id); load(); } catch (e) { setErr(e.message); } };

  return (
    <div className="page">
      <DashHead title="Restaurant Dashboard" go={go} theme={theme} setTheme={setTheme} />
      {err && <div className="err" style={{ marginBottom: 14 }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        {statCard("Orders", orders.length)}
        {statCard("Revenue", `$${revenue}`)}
      </div>

      <h3 style={{ marginBottom: 12 }}>Active Orders</h3>
      {orders.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>No orders yet.</p>}
      {orders.map((o) => (
        <div key={o.id} className="glass" style={{ padding: 14, borderRadius: 16, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <strong>Order #{o.id.slice(-5)}</strong>
            {statusPill(ORDER_LABELS[o.status], true)}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>{o.items?.length || 0} item(s) · ${o.total}</div>
          {next[o.status]
            ? <button className="cta" onClick={() => advance(o)}>{o.status === "PLACED" ? "Start preparing" : "Mark ready"}</button>
            : <span style={{ fontSize: 12, color: "var(--muted)" }}>{o.status === "READY" ? "Awaiting rider pickup" : ORDER_LABELS[o.status]}</span>}
          <button className="order-chat-btn" onClick={() => setChatOrder(o.id)}>
            <MessageCircle size={16} /> Chat with customer
          </button>
        </div>
      ))}

      <h3 style={{ margin: "22px 0 12px" }}>Add Food Item</h3>
      <div className="glass" style={{ padding: 16, borderRadius: 16, marginBottom: 18 }}>
        <div className="field" style={{ marginBottom: 10 }}><label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Double Cheeseburger" /></div>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="field" style={{ flex: 1, marginBottom: 10 }}><label>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.emoji} {c.name}</option>)}
            </select></div>
          <div className="field" style={{ width: 110, marginBottom: 10 }}><label>Price ($)</label>
            <input type="number" step="0.1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="9.99" /></div>
        </div>
        <div className="field" style={{ marginBottom: 10 }}><label>Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" /></div>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="field" style={{ width: 80, marginBottom: 12 }}><label>Emoji</label>
            <input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} style={{ textAlign: "center" }} /></div>
          <div className="field" style={{ flex: 1, marginBottom: 12 }}><label>Image URL (optional)</label>
            <input value={form.img} onChange={(e) => setForm({ ...form, img: e.target.value })} placeholder="https://…" /></div>
        </div>
        <button className="cta" onClick={addFood}><Plus size={16} /> Add to menu</button>
      </div>

      <h3 style={{ marginBottom: 12 }}>My Menu ({foods.length})</h3>
      {foods.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>No items yet — add your first dish above.</p>}
      {foods.map((f) => (
        <div key={f.id} className="glass" style={{ padding: 12, borderRadius: 16, marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 26 }}>{f.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{f.category || "—"} · ${f.price}</div>
          </div>
          <button className="icon-btn" onClick={() => delFood(f.id)}><Trash2 size={16} /></button>
        </div>
      ))}

      <SignOutRow logout={logout} go={go} />
      {chatOrder && <OrderChat orderId={chatOrder} onClose={() => setChatOrder(null)} />}
    </div>
  );
}

/* -------------------------------- Delivery Rider Dashboard -------------------------------- */
export function DeliveryBoyDashboard({ go, theme, setTheme }) {
  const { user, logout } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [err, setErr] = useState("");

  const load = async () => { try { setDeliveries(await api.assignedDeliveries()); } catch (e) { setErr(e.message); } };
  useEffect(() => { if (user) load(); }, [user]);

  if (!user) return <SignInGate title="Delivery Dashboard" emoji="🚚" msg="Only delivery partners can access this." go={go} theme={theme} setTheme={setTheme} />;

  const completed = deliveries.filter((d) => d.status === "delivered").length;
  const inProgress = deliveries.filter((d) => ["accepted", "picked_up", "on_the_way"].includes(d.status)).length;
  const available = deliveries.filter((d) => d.status === "pending").length;

  const NEXT = { pending: "accepted", accepted: "picked_up", picked_up: "on_the_way", on_the_way: "delivered" };
  const LABEL = { pending: "Available", accepted: "Accepted", picked_up: "Picked up", on_the_way: "On the way", delivered: "Delivered" };
  const BTN = { pending: "Accept", accepted: "Mark picked up", picked_up: "Start delivery", on_the_way: "Mark delivered" };
  const advance = async (d) => { const n = NEXT[d.status]; if (!n) return; try { await api.updateDeliveryStatus(d.id, n); load(); } catch (e) { setErr(e.message); } };

  return (
    <div className="page">
      <DashHead title="Delivery Dashboard" go={go} theme={theme} setTheme={setTheme} />
      {err && <div className="err" style={{ marginBottom: 14 }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
        {statCard("Completed", completed)}
        {statCard("In progress", inProgress)}
        {statCard("Available", available)}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3>Deliveries</h3>
        <button className="icon-btn" onClick={load} title="Refresh"><RefreshCw size={16} /></button>
      </div>
      {deliveries.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>No deliveries available right now.</p>}
      {deliveries.map((d) => (
        <div key={d.id} className="glass" style={{ padding: 14, borderRadius: 16, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong><Package size={14} style={{ verticalAlign: "-2px" }} /> Order #{d.order?.id?.slice(-5) || "—"}</strong>
            {statusPill(LABEL[d.status], d.status !== "pending")}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <MapPin size={13} /> {d.order?.address || "No address"}
          </div>
          <div style={{ fontSize: 12, marginBottom: 10 }}>${d.order?.total ?? "—"} · ETA {d.estimated_time || "—"}</div>
          {NEXT[d.status]
            ? <button className="cta" onClick={() => advance(d)}>{BTN[d.status]}</button>
            : <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700 }}>✓ Delivered</span>}
        </div>
      ))}

      <SignOutRow logout={logout} go={go} />
    </div>
  );
}
