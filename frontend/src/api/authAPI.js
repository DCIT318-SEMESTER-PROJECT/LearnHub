import api from './axiosConfig';

export const register = (userData) => {
  return api.post('/auth/register', userData);
};

export const login = (credentials) => {
  return api.post('/auth/login', credentials);
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const updateProfile = (userData) => {
  return api.put('/auth/profile', userData);
};

export const getProfile = () => {
  return api.get('/auth/profile');
};

export const uploadAvatar = (avatarData) => {
  return api.post('/auth/avatar', { avatarData });
};

export const removeAvatar = () => {
  return api.delete('/auth/avatar');
};

export const getAchievements = () => {
  return api.get('/auth/achievements');
};

export const getDashboardSummary = () => {
  return api.get('/auth/dashboard-summary');
};

export const deleteAccount = () => {
  return api.delete('/auth/account');
};