/*
  AuthContext -- think of this as a global variable that any component can read
  
  without context you'd have to pass the logged-in user as a prop through
  every single component. with context, any component can just call
  useAuth() and get the current user directly. much cleaner.

  we store tokens in localStorage so they survive page refresh.
  if you close the tab and come back, you're still logged in.
*/

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check localStorage

  useEffect(() => {
    // on app load, check if tokens are saved from a previous session
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setAccessToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  const login = (userData, tokens) => {
    // save to state
    setUser(userData);
    setAccessToken(tokens.access);

    // save to localStorage so it persists after refresh
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);

    // clear everything from storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// custom hook -- components call useAuth() instead of useContext(AuthContext)
// just a bit cleaner
export function useAuth() {
  return useContext(AuthContext);
}
