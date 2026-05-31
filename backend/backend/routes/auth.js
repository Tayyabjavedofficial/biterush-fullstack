import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { signToken, authRequired } from "../auth.js";

const router = Router();

router.post("/register", (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ error: "name, email and password are required" });
    if (password.length < 4)
      return res.status(400).json({ error: "Password must be at least 4 characters" });

    const validRoles = ["customer", "delivery_rider", "admin"];
    const userRole = role && validRoles.includes(role) ? role : "customer";

    const exists = db.get("SELECT id FROM users WHERE email = ?", [email]);
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const hash = bcrypt.hashSync(password, 10);
    const info = db.run(
      "INSERT INTO users (name, email, password, role, created_at) VALUES (?,?,?,?,?)",
      [name, email, hash, userRole, new Date().toISOString()]
    );

    const user = { id: info.lastInsertRowid, name, email, role: userRole };
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
    const row = db.get("SELECT id, name, email, role, phone, address, picture FROM users WHERE id = ?", [req.user.id]);
    if (!row) return res.status(404).json({ error: "User not found" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/me", authRequired, (req, res) => {
  try {
    const { name, phone, address, picture, role } = req.body || {};
    const validRoles = ["customer", "delivery_rider", "admin"];
    const updates = [];
    const params = [];

    if (name) {
      updates.push("name = ?");
      params.push(name);
    }
    if (phone) {
      updates.push("phone = ?");
      params.push(phone);
    }
    if (address) {
      updates.push("address = ?");
      params.push(address);
    }
    if (picture) {
      updates.push("picture = ?");
      params.push(picture);
    }
    if (role && validRoles.includes(role)) {
      updates.push("role = ?");
      params.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(req.user.id);
    const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
    db.run(sql, params);

    const updated = db.get("SELECT id, name, email, role, phone, address, picture FROM users WHERE id = ?", [req.user.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
