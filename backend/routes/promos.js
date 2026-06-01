import { Router } from "express";
import mongoose from "mongoose";
import { PromoCode } from "../models.js";
import { authRequired, requireRole } from "../auth.js";

const router = Router();

const round2 = (n) => Math.round(n * 100) / 100;

// POST /api/promos/validate — checkout applies a code against a subtotal
router.post("/validate", authRequired, async (req, res) => {
  const { code, subtotal } = req.body || {};
  const sub = Number(subtotal) || 0;
  const promo = await PromoCode.findOne({ code: String(code || "").toUpperCase(), active: true });
  if (!promo) return res.status(404).json({ valid: false, error: "Invalid or expired code" });
  if (promo.expires_at && new Date() > promo.expires_at)
    return res.status(400).json({ valid: false, error: "This promo code has expired" });
  if (sub < promo.min_order)
    return res.status(400).json({ valid: false, error: `Minimum order $${promo.min_order} required` });
  let discount = promo.type === "percent" ? (sub * promo.value) / 100 : promo.value;
  discount = round2(Math.min(discount, sub));
  res.json({ valid: true, code: promo.code, type: promo.type, value: promo.value, discount });
});

// GET /api/promos — admin lists all codes
router.get("/", authRequired, requireRole("admin"), async (_req, res) => {
  const promos = await PromoCode.find().sort({ created_at: -1 });
  res.json(promos.map((p) => p.toJSON()));
});

// POST /api/promos — admin creates a code
router.post("/", authRequired, requireRole("admin"), async (req, res) => {
  const { code, type, value, min_order, expires_at } = req.body || {};
  if (!code || value == null) return res.status(400).json({ error: "code and value are required" });
  const exists = await PromoCode.findOne({ code: String(code).toUpperCase() });
  if (exists) return res.status(409).json({ error: "Code already exists" });
  const promo = await PromoCode.create({
    code: String(code).toUpperCase(),
    type: type === "flat" ? "flat" : "percent",
    value: Number(value),
    min_order: Number(min_order) || 0,
    expires_at: expires_at ? new Date(expires_at) : null,
  });
  res.json(promo.toJSON());
});

// DELETE /api/promos/:id — admin
router.delete("/:id", authRequired, requireRole("admin"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ error: "Promo not found" });
  await PromoCode.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
