"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  Briefcase,
  MapPin,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  AlertCircle,
  User,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { formatDate, getSafeJobDate } from '../utils/dateUtils'

const ManageJobs = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({ status: "all" })
  const [deleteJobId, setDeleteJobId] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/jobs/employer", {
        credentials: "include",
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        throw new Error("Server error: " + text)
      }

      if (!response.ok) {
        throw new Error("Failed to fetch jobs")
      }

      const data = await response.json()
      setJobs(data)
    } catch (err) {
      console.error("Error fetching jobs:", err)
      setError(err.message || "An error occurred while fetching jobs")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteJob = async (jobId) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete job")
      }

      setJobs(jobs.filter((job) => job.id !== jobId))
      setShowDeleteConfirm(false)
    } catch (err) {
      console.error("Error deleting job:", err)
      setError(err.message || "An error occurred while deleting the job")
    }
  }

  // Filter jobs based on search and filters
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      filters.status === "all" ||
      (filters.status === "active" && job.isActive) ||
      (filters.status === "expired" && job.isExpired) ||
      (filters.status === "draft" && job.isDraft)
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const stats = [
    { label: "Total Jobs", value: jobs.length, icon: Briefcase, color: "bg-blue-50 text-blue-600" },
    { label: "Active", value: jobs.filter(j => j.isActive).length, icon: CheckCircle, color: "bg-green-50 text-green-600" },
    { label: "Expired", value: jobs.filter(j => j.isExpired).length, icon: XCircle, color: "bg-red-50 text-red-600" },
    { label: "Draft", value: jobs.filter(j => j.isDraft).length, icon: Clock, color: "bg-yellow-50 text-yellow-600" },
  ]

  const getStatusBadge = (job) => {
    if (job.isActive) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>
    } else if (job.isExpired) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Expired</span>
    } else if (job.isDraft) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Draft</span>
    }
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Pending</span>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Jobs</h1>
              <p className="text-gray-600 text-sm mt-1">View and manage all your job postings</p>
            </div>
            <Link
              to="/jobs/post"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Post New Job
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-6">Filters</h2>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Job title"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
                <div className="space-y-2">
                  {[
                    { value: "all", label: "All Jobs" },
                    { value: "active", label: "Active" },
                    { value: "expired", label: "Expired" },
                    { value: "draft", label: "Draft" },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={filters.status === option.value}
                        onChange={(e) => setFilters({ status: e.target.value })}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
                <p className="text-gray-600 mt-4">Loading jobs...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 mb-6">{error}</p>
                  <button
                    onClick={fetchJobs}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {jobs.length === 0 ? "No Jobs Posted Yet" : "No matching jobs"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {jobs.length === 0
                    ? "Start attracting top talent by posting your first job."
                    : "Try adjusting your filters or search."}
                </p>
                {jobs.length === 0 && (
                  <Link
                    to="/jobs/post"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={18} />
                    Post a Job
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                          {getStatusBadge(job)}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin size={16} />
                            {job.location}
                            {job.isRemote && <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">Remote</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase size={16} />
                            {job.type}
                          </div>
                          {job.salary && (
                            <div className="flex items-center gap-1 font-medium">
                              <DollarSign size={16} />
                              PKR {job.salary}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div>Posted {formatDate(getSafeJobDate(job, 'posted'))}</div>
                        <div className="flex items-center gap-1">
                          <User size={16} />
                          <span>{job.applicationsCount || 0} applications</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          to={`/jobs/${job.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Job"
                        >
                          <Eye size={20} />
                        </Link>
                        <Link
                          to={`/jobs/${job.id}/applications`}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="View Applications"
                        >
                          <User size={20} />
                        </Link>
                        <Link
                          to={`/jobs/${job.id}/edit`}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Job"
                        >
                          <Edit size={20} />
                        </Link>
                        <button
                          onClick={() => {
                            setDeleteJobId(job.id)
                            setShowDeleteConfirm(true)
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Job"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Job</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this job? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteJobId(null)
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteJob(deleteJobId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageJobs

