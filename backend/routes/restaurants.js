import { Router } from "express";
import mongoose from "mongoose";
import { Restaurant, Food } from "../models.js";
import { authRequired, requireRole } from "../auth.js";

const router = Router();

// GET /api/restaurants — public list (only approved restaurants are live)
router.get("/", async (_req, res) => {
  const list = await Restaurant.find({ approved: true }).sort({ created_at: -1 });
  res.json(list.map((r) => r.toJSON()));
});

// GET /api/restaurants/mine — the owner's restaurant (any approval state)
router.get("/mine", authRequired, requireRole("owner", "admin"), async (req, res) => {
  const r = await Restaurant.findOne({ owner_id: req.user.id });
  res.json(r ? r.toJSON() : null);
});

// GET /api/restaurants/manage — admin: every restaurant incl. pending
router.get("/manage", authRequired, requireRole("admin"), async (_req, res) => {
  const list = await Restaurant.find().sort({ approved: 1, created_at: -1 });
  res.json(list.map((r) => r.toJSON()));
});

// GET /api/restaurants/:id — public detail
router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ error: "Restaurant not found" });
  const r = await Restaurant.findById(req.params.id);
  if (!r) return res.status(404).json({ error: "Restaurant not found" });
  res.json(r.toJSON());
});

// GET /api/restaurants/:id/foods — public menu for a restaurant
router.get("/:id/foods", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ error: "Restaurant not found" });
  const foods = await Food.find({ restaurant_id: req.params.id }).sort({ created_at: -1 });
  res.json(foods.map((f) => f.toJSON()));
});

// POST /api/restaurants — admin
router.post("/", authRequired, requireRole("admin"), async (req, res) => {
  const { name, address, phone, owner_id, cuisine, image } = req.body || {};
  if (!name) return res.status(400).json({ error: "name is required" });
  // Admin-created restaurants are approved immediately.
  const r = await Restaurant.create({ name, address: address || "", phone: phone || "", cuisine: cuisine || "", image: image || "🍽️", owner_id: owner_id || null, approved: true });
  res.json(r.toJSON());
});

// PUT /api/restaurants/:id — admin or owning owner
router.put("/:id", authRequired, requireRole("admin", "owner"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ error: "Restaurant not found" });
  const r = await Restaurant.findById(req.params.id);
  if (!r) return res.status(404).json({ error: "Restaurant not found" });
  if (req.user.role === "owner" && String(r.owner_id) !== req.user.id)
    return res.status(403).json({ error: "Not your restaurant" });
  for (const k of ["name", "address", "phone", "rating", "cuisine", "image"])
    if (req.body[k] !== undefined) r[k] = req.body[k];
  // Only admins may approve/unapprove a restaurant.
  if (req.body.approved !== undefined && req.user.role === "admin") r.approved = !!req.body.approved;
  await r.save();
  res.json(r.toJSON());
});

// DELETE /api/restaurants/:id — admin
router.delete("/:id", authRequired, requireRole("admin"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ error: "Restaurant not found" });
  await Restaurant.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
