import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env.local") }); // local dev secrets (gitignored)
dotenv.config({ path: path.join(__dirname, ".env") }); // fallback. On Vercel, real env vars win.
import express from "express";
import cors from "cors";
import { connect } from "./db.js";
import authRoutes from "./routes/auth.js";
import foodRoutes from "./routes/foods.js";
import orderRoutes from "./routes/orders.js";
import categoryRoutes from "./routes/categories.js";
import restaurantRoutes from "./routes/restaurants.js";
import deliveryRoutes from "./routes/deliveries.js";
import reviewRoutes from "./routes/reviews.js";
import promoRoutes from "./routes/promos.js";
import cartRoutes from "./routes/cart.js";
import adminRoutes from "./routes/admin.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Ensure the MongoDB connection is ready before handling any request. The
// connection is cached, so this is a no-op on warm serverless invocations.
app.use(async (_req, res, next) => {
  try {
    await connect();
    next();
  } catch (err) {
    console.error("DB connection failed:", err.message);
    res.status(503).json({ error: "Database unavailable" });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "biterush-api" }));
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/promos", promoRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin", adminRoutes);

// Error fallback so unhandled async errors return JSON, not an HTML stack.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`BiteRush API running on http://localhost:${PORT}`));

export default app;
