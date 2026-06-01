import { Router } from "express";
import mongoose from "mongoose";
import { Order, Food, User, Delivery, PromoCode, ORDER_STATUSES } from "../models.js";
import { authRequired, requireRole } from "../auth.js";

const router = Router();

const round2 = (n) => Math.round(n * 100) / 100;

// POST /api/orders — customer places an order (optional promo_code)
router.post("/", authRequired, async (req, res) => {
  const { items, address, payment, promo_code } = req.body || {};
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: "Order must contain at least one item" });

  let subtotal = 0;
  const resolved = [];
  let restaurant_id = null;
  for (const it of items) {
    if (!mongoose.isValidObjectId(it.food_id))
      return res.status(400).json({ error: `Food ${it.food_id} not found` });
    const food = await Food.findById(it.food_id);
    if (!food) return res.status(400).json({ error: `Food ${it.food_id} not found` });
    const qty = Math.max(1, parseInt(it.qty) || 1);
    subtotal += food.price * qty;
    if (!restaurant_id && food.restaurant_id) restaurant_id = food.restaurant_id;
    resolved.push({ food_id: String(food._id), name: food.name, price: food.price, qty });
  }
  subtotal = round2(subtotal);

  // Promo code (optional)
  let discount = 0;
  let appliedCode = "";
  if (promo_code) {
    const promo = await PromoCode.findOne({ code: String(promo_code).toUpperCase(), active: true });
    if (promo && subtotal >= promo.min_order) {
      discount = promo.type === "percent" ? (subtotal * promo.value) / 100 : promo.value;
      discount = round2(Math.min(discount, subtotal));
      appliedCode = promo.code;
    }
  }

  const order = await Order.create({
    user_id: req.user.id,
    restaurant_id,
    items: resolved,
    subtotal,
    discount,
    promo_code: appliedCode,
    total: round2(subtotal - discount),
    address: address || "",
    payment: payment || "Cash on Delivery",
    status: "PLACED",
  });

  res.json(order.toJSON());
});

// GET /api/orders — current customer's orders
router.get("/", authRequired, async (req, res) => {
  const orders = await Order.find({ user_id: req.user.id }).sort({ created_at: -1 });
  res.json(orders.map((o) => o.toJSON()));
});

// GET /api/orders/restaurant — owner's restaurant orders
router.get("/restaurant", authRequired, requireRole("owner", "admin"), async (req, res) => {
  const owner = await User.findById(req.user.id);
  const filter = owner?.restaurant_id ? { restaurant_id: owner.restaurant_id } : {};
  const orders = await Order.find(filter).sort({ created_at: -1 });
  res.json(orders.map((o) => o.toJSON()));
});

// GET /api/orders/all — admin: every order
router.get("/all", authRequired, requireRole("admin"), async (_req, res) => {
  const orders = await Order.find().sort({ created_at: -1 });
  res.json(orders.map((o) => o.toJSON()));
});

// PUT /api/orders/:id/status — owner/admin advances order status
router.put("/:id/status", authRequired, requireRole("owner", "admin"), async (req, res) => {
  const { status } = req.body || {};
  if (!ORDER_STATUSES.includes(status))
    return res.status(400).json({ error: "Invalid status" });
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ error: "Order not found" });
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  order.status = status;
  await order.save();

  // Once a kitchen marks an order READY, create a pending delivery so riders
  // can pick it up. (Simulated tracking — no real GPS.)
  if (status === "READY") {
    const existing = await Delivery.findOne({ order_id: order._id });
    if (!existing) {
      await Delivery.create({ order_id: order._id, status: "pending", estimated_time: "30 min" });
    }
  }

  res.json(order.toJSON());
});

export default router;
