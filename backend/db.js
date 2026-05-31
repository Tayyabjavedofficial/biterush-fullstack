import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'customer',
        restaurant_id INTEGER,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        emoji TEXT
      );
      CREATE TABLE IF NOT EXISTS foods (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        restaurant TEXT,
        category TEXT,
        price REAL NOT NULL,
        emoji TEXT,
        img TEXT,
        rating REAL,
        time TEXT,
        distance TEXT,
        kcal INTEGER,
        protein INTEGER,
        fat INTEGER,
        carbs INTEGER,
        description TEXT
      );
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        total REAL NOT NULL,
        address TEXT,
        payment TEXT,
        status TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        food_id INTEGER,
        name TEXT,
        price REAL,
        qty INTEGER
      );
      CREATE TABLE IF NOT EXISTS restaurants (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        owner_id INTEGER NOT NULL,
        address TEXT,
        phone TEXT,
        rating REAL DEFAULT 4.5,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS deliveries (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        delivery_boy_id INTEGER,
        status TEXT DEFAULT 'pending',
        current_location TEXT,
        estimated_time TEXT,
        created_at TEXT NOT NULL
      );
    `);

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

    const checkFoods = await client.query("SELECT COUNT(*) as count FROM foods");
    if (checkFoods.rows[0].count === 0) {
      for (const c of categories) {
        await client.query("INSERT INTO categories (name, emoji) VALUES ($1, $2)", [c.name, c.emoji]);
      }
      for (const f of foods) {
        await client.query(
          "INSERT INTO foods (name, restaurant, category, price, emoji, img, rating, time, distance, kcal, protein, fat, carbs, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)",
          [f.name, f.restaurant, f.category, f.price, f.emoji, f.img, f.rating, f.time, f.distance, f.kcal, f.protein, f.fat, f.carbs, f.description]
        );
      }
      console.log("Database seeded with", foods.length, "foods and", categories.length, "categories.");
    }
  } finally {
    client.release();
  }
}

const db = {
  async all(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows;
  },
  async get(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows[0];
  },
  async run(sql, params = []) {
    const result = await pool.query(sql, params);
    return { lastInsertRowid: result.rows[0]?.id, changes: result.rowCount };
  },
};

initDatabase().catch(console.error);

export default db;
