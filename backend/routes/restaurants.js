import { Router } from "express";
import mongoose from "mongoose";
import { Restaurant, Food } from "../models.js";
import { authRequired, requireRole } from "../auth.js";

const router = Router();

// GET /api/restaurants — public list
router.get("/", async (_req, res) => {
  const list = await Restaurant.find().sort({ created_at: -1 });
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
  const { name, address, phone, owner_id } = req.body || {};
  if (!name) return res.status(400).json({ error: "name is required" });
  const r = await Restaurant.create({ name, address: address || "", phone: phone || "", owner_id: owner_id || null });
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
  for (const k of ["name", "address", "phone", "rating"])
    if (req.body[k] !== undefined) r[k] = req.body[k];
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
