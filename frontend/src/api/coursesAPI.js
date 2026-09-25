import api from './axiosConfig';

// ═══════════════════════════════════════════════════
// PUBLIC / STUDENT ENDPOINTS
// ═══════════════════════════════════════════════════

export const getCourses = () => {
  return api.get('/courses');
};

export const getCourseById = (id) => {
  return api.get(`/courses/${id}`);
};

export const enrollInCourse = (courseId) => {
  return api.post(`/courses/${courseId}/enroll`);
};

export const unenrollFromCourse = (courseId) => {
  return api.delete(`/courses/${courseId}/unenroll`);
};

export const getUserEnrollments = (userId) => {
  return api.get(`/enrollments/user/${userId}`);
};

export const trackLessonProgress = (lessonId, completed, watchTime) => {
  return api.put(`/courses/lessons/${lessonId}/progress`, { completed, watchTime });
};

// ═══════════════════════════════════════════════════
// INSTRUCTOR COURSE MANAGEMENT
// ═══════════════════════════════════════════════════

export const getMyCourses = () => {
  return api.get('/courses/instructor/my-courses');
};

export const getCourseForEdit = (id) => {
  return api.get(`/courses/instructor/${id}/edit`);
};

export const createCourse = (data) => {
  return api.post('/courses/instructor/create', data);
};

export const updateCourse = (id, data) => {
  return api.put(`/courses/instructor/${id}`, data);
};

export const deleteCourse = (id) => {
  return api.delete(`/courses/instructor/${id}`);
};

export const publishCourse = (id) => {
  return api.post(`/courses/instructor/${id}/publish`);
};

export const unpublishCourse = (id) => {
  return api.post(`/courses/instructor/${id}/unpublish`);
};

// ═══════════════════════════════════════════════════
// MODULE MANAGEMENT
// ═══════════════════════════════════════════════════

export const addModule = (courseId, data) => {
  return api.post(`/courses/instructor/${courseId}/modules`, data);
};

export const updateModule = (moduleId, data) => {
  return api.put(`/courses/instructor/modules/${moduleId}`, data);
};

export const deleteModule = (moduleId) => {
  return api.delete(`/courses/instructor/modules/${moduleId}`);
};

// ═══════════════════════════════════════════════════
// LESSON MANAGEMENT
// ═══════════════════════════════════════════════════

export const addLesson = (courseId, data) => {
  return api.post(`/courses/instructor/${courseId}/lessons`, data);
};

export const updateLesson = (lessonId, data) => {
  return api.put(`/courses/instructor/lessons/${lessonId}`, data);
};

export const deleteLesson = (lessonId) => {
  return api.delete(`/courses/instructor/lessons/${lessonId}`);
};