import { Router } from "express";
import mongoose from "mongoose";
import { Delivery, Order, DELIVERY_STATUSES } from "../models.js";
import { authRequired, requireRole } from "../auth.js";

const router = Router();

// Attach a light order summary to each delivery for the rider UI.
async function withOrder(deliveries) {
  const out = [];
  for (const d of deliveries) {
    const order = await Order.findById(d.order_id);
    const j = d.toJSON();
    j.order = order
      ? { id: order.id, address: order.address, total: order.total, items: order.items, status: order.status }
      : null;
    out.push(j);
  }
  return out;
}

// GET /api/deliveries/assigned — rider sees their deliveries + the available pool
router.get("/assigned", authRequired, requireRole("delivery_rider", "admin"), async (req, res) => {
  const mine = await Delivery.find({
    $or: [{ delivery_boy_id: req.user.id }, { delivery_boy_id: null, status: "pending" }],
  }).sort({ created_at: -1 });
  res.json(await withOrder(mine));
});

// PUT /api/deliveries/:id/status — rider accepts / advances a delivery
router.put("/:id/status", authRequired, requireRole("delivery_rider", "admin"), async (req, res) => {
  const { status } = req.body || {};
  if (!DELIVERY_STATUSES.includes(status))
    return res.status(400).json({ error: "Invalid delivery status" });
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ error: "Delivery not found" });
  const delivery = await Delivery.findById(req.params.id);
  if (!delivery) return res.status(404).json({ error: "Delivery not found" });

  // Accepting a pending delivery assigns it to this rider.
  if (status === "accepted" && !delivery.delivery_boy_id) {
    delivery.delivery_boy_id = req.user.id;
  }
  if (
    req.user.role === "delivery_rider" &&
    delivery.delivery_boy_id &&
    String(delivery.delivery_boy_id) !== req.user.id
  ) {
    return res.status(403).json({ error: "Delivery assigned to another rider" });
  }

  delivery.status = status;
  await delivery.save();

  // Keep the parent order's status in sync (simulated tracking).
  const order = await Order.findById(delivery.order_id);
  if (order) {
    if (status === "delivered") order.status = "DELIVERED";
    else if (["picked_up", "on_the_way", "accepted"].includes(status)) order.status = "ON_THE_WAY";
    await order.save();
  }

  res.json(delivery.toJSON());
});

export default router;
