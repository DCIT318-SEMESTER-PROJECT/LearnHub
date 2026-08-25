import api from './axiosConfig';

export const getStudyGroups = () => {
  return api.get('/study-groups');
};

export const getStudyGroupById = (id) => {
  return api.get(`/study-groups/${id}`);
};

export const createStudyGroup = (groupData) => {
  return api.post('/study-groups', groupData);
};

export const joinStudyGroup = (groupId, userId) => {
  return api.post(`/study-groups/${groupId}/join`, { userId });
};

export const leaveStudyGroup = (groupId, userId) => {
  return api.delete(`/study-groups/${groupId}/leave`, { data: { userId } });
};

export const deleteStudyGroup = (groupId) => {
  return api.delete(`/study-groups/${groupId}/delete`);
};

export const getGroupMessages = (groupId) => {
  return api.get(`/study-groups/${groupId}/messages`);
};

export const sendGroupMessage = (groupId, message) => {
  return api.post(`/study-groups/${groupId}/messages`, { message });
};