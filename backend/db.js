import mongoose from "mongoose";

// MongoDB connection string. On Vercel this comes from the project env var.
// Read lazily (inside connect) so it picks up dotenv loaded by the server entry,
// regardless of ESM import-evaluation order. Falls back to a local mongod.
const getUri = () =>
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  "mongodb://127.0.0.1:27017/biterush";

// Cache the connection across warm serverless invocations so we don't open a
// new pool on every request (the standard Mongoose-on-serverless pattern).
let cached = globalThis.__biterushMongoose;
if (!cached) cached = globalThis.__biterushMongoose = { conn: null, promise: null };

export async function connect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    mongoose.set("strictQuery", true);
    cached.promise = mongoose
      .connect(getUri(), { serverSelectionTimeoutMS: 10000 })
      .then(async (m) => {
        const { seed } = await import("./seed.js");
        await seed();
        return m;
      });
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // allow retry on next request
    throw err;
  }
  return cached.conn;
}

export default connect;
