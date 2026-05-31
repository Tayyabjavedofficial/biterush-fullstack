import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api.js";

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

  async function login(email, password) {
    const { token, user } = await api.login({ email, password });
    localStorage.setItem("biterush_token", token);
    setToken(token);
    setUser(user);
  }

  async function register(name, email, password, role = "customer") {
    const { token, user } = await api.register({ name, email, password, role });
    localStorage.setItem("biterush_token", token);
    setToken(token);
    setUser(user);
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
