import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { category, q } = req.query;
    let sql = "SELECT * FROM foods";
    const where = [];
    const params = [];
    let paramCount = 1;

    if (category && category !== "All") {
      where.push(`category = $${paramCount++}`);
      params.push(category);
    }
    if (q) {
      where.push(`(name ILIKE $${paramCount++} OR restaurant ILIKE $${paramCount++})`);
      params.push(`%${q}%`, `%${q}%`);
    }
    if (where.length) sql += " WHERE " + where.join(" AND ");

    const foods = await db.all(sql, params);
    res.json(foods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const food = await db.get("SELECT * FROM foods WHERE id = $1", [req.params.id]);
    if (!food) return res.status(404).json({ error: "Food not found" });
    res.json(food);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
