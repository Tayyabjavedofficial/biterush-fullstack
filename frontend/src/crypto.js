// End-to-end encryption helpers (Web Crypto API).
// ECDH P-256 keypair per device; private key never leaves the browser.
// Two participants derive the same AES-GCM key from (myPrivate, peerPublic).

const STORE_KEY = "biterush_chat_priv";

export const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
export const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export const enc = (s) => new TextEncoder().encode(s);
export const dec = (b) => new TextDecoder().decode(b);

// Load (or create on first use) this device's ECDH keypair.
export async function getKeypair() {
  const saved = localStorage.getItem(STORE_KEY);
  if (saved) {
    try {
      const { priv, pub } = JSON.parse(saved);
      const privKey = await crypto.subtle.importKey("jwk", priv, { name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
      return { privKey, pubJwk: pub };
    } catch {
      /* corrupt — regenerate below */
    }
  }
  const kp = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
  const priv = await crypto.subtle.exportKey("jwk", kp.privateKey);
  const pub = await crypto.subtle.exportKey("jwk", kp.publicKey);
  localStorage.setItem(STORE_KEY, JSON.stringify({ priv, pub }));
  return { privKey: kp.privateKey, pubJwk: pub };
}

// Derive the shared AES-GCM key for a conversation.
export async function deriveSharedKey(privKey, peerPubJwk) {
  const peerPub = await crypto.subtle.importKey("jwk", peerPubJwk, { name: "ECDH", namedCurve: "P-256" }, false, []);
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: peerPub },
    privKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptBytes(key, bytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
  return { ciphertext: b64(ct), iv: b64(iv) };
}

export async function decryptBytes(key, ciphertextB64, ivB64) {
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(ivB64) }, key, unb64(ciphertextB64));
  return new Uint8Array(pt);
}
