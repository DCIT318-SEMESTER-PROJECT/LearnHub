import api from './axiosConfig';

export const getQuizByCourse = (courseId) =>
  api.get(`/quizzes/course/${courseId}`);

export const saveQuiz = (courseId, questions, title = 'Course Quiz') =>
  api.post(`/quizzes/course/${courseId}`, { questions, title });

export const submitQuiz = (courseId, answers) =>
  api.post(`/quizzes/course/${courseId}/submit`, { answers });