"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Lock, Bell, AlertTriangle, Eye, EyeOff } from "lucide-react"

const Settings = ({ user }) => {
  const [activeTab, setActiveTab] = useState("account")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    jobAlerts: true,
    applicationUpdates: true,
    recommendations: true
  })

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData({
      ...passwordData,
      [name]: value
    })
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validate passwords
    if (passwordData.currentPassword === "") {
      setError("Current password is required")
      return
    }

    if (passwordData.newPassword === "") {
      setError("New password is required")
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:5000/api/auth/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
        credentials: "include"
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to change password")
      }

      setSuccess("Password changed successfully!")
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
    } catch (err) {
      console.error("Error changing password:", err)
      setError(err.message || "Failed to change password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationChange = (key) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key]
    })
    // Save to localStorage for now
    localStorage.setItem('notificationPreferences', JSON.stringify({
      ...notifications,
      [key]: !notifications[key]
    }))
  }

  const handleDeleteAccount = async () => {
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:5000/api/auth/account", {
        method: "DELETE",
        headers: {
          "Accept": "application/json"
        },
        credentials: "include"
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete account")
      }

      // Clear localStorage and redirect
      localStorage.removeItem('user')
      window.location.href = "/"
    } catch (err) {
      console.error("Error deleting account:", err)
      setError(err.message || "Failed to delete account")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-600 rounded-md">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <nav className="space-y-0">
                  <button
                    onClick={() => {
                      setActiveTab("account")
                      setError("")
                      setSuccess("")
                    }}
                    className={`w-full text-left px-4 py-3 border-l-4 transition-colors ${
                      activeTab === "account"
                        ? "border-l-blue-600 bg-blue-50 text-blue-600 font-medium"
                        : "border-l-transparent text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Account Info
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("password")
                      setError("")
                      setSuccess("")
                    }}
                    className={`w-full text-left px-4 py-3 border-l-4 transition-colors ${
                      activeTab === "password"
                        ? "border-l-blue-600 bg-blue-50 text-blue-600 font-medium"
                        : "border-l-transparent text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Change Password
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("notifications")
                      setError("")
                      setSuccess("")
                    }}
                    className={`w-full text-left px-4 py-3 border-l-4 transition-colors ${
                      activeTab === "notifications"
                        ? "border-l-blue-600 bg-blue-50 text-blue-600 font-medium"
                        : "border-l-transparent text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Notifications
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("danger")
                      setError("")
                      setSuccess("")
                    }}
                    className={`w-full text-left px-4 py-3 border-l-4 transition-colors ${
                      activeTab === "danger"
                        ? "border-l-red-600 bg-red-50 text-red-600 font-medium"
                        : "border-l-transparent text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Danger Zone
                  </button>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3">
              {/* Account Info Tab */}
              {activeTab === "account" && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={user?.fullName || ""}
                        disabled
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Update your name in your profile</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                      <input
                        type="text"
                        value={user?.userType === "jobSeeker" ? "Job Seeker" : "Employer"}
                        disabled
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Account type cannot be changed</p>
                    </div>

                    <div className="pt-4">
                      <Link
                        to="/profile/edit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-block"
                      >
                        Edit Profile
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === "password" && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                    <Lock className="h-5 w-5 mr-2" />
                    Change Password
                  </h2>
                  <p className="text-gray-600 mb-6">Update your password to keep your account secure</p>

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="currentPassword"
                          name="currentPassword"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.current ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="newPassword"
                          name="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.new ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                        isLoading ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {isLoading ? "Updating..." : "Update Password"}
                    </button>
                  </form>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notification Preferences
                  </h2>
                  <p className="text-gray-600 mb-6">Manage how you receive notifications and alerts</p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Email Alerts</p>
                        <p className="text-sm text-gray-600">Receive general email notifications</p>
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          checked={notifications.emailAlerts}
                          onChange={() => handleNotificationChange("emailAlerts")}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Job Alerts</p>
                        <p className="text-sm text-gray-600">Get notified about new job matches</p>
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          checked={notifications.jobAlerts}
                          onChange={() => handleNotificationChange("jobAlerts")}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Application Updates</p>
                        <p className="text-sm text-gray-600">Receive updates on your applications</p>
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          checked={notifications.applicationUpdates}
                          onChange={() => handleNotificationChange("applicationUpdates")}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Recommendations</p>
                        <p className="text-sm text-gray-600">Get personalized job recommendations</p>
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          checked={notifications.recommendations}
                          onChange={() => handleNotificationChange("recommendations")}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-6">
                    Your notification preferences have been automatically saved.
                  </p>
                </div>
              )}

              {/* Danger Zone Tab */}
              {activeTab === "danger" && (
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-l-red-500">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                    Danger Zone
                  </h2>
                  <p className="text-gray-600 mb-6">
                    This section contains actions that cannot be undone. Please proceed with caution.
                  </p>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Delete Account</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Permanently delete your account and all associated data. This action cannot be reversed.
                    </p>

                    {showDeleteConfirm ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 font-medium mb-4">
                          Are you sure you want to delete your account? All your data will be permanently removed.
                        </p>
                        <div className="flex gap-4">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={isLoading}
                            className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors ${
                              isLoading ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                          >
                            {isLoading ? "Deleting..." : "Yes, Delete My Account"}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isLoading}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Delete Account
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Settings

// Feature: Form submission handler
const handleFormSubmit = (e, formData, callback) => {
  e.preventDefault();
  if (!formData.email || !formData.password) {
    console.error('Missing required fields');
    return;
  }
  callback(formData);
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

// Feature: Local storage wrapper
const storage = {
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  get: (key) => JSON.parse(localStorage.getItem(key)),
  remove: (key) => localStorage.removeItem(key),
  clear: () => localStorage.clear()
};
