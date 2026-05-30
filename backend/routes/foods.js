import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const { category, q } = req.query;
  let sql = "SELECT * FROM foods";
  const where = [];
  const params = [];
  if (category && category !== "All") { where.push("category = ?"); params.push(category); }
  if (q) { where.push("(name LIKE ? OR restaurant LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }
  if (where.length) sql += " WHERE " + where.join(" AND ");
  res.json(db.all(sql, params));
});

router.get("/:id", (req, res) => {
  const food = db.get("SELECT * FROM foods WHERE id = ?", [req.params.id]);
  if (!food) return res.status(404).json({ error: "Food not found" });
  res.json(food);
});

export default router;
