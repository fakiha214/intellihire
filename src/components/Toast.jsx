import React, { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const Toast = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      if (onClose) onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200',
  }[type] || 'bg-blue-50 border-blue-200'

  const textColor = {
    success: 'text-green-700',
    error: 'text-red-700',
    info: 'text-blue-700',
    warning: 'text-yellow-700',
  }[type] || 'text-blue-700'

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle,
  }[type] || Info

  const iconColor = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    warning: 'text-yellow-500',
  }[type] || 'text-blue-500'

  return (
    <div className={`fixed bottom-4 right-4 max-w-sm border rounded-md ${bgColor} ${textColor} p-4 shadow-lg flex items-start gap-3 z-50 animate-slideIn`}>
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={() => setIsVisible(false)}
        className="text-gray-500 hover:text-gray-700 flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default Toast

// Feature: Array utility functions
const arrayUtils = {
  unique: (arr) => [...new Set(arr)],
  flatten: (arr) => arr.reduce((flat, item) => flat.concat(item), []),
  chunk: (arr, size) => Array.from({ length: Math.ceil(arr.length / size) },
    (_, i) => arr.slice(i * size, i * size + size))
};

// Feature: Notification system
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
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

// Feature: Local storage wrapper
const storage = {
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  get: (key) => JSON.parse(localStorage.getItem(key)),
  remove: (key) => localStorage.removeItem(key),
  clear: () => localStorage.clear()
};
