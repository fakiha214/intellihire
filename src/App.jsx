"use client"

import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Header from "./components/Header"
import Hero from "./components/Hero"
import Features from "./components/Features"
import HowItWorks from "./components/HowItWorks"
import UserTypes from "./components/UserTypes"
import Testimonials from "./components/Testimonials"
import CallToAction from "./components/CallToAction"
import Footer from "./components/Footer"
import SignIn from "./routes/signin"
import SignUp from "./routes/signup"
import ProfileCompletion from "./routes/ProfileCompletion"
import Dashboard from "./routes/Dashboard"
import UserProfile from "./routes/UserProfile"
import PostJob from "./routes/PostJob"
import ManageJobs from "./routes/ManageJobs"
import JobSearch from "./routes/JobSearch"
import JobDetail from "./routes/JobDetail"
import MyApplications from "./routes/MyApplications"
import JobApplications from "./routes/JobApplications"
import CandidateRecommendations from "./routes/CandidateRecommendations"
import EditJob from "./routes/EditJob"
import ApplicationDetail from "./routes/ApplicationDetail"
import Settings from "./routes/Settings"
import Terms from "./routes/Terms"
import TalentTrends from "./routes/TalentTrends"
import ResumeAnalyzer from "./routes/ResumeAnalyzer"
import EventJoinPage from "./routes/events/EventJoinPage"
import CreateEvent from "./routes/events/CreateEvent"
import MyEvents from "./routes/events/MyEvents"
import EventDashboard from "./routes/events/EventDashboard"
import EventEmployerPortal from "./routes/events/EventEmployerPortal"
import EventBrowsePage from "./routes/events/EventBrowsePage"
import EventInvitations from "./routes/events/EventInvitations"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const checkAuthStatus = async () => {
      try {
        // First check localStorage
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          setUser(userData)
          setIsAuthenticated(true)
        }

        // Then verify with server
        const response = await fetch("/api/auth/status", {
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          }
        })

        console.log("Auth status response:", response.status);
        const data = await response.json();
        console.log("Auth status data:", data);

        if (response.ok && data.isAuthenticated) {
          setIsAuthenticated(true)
          setUser(data.user)
          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(data.user))
        } else {
          setIsAuthenticated(false)
          setUser(null)
          localStorage.removeItem('user')
        }
      } catch (error) {
        console.error("Error checking auth status:", error)
        setIsAuthenticated(false)
        setUser(null)
        localStorage.removeItem('user')
      } finally {
        setLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  // Update the logout function
  const logout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        }
      })

      if (response.ok) {
        setIsAuthenticated(false)
        setUser(null)
        localStorage.removeItem('user') // Clear user data from localStorage
        // Redirect to home page
        window.location.href = "/"
      } else {
        console.error("Logout failed:", response.status)
      }
    } catch (error) {
      console.error("Error logging out:", error)
      // Still clear the state and redirect even if the server request fails
      setIsAuthenticated(false)
      setUser(null)
      localStorage.removeItem('user')
      window.location.href = "/"
    }
  }

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (loading) return <div>Loading...</div>

    if (!isAuthenticated) {
      return <Navigate to="/signin" replace />
    }

    return children
  }

  // Add a new route guard for completed profile
  const ProfileRequiredRoute = ({ children }) => {
    const [profileChecked, setProfileChecked] = useState(false);
    const [hasProfile, setHasProfile] = useState(false);

    useEffect(() => {
      const checkProfile = async () => {
        try {
          const response = await fetch("/api/profile", {
            credentials: "include"
          });

          setHasProfile(response.ok);
        } catch (error) {
          console.error("Error checking profile:", error);
          setHasProfile(false);
        } finally {
          setProfileChecked(true);
        }
      };

      checkProfile();
    }, []);

    if (!profileChecked) return <div>Loading...</div>;

    if (!hasProfile) {
      return <Navigate to="/complete-profile" replace />;
    }

    return children;
  };

  // Helper function to determine if header should be shown
  const shouldShowHeader = (pathname) => {
    return !['/signin', '/signup'].includes(pathname)
  }

  return (
    <Router>
      <Routes>
        {/* Auth routes without header */}
        <Route path="/signin" element={<SignIn setIsAuthenticated={setIsAuthenticated} setUser={setUser} />} />
        <Route path="/signup" element={<SignUp setIsAuthenticated={setIsAuthenticated} setUser={setUser} />} />

        {/* All other routes with header */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex flex-col">
              {shouldShowHeader(window.location.pathname) && (
                <Header
                  isAuthenticated={isAuthenticated}
                  user={user}
                  onLogout={logout}
                  loading={loading}
                />
              )}
              <Routes>
                <Route
                  path="/complete-profile"
                  element={
                    <ProtectedRoute>
                      <ProfileCompletion user={user} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <ProfileRequiredRoute>
                        <Dashboard user={user} />
                      </ProfileRequiredRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <UserProfile user={user} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/edit"
                  element={
                    <ProtectedRoute>
                      <ProfileCompletion user={user} initialStep={1} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/edit/about"
                  element={
                    <ProtectedRoute>
                      <ProfileCompletion user={user} initialStep={1} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/edit/skills"
                  element={
                    <ProtectedRoute>
                      <ProfileCompletion user={user} initialStep={2} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/edit/experience"
                  element={
                    <ProtectedRoute>
                      <ProfileCompletion user={user} initialStep={3} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/edit/education"
                  element={
                    <ProtectedRoute>
                      <ProfileCompletion user={user} initialStep={4} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/edit/preferences"
                  element={
                    <ProtectedRoute>
                      <ProfileCompletion user={user} initialStep={5} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings user={user} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/trends"
                  element={
                    <ProtectedRoute>
                      <TalentTrends />
                    </ProtectedRoute>
                  }
                />
                {/* Job posting routes */}
                <Route
                  path="/jobs/post"
                  element={
                    <ProtectedRoute>
                      <ProfileRequiredRoute>
                        <PostJob />
                      </ProfileRequiredRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/jobs/manage"
                  element={
                    <ProtectedRoute>
                      <ProfileRequiredRoute>
                        <ManageJobs />
                      </ProfileRequiredRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/jobs/:id/edit"
                  element={
                    <ProtectedRoute>
                      <ProfileRequiredRoute>
                        <EditJob />
                      </ProfileRequiredRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/resumes/analyze"
                  element={
                    <ProtectedRoute>
                      <ProfileRequiredRoute>
                        <ResumeAnalyzer />
                      </ProfileRequiredRoute>
                    </ProtectedRoute>
                  }
                />
                <Route path="/jobs" element={<JobSearch />} />
                <Route path="/jobs/:id" element={<JobDetail />} />
                <Route
                  path="/applications"
                  element={
                    <ProtectedRoute>
                      <ProfileRequiredRoute>
                        <MyApplications />
                      </ProfileRequiredRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/applications/:id"
                  element={
                    <ProtectedRoute>
                      <ProfileRequiredRoute>
                        <ApplicationDetail />
                      </ProfileRequiredRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/jobs/:id/applications"
                  element={
                    <ProtectedRoute>
                      <ProfileRequiredRoute>
                        <JobApplications />
                      </ProfileRequiredRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/jobs/:id/candidates"
                  element={
                    <ProtectedRoute>
                      <ProfileRequiredRoute>
                        <CandidateRecommendations />
                      </ProfileRequiredRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Event Routes - Order matters: specific paths before dynamic :eventId */}
                <Route
                  path="/events/join/:token"
                  element={<EventJoinPage isAuthenticated={isAuthenticated} user={user} />}
                />
                <Route
                  path="/events/invitations"
                  element={
                    <ProtectedRoute>
                      <ProfileRequiredRoute>
                        <EventInvitations />
                      </ProfileRequiredRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/events"
                  element={
                    <ProtectedRoute>
                      <ProfileRequiredRoute>
                        <MyEvents />
                      </ProfileRequiredRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/events/create"
                  element={
                    <ProtectedRoute>
                      <ProfileRequiredRoute>
                        <CreateEvent />
                      </ProfileRequiredRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/events/:eventId/edit"
                  element={
                    <ProtectedRoute>
                      <ProfileRequiredRoute>
                        <CreateEvent />
                      </ProfileRequiredRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/events/:eventId/dashboard"
                  element={
                    <ProtectedRoute>
                      <ProfileRequiredRoute>
                        <EventDashboard />
                      </ProfileRequiredRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/events/:eventId/employer-portal"
                  element={
                    <ProtectedRoute>
                      <ProfileRequiredRoute>
                        <EventEmployerPortal />
                      </ProfileRequiredRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/events/:eventId/browse"
                  element={
                    <ProtectedRoute>
                      <ProfileRequiredRoute>
                        <EventBrowsePage user={user} />
                      </ProfileRequiredRoute>
                    </ProtectedRoute>
                  }
                />

                <Route path="/terms" element={<Terms />} />
                <Route
                  path="/"
                  element={
                    <main className="flex-grow">
                      <Hero />
                      <Features />
                      <HowItWorks />
                      <UserTypes />
                      <Testimonials />
                      <CallToAction />
                    </main>
                  }
                />
              </Routes>
              <Footer />
            </div>
          }
        />
      </Routes>
    </Router>
  )
}

export default App

