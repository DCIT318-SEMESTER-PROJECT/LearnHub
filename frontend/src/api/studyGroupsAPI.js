import api from './axiosConfig';

export const getStudyGroups = (params = {}) =>
  api.get('/study-groups', { params });

export const getStudyGroupById = (id) =>
  api.get(`/study-groups/${id}`);

export const getGroupsByCourse = (courseId) =>
  api.get('/study-groups', { params: { courseId } });

export const createStudyGroup = (groupData) =>
  api.post('/study-groups', groupData);

export const joinStudyGroup = (groupId) =>
  api.post(`/study-groups/${groupId}/join`);

export const leaveStudyGroup = (groupId) =>
  api.delete(`/study-groups/${groupId}/leave`);

export const deleteStudyGroup = (groupId) =>
  api.delete(`/study-groups/${groupId}/delete`);

export const getGroupMessages = (groupId, limit = 50) =>
  api.get(`/study-groups/${groupId}/messages`, { params: { limit } });

export const sendGroupMessage = (groupId, message) =>
  api.post(`/study-groups/${groupId}/messages`, { message });