import { Router } from "express";
import mongoose from "mongoose";
import { Order, Restaurant, User, Message } from "../models.js";
import { authRequired } from "../auth.js";

const router = Router();

// The two parties for an order's chat: the customer who placed it and the
// owner of the restaurant it belongs to.
async function participants(order) {
  const customerId = String(order.user_id);
  let ownerId = null;
  if (order.restaurant_id) {
    const r = await Restaurant.findById(order.restaurant_id);
    if (r?.owner_id) ownerId = String(r.owner_id);
  }
  return { customerId, ownerId };
}

// GET /api/messages/:orderId — peer public key + the encrypted thread.
// Only the customer and the restaurant owner may access it (not admins).
router.get("/:orderId", authRequired, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.orderId)) return res.status(404).json({ error: "Order not found" });
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const { customerId, ownerId } = await participants(order);
  const me = req.user.id;
  if (me !== customerId && me !== ownerId) return res.status(403).json({ error: "Not a participant in this chat" });
  if (!ownerId) return res.status(400).json({ error: "This order's restaurant doesn't support chat yet" });

  const peerId = me === customerId ? ownerId : customerId;
  const peer = await User.findById(peerId).select("name pubkey");
  const messages = await Message.find({ order_id: order._id }).sort({ created_at: 1 });
  res.json({
    peer: peer ? { id: peer.id, name: peer.name, pubkey: peer.pubkey || "" } : null,
    messages: messages.map((m) => m.toJSON()),
  });
});

// POST /api/messages/:orderId — store an already-encrypted message.
router.post("/:orderId", authRequired, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.orderId)) return res.status(404).json({ error: "Order not found" });
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const { customerId, ownerId } = await participants(order);
  const me = req.user.id;
  if (me !== customerId && me !== ownerId) return res.status(403).json({ error: "Not a participant in this chat" });

  const { type, ciphertext, iv, mime } = req.body || {};
  if (!ciphertext || !iv) return res.status(400).json({ error: "ciphertext and iv are required" });

  const sender = await User.findById(me).select("name");
  const msg = await Message.create({
    order_id: order._id,
    sender_id: me,
    sender_name: sender?.name || "",
    type: type === "voice" ? "voice" : "text",
    ciphertext,
    iv,
    mime: mime || "",
  });
  res.json(msg.toJSON());
});

export default router;
