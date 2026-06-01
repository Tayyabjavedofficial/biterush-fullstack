import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "biterush_dev_secret_change_me";

export function signToken(user) {
  return jwt.sign(
    { id: String(user.id || user._id), email: user.email, role: user.role || "customer" },
    SECRET,
    { expiresIn: "7d" }
  );
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Role gate — use after authRequired, e.g. requireRole("owner", "admin").
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    next();
  };
}
