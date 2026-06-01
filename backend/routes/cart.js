import { Router } from "express";
import { Cart } from "../models.js";
import { authRequired } from "../auth.js";

const router = Router();

// GET /api/cart — current user's persisted cart
router.get("/", authRequired, async (req, res) => {
  const cart = await Cart.findOne({ user_id: req.user.id });
  res.json({ items: cart ? cart.items : [] });
});

// PUT /api/cart — replace the user's cart with the given items
router.put("/", authRequired, async (req, res) => {
  const items = Array.isArray(req.body?.items)
    ? req.body.items
        .filter((it) => it && it.food_id)
        .map((it) => ({ food_id: String(it.food_id), qty: Math.max(1, parseInt(it.qty) || 1) }))
    : [];
  const cart = await Cart.findOneAndUpdate(
    { user_id: req.user.id },
    { items, updated_at: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ items: cart.items });
});

export default router;
