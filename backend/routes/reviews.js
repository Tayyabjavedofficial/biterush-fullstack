import { Router } from "express";
import mongoose from "mongoose";
import { Review, Food, Restaurant, User, Order } from "../models.js";
import { authRequired } from "../auth.js";

const router = Router();

const round1 = (n) => Math.round(n * 10) / 10;

// Recompute the average rating for a food or restaurant after a new review.
async function recompute({ food_id, restaurant_id }) {
  if (food_id) {
    const reviews = await Review.find({ food_id });
    if (reviews.length) {
      const avg = round1(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length);
      await Food.findByIdAndUpdate(food_id, { rating: avg });
    }
  }
  if (restaurant_id) {
    const reviews = await Review.find({ restaurant_id });
    if (reviews.length) {
      const avg = round1(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length);
      await Restaurant.findByIdAndUpdate(restaurant_id, { rating: avg });
    }
  }
}

// GET /api/reviews?food=<id>&restaurant=<id>
router.get("/", async (req, res) => {
  const filter = {};
  if (req.query.food && mongoose.isValidObjectId(req.query.food)) filter.food_id = req.query.food;
  if (req.query.restaurant && mongoose.isValidObjectId(req.query.restaurant))
    filter.restaurant_id = req.query.restaurant;
  const reviews = await Review.find(filter).sort({ created_at: -1 }).limit(50);
  res.json(reviews.map((r) => r.toJSON()));
});

// POST /api/reviews — any authenticated user
router.post("/", authRequired, async (req, res) => {
  const { food_id, restaurant_id, order_id, rating, comment } = req.body || {};
  const r = Number(rating);
  if (!r || r < 1 || r > 5) return res.status(400).json({ error: "rating must be 1-5" });
  if (!food_id && !restaurant_id)
    return res.status(400).json({ error: "food_id or restaurant_id required" });

  // FR-REV-001: only allow a review after the customer has a DELIVERED order
  // for that food / restaurant.
  const delivered = { user_id: req.user.id, status: "DELIVERED" };
  if (food_id) delivered["items.food_id"] = String(food_id);
  else if (restaurant_id) delivered.restaurant_id = restaurant_id;
  const eligible = await Order.exists(delivered);
  if (!eligible)
    return res.status(403).json({ error: "You can review only after a delivered order." });

  const user = await User.findById(req.user.id);
  const review = await Review.create({
    user_id: req.user.id,
    user_name: user?.name || "User",
    food_id: food_id && mongoose.isValidObjectId(food_id) ? food_id : null,
    restaurant_id: restaurant_id && mongoose.isValidObjectId(restaurant_id) ? restaurant_id : null,
    order_id: order_id && mongoose.isValidObjectId(order_id) ? order_id : null,
    rating: r,
    comment: comment || "",
  });
  await recompute({ food_id: review.food_id, restaurant_id: review.restaurant_id });
  res.json(review.toJSON());
});

export default router;
