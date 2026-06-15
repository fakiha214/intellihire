"use client"

import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Briefcase, MapPin, DollarSign, Calendar, Download, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react"
import { formatDate } from '../utils/dateUtils'
import { getBackendUrl } from '../utils/getBackendUrl'

const ApplicationDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [application, setApplication] = useState(null)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        setLoading(true)

        // Fetch all applications
        const response = await fetch("/api/applications", {
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          }
        })

        if (!response.ok) {
          throw new Error("Failed to fetch applications")
        }

        const applications = await response.json()
        const foundApplication = applications.find(app => app.id === parseInt(id))

        if (!foundApplication) {
          throw new Error("Application not found")
        }

        setApplication(foundApplication)

        // Fetch job details
        const jobResponse = await fetch(`/api/jobs/${foundApplication.jobId}`, {
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          }
        })

        if (jobResponse.ok) {
          const jobData = await jobResponse.json()
          setJob(jobData)
        }
      } catch (err) {
        console.error("Error fetching application details:", err)
        setError(err.message || "Failed to load application details")
      } finally {
        setLoading(false)
      }
    }

    fetchApplicationDetails()
  }, [id])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'applied':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'reviewed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'interviewed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'reviewed':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'interviewed':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading application details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            to="/applications"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Applications
          </Link>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Not Found</h2>
          <p className="text-gray-600 mb-4">This application could not be found.</p>
          <Link
            to="/applications"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Applications
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/applications')}
              className="text-blue-600 hover:text-blue-800 mr-4"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Application Details</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Job Information */}
          {job && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{job.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Company</p>
                  <p className="text-lg font-semibold text-gray-900">{job.company}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Location</p>
                  <div className="flex items-center text-gray-900">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{job.location}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Job Type</p>
                  <p className="text-lg font-semibold text-gray-900">{job.type}</p>
                </div>
                {job.salary && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Salary</p>
                    <div className="flex items-center text-gray-900">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>{job.salary}</span>
                    </div>
                  </div>
                )}
              </div>
              <Link
                to={`/jobs/${job.id}`}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                View Full Job Posting →
              </Link>
            </div>
          )}

          {/* Application Status */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
            <div className="flex items-center gap-4 mb-6">
              {getStatusIcon(application.status)}
              <div className={`px-4 py-2 rounded-lg border ${getStatusColor(application.status)}`}>
                <p className="capitalize font-medium">{application.status}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Applied Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {application.appliedDate && formatDate(new Date(application.appliedDate))}
                </p>
              </div>
              {application.updatedAt && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(new Date(application.updatedAt))}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cover Letter */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cover Letter</h3>
            {application.coverLetter ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{application.coverLetter}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No cover letter provided</p>
            )}
          </div>

          {/* Resume */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume</h3>
            {application.resumeUrl ? (
              <a
                href={getBackendUrl(application.resumeUrl)}
                download
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Resume
              </a>
            ) : (
              <p className="text-gray-500 italic">No resume attached</p>
            )}
          </div>

          {/* Employer Feedback */}
          {(application.feedback || application.interviewNotes || application.offerDetails) && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Employer Feedback</h3>

              {application.feedback && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2 font-medium">Feedback</p>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <p className="text-red-800">{application.feedback}</p>
                  </div>
                </div>
              )}

              {application.interviewNotes && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2 font-medium">Interview Notes</p>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-blue-800">{application.interviewNotes}</p>
                  </div>
                </div>
              )}

              {application.offerDetails && (
                <div>
                  <p className="text-sm text-gray-600 mb-2 font-medium">Offer Details</p>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-green-800">{application.offerDetails}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Back Button */}
          <div className="flex justify-center">
            <Link
              to="/applications"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Back to Applications
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ApplicationDetail
