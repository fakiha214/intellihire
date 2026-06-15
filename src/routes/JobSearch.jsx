"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Search,
  Star,
  AlertCircle,
  Building,
  X,
} from "lucide-react"
import { formatDate, getSafeJobDate } from '../utils/dateUtils'

const JobSearch = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    jobType: [],
    location: [],
    experienceLevel: [],
    salary: "",
    remote: false,
  })
  const [userType, setUserType] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  useEffect(() => {
    const checkUserType = async () => {
      try {
        const response = await fetch("/api/auth/status", {
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          }
        })

        if (!response.ok) {
          throw new Error("Failed to check user status")
        }

        const data = await response.json()
        setUserType(data.user?.userType)
      } catch (err) {
        console.error("Error checking user type:", err)
        setError("Failed to verify user type")
      }
    }

    checkUserType()
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/jobs", {
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        }
      })

      if (!response.ok) {
        throw new Error("Failed to fetch jobs")
      }

      const data = await response.json()
      setJobs(data.jobs || data)
    } catch (err) {
      console.error("Error fetching jobs:", err)
      setError(err.message || "An error occurred while fetching jobs")
    } finally {
      setLoading(false)
    }
  }

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
    setCurrentPage(1)
  }

  const filteredJobs = jobs.filter((job) => {
    if (
      searchTerm &&
      !job.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !job.company.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !job.description.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false
    }

    if (filters.jobType.length > 0 && !filters.jobType.includes(job.type)) {
      return false
    }

    if (
      filters.location.length > 0 &&
      !filters.location.some((loc) => job.location.toLowerCase().includes(loc.toLowerCase()))
    ) {
      return false
    }

    if (filters.experienceLevel.length > 0 && !filters.experienceLevel.includes(job.experienceLevel)) {
      return false
    }

    if (filters.remote && !job.isRemote) {
      return false
    }

    return true
  })

  const sortedJobs = [...filteredJobs].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))

  const totalPages = Math.ceil(sortedJobs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedJobs = sortedJobs.slice(startIndex, startIndex + itemsPerPage)

  const hasActiveFilters = Object.values(filters).some((f) => (Array.isArray(f) ? f.length > 0 : f))

  if (userType && userType !== 'jobSeeker') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            Only job seekers can access the job search page. Please log in as a job seeker to continue.
          </p>
          <Link
            to="/signin"
            className="btn btn-primary inline-block"
          >
            Sign In as Job Seeker
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Your Perfect Job</h1>
          <p className="text-gray-600 mt-2">Discover opportunities that match your skills and preferences</p>

          {/* Search Bar */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search jobs by title, company, or keywords..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <aside className="lg:col-span-1">
            <div className="card p-6 sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={() =>
                      setFilters({
                        jobType: [],
                        location: [],
                        experienceLevel: [],
                        salary: "",
                        remote: false,
                      })
                    }
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Job Type */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Job Type</h4>
                <div className="space-y-2">
                  {["Full-time", "Part-time", "Contract", "Freelance", "Internship"].map((type) => (
                    <label key={type} className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.jobType.includes(type)}
                        onChange={() => toggleFilter("jobType", type)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                      />
                      <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Location</h4>
                <div className="space-y-2">
                  {["Remote", "Karachi", "Lahore", "Islamabad", "Faisalabad"].map((location) => (
                    <label key={location} className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.location.includes(location)}
                        onChange={() => toggleFilter("location", location)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                      />
                      <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">{location}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Experience</h4>
                <div className="space-y-2">
                  {["Entry-level", "Mid-level", "Senior-level", "Executive"].map((level) => (
                    <label key={level} className="flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.experienceLevel.includes(level)}
                        onChange={() => toggleFilter("experienceLevel", level)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                      />
                      <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Salary Range */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Salary (PKR)</h4>
                <select
                  value={filters.salary}
                  onChange={(e) => {
                    setFilters({ ...filters, salary: e.target.value })
                    setCurrentPage(1)
                  }}
                  className="w-full input-field text-sm"
                >
                  <option value="">Any Salary</option>
                  <option value="0-500000">0 - 5,00,000</option>
                  <option value="500000-1000000">5,00,000 - 10,00,000</option>
                  <option value="1000000-1500000">10,00,000 - 15,00,000</option>
                  <option value="1500000+">15,00,000+</option>
                </select>
              </div>

              {/* Remote Only */}
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.remote}
                  onChange={(e) => {
                    setFilters({ ...filters, remote: e.target.checked })
                    setCurrentPage(1)
                  }}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">Remote Only</span>
              </label>
            </div>
          </aside>

          {/* Main Content - Job Grid */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {hasActiveFilters || searchTerm ? "Search Results" : "Recommended Jobs"}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {loading ? "Loading..." : `${sortedJobs.length} job${sortedJobs.length !== 1 ? "s" : ""} found`}
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading jobs...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="card p-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchJobs}
                  className="btn btn-primary"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* No Results */}
            {!loading && !error && sortedJobs.length === 0 && (
              <div className="card p-12 text-center">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or search term to find more opportunities.</p>
                <button
                  onClick={() => {
                    setSearchTerm("")
                    setFilters({
                      jobType: [],
                      location: [],
                      experienceLevel: [],
                      salary: "",
                      remote: false,
                    })
                  }}
                  className="btn btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Job Grid */}
            {!loading && !error && sortedJobs.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {paginatedJobs.map((job) => (
                    <div key={job.id} className="card p-6 hover:shadow-lg transition-all group">
                      {/* Match Score */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="text-yellow-400 fill-yellow-400" size={16} />
                          <span className="text-sm font-semibold text-gray-900">
                            {job.matchScore ? `${job.matchScore}% Match` : "New"}
                          </span>
                        </div>
                        {job.is_remote && (
                          <span className="badge badge-primary text-xs">Remote</span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-gray-600 text-sm flex items-center gap-1 mb-4">
                        <Building size={16} />
                        {job.company}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="badge badge-primary text-xs">
                          <Briefcase size={12} />
                          {job.type}
                        </span>
                        <span className="badge badge-gray text-xs">
                          <MapPin size={12} />
                          {job.location}
                        </span>
                        {job.salary && (
                          <span className="badge badge-warning text-xs">
                            PKR {job.salary}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {job.description}
                      </p>

                      {/* Footer */}
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <span className="text-xs text-gray-500">
                          {formatDate(getSafeJobDate(job, 'posted'))}
                        </span>
                        <Link
                          to={`/jobs/${job.id}`}
                          className="btn btn-sm btn-primary"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = currentPage - 2 + i
                        if (page < 1 || page > totalPages) return null
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded-lg transition-colors ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default JobSearch

