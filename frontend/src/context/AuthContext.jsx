import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api.js";
import { getKeypair } from "../crypto.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("biterush_token"));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("biterush_token");
    setToken(storedToken);
    if (storedToken) {
      api.me()
        .then(setUser)
        .catch(() => localStorage.removeItem("biterush_token"))
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  // Publish this device's E2E chat public key once signed in (private key stays local).
  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      try {
        const { pubJwk } = await getKeypair();
        await api.updateMe({ pubkey: JSON.stringify(pubJwk) });
      } catch { /* non-fatal */ }
    })();
  }, [user, token]);

  async function login(email, password) {
    const { token, user } = await api.login({ email, password });
    localStorage.setItem("biterush_token", token);
    setToken(token);
    setUser(user);
    return user;
  }

  async function register(name, email, password, role = "customer", phone = "") {
    const { token, user } = await api.register({ name, email, password, role, phone });
    localStorage.setItem("biterush_token", token);
    setToken(token);
    setUser(user);
    return user;
  }

  function logout() {
    localStorage.removeItem("biterush_token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ user, token, ready, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
