import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { signToken, authRequired } from "../auth.js";

const router = Router();

router.post("/register", (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ error: "name, email and password are required" });
    if (password.length < 4)
      return res.status(400).json({ error: "Password must be at least 4 characters" });

    const exists = db.get("SELECT id FROM users WHERE email = ?", [email]);
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const hash = bcrypt.hashSync(password, 10);
    const info = db.run(
      "INSERT INTO users (name, email, password, created_at) VALUES (?,?,?,?)",
      [name, email, hash, new Date().toISOString()]
    );

    const user = { id: info.lastInsertRowid, name, email };
    res.json({ token: signToken(user), user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body || {};
    const row = db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!row || !bcrypt.compareSync(password || "", row.password))
      return res.status(401).json({ error: "Invalid email or password" });

    const user = { id: row.id, name: row.name, email: row.email, role: row.role };
    res.json({ token: signToken(user), user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", authRequired, (req, res) => {
  try {
    const row = db.get("SELECT id, name, email, role FROM users WHERE id = ?", [req.user.id]);
    if (!row) return res.status(404).json({ error: "User not found" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
