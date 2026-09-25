import api from './axiosConfig';

export const submitRating = (courseId, rating, review = '') =>
  api.post(`/ratings/${courseId}`, { rating: Number(rating), review });

export const getMyRating = (courseId) =>
  api.get(`/ratings/${courseId}/mine`);

export const getCourseRatings = (courseId) =>
  api.get(`/ratings/${courseId}`);