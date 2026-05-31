import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { signToken, authRequired } from "../auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ error: "name, email and password are required" });
    if (password.length < 4)
      return res.status(400).json({ error: "Password must be at least 4 characters" });

    const exists = await db.get("SELECT id FROM users WHERE email = $1", [email]);
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const hash = bcrypt.hashSync(password, 10);
    const info = await db.run(
      "INSERT INTO users (name, email, password, created_at) VALUES ($1, $2, $3, $4) RETURNING id",
      [name, email, hash, new Date().toISOString()]
    );

    const userId = info.lastInsertRowid || (await db.get("SELECT id FROM users WHERE email = $1", [email])).id;
    const user = { id: userId, name, email };
    res.json({ token: signToken(user), user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const row = await db.get("SELECT * FROM users WHERE email = $1", [email]);
    if (!row || !bcrypt.compareSync(password || "", row.password))
      return res.status(401).json({ error: "Invalid email or password" });

    const user = { id: row.id, name: row.name, email: row.email, role: row.role };
    res.json({ token: signToken(user), user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", authRequired, async (req, res) => {
  try {
    const row = await db.get("SELECT id, name, email, role FROM users WHERE id = $1", [req.user.id]);
    if (!row) return res.status(404).json({ error: "User not found" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
