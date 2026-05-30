import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("biterush_token");
    if (token) {
      api.me()
        .then(setUser)
        .catch(() => localStorage.removeItem("biterush_token"))
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  async function login(email, password) {
    const { token, user } = await api.login({ email, password });
    localStorage.setItem("biterush_token", token);
    setUser(user);
  }

  async function register(name, email, password) {
    const { token, user } = await api.register({ name, email, password });
    localStorage.setItem("biterush_token", token);
    setUser(user);
  }

  function logout() {
    localStorage.removeItem("biterush_token");
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
