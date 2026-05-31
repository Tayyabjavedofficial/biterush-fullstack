import { Router } from "express";
import db from "../db.js";
import { authRequired } from "../auth.js";

const router = Router();

async function getOrder(id) {
  const order = await db.get("SELECT * FROM orders WHERE id = $1", [id]);
  if (order) {
    order.items = await db.all("SELECT * FROM order_items WHERE order_id = $1", [id]);
  }
  return order;
}

router.post("/", authRequired, async (req, res) => {
  try {
    const { items, address, payment } = req.body || {};
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: "Order must contain at least one item" });

    let total = 0;
    const resolved = [];
    for (const it of items) {
      const food = await db.get("SELECT * FROM foods WHERE id = $1", [it.food_id]);
      if (!food) return res.status(400).json({ error: `Food ${it.food_id} not found` });
      const qty = Math.max(1, parseInt(it.qty) || 1);
      total += food.price * qty;
      resolved.push({ food_id: food.id, name: food.name, price: food.price, qty });
    }
    total = Math.round(total * 100) / 100;

    const info = await db.run(
      "INSERT INTO orders (user_id, total, address, payment, status, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [req.user.id, total, address || "", payment || "Cash on Delivery", "PLACED", new Date().toISOString()]
    );
    const oid = info.lastInsertRowid || (await db.get("SELECT id FROM orders WHERE user_id = $1 ORDER BY id DESC LIMIT 1", [req.user.id])).id;

    for (const r of resolved) {
      await db.run("INSERT INTO order_items (order_id, food_id, name, price, qty) VALUES ($1, $2, $3, $4, $5)",
        [oid, r.food_id, r.name, r.price, r.qty]);
    }

    res.json(await getOrder(oid));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", authRequired, async (req, res) => {
  try {
    const orders = await db.all("SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC", [req.user.id]);
    const enriched = await Promise.all(
      orders.map(async (o) => ({
        ...o,
        items: await db.all("SELECT * FROM order_items WHERE order_id = $1", [o.id])
      }))
    );
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
