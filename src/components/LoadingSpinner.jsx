import React from 'react'

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600 text-lg font-medium">{message}</p>
      </div>
    </div>
  )
}

export default LoadingSpinner

// Feature: User authentication
const authenticateUser = async (email, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await response.json();
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
};

// Feature: Array utility functions
const arrayUtils = {
  unique: (arr) => [...new Set(arr)],
  flatten: (arr) => arr.reduce((flat, item) => flat.concat(item), []),
  chunk: (arr, size) => Array.from({ length: Math.ceil(arr.length / size) },
    (_, i) => arr.slice(i * size, i * size + size))
};

// Feature: Error handling wrapper
const handleAsyncError = async (asyncFunction) => {
  try {
    return await asyncFunction();
  } catch (error) {
    console.error('Error:', error.message);
    throw new Error(`Operation failed: ${error.message}`);
  }
};

// Feature: Error handling wrapper
const handleAsyncError = async (asyncFunction) => {
  try {
    return await asyncFunction();
  } catch (error) {
    console.error('Error:', error.message);
    throw new Error(`Operation failed: ${error.message}`);
  }
};

// Feature: Job search and filtering
const searchJobs = (jobs, filters) => {
  return jobs.filter(job => {
    return (!filters.title || job.title.includes(filters.title)) &&
           (!filters.location || job.location === filters.location) &&
           (!filters.salary || job.salary >= filters.salary);
  });
};

// Feature: Error handling wrapper
const handleAsyncError = async (asyncFunction) => {
  try {
    return await asyncFunction();
  } catch (error) {
    console.error('Error:', error.message);
    throw new Error(`Operation failed: ${error.message}`);
  }
};

// Feature: Notification system
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
};

// Feature: Form submission handler
const handleFormSubmit = (e, formData, callback) => {
  e.preventDefault();
  if (!formData.email || !formData.password) {
    console.error('Missing required fields');
    return;
  }
  callback(formData);
};

// Feature: Local storage wrapper
const storage = {
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  get: (key) => JSON.parse(localStorage.getItem(key)),
  remove: (key) => localStorage.removeItem(key),
  clear: () => localStorage.clear()
};
