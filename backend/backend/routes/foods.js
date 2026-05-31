import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  try {
    const { category, q } = req.query;
    let sql = "SELECT * FROM foods";
    const where = [];
    const params = [];

    if (category && category !== "All") {
      where.push("category = ?");
      params.push(category);
    }
    if (q) {
      where.push("(name LIKE ? OR restaurant LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }
    if (where.length) sql += " WHERE " + where.join(" AND ");

    const foods = db.all(sql, params);
    res.json(foods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", (req, res) => {
  try {
    const food = db.get("SELECT * FROM foods WHERE id = ?", [req.params.id]);
    if (!food) return res.status(404).json({ error: "Food not found" });
    res.json(food);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
