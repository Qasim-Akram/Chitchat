import api from './api';

export const registerUser = (username, email, password) => {
  return api.post('/auth/register/', {
    username,
    email,
    password,
    password2: password,
  });
};

export const loginUser = (username, password) => {
  return api.post('/auth/login/', { username, password });
};

export const getProfile = () => {
  return api.get('/auth/profile/');
};
