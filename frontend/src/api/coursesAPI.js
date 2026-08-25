import api from './axiosConfig';

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