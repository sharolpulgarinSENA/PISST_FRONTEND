/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext } from "react";

const AuthContext = createContext(null);

function leerSesion() {
  try {
    const token        = sessionStorage.getItem("pisst_token");
    const refreshToken = sessionStorage.getItem("pisst_refresh_token");
    const user         = JSON.parse(sessionStorage.getItem("pisst_user") || "null");
    return { token, refreshToken, user };
  } catch {
    return { token: null, refreshToken: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const sesion = leerSesion();
  const [token, setToken]               = useState(sesion.token);
  const [refreshToken, setRefreshToken] = useState(sesion.refreshToken);
  const [user, setUser]                 = useState(sesion.user);

  // Sprint 4: login ahora recibe y guarda el refresh_token
  function login(accessToken, newRefreshToken, userData) {
    sessionStorage.setItem("pisst_token",         accessToken);
    sessionStorage.setItem("pisst_refresh_token", newRefreshToken);
    sessionStorage.setItem("pisst_user",          JSON.stringify(userData));
    setToken(accessToken);
    setRefreshToken(newRefreshToken);
    setUser(userData);
  }

  function logout() {
    sessionStorage.removeItem("pisst_token");
    sessionStorage.removeItem("pisst_refresh_token");
    sessionStorage.removeItem("pisst_user");
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, refreshToken, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// export const authAPI = {
//   cambiarPassword: (data) => api.post("/auth/cambiar-password", data),
//   forgotPassword:  (data) => api.post("/auth/forgot-password",  data),
//   resetPassword:   (data) => api.post("/auth/reset-password",   data),
// };