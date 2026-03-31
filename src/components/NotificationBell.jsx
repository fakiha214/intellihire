import { useState, useEffect } from "react"
import { Bell, X, Check } from "lucide-react"

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch notifications
  useEffect(() => {
    fetchNotifications()
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/notifications", {
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data)

        // Count unread
        const unread = data.filter(n => !n.isRead).length
        setUnreadCount(unread)
      }
    } catch (err) {
      console.error("Error fetching notifications:", err)
    }
  }

  const markAsRead = async (notifId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${notifId}/read`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      })

      if (response.ok) {
        // Update local state
        setNotifications(notifications.map(n =>
          n.id === notifId ? {...n, isRead: true} : n
        ))
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (err) {
      console.error("Error marking notification as read:", err)
    }
  }

  const markAllAsRead = async () => {
    try {
      setLoading(true)
      const response = await fetch("http://localhost:5000/api/notifications/read-all", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      })

      if (response.ok) {
        // Mark all as read locally
        setNotifications(notifications.map(n => ({...n, isRead: true})))
        setUnreadCount(0)
      }
    } catch (err) {
      console.error("Error marking all as read:", err)
    } finally {
      setLoading(false)
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'application':
        return 'bg-blue-50 border-l-4 border-l-blue-600'
      case 'status_update':
        return 'bg-green-50 border-l-4 border-l-green-600'
      case 'job_match':
        return 'bg-purple-50 border-l-4 border-l-purple-600'
      case 'recommendation':
        return 'bg-yellow-50 border-l-4 border-l-yellow-600'
      default:
        return 'bg-gray-50 border-l-4 border-l-gray-600'
    }
  }

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <button
              onClick={() => setShowDropdown(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      notif.isRead ? 'opacity-75' : ''
                    } ${getNotificationColor(notif.type)}`}
                    onClick={() => !notif.isRead && markAsRead(notif.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{notif.title}</p>
                        {notif.message && (
                          <p className="text-sm text-gray-700 mt-1">{notif.message}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="ml-2 flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && unreadCount > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
              >
                <Check className="h-4 w-4 inline mr-1" />
                {loading ? "Marking..." : "Mark all as read"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  )
}

export default NotificationBell

// Feature: Array utility functions
const arrayUtils = {
  unique: (arr) => [...new Set(arr)],
  flatten: (arr) => arr.reduce((flat, item) => flat.concat(item), []),
  chunk: (arr, size) => Array.from({ length: Math.ceil(arr.length / size) },
    (_, i) => arr.slice(i * size, i * size + size))
};

// Feature: Local storage wrapper
const storage = {
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  get: (key) => JSON.parse(localStorage.getItem(key)),
  remove: (key) => localStorage.removeItem(key),
  clear: () => localStorage.clear()
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

// Feature: Notification system
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
};
