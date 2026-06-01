import { Router } from "express";
import mongoose from "mongoose";
import { Category } from "../models.js";
import { authRequired, requireRole } from "../auth.js";

const router = Router();

// GET /api/categories — public
router.get("/", async (_req, res) => {
  const cats = await Category.find();
  res.json(cats.map((c) => c.toJSON()));
});

// POST /api/categories — admin
router.post("/", authRequired, requireRole("admin"), async (req, res) => {
  const { name, emoji } = req.body || {};
  if (!name) return res.status(400).json({ error: "name is required" });
  const cat = await Category.create({ name, emoji: emoji || "" });
  res.json(cat.toJSON());
});

// PUT /api/categories/:id — admin
router.put("/:id", authRequired, requireRole("admin"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ error: "Category not found" });
  const cat = await Category.findById(req.params.id);
  if (!cat) return res.status(404).json({ error: "Category not found" });
  if (req.body.name !== undefined) cat.name = req.body.name;
  if (req.body.emoji !== undefined) cat.emoji = req.body.emoji;
  await cat.save();
  res.json(cat.toJSON());
});

// DELETE /api/categories/:id — admin
router.delete("/:id", authRequired, requireRole("admin"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ error: "Category not found" });
  await Category.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
