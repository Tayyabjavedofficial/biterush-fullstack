import { Router } from "express";
import mongoose from "mongoose";
import { Order, Food, User, Delivery, PromoCode, ORDER_STATUSES } from "../models.js";
import { authRequired, requireRole } from "../auth.js";
import { processPayment, signRef } from "../payment.js";

const router = Router();

const round2 = (n) => Math.round(n * 100) / 100;
const DELIVERY_FEE = 2.99;

// POST /api/orders — ONLY customers can place orders (per role matrix)
router.post("/", authRequired, requireRole("customer"), async (req, res) => {
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
    const expired = promo?.expires_at && new Date() > promo.expires_at;
    if (promo && !expired && subtotal >= promo.min_order) {
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
    status: "PENDING",
    status_history: [{ status: "PENDING", at: new Date() }],
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
// (Accept = PENDING→PREPARING, Reject = →CANCELLED). Records status history.
router.put("/:id/status", authRequired, requireRole("owner", "admin"), async (req, res) => {
  const { status } = req.body || {};
  if (!ORDER_STATUSES.includes(status))
    return res.status(400).json({ error: "Invalid status" });
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ error: "Order not found" });
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (order.status !== status) {
    order.status = status;
    order.status_history.push({ status, at: new Date() });
  }
  await order.save();
  res.json(order.toJSON());
});

// PUT /api/orders/:id/assign — owner/admin assigns a rider to an accepted order
router.put("/:id/assign", authRequired, requireRole("owner", "admin"), async (req, res) => {
  const { rider_id } = req.body || {};
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ error: "Order not found" });
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (!mongoose.isValidObjectId(rider_id)) return res.status(400).json({ error: "Select a rider" });
  const rider = await User.findById(rider_id);
  if (!rider || rider.role !== "delivery_rider") return res.status(400).json({ error: "Not a valid rider" });

  order.rider_id = rider._id;
  await order.save();

  let delivery = await Delivery.findOne({ order_id: order._id });
  if (delivery) {
    delivery.delivery_boy_id = rider._id;
    if (delivery.status === "pending") delivery.status = "accepted";
  } else {
    delivery = new Delivery({ order_id: order._id, delivery_boy_id: rider._id, status: "accepted", estimated_time: "30 min" });
  }
  await delivery.save();

  res.json({ ...order.toJSON(), rider_name: rider.name });
});

export default router;
