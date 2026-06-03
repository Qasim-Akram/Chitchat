import api from './api';

// POST /api/auth/register/
export const registerUser = (username, email, password) => {
  return api.post('/auth/register/', {
    username,
    email,
    password,
    password2: password,
  });
};

// POST /api/auth/login/
export const loginUser = (username, password) => {
  return api.post('/auth/login/', { username, password });
};

// GET /api/auth/profile/
export const getProfile = () => {
  return api.get('/auth/profile/');
};
