import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, registerUser, getProfile } from '../api/auth';
import './LoginPage.css';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await registerUser(username, email, password);
      }

      const res = await loginUser(username, password);
      const tokens = res.data;

      localStorage.setItem('access_token', tokens.access);

      const profileRes = await getProfile();

      login(profileRes.data, tokens);
      navigate('/rooms');

    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const firstError = Object.values(data)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError('something went wrong, try again');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">

        <div className="login-header">
          <span className="login-logo">CC</span>
          <h1>ChatRoom</h1>
          <p>{mode === 'login' ? 'sign in to continue' : 'create an account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">

          <div className="field">
            <label>username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="your username"
              required
              autoFocus
            />
          </div>

          {mode === 'register' && (
            <div className="field">
              <label>email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
          )}

          <div className="field">
            <label>password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'sign in' : 'create account'}
          </button>

        </form>

        <div className="login-footer">
          {mode === 'login' ? (
            <p>no account? <button className="link-btn" onClick={() => { setMode('register'); setError(''); }}>register</button></p>
          ) : (
            <p>have an account? <button className="link-btn" onClick={() => { setMode('login'); setError(''); }}>sign in</button></p>
          )}
        </div>

      </div>
    </div>
  );
}