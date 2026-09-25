import api from './axiosConfig';

export const getCourses = () => api.get('/courses');
export const getCourseById = (id) => api.get(`/courses/${id}`);
export const enrollInCourse = (courseId) => api.post(`/courses/${courseId}/enroll`);
export const unenrollFromCourse = (courseId) => api.delete(`/courses/${courseId}/unenroll`);
export const getUserEnrollments = (userId) => api.get(`/enrollments/user/${userId}`);
export const trackLessonProgress = (lessonId, completed, watchTime) =>
  api.put(`/courses/lessons/${lessonId}/progress`, { completed, watchTime });

export const getMyCourses = () => api.get('/courses/instructor/my-courses');
export const getCourseForEdit = (id) => api.get(`/courses/instructor/${id}/edit`);
export const createCourse = (data) => api.post('/courses/instructor/create', data);
export const updateCourse = (id, data) => api.put(`/courses/instructor/${id}`, data);
export const deleteCourse = (id) => api.delete(`/courses/instructor/${id}`);
export const publishCourse = (id) => api.post(`/courses/instructor/${id}/publish`);
export const unpublishCourse = (id) => api.post(`/courses/instructor/${id}/unpublish`);

export const addModule = (courseId, data) => api.post(`/courses/instructor/${courseId}/modules`, data);
export const updateModule = (moduleId, data) => api.put(`/courses/instructor/modules/${moduleId}`, data);
export const deleteModule = (moduleId) => api.delete(`/courses/instructor/modules/${moduleId}`);

export const addLesson = (courseId, data) => api.post(`/courses/instructor/${courseId}/lessons`, data);
export const updateLesson = (lessonId, data) => api.put(`/courses/instructor/lessons/${lessonId}`, data);
export const deleteLesson = (lessonId) => api.delete(`/courses/instructor/lessons/${lessonId}`);

// ✅ NEW — Phase 3
export const bulkCreateModules = (courseId, modules) =>
  api.post(`/courses/instructor/${courseId}/bulk-modules`, { modules });