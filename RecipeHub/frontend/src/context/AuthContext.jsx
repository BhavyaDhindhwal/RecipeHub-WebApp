
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // CHECK AUTHENTICATION
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("recipehub_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest("/auth/me");
        setUser(data.user);
      } catch {
        localStorage.removeItem("recipehub_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // REGISTER
  const register = async (formData) => {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(formData),
    });

    localStorage.setItem("recipehub_token", data.token);
    setUser(data.user);

    return data;
  };

  // LOGIN
  const login = async (formData) => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(formData),
    });

    localStorage.setItem("recipehub_token", data.token);
    setUser(data.user);

    return data;
  };

  // UPDATE PROFILE
  const updateProfile = async (formData) => {
    const data = await apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(formData),
    });

    setUser(data.user);

    return data;
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("recipehub_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
