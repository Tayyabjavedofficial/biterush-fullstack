import { createContext, useContext, useState } from "react";

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{ food, qty }]

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
