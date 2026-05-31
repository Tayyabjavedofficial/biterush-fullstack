import "dotenv/config";
import express from "express";
import cors from "cors";
import db from "./db.js";
import authRoutes from "./routes/auth.js";
import foodRoutes from "./routes/foods.js";
import orderRoutes from "./routes/orders.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, service: "biterush-api" }));
app.get("/api/categories", (req, res) => {
  try {
    const categories = db.all("SELECT * FROM categories");
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`BiteRush API running on http://localhost:${PORT}`));
