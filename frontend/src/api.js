const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const getToken = () => localStorage.getItem("biterush_token");

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;

  const bypassToken = import.meta.env.VITE_VERCEL_BYPASS_TOKEN;
  if (bypassToken) {
    headers["x-vercel-protection-bypass"] = bypassToken;
  }

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

const qs = (params = {}) => {
  const q = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== "")
  ).toString();
  return q ? `?${q}` : "";
};

export const api = {
  // ---- auth ----
  register: (b) => request("/auth/register", { method: "POST", body: b }),
  login: (b) => request("/auth/login", { method: "POST", body: b }),
  me: () => request("/auth/me", { auth: true }),
  updateMe: (b) => request("/auth/me", { method: "PUT", body: b, auth: true }),
  changePassword: (b) => request("/auth/password", { method: "PUT", body: b, auth: true }),

  // ---- catalog ----
  categories: () => request("/categories"),
  createCategory: (b) => request("/categories", { method: "POST", body: b, auth: true }),
  deleteCategory: (id) => request("/categories/" + id, { method: "DELETE", auth: true }),
  foods: (params = {}) => request("/foods" + qs(params)),
  food: (id) => request("/foods/" + id),

  // ---- owner: food management ----
  createFood: (b) => request("/foods", { method: "POST", body: b, auth: true }),
  updateFood: (id, b) => request("/foods/" + id, { method: "PUT", body: b, auth: true }),
  deleteFood: (id) => request("/foods/" + id, { method: "DELETE", auth: true }),

  // ---- restaurants ----
  restaurants: () => request("/restaurants"),
  manageRestaurants: () => request("/restaurants/manage", { auth: true }),
  myRestaurant: () => request("/restaurants/mine", { auth: true }),
  restaurant: (id) => request("/restaurants/" + id),
  restaurantFoods: (id) => request("/restaurants/" + id + "/foods"),
  createRestaurant: (b) => request("/restaurants", { method: "POST", body: b, auth: true }),
  updateRestaurant: (id, b) => request("/restaurants/" + id, { method: "PUT", body: b, auth: true }),
  deleteRestaurant: (id) => request("/restaurants/" + id, { method: "DELETE", auth: true }),

  // ---- orders ----
  createOrder: (b) => request("/orders", { method: "POST", body: b, auth: true }),
  orders: () => request("/orders", { auth: true }),
  restaurantOrders: () => request("/orders/restaurant", { auth: true }),
  allOrders: () => request("/orders/all", { auth: true }),
  updateOrderStatus: (id, status) =>
    request("/orders/" + id + "/status", { method: "PUT", body: { status }, auth: true }),
  assignRider: (id, rider_id) =>
    request("/orders/" + id + "/assign", { method: "PUT", body: { rider_id }, auth: true }),

  // ---- deliveries (rider) ----
  assignedDeliveries: () => request("/deliveries/assigned", { auth: true }),
  riders: () => request("/deliveries/riders", { auth: true }),
  updateDeliveryStatus: (id, status) =>
    request("/deliveries/" + id + "/status", { method: "PUT", body: { status }, auth: true }),

  // ---- reviews ----
  reviews: (params = {}) => request("/reviews" + qs(params)),
  createReview: (b) => request("/reviews", { method: "POST", body: b, auth: true }),

  // ---- promo codes ----
  promos: () => request("/promos", { auth: true }),
  createPromo: (b) => request("/promos", { method: "POST", body: b, auth: true }),
  deletePromo: (id) => request("/promos/" + id, { method: "DELETE", auth: true }),
  validatePromo: (b) => request("/promos/validate", { method: "POST", body: b, auth: true }),

  // ---- cart persistence ----
  getCart: () => request("/cart", { auth: true }),
  saveCart: (items) => request("/cart", { method: "PUT", body: { items }, auth: true }),

  // ---- encrypted chat ----
  getMessages: (orderId) => request("/messages/" + orderId, { auth: true }),
  sendMessage: (orderId, body) => request("/messages/" + orderId, { method: "POST", body, auth: true }),

  // ---- admin ----
  adminStats: () => request("/admin/stats", { auth: true }),
  adminUsers: () => request("/admin/users", { auth: true }),
  updateUser: (id, b) => request("/admin/users/" + id, { method: "PUT", body: b, auth: true }),
  deleteUser: (id) => request("/admin/users/" + id, { method: "DELETE", auth: true }),
};
