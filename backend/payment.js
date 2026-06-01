import crypto from "crypto";

// Server secret for signing transaction references. Falls back to JWT secret.
const SECRET = process.env.PAYMENT_SECRET || process.env.JWT_SECRET || "biterush_dev_secret_change_me";

export const PAYMENT_METHODS = ["Cash on Delivery", "Card", "JazzCash", "EasyPaisa"];

// Tamper-evident transaction reference (HMAC-SHA256 of the order facts).
export function signRef(parts) {
  return "BR-" + crypto.createHmac("sha256", SECRET).update(parts.join("|")).digest("hex").slice(0, 24).toUpperCase();
}

// Simulated payment gateway. CRITICAL: this function never receives or stores a
// card PAN, CVV, or wallet PIN — only a client-side token, the last 4 digits, or
// a mobile-wallet number (which it masks). Returns the payment outcome.
export function processPayment({ method, amount, details = {} }) {
  if (!PAYMENT_METHODS.includes(method)) {
    return { ok: false, error: "Unsupported payment method" };
  }
  if (!(amount > 0)) return { ok: false, error: "Invalid amount" };

  if (method === "Cash on Delivery") {
    return { ok: true, status: "cod" };
  }

  if (method === "Card") {
    const last4 = String(details.last4 || "").replace(/\D/g, "");
    // Reject anything that looks like a full card number reaching the server.
    if (String(details.token || "").replace(/\D/g, "").length > 4) {
      return { ok: false, error: "Raw card data must not be sent to the server" };
    }
    if (!details.token || !/^\d{4}$/.test(last4)) {
      return { ok: false, error: "Card payment requires a tokenized card" };
    }
    if (last4 === "0000") return { ok: false, status: "failed", error: "Card declined by issuer" };
    return { ok: true, status: "paid", last4 };
  }

  if (method === "JazzCash" || method === "EasyPaisa") {
    const digits = String(details.wallet || "").replace(/\D/g, "");
    if (digits.length !== 11 || !digits.startsWith("03")) {
      return { ok: false, error: "Enter a valid mobile wallet number (03XXXXXXXXX)" };
    }
    const masked = digits.slice(0, 4) + "***" + digits.slice(-2);
    return { ok: true, status: "paid", wallet: masked };
  }

  return { ok: false, error: "Unsupported payment method" };
}
