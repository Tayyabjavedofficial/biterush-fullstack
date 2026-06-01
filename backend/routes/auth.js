import { Router } from "express";
import bcrypt from "bcryptjs";
import { User, Restaurant, ROLES } from "../models.js";
import { signToken, authRequired } from "../auth.js";

const router = Router();

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password)
    return res.status(400).json({ error: "name, email and password are required" });
  if (password.length < 4)
    return res.status(400).json({ error: "Password must be at least 4 characters" });

  // Admin can NEVER be self-assigned at signup — only an existing admin may
  // promote a user to admin (via the admin Users tab). Prevents rogue admins.
  const SELF_SIGNUP_ROLES = ["customer", "owner", "delivery_rider"];
  const wantRole = SELF_SIGNUP_ROLES.includes(role) ? role : "customer";

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ error: "Email already registered" });

  const hash = bcrypt.hashSync(password, 10);
  const user = await User.create({ name, email, password: hash, role: wantRole });

  // Owners get a restaurant created automatically so they can manage a menu.
  if (wantRole === "owner") {
    const restaurant = await Restaurant.create({ name: `${name}'s Kitchen`, owner_id: user._id });
    user.restaurant_id = restaurant._id;
    await user.save();
  }

  res.json({ token: signToken(user), user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email: (email || "").toLowerCase() });
  if (!user || !bcrypt.compareSync(password || "", user.password))
    return res.status(401).json({ error: "Invalid email or password" });

  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get("/me", authRequired, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user.toJSON());
});

router.put("/me", authRequired, async (req, res) => {
  const { name, phone, address, picture, lat, lng, pubkey } = req.body || {};
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  // Role is intentionally NOT self-editable here; admins manage roles.
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  if (picture !== undefined) user.picture = picture;
  if (lat !== undefined) user.lat = lat === null ? null : Number(lat);
  if (lng !== undefined) user.lng = lng === null ? null : Number(lng);
  if (pubkey !== undefined) user.pubkey = pubkey; // E2E chat public key (JWK)
  await user.save();
  const { password, ...rest } = user.toJSON();
  res.json(rest);
});

export default router;
