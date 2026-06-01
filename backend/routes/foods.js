import { Router } from "express";
import mongoose from "mongoose";
import { Food, User } from "../models.js";
import { authRequired, requireRole } from "../auth.js";

const router = Router();

// GET /api/foods?category=&q=  — public listing with filters
router.get("/", async (req, res) => {
  const { category, q } = req.query;
  const filter = {};
  if (category && category !== "All") filter.category = category;
  if (q) filter.$or = [{ name: new RegExp(q, "i") }, { restaurant: new RegExp(q, "i") }];
  const foods = await Food.find(filter).sort({ created_at: -1 });
  res.json(foods.map((f) => f.toJSON()));
});

// GET /api/foods/:id — public detail
router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ error: "Food not found" });
  const food = await Food.findById(req.params.id);
  if (!food) return res.status(404).json({ error: "Food not found" });
  res.json(food.toJSON());
});

// POST /api/foods — owner/admin adds a food item to their restaurant
router.post("/", authRequired, requireRole("owner", "admin"), async (req, res) => {
  const owner = await User.findById(req.user.id);
  const b = req.body || {};
  if (!b.name || b.price == null)
    return res.status(400).json({ error: "name and price are required" });
  const food = await Food.create({
    name: b.name,
    category: b.category || "",
    price: Number(b.price),
    emoji: b.emoji || "🍽️",
    img: b.img || "",
    description: b.description || "",
    time: b.time || "20 min",
    distance: b.distance || "1.0 km",
    rating: b.rating || 4.5,
    kcal: b.kcal || 0,
    protein: b.protein || 0,
    fat: b.fat || 0,
    carbs: b.carbs || 0,
    restaurant: owner?.role === "owner" ? "" : b.restaurant || "",
    restaurant_id: owner?.restaurant_id || null,
    owner_id: owner?._id || null,
  });
  res.json(food.toJSON());
});

// PUT /api/foods/:id — owner can edit own foods, admin any
router.put("/:id", authRequired, requireRole("owner", "admin"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ error: "Food not found" });
  const food = await Food.findById(req.params.id);
  if (!food) return res.status(404).json({ error: "Food not found" });
  if (req.user.role === "owner" && String(food.owner_id) !== req.user.id)
    return res.status(403).json({ error: "Not your food item" });

  const editable = ["name", "category", "price", "emoji", "img", "description", "time", "distance", "rating", "kcal", "protein", "fat", "carbs"];
  for (const k of editable) if (req.body[k] !== undefined) food[k] = req.body[k];
  await food.save();
  res.json(food.toJSON());
});

// DELETE /api/foods/:id
router.delete("/:id", authRequired, requireRole("owner", "admin"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ error: "Food not found" });
  const food = await Food.findById(req.params.id);
  if (!food) return res.status(404).json({ error: "Food not found" });
  if (req.user.role === "owner" && String(food.owner_id) !== req.user.id)
    return res.status(403).json({ error: "Not your food item" });
  await food.deleteOne();
  res.json({ ok: true });
});

export default router;
