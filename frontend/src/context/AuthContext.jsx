import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import authService from "../services/authService";


const AuthContext =
  createContext(null);


export const AuthProvider = ({
  children,
}) => {
  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);


  const login = async (
    credentials
  ) => {
    const data =
      await authService.login(
        credentials
      );

    setUser(data.user);

    return data;
  };


  const register = async (
    userData
  ) => {
    return authService.register(
      userData
    );
  };


  const refreshSession =
    async () => {
      try {
        await authService.refresh();

        const currentUser =
          await authService.getCurrentUser();

        setUser(currentUser);

        return currentUser;
      } catch {
        setUser(null);
        return null;
      }
    };


  useEffect(() => {
    const initialize =
      async () => {
        try {
          /*
           * Authentication uses HTTP-only
           * cookies, so JavaScript never
           * reads the tokens directly.
           */
          await refreshSession();
        } finally {
          setLoading(false);
        }
      };


    initialize();
  }, []);


  const value = {
    user,
    loading,
    isAuthenticated:
      Boolean(user),
    login,
    register,
    refreshSession,
  };


  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};