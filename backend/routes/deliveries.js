import { Router } from "express";
import mongoose from "mongoose";
import { Delivery, Order, Restaurant, User, DELIVERY_STATUSES } from "../models.js";
import { authRequired, requireRole } from "../auth.js";

const router = Router();

// Attach order + pickup-restaurant info to each delivery for the rider UI.
async function withOrder(deliveries) {
  const out = [];
  for (const d of deliveries) {
    const order = await Order.findById(d.order_id);
    const restaurant = order?.restaurant_id ? await Restaurant.findById(order.restaurant_id) : null;
    const j = d.toJSON();
    j.order = order
      ? { id: order.id, address: order.address, total: order.total, items: order.items, status: order.status }
      : null;
    j.pickup = restaurant ? { name: restaurant.name, address: restaurant.address } : null;
    out.push(j);
  }
  return out;
}

// GET /api/deliveries/riders — owner/admin: list of riders to assign
router.get("/riders", authRequired, requireRole("owner", "admin"), async (_req, res) => {
  const riders = await User.find({ role: "delivery_rider", blocked: { $ne: true } }).select("name email");
  res.json(riders.map((r) => ({ id: r.id, name: r.name, email: r.email })));
});

// GET /api/deliveries/assigned — rider sees ONLY orders assigned to them (FR-RID-001)
router.get("/assigned", authRequired, requireRole("delivery_rider", "admin"), async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { delivery_boy_id: req.user.id };
  const mine = await Delivery.find(filter).sort({ created_at: -1 });
  res.json(await withOrder(mine));
});

// PUT /api/deliveries/:id/status — rider advances picked_up / on_the_way / delivered
router.put("/:id/status", authRequired, requireRole("delivery_rider", "admin"), async (req, res) => {
  const { status } = req.body || {};
  if (!DELIVERY_STATUSES.includes(status))
    return res.status(400).json({ error: "Invalid delivery status" });
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ error: "Delivery not found" });
  const delivery = await Delivery.findById(req.params.id);
  if (!delivery) return res.status(404).json({ error: "Delivery not found" });

  if (
    req.user.role === "delivery_rider" &&
    delivery.delivery_boy_id &&
    String(delivery.delivery_boy_id) !== req.user.id
  ) {
    return res.status(403).json({ error: "Delivery assigned to another rider" });
  }

  delivery.status = status;
  await delivery.save();

  // Keep the parent order's status + history in sync (simulated tracking).
  const order = await Order.findById(delivery.order_id);
  if (order) {
    const next = status === "delivered" ? "DELIVERED"
      : ["picked_up", "on_the_way"].includes(status) ? "ON_THE_WAY" : null;
    if (next && order.status !== next) {
      order.status = next;
      order.status_history.push({ status: next, at: new Date() });
      await order.save();
    }
  }

  res.json(delivery.toJSON());
});

export default router;
