import api from './api';

export const getRooms = () => {
  return api.get('/chat/rooms/');
};

export const createRoom = (name) => {
  return api.post('/chat/rooms/', { name });
};

export const getRoom = (slug) => {
  return api.get(`/chat/rooms/${slug}/`);
};

export const joinRoom = (slug) => {
  return api.post(`/chat/rooms/${slug}/join/`);
};

export const getMessages = (slug, beforeId = null) => {
  const params = beforeId ? { before: beforeId } : {};
  return api.get(`/chat/rooms/${slug}/messages/`, { params });
};

export const getNotifications = () => {
  return api.get('/chat/notifications/');
};

export const markNotificationsRead = () => {
  return api.post('/chat/notifications/read/');
};

export const getUnreadCount = () => {
  return api.get('/chat/notifications/unread-count/');
};