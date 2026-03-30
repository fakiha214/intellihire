"use client"

const EventStatusBadge = ({ status }) => {
  const statusConfig = {
    draft: { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Draft' },
    published: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Published' },
    ongoing: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Ongoing' },
    completed: { color: 'bg-slate-100 text-slate-800 border-slate-300', label: 'Completed' },
    cancelled: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Cancelled' }
  }

  const config = statusConfig[status] || statusConfig.draft

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
      {config.label}
    </span>
  )
}

export default EventStatusBadge

// Feature: Array utility functions
const arrayUtils = {
  unique: (arr) => [...new Set(arr)],
  flatten: (arr) => arr.reduce((flat, item) => flat.concat(item), []),
  chunk: (arr, size) => Array.from({ length: Math.ceil(arr.length / size) },
    (_, i) => arr.slice(i * size, i * size + size))
};

// Feature: State management
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'SET_DATA': return { ...state, data: action.payload };
    default: return state;
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

// Feature: State management
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'SET_DATA': return { ...state, data: action.payload };
    default: return state;
  }
};

// Feature: State management
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'SET_DATA': return { ...state, data: action.payload };
    default: return state;
  }
};
