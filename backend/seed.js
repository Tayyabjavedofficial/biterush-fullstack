import bcrypt from "bcryptjs";
import { User, Category, Restaurant, Food, PromoCode } from "./models.js";

const categories = [
  { name: "Burger", emoji: "🍔" },
  { name: "Pizza", emoji: "🍕" },
  { name: "Chicken", emoji: "🍗" },
  { name: "Fries", emoji: "🍟" },
  { name: "Drinks", emoji: "🥤" },
  { name: "Dessert", emoji: "🍰" },
];

const foods = [
  { name: "Classic Royale Burger", restaurant: "Burger Flame", category: "Burger", price: 9.8, emoji: "🍔", img: "https://loremflickr.com/600/600/burger?lock=10", rating: 4.8, time: "25 min", distance: "1.4 km", kcal: 198, protein: 25, fat: 13, carbs: 23, description: "A flame-grilled beef patty layered with crisp lettuce, ripe tomato, melted cheddar and our signature house sauce on a toasted brioche bun." },
  { name: "Spicy Inferno Pizza", restaurant: "Pizza Craft", category: "Pizza", price: 12.5, emoji: "🍕", img: "https://loremflickr.com/600/600/pizza?lock=20", rating: 4.7, time: "30 min", distance: "2.1 km", kcal: 285, protein: 14, fat: 11, carbs: 34, description: "Wood-fired thin crust loaded with pepperoni, jalapenos, red chilli flakes and a fiery hot-sauce drizzle for heat lovers." },
  { name: "Chicken Fried Rice", restaurant: "Nom Nom House", category: "Chicken", price: 8.0, emoji: "🍛", img: "https://loremflickr.com/600/600/rice?lock=30", rating: 4.6, time: "20 min", distance: "1.1 km", kcal: 240, protein: 18, fat: 9, carbs: 30, description: "Wok-tossed jasmine rice with tender chicken, egg, spring onions and a savoury soy-garlic glaze." },
  { name: "Beef Cheesy Delight", restaurant: "Crunch Kitchen", category: "Burger", price: 11.2, emoji: "🧀", img: "https://loremflickr.com/600/600/burger?lock=40", rating: 4.9, time: "28 min", distance: "1.8 km", kcal: 310, protein: 28, fat: 16, carbs: 18, description: "Double smashed beef stacked with a molten cheese core, caramelised onions and smoked aioli." },
  { name: "Crispy Fries", restaurant: "Burger Flame", category: "Fries", price: 4.5, emoji: "🍟", img: "https://loremflickr.com/600/600/fries?lock=50", rating: 4.5, time: "15 min", distance: "1.4 km", kcal: 312, protein: 4, fat: 15, carbs: 41, description: "Golden hand-cut fries, double-fried for maximum crunch and dusted with sea salt." },
  { name: "Fresh Orange Juice", restaurant: "Crunch Kitchen", category: "Drinks", price: 3.8, emoji: "🧃", img: "https://loremflickr.com/600/600/juice?lock=60", rating: 4.4, time: "10 min", distance: "1.8 km", kcal: 110, protein: 2, fat: 0, carbs: 26, description: "Cold-pressed seasonal oranges, no added sugar - bright, sweet and refreshing." },
];

const promos = [
  { code: "WELCOME10", type: "percent", value: 10, min_order: 0 },
  { code: "SAVE5", type: "flat", value: 5, min_order: 15 },
];

// Idempotent: only inserts what is missing. Safe to call on every cold start.
export async function seed() {
  if ((await Category.estimatedDocumentCount()) === 0) {
    await Category.insertMany(categories);
  }

  // Demo accounts (admin / owner / rider / customer), password: "password".
  const demoAccounts = [
    { name: "BiteRush Admin", email: "admin@biterush.com", role: "admin" },
    { name: "Demo Owner", email: "owner@biterush.com", role: "owner" },
    { name: "Demo Rider", email: "rider@biterush.com", role: "delivery_rider" },
    { name: "Demo Customer", email: "customer@biterush.com", role: "customer" },
  ];
  const hash = bcrypt.hashSync("password", 10);
  for (const acc of demoAccounts) {
    const exists = await User.findOne({ email: acc.email });
    if (!exists) await User.create({ ...acc, password: hash });
  }

  // Restaurants (for the Search page + nearest). Burger Flame is the demo owner's.
  const restaurants = [
    { name: "Burger Flame", cuisine: "American, Burgers", image: "🍔", rating: 4.8, lat: 40.7128, lng: -74.006, time: "25 min", address: "Downtown" },
    { name: "Pizza Craft", cuisine: "Italian, Pizza", image: "🍕", rating: 4.7, lat: 40.758, lng: -73.9855, time: "30 min", address: "Midtown" },
    { name: "Nom Nom House", cuisine: "Asian, Chinese", image: "🍛", rating: 4.6, lat: 40.7489, lng: -73.968, time: "20 min", address: "East Side" },
    { name: "Crunch Kitchen", cuisine: "Fast Food, Sides", image: "🍟", rating: 4.5, lat: 40.7505, lng: -74.006, time: "18 min", address: "West Plaza" },
    { name: "Coffee Corner", cuisine: "Cafe, Beverages", image: "☕", rating: 4.4, lat: 40.7614, lng: -73.9776, time: "10 min", address: "City Center" },
    { name: "Sweet Bites", cuisine: "Desserts, Bakery", image: "🍰", rating: 4.9, lat: 40.7505, lng: -74.0, time: "5 min", address: "Arts District" },
  ];
  const owner = await User.findOne({ email: "owner@biterush.com" });
  let demoRestaurant = null;
  for (const r of restaurants) {
    const isDemo = r.name === "Burger Flame";
    let doc = await Restaurant.findOne({ name: r.name });
    if (!doc) {
      doc = await Restaurant.create({ ...r, approved: true, owner_id: isDemo ? owner?._id || null : null });
    } else {
      // backfill the new fields onto any pre-existing doc
      doc.cuisine ||= r.cuisine; doc.image ||= r.image; doc.time ||= r.time;
      if (doc.lat == null) doc.lat = r.lat;
      if (doc.lng == null) doc.lng = r.lng;
      doc.approved = true; // seeded restaurants are pre-approved
      if (isDemo && !doc.owner_id && owner) doc.owner_id = owner._id;
      await doc.save();
    }
    if (isDemo) demoRestaurant = doc;
  }
  if (owner && demoRestaurant && String(owner.restaurant_id) !== String(demoRestaurant._id)) {
    owner.restaurant_id = demoRestaurant._id;
    await owner.save();
  }

  if ((await Food.estimatedDocumentCount()) === 0) {
    // Attach the first two foods to the demo restaurant so the owner dashboard
    // has data to show; the rest stay as platform foods.
    const docs = foods.map((f, i) =>
      i < 2 && demoRestaurant
        ? { ...f, restaurant: demoRestaurant.name, restaurant_id: demoRestaurant._id, owner_id: owner?._id }
        : f
    );
    await Food.insertMany(docs);
  }

  for (const p of promos) {
    const exists = await PromoCode.findOne({ code: p.code });
    if (!exists) await PromoCode.create(p);
  }
}

export default seed;
