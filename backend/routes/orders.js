import { Router } from "express";
import mongoose from "mongoose";
import { Order, Food, User, Delivery, PromoCode, ORDER_STATUSES } from "../models.js";
import { authRequired, requireRole } from "../auth.js";
import { processPayment, signRef } from "../payment.js";

const router = Router();

const round2 = (n) => Math.round(n * 100) / 100;
const DELIVERY_FEE = 2.99;

// POST /api/orders — customer places an order (optional promo_code + payment)
router.post("/", authRequired, async (req, res) => {
  const { items, address, payment, promo_code, payment_details, idempotency_key } = req.body || {};
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: "Order must contain at least one item" });

  // Idempotency: a repeated submit with the same key returns the original order
  // instead of charging/creating twice.
  const idem = idempotency_key || req.headers["idempotency-key"] || "";
  if (idem) {
    const existing = await Order.findOne({ user_id: req.user.id, idempotency_key: idem });
    if (existing) return res.json(existing.toJSON());
  }

  // Recompute the amount on the SERVER from the catalog — never trust client prices.
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

  // Promo code (optional) — re-validated server-side
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

  const total = round2(subtotal - discount + DELIVERY_FEE);
  const method = payment || "Cash on Delivery";

  // Process payment on the authoritative server amount.
  const pay = processPayment({ method, amount: total, details: payment_details || {} });
  if (!pay.ok) {
    return res.status(pay.status === "failed" ? 402 : 400).json({ error: pay.error || "Payment failed" });
  }

  const order = await Order.create({
    user_id: req.user.id,
    restaurant_id,
    items: resolved,
    subtotal,
    discount,
    promo_code: appliedCode,
    total,
    address: address || "",
    payment: method,
    payment_status: pay.status, // "paid" | "cod"
    payment_last4: pay.last4 || "",
    payment_wallet: pay.wallet || "",
    idempotency_key: idem,
    status: "PLACED",
  });

  // Tamper-evident reference signed from the persisted order facts.
  order.payment_ref = signRef([order.id, total, method, order.created_at.toISOString()]);
  await order.save();

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
