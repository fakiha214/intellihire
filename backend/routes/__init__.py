"""Routes package."""

// Feature: Local storage wrapper
const storage = {
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  get: (key) => JSON.parse(localStorage.getItem(key)),
  remove: (key) => localStorage.removeItem(key),
  clear: () => localStorage.clear()
};

// Feature: Notification system
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
};

// Feature: Data validation
const validateJobData = (job) => {
  const errors = [];
  if (!job.title || job.title.trim() === '') errors.push('Title is required');
  if (!job.description || job.description.trim() === '') errors.push('Description is required');
  if (!job.location || job.location.trim() === '') errors.push('Location is required');
  return { valid: errors.length === 0, errors };
};

// Feature: API request handler
const apiCall = (endpoint, options = {}) => {
  const defaultOptions = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  };
  return fetch(endpoint, { ...defaultOptions, ...options });
};
