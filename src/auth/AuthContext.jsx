import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import { getAccessToken, refreshAccessToken, setAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const applySession = useCallback((session) => {
    if (session?.accessToken) setAccessToken(session.accessToken);
    if (session?.user) setUser(session.user);
    return session;
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      if (!getAccessToken()) {
        const token = await Promise.race([
          refreshAccessToken(),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('refresh-timeout')), 2500);
          }),
        ]).catch(() => null);
        if (!token) return;
      }
      const profile = await authApi.getUser();
      setUser(profile);
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (email, password) => applySession(await authApi.login(email, password)),
    [applySession]
  );

  const register = useCallback((payload) => authApi.register(payload), []);

  const verifyRegistrationOtp = useCallback(
    async (email, otp) => applySession(await authApi.verifyRegistrationOtp(email, otp)),
    [applySession]
  );

  const googleLogin = useCallback(
    async (idToken) => applySession(await authApi.google(idToken)),
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      isAuthenticated: Boolean(user),
      login,
      register,
      verifyRegistrationOtp,
      googleLogin,
      logout,
      applySession,
      setUser,
    }),
    [user, ready, login, register, verifyRegistrationOtp, googleLogin, logout, applySession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
