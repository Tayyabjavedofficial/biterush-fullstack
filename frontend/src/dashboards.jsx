import React, { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, Users, DollarSign, Store, Truck, Clock, MapPin, CheckCircle } from "lucide-react";
import { ThemeToggle } from "./components.jsx";
import { useAuth } from "./context/AuthContext.jsx";

/* -------------------------------- Admin Dashboard -------------------------------- */
export function AdminDashboard({ go, theme, setTheme }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ totalOrders: 0, totalUsers: 0, totalRevenue: 0, totalRestaurants: 0 });
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;
    setStats({
      totalOrders: 156,
      totalUsers: 1200,
      totalRevenue: 24580,
      totalRestaurants: 45,
    });
    setOrders([
      { id: 1, user: "John Doe", total: 45.99, status: "Delivered", date: "2025-05-30" },
      { id: 2, user: "Jane Smith", total: 32.50, status: "Processing", date: "2025-05-31" },
      { id: 3, user: "Mike Wilson", total: 58.75, status: "Out for Delivery", date: "2025-05-31" },
    ]);
  }, [user]);

  if (!user) {
    return (
      <div className="page">
        <div className="page-head"><h1>Admin Dashboard</h1><ThemeToggle theme={theme} setTheme={setTheme} /></div>
        <div className="empty"><div className="big">🔐</div><h3>Sign in required</h3><p>Only admins can access this dashboard.</p><button className="cta inline" onClick={() => go("auth")}>Sign in</button></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head"><h1>Admin Dashboard</h1><ThemeToggle theme={theme} setTheme={setTheme} /></div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div className="glass" style={{ padding: 16, borderRadius: 12, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Total Orders</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{stats.totalOrders}</div>
        </div>
        <div className="glass" style={{ padding: 16, borderRadius: 12, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Total Users</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{stats.totalUsers}</div>
        </div>
        <div className="glass" style={{ padding: 16, borderRadius: 12, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💰</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Total Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>${stats.totalRevenue}</div>
        </div>
        <div className="glass" style={{ padding: 16, borderRadius: 12, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏪</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Restaurants</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{stats.totalRestaurants}</div>
        </div>
      </div>

      <h3 style={{ marginBottom: 12 }}>Recent Orders</h3>
      {orders.map(order => (
        <div key={order.id} className="glass" style={{ padding: 12, borderRadius: 12, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700 }}>Order #{order.id}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{order.user}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700 }}>${order.total}</div>
            <div style={{ fontSize: 12, color: order.status === "Delivered" ? "var(--primary)" : "var(--muted)" }}>{order.status}</div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 20 }}>
        <button className="cta" style={{ width: "100%", marginBottom: 10 }} onClick={() => go("home")}>Back to Home</button>
        <button className="cta" style={{ width: "100%", background: "var(--glass)" }} onClick={() => { logout(); go("home"); }}>Sign Out</button>
      </div>
    </div>
  );
}

/* -------------------------------- Owner Dashboard -------------------------------- */
export function OwnerDashboard({ go, theme, setTheme }) {
  const { user, logout } = useAuth();
  const [restaurant, setRestaurant] = useState({ name: "My Restaurant", orders: 0, revenue: 0 });
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;
    setRestaurant({ name: "Burger Flame", orders: 45, revenue: 2850 });
    setOrders([
      { id: 1, customer: "John", items: 3, total: 45.99, status: "Ready" },
      { id: 2, customer: "Jane", items: 2, total: 32.50, status: "Preparing" },
    ]);
  }, [user]);

  if (!user) {
    return (
      <div className="page">
        <div className="page-head"><h1>Restaurant Dashboard</h1><ThemeToggle theme={theme} setTheme={setTheme} /></div>
        <div className="empty"><div className="big">🏪</div><h3>Sign in required</h3><p>Only restaurant owners can access this.</p><button className="cta inline" onClick={() => go("auth")}>Sign in</button></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head"><h1>{restaurant.name}</h1><ThemeToggle theme={theme} setTheme={setTheme} /></div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div className="glass" style={{ padding: 16, borderRadius: 12, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Today's Orders</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{restaurant.orders}</div>
        </div>
        <div className="glass" style={{ padding: 16, borderRadius: 12, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Revenue</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>${restaurant.revenue}</div>
        </div>
      </div>

      <h3 style={{ marginBottom: 12 }}>Active Orders</h3>
      {orders.map(order => (
        <div key={order.id} className="glass" style={{ padding: 12, borderRadius: 12, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div><strong>Order #{order.id}</strong> - {order.customer}</div>
            <span style={{ padding: "4px 8px", borderRadius: 6, background: order.status === "Ready" ? "var(--primary)" : "var(--accent-ink)", fontSize: 11, color: "white" }}>{order.status}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{order.items} items · ${order.total}</div>
        </div>
      ))}

      <div style={{ marginTop: 20 }}>
        <button className="cta" style={{ width: "100%", marginBottom: 10 }} onClick={() => go("home")}>Back to Home</button>
        <button className="cta" style={{ width: "100%", background: "var(--glass)" }} onClick={() => { logout(); go("home"); }}>Sign Out</button>
      </div>
    </div>
  );
}

/* -------------------------------- Delivery Boy Dashboard -------------------------------- */
export function DeliveryBoyDashboard({ go, theme, setTheme }) {
  const { user, logout } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState({ completed: 0, inProgress: 0, available: 0 });

  useEffect(() => {
    if (!user) return;
    setStats({ completed: 12, inProgress: 2, available: 8 });
    setDeliveries([
      { id: 1, customer: "John Doe", address: "123 Main St", status: "Delivering", distance: "2.1 km", eta: "10 min" },
      { id: 2, customer: "Jane Smith", address: "456 Oak Ave", status: "Pickup", distance: "0.5 km", eta: "5 min" },
      { id: 3, customer: "Mike Wilson", address: "789 Pine Rd", status: "Available", distance: "-", eta: "-" },
    ]);
  }, [user]);

  if (!user) {
    return (
      <div className="page">
        <div className="page-head"><h1>Delivery Dashboard</h1><ThemeToggle theme={theme} setTheme={setTheme} /></div>
        <div className="empty"><div className="big">🚚</div><h3>Sign in required</h3><p>Only delivery partners can access this.</p><button className="cta inline" onClick={() => go("auth")}>Sign in</button></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head"><h1>Delivery Dashboard</h1><ThemeToggle theme={theme} setTheme={setTheme} /></div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        <div className="glass" style={{ padding: 12, borderRadius: 12, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Completed</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{stats.completed}</div>
        </div>
        <div className="glass" style={{ padding: 12, borderRadius: 12, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>In Progress</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{stats.inProgress}</div>
        </div>
        <div className="glass" style={{ padding: 12, borderRadius: 12, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Available</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{stats.available}</div>
        </div>
      </div>

      <h3 style={{ marginBottom: 12 }}>Deliveries</h3>
      {deliveries.map(delivery => (
        <div key={delivery.id} className="glass" style={{ padding: 12, borderRadius: 12, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div><strong>{delivery.customer}</strong></div>
            <span style={{ padding: "4px 8px", borderRadius: 6, background: delivery.status === "Delivering" ? "var(--primary)" : delivery.status === "Pickup" ? "var(--accent-ink)" : "var(--glass-2)", fontSize: 11 }}>{delivery.status}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>📍 {delivery.address}</div>
          <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
            <span>🛣️ {delivery.distance}</span>
            <span>⏱️ {delivery.eta}</span>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 20 }}>
        <button className="cta" style={{ width: "100%", marginBottom: 10 }} onClick={() => go("home")}>Back to Home</button>
        <button className="cta" style={{ width: "100%", background: "var(--glass)" }} onClick={() => { logout(); go("home"); }}>Sign Out</button>
      </div>
    </div>
  );
}
