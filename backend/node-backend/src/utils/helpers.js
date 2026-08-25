// Format date to readable string
const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Format time (seconds to minutes:seconds)
const formatTime = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Generate a random ID
const generateId = (prefix = '') => {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
};

// Pagination helper
const paginate = (items, page = 1, limit = 10) => {
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    data: items.slice(start, end),
    total: items.length,
    page,
    totalPages: Math.ceil(items.length / limit)
  };
};

// Validate email format
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Truncate text
const truncate = (text, length = 100) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

module.exports = {
  formatDate,
  formatTime,
  generateId,
  paginate,
  isValidEmail,
  truncate
};