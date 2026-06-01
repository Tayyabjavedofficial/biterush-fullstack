import { createContext, useContext, useState, useEffect, useRef } from "react";
import { api } from "../api.js";
import { useAuth } from "./AuthContext.jsx";

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]); // [{ food, qty }]
  const hydrated = useRef(false);

  // Load the persisted cart when a user signs in, merging anything added as a guest.
  useEffect(() => {
    let cancelled = false;
    async function loadServerCart() {
      if (!token || !user) {
        hydrated.current = false;
        return;
      }
      try {
        const { items: srv } = await api.getCart();
        if (cancelled) return;
        if (srv && srv.length) {
          const foods = await Promise.all(srv.map((it) => api.food(it.food_id).catch(() => null)));
          const restored = srv
            .map((it, i) => (foods[i] ? { food: foods[i], qty: it.qty } : null))
            .filter(Boolean);
          setItems((local) => {
            const map = new Map();
            restored.forEach(({ food, qty }) => map.set(food.id, { food, qty }));
            local.forEach(({ food, qty }) => map.set(food.id, { food, qty })); // guest items win
            return [...map.values()];
          });
        }
      } catch {
        /* offline / not signed in — keep local cart */
      }
      hydrated.current = true;
    }
    loadServerCart();
    return () => {
      cancelled = true;
    };
  }, [token, user]);

  // Persist cart changes to the server once hydrated.
  useEffect(() => {
    if (!token || !hydrated.current) return;
    api.saveCart(items.map((x) => ({ food_id: x.food.id, qty: x.qty }))).catch(() => {});
  }, [items, token]);

  function add(food, qty = 1) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.food.id === food.id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + qty };
        return copy;
      }
      return [...prev, { food, qty }];
    });
  }

  function setQty(id, qty) {
    setItems((prev) =>
      qty <= 0 ? prev.filter((x) => x.food.id !== id) : prev.map((x) => (x.food.id === id ? { ...x, qty } : x))
    );
  }

  function remove(id) {
    setItems((prev) => prev.filter((x) => x.food.id !== id));
  }

  function clear() {
    setItems([]);
  }

  const count = items.reduce((s, x) => s + x.qty, 0);
  const total = Math.round(items.reduce((s, x) => s + x.food.price * x.qty, 0) * 100) / 100;

  return (
    <CartCtx.Provider value={{ items, add, setQty, remove, clear, count, total }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
