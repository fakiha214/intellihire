'use client';

import { AlertCircle, CheckCircle, Info } from 'lucide-react';

/**
 * MessageStatus Component
 * Displays status messages (errors, info, success)
 */
const MessageStatus = ({ type = 'info', message = '', dismissible = true, onDismiss = null }) => {
  const statusConfig = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-600',
      textColor: 'text-red-800',
      title: 'Error',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      textColor: 'text-green-800',
      title: 'Success',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: Info,
      iconColor: 'text-blue-600',
      textColor: 'text-blue-800',
      title: 'Info',
    },
  };

  const config = statusConfig[type] || statusConfig.info;
  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border-2 ${config.border} ${config.bg} p-4 my-3 shadow-md hover:shadow-lg transition-all duration-200 animate-slideUp`}>
      <div className="flex items-start gap-3">
        <Icon className={`flex-shrink-0 w-6 h-6 mt-0.5 ${config.iconColor} animate-pulse`} />
        <div className="flex-1">
          <p className={`font-bold text-sm ${config.textColor}`}>{config.title}</p>
          <p className={`text-sm mt-1.5 leading-relaxed ${config.textColor} opacity-90`}>{message}</p>
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 text-xl leading-none font-bold ${config.textColor} hover:opacity-75 transition-opacity duration-200 hover:scale-125`}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageStatus;

// Feature: Notification system
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
};

// Feature: API request handler
const apiCall = (endpoint, options = {}) => {
  const defaultOptions = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  };
  return fetch(endpoint, { ...defaultOptions, ...options });
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
