import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

// Shared JSON transform: expose `id` (string) instead of `_id`, drop __v.
function toJSON(schema) {
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      ret.id = ret._id?.toString?.() ?? ret._id;
      delete ret._id;
      return ret;
    },
  });
}

export const ROLES = ["customer", "owner", "delivery_rider", "admin"];
export const ORDER_STATUSES = ["PENDING", "ACCEPTED", "PREPARING", "READY", "ON_THE_WAY", "DELIVERED", "CANCELLED"];
export const DELIVERY_STATUSES = ["pending", "accepted", "picked_up", "on_the_way", "delivered"];

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ROLES, default: "customer" },
  restaurant_id: { type: Schema.Types.ObjectId, ref: "Restaurant", default: null },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  addresses: { type: [new Schema({ label: String, address: String, lat: Number, lng: Number }, { _id: false })], default: [] },
  picture: { type: String, default: "" },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  pubkey: { type: String, default: "" }, // ECDH public key (JWK string) for E2E chat
  blocked: { type: Boolean, default: false }, // admin can block/unblock
  created_at: { type: Date, default: Date.now },
});
toJSON(userSchema);

const categorySchema = new Schema({
  name: { type: String, required: true },
  emoji: { type: String, default: "" },
});
toJSON(categorySchema);

const restaurantSchema = new Schema({
  name: { type: String, required: true },
  owner_id: { type: Schema.Types.ObjectId, ref: "User" },
  address: { type: String, default: "" },
  phone: { type: String, default: "" },
  cuisine: { type: String, default: "" },
  image: { type: String, default: "🍽️" },
  time: { type: String, default: "25 min" },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  rating: { type: Number, default: 4.5 },
  approved: { type: Boolean, default: false }, // admin must approve before it goes live
  created_at: { type: Date, default: Date.now },
});
toJSON(restaurantSchema);

const foodSchema = new Schema({
  name: { type: String, required: true },
  restaurant: { type: String, default: "" },
  restaurant_id: { type: Schema.Types.ObjectId, ref: "Restaurant", default: null },
  owner_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
  category: { type: String, default: "" },
  price: { type: Number, required: true },
  emoji: { type: String, default: "" },
  img: { type: String, default: "" },
  rating: { type: Number, default: 4.5 },
  time: { type: String, default: "" },
  distance: { type: String, default: "" },
  kcal: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  description: { type: String, default: "" },
  available: { type: Boolean, default: true }, // owner can mark unavailable
  created_at: { type: Date, default: Date.now },
});
toJSON(foodSchema);

const orderItemSchema = new Schema(
  {
    food_id: { type: String, default: "" },
    name: { type: String, default: "" },
    price: { type: Number, default: 0 },
    qty: { type: Number, default: 1 },
  },
  { _id: false }
);

const statusEventSchema = new Schema(
  { status: { type: String }, at: { type: Date, default: Date.now } },
  { _id: false }
);

const orderSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  restaurant_id: { type: Schema.Types.ObjectId, ref: "Restaurant", default: null },
  rider_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
  items: { type: [orderItemSchema], default: [] },
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  promo_code: { type: String, default: "" },
  total: { type: Number, required: true },
  address: { type: String, default: "" },
  payment: { type: String, default: "Cash on Delivery" },
  // Payment outcome — NEVER stores card PAN/CVV or wallet PIN. Only safe, masked data.
  payment_status: { type: String, enum: ["pending", "paid", "failed", "cod"], default: "pending" },
  payment_ref: { type: String, default: "" },   // HMAC-signed transaction reference
  payment_last4: { type: String, default: "" },  // card last 4 only
  payment_wallet: { type: String, default: "" }, // masked mobile-wallet number
  idempotency_key: { type: String, default: "", index: true },
  status: { type: String, enum: ORDER_STATUSES, default: "PENDING" },
  status_history: { type: [statusEventSchema], default: [] },
  created_at: { type: Date, default: Date.now },
});
toJSON(orderSchema);

const deliverySchema = new Schema({
  order_id: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  delivery_boy_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
  status: { type: String, enum: DELIVERY_STATUSES, default: "pending" },
  current_location: { type: String, default: "" },
  estimated_time: { type: String, default: "" },
  created_at: { type: Date, default: Date.now },
});
toJSON(deliverySchema);

const reviewSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  user_name: { type: String, default: "" },
  food_id: { type: Schema.Types.ObjectId, ref: "Food", default: null },
  restaurant_id: { type: Schema.Types.ObjectId, ref: "Restaurant", default: null },
  order_id: { type: Schema.Types.ObjectId, ref: "Order", default: null },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: "" },
  created_at: { type: Date, default: Date.now },
});
toJSON(reviewSchema);

const promoSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ["percent", "flat"], default: "percent" },
  value: { type: Number, required: true },
  min_order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  expires_at: { type: Date, default: null }, // null = never expires
  created_at: { type: Date, default: Date.now },
});
toJSON(promoSchema);

const cartItemSchema = new Schema(
  { food_id: { type: String, default: "" }, qty: { type: Number, default: 1 } },
  { _id: false }
);

const cartSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: { type: [cartItemSchema], default: [] },
  updated_at: { type: Date, default: Date.now },
});
toJSON(cartSchema);

// Encrypted chat messages. The server only ever stores ciphertext + iv — it
// cannot read the content (no access to the participants' private keys).
const messageSchema = new Schema({
  order_id: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
  sender_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  sender_name: { type: String, default: "" },
  type: { type: String, enum: ["text", "voice"], default: "text" },
  ciphertext: { type: String, required: true },
  iv: { type: String, required: true },
  mime: { type: String, default: "" },
  created_at: { type: Date, default: Date.now },
});
toJSON(messageSchema);

// Guard against model re-compilation on warm serverless invocations.
export const User = models.User || model("User", userSchema);
export const Message = models.Message || model("Message", messageSchema);
export const Category = models.Category || model("Category", categorySchema);
export const Restaurant = models.Restaurant || model("Restaurant", restaurantSchema);
export const Food = models.Food || model("Food", foodSchema);
export const Order = models.Order || model("Order", orderSchema);
export const Delivery = models.Delivery || model("Delivery", deliverySchema);
export const Review = models.Review || model("Review", reviewSchema);
export const PromoCode = models.PromoCode || model("PromoCode", promoSchema);
export const Cart = models.Cart || model("Cart", cartSchema);
