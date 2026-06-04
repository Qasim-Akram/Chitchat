/*
  api.js -- central place for all HTTP requests to the backend

  we create one axios instance with the base URL already set,
  so everywhere else we just write api.get('/chat/rooms/') 
  instead of axios.get('http://localhost:8000/api/chat/rooms/')

  the interceptor automatically attaches the JWT token to every
  request so we dont have to do it manually each time
*/

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// before every request, grab the token from storage and add it to the header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
