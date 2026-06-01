import { Router } from "express";
import mongoose from "mongoose";
import { User, Order, Restaurant, Food, ROLES } from "../models.js";
import { authRequired, requireRole } from "../auth.js";

const router = Router();

// Everything here is admin-only.
router.use(authRequired, requireRole("admin"));

// GET /api/admin/stats — dashboard summary
router.get("/stats", async (_req, res) => {
  const [totalOrders, totalUsers, totalRestaurants, totalFoods, orders] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments(),
    Restaurant.countDocuments(),
    Food.countDocuments(),
    Order.find().select("total status"),
  ]);
  const totalRevenue =
    Math.round(orders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.total, 0) * 100) / 100;
  res.json({ totalOrders, totalUsers, totalRestaurants, totalFoods, totalRevenue });
});

// GET /api/admin/users
router.get("/users", async (_req, res) => {
  const users = await User.find().select("-password").sort({ created_at: -1 });
  res.json(users.map((u) => u.toJSON()));
});

// PUT /api/admin/users/:id — change role / name
router.put("/users/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ error: "User not found" });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (req.body.role !== undefined) {
    if (!ROLES.includes(req.body.role)) return res.status(400).json({ error: "Invalid role" });
    user.role = req.body.role;
  }
  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.blocked !== undefined) {
    if (req.params.id === req.user.id) return res.status(400).json({ error: "You cannot block your own account" });
    user.blocked = !!req.body.blocked;
  }
  await user.save();
  const { password, ...rest } = user.toJSON();
  res.json(rest);
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ error: "User not found" });
  if (req.params.id === req.user.id)
    return res.status(400).json({ error: "You cannot delete your own account" });
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
