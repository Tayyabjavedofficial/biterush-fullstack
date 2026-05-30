const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const getToken = () => localStorage.getItem("biterush_token");

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  register: (b) => request("/auth/register", { method: "POST", body: b }),
  login: (b) => request("/auth/login", { method: "POST", body: b }),
  me: () => request("/auth/me", { auth: true }),
  categories: () => request("/categories"),
  foods: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request("/foods" + (q ? `?${q}` : ""));
  },
  food: (id) => request("/foods/" + id),
  createOrder: (b) => request("/orders", { method: "POST", body: b, auth: true }),
  orders: () => request("/orders", { auth: true }),
};
