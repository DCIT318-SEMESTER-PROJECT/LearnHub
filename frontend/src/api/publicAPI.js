import api from './axiosConfig';

export const getRecentActivity = () => api.get('/public/recent-activity');