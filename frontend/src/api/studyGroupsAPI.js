import api from './axiosConfig';

// ─── Groups ─────────────────────────────────────────────
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

// ─── Messages ───────────────────────────────────────────
export const getGroupMessages = (groupId, limit = 50) =>
  api.get(`/study-groups/${groupId}/messages`, { params: { limit } });

export const sendGroupMessage = (groupId, message, attachment = null) =>
  api.post(`/study-groups/${groupId}/messages`, {
    message,
    ...(attachment ? { attachment } : {}),
  });

// ─── Members ────────────────────────────────────────────
export const getMemberPreviews = (groupIds) =>
  api.get('/study-groups/members/preview', {
    params: { groupIds: Array.isArray(groupIds) ? groupIds.join(',') : groupIds },
  });

export const getMemberProfile = (userId) =>
  api.get(`/study-groups/members/${userId}/profile`);