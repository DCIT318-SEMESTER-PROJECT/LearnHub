import api from './axiosConfig';

export const getConversations = () =>
  api.get('/messages/conversations');

export const getUnreadCount = () =>
  api.get('/messages/unread/count');

export const getThread = (userId) =>
  api.get(`/messages/${userId}`);

export const sendMessage = (userId, body, attachment = null) =>
  api.post(`/messages/${userId}`, {
    body,
    ...(attachment ? { attachment } : {}),
  });

export const clearThread = (userId) =>
  api.delete(`/messages/${userId}`);