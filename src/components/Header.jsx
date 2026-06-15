"use client"

import { useState } from "react"
import { Menu, X, User, LogOut, Settings, ChevronDown, Home, Search, FileText, TrendingUp, Calendar, Mail, Users } from "lucide-react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import NotificationBell from "./NotificationBell"
import ChatModal from "./ChatModal"

const Header = ({ isAuthenticated, user, onLogout, loading }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await onLogout()
    navigate('/')
  }

  const getNavigationItems = () => {
    const isJobSeeker = user?.userType === 'jobSeeker'
    const isEmployer = user?.userType === 'employer'

    const commonItems = [
      { path: '/dashboard', label: 'Dashboard', icon: Home },
      { path: '/profile', label: 'Profile', icon: User },
      { path: '/trends', label: 'Trends', icon: TrendingUp },
    ]

    const jobSeekerItems = [
      { path: '/jobs', label: 'Find Jobs', icon: Search },
      { path: '/applications', label: 'My Applications', icon: FileText },
    ]

    const employerItems = [
      { path: '/jobs/post', label: 'Post Job', icon: Home },
      { path: '/jobs/manage', label: 'Manage Jobs', icon: Settings },
      { path: '/resumes/analyze', label: 'Bulk CV Ranking', icon: Users },
      { path: '/events', label: 'Job Fairs', icon: Calendar },
      { path: '/events/invitations', label: 'Invitations', icon: Mail },
    ]

    if (isJobSeeker) {
      return [...commonItems, ...jobSeekerItems]
    } else if (isEmployer) {
      return [...commonItems, ...employerItems]
    }

    return commonItems
  }

  const isActive = (path) => location.pathname === path

  // Check if we should show AI Chat: only on job detail and job applications pages
  const shouldShowAIChat = () => {
    const pathname = location.pathname
    // Match /jobs/:id (job detail for seekers)
    // Match /jobs/:id/applications (applications for employers)
    return /^\/jobs\/\d+$/.test(pathname) || /^\/jobs\/\d+\/applications$/.test(pathname)
  }

  if (loading) {
    return <div className="h-20 bg-white border-b border-gray-200"></div>
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Logo Section */}
          <Link to="/" className="flex items-center flex-shrink-0 mr-8">
            <img src="/FYP_LOGO.webp" alt="IntelliHire" className="h-14 w-auto object-contain" />
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center">
              <div className="flex items-center space-x-1">
                {getNavigationItems().map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all relative group ${isActive(item.path)
                          ? "text-blue-600"
                          : "text-gray-700 hover:text-gray-900"
                        }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                      {/* Underline effect */}
                      <span
                        className={`absolute bottom-0 left-0 h-1 bg-blue-600 transition-all duration-300 ${isActive(item.path) ? "w-full" : "w-0 group-hover:w-full"
                          }`}
                      />
                    </Link>
                  )
                })}
              </div>
            </nav>
          )}

          {/* Right Side - Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />

                {/* AI Chat Button - Only on Job Detail and Applications pages */}
                {shouldShowAIChat() && <ChatModal />}

                {/* Divider */}
                {shouldShowAIChat() && <div className="hidden sm:block w-px h-6 bg-gray-200 mx-2"></div>}

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                      {user?.fullName?.charAt(0).toUpperCase() || <User size={18} />}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-semibold text-gray-900 leading-none">
                        {user?.fullName?.split(' ')[0] || "User"}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{user?.userType}</p>
                    </div>
                    <ChevronDown size={18} className={`text-gray-600 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10 animate-fadeIn">
                      {/* Header */}
                      <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <p className="text-sm font-bold text-gray-900">{user?.fullName || "User"}</p>
                        <p className="text-xs text-gray-600 mt-1 capitalize">{user?.userType === 'jobSeeker' ? 'Job Seeker' : 'Employer'}</p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Home size={18} />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <User size={18} />
                          <span>My Profile</span>
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Settings size={18} />
                          <span>Settings</span>
                        </Link>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-100"></div>

                      {/* Sign Out */}
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false)
                          handleLogout()
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                      >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/signin"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 ml-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && isAuthenticated && (
        <div className="lg:hidden border-t border-gray-200 bg-white animate-slideDown">
          <nav className="px-4 py-3 space-y-1">
            {getNavigationItems().map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive(item.path)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              )
            })}

            <div className="border-t border-gray-200 my-3 pt-3">
              <button
                onClick={() => {
                  setIsMenuOpen(false)
                  handleLogout()
                }}
                className="flex items-center gap-3 px-4 py-3 text-red-600 font-medium hover:bg-red-50 rounded-lg w-full transition-colors"
              >
                <LogOut size={20} />
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header