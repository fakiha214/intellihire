"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  Briefcase, MapPin, Building, DollarSign, Star, Search, Filter,
  ChevronDown, ArrowRight, TrendingUp, Clock, CheckCircle, AlertCircle
} from "lucide-react"
import { formatDate, getSafeJobDate } from '../utils/dateUtils'

const Dashboard = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    jobType: [],
    location: [],
    salary: "",
  })
  const [showFilters, setShowFilters] = useState(false)
  const [recommendedJobs, setRecommendedJobs] = useState([])
  const [recommendationsLoading, setRecommendationsLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState(null)
  const [completionPercent, setCompletionPercent] = useState(0)

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats", {
          credentials: "include"
        })
        if (!response.ok) throw new Error("Failed to fetch dashboard stats")
        const data = await response.json()
        setDashboardStats(data)
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      }
    }
    fetchDashboardStats()
  }, [])

  useEffect(() => {
    const fetchProfileCompletion = async () => {
      try {
        const response = await fetch("/api/profile", {
          credentials: "include"
        })
        if (response.ok) {
          const data = await response.json()
          setCompletionPercent(data.completionPercent || 0)
        }
      } catch (error) {
        console.error("Error fetching profile completion:", error)
      }
    }
    if (user?.userType === "jobSeeker") {
      fetchProfileCompletion()
    }
  }, [user])

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setRecommendationsLoading(true)
        const response = await fetch("/api/recommendations/jobs", {
          credentials: "include",
        })
        if (!response.ok) throw new Error("Failed to fetch job recommendations")
        const data = await response.json()
        setRecommendedJobs(data)
      } catch (error) {
        console.error("Error fetching recommendations:", error)
      } finally {
        setRecommendationsLoading(false)
      }
    }
    if (user?.userType === "jobSeeker") {
      fetchRecommendations()
    }
  }, [user])

  const toggleFilter = (category, value) => {
    setFilters((prev) => {
      const current = [...prev[category]]
      if (current.includes(value)) {
        return {
          ...prev,
          [category]: current.filter((item) => item !== value),
        }
      } else {
        return {
          ...prev,
          [category]: [...current, value],
        }
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.fullName || "there"}!</p>
            </div>
            <Link
              to={user?.userType === "jobSeeker" ? "/profile" : "/jobs/manage"}
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {user?.userType === "jobSeeker" ? "Complete Profile" : "Manage Jobs"}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Profile Completion Banner - Job Seeker Only */}
        {user?.userType === "jobSeeker" && completionPercent < 100 && (
          <div className="mb-8 bg-white border border-amber-200 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Complete Your Profile</h3>
              <p className="text-gray-600 text-sm mt-1">Your profile is {completionPercent}% complete. Finish it to improve your job matches.</p>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{width: `${completionPercent}%`}}
                />
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {user?.userType === "jobSeeker" ? (
              <>
                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Active Applications</p>
                      <p className="text-4xl font-bold text-gray-900 mt-2">{dashboardStats.activeApplications || 0}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <Briefcase className="text-blue-600" size={28} />
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Pending Review</p>
                      <p className="text-4xl font-bold text-gray-900 mt-2">{dashboardStats.pendingApplications || 0}</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <Clock className="text-yellow-600" size={28} />
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Reviewed</p>
                      <p className="text-4xl font-bold text-gray-900 mt-2">{dashboardStats.reviewedApplications || 0}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <CheckCircle className="text-green-600" size={28} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Active Postings</p>
                      <p className="text-4xl font-bold text-gray-900 mt-2">{dashboardStats.totalJobs || 0}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <Briefcase className="text-blue-600" size={28} />
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Applications</p>
                      <p className="text-4xl font-bold text-gray-900 mt-2">{dashboardStats.totalApplications || 0}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <TrendingUp className="text-purple-600" size={28} />
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Last 7 Days</p>
                      <p className="text-4xl font-bold text-gray-900 mt-2">{dashboardStats.newApplications || 0}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <CheckCircle className="text-green-600" size={28} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <Search className="text-blue-600" size={32} />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Browse Jobs</h3>
                <p className="text-gray-600 text-sm">Find your next opportunity</p>
              </div>
              <Link to="/jobs" className="text-blue-600 hover:text-blue-700">
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-4">
              <TrendingUp className="text-purple-600" size={32} />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Talent Trends</h3>
                <p className="text-gray-600 text-sm">View market insights</p>
              </div>
              <Link to="/trends" className="text-purple-600 hover:text-purple-700">
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Recommendations Section */}
        {user?.userType === "jobSeeker" && (
          <>
            {/* Search Bar */}
            <div className="card p-6 mb-8">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search for jobs</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Search by title, company, or keywords..."
                    />
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    <Filter size={18} />
                    Advanced Filters
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>

                {/* Filters */}
                {showFilters && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Job Type</label>
                        <div className="space-y-2">
                          {["Full-time", "Part-time", "Contract", "Freelance", "Internship"].map((type) => (
                            <label key={type} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filters.jobType.includes(type)}
                                onChange={() => toggleFilter("jobType", type)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300"
                              />
                              <span className="text-sm text-gray-700">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Location</label>
                        <div className="space-y-2">
                          {["Remote", "New York", "San Francisco", "Boston", "Chicago"].map((location) => (
                            <label key={location} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filters.location.includes(location)}
                                onChange={() => toggleFilter("location", location)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300"
                              />
                              <span className="text-sm text-gray-700">{location}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Salary Range</label>
                        <select
                          value={filters.salary}
                          onChange={(e) => setFilters({ ...filters, salary: e.target.value })}
                          className="input-field w-full"
                        >
                          <option value="">Any Salary</option>
                          <option value="0-50000">PKR 0 - PKR 50,000</option>
                          <option value="50000-100000">PKR 50,000 - PKR 100,000</option>
                          <option value="100000-150000">PKR 100,000 - PKR 150,000</option>
                          <option value="150000+">PKR 150,000+</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setFilters({ jobType: [], location: [], salary: "" })}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Jobs */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
                  <p className="text-gray-600 text-sm mt-1">Based on your skills and preferences</p>
                </div>
                <Link to="/jobs" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  View All →
                </Link>
              </div>

              {recommendationsLoading ? (
                <div className="card p-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent mb-3"></div>
                  <p className="text-gray-600">Finding jobs that match your skills...</p>
                </div>
              ) : recommendedJobs.length === 0 ? (
                <div className="card p-12 text-center">
                  <Briefcase className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600 mb-4">No job recommendations yet. Add more skills to your profile.</p>
                  <Link
                    to="/profile"
                    className="btn btn-primary inline-flex"
                  >
                    Update Your Skills
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {recommendedJobs.slice(0, 4).map((job) => (
                    <div key={job.id} className="card p-6 hover:shadow-md transition-all">
                      <div className="flex flex-col">
                        {/* Match Score */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="text-yellow-400 fill-yellow-400" size={16} />
                            <span className="text-sm font-semibold text-gray-900">{job.matchScore}% Match</span>
                          </div>
                          <span className={`badge ${
                            job.matchScore >= 80 ? 'badge-success' :
                            job.matchScore >= 60 ? 'badge-warning' :
                            'badge-danger'
                          }`}>
                            {job.matchScore >= 80 ? 'Perfect' : job.matchScore >= 60 ? 'Good' : 'Fair'}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{job.title}</h3>
                        <p className="text-gray-600 text-sm flex items-center gap-1 mb-4">
                          <Building size={16} />
                          {job.company}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="badge badge-primary">
                            {job.type}
                          </span>
                          <span className="badge badge-gray flex items-center gap-1">
                            <MapPin size={12} />
                            {job.location}
                          </span>
                          {job.salary && (
                            <span className="badge badge-warning">
                              PKR {job.salary}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {job.description || 'No description available'}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            {formatDate(getSafeJobDate(job, 'posted'))}
                          </p>
                          <Link
                            to={`/jobs/${job.id}`}
                            className="btn btn-sm btn-primary"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!recommendationsLoading && recommendedJobs.length > 4 && (
                <div className="text-center mt-8">
                  <Link
                    to="/jobs"
                    className="btn btn-secondary inline-flex items-center gap-2"
                  >
                    View All {recommendedJobs.length} Recommendations
                    <ArrowRight size={18} />
                  </Link>
                </div>
              )}
            </div>
          </>
        )}

        {/* Employer Section */}
        {user?.userType === "employer" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Jobs</h2>
                <p className="text-gray-600 text-sm mt-1">Manage postings and review applications</p>
              </div>
              <Link 
                to="/jobs/manage" 
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors group"
              >
                View All 
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <Link to="/jobs/manage" className="card p-12 text-center hover:shadow-xl transition-all group border-2 border-transparent hover:border-blue-100 block relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="text-blue-600" size={40} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">Manage Your Job Postings</h3>
                <p className="text-gray-600 text-lg max-w-2xl mb-8 text-center">
                  View all your active postings, review applications, and manage candidates in one place.
                </p>
                <div className="flex justify-center">
                  <span className="btn btn-primary btn-lg shadow-lg shadow-blue-200 group-hover:shadow-blue-300 transition-shadow">
                    Go to Job Manager
                    <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard
