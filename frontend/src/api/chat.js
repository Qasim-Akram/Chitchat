import api from './api';

// GET /api/chat/rooms/
export const getRooms = () => {
  return api.get('/chat/rooms/');
};

// POST /api/chat/rooms/
export const createRoom = (name) => {
  return api.post('/chat/rooms/', { name });
};

// GET /api/chat/rooms/<slug>/
export const getRoom = (slug) => {
  return api.get(`/chat/rooms/${slug}/`);
};

// POST /api/chat/rooms/<slug>/join/
export const joinRoom = (slug) => {
  return api.post(`/chat/rooms/${slug}/join/`);
};

// GET /api/chat/rooms/<slug>/messages/?before=<id>
export const getMessages = (slug, beforeId = null) => {
  const params = beforeId ? { before: beforeId } : {};
  return api.get(`/chat/rooms/${slug}/messages/`, { params });
};
