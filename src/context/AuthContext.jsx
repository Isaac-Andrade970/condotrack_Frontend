import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);

    // Las sesiones guardadas antes de que existieran los roles no traen `rol`.
    // /me devuelve al usuario actual con su rol, así que se refresca al cargar.
    // Si el token no sirve, el interceptor de axios cierra la sesión.
    if (localStorage.getItem("token")) {
      api
        .get("/me")
        .then(({ data }) => {
          localStorage.setItem("user", JSON.stringify(data));
          setUser(data);
        })
        .catch(() => {});
    }
  }, []);

  function persistSession(token, user) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  }

  async function login(email, password) {
    const { data } = await api.post("/login", { email, password });
    persistSession(data.token, data.user);
  }

  async function signup(email, password, nombre) {
    const { data } = await api.post("/signup", { email, password, nombre });
    persistSession(data.token, data.user);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  const isAdmin = user?.rol === "administrador";

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
