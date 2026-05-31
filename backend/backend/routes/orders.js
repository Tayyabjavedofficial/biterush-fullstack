import { Router } from "express";
import db from "../db.js";
import { authRequired } from "../auth.js";

const router = Router();

function getOrder(id) {
  const order = db.get("SELECT * FROM orders WHERE id = ?", [id]);
  if (order) {
    order.items = db.all("SELECT * FROM order_items WHERE order_id = ?", [id]);
  }
  return order;
}

router.post("/", authRequired, (req, res) => {
  try {
    const { items, address, payment } = req.body || {};
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: "Order must contain at least one item" });

    let total = 0;
    const resolved = [];
    for (const it of items) {
      const food = db.get("SELECT * FROM foods WHERE id = ?", [it.food_id]);
      if (!food) return res.status(400).json({ error: `Food ${it.food_id} not found` });
      const qty = Math.max(1, parseInt(it.qty) || 1);
      total += food.price * qty;
      resolved.push({ food_id: food.id, name: food.name, price: food.price, qty });
    }
    total = Math.round(total * 100) / 100;

    const info = db.run(
      "INSERT INTO orders (user_id, total, address, payment, status, created_at) VALUES (?,?,?,?,?,?)",
      [req.user.id, total, address || "", payment || "Cash on Delivery", "PLACED", new Date().toISOString()]
    );

    for (const r of resolved) {
      db.run("INSERT INTO order_items (order_id, food_id, name, price, qty) VALUES (?,?,?,?,?)",
        [info.lastInsertRowid, r.food_id, r.name, r.price, r.qty]);
    }

    res.json(getOrder(info.lastInsertRowid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", authRequired, (req, res) => {
  try {
    const orders = db.all("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC", [req.user.id]);
    const enriched = orders.map((o) => ({
      ...o,
      items: db.all("SELECT * FROM order_items WHERE order_id = ?", [o.id])
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
