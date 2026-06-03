/*
  App.jsx -- sets up routing

  three routes:
  /          -> login page (public)
  /rooms     -> room list (must be logged in)
  /rooms/:slug -> chat room (must be logged in)

  ProtectedRoute wraps the private pages -- if you're not logged in
  it redirects you back to the login page automatically
*/

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RoomsPage from './pages/RoomsPage';
import ChatPage from './pages/ChatPage';

// wraps routes that require login
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // still checking localStorage, dont redirect yet
  if (loading) {
    return <div style={{ color: '#444', padding: 40, fontFamily: 'monospace' }}>loading...</div>;
  }

  // not logged in, send to login page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />

          <Route path="/rooms" element={
            <ProtectedRoute>
              <RoomsPage />
            </ProtectedRoute>
          } />

          <Route path="/rooms/:slug" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />

          {/* catch all -- send unknown routes to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
