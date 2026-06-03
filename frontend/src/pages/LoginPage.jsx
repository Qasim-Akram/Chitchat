/*
  LoginPage -- handles both login and register
  toggle between the two with a button at the bottom
*/

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, registerUser, getProfile } from '../api/auth';
import './LoginPage.css';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
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
        // first register the account
        await registerUser(username, email, password);
        // then log in right away, no point making them do it manually
      }

      // login to get tokens
      const res = await loginUser(username, password);
      const tokens = res.data; // has access + refresh

      // fetch the full user profile
      // we set the token manually here since context isnt updated yet
      const profileRes = await getProfile();
      // actually we need token first, lets do it properly
      // store token temporarily then fetch profile
      localStorage.setItem('access_token', tokens.access);
      const { data: userData } = await getProfile();

      // now save everything to context properly
      login(userData, tokens);
      navigate('/rooms');

    } catch (err) {
      // try to get a useful error message from the response
      const data = err.response?.data;
      if (data) {
        // django validation errors come back as objects like {username: ["already taken"]}
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
          <h1>ChitChat</h1>
          <p>{ mode === 'login' ? 'sign in to continue' : 'create an account' }</p>
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
            {loading ? 'please wait...' : mode === 'login' ? 'sign in' : 'create account'}
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
