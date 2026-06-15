"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Briefcase, MapPin, DollarSign, Calendar, Save, Plus, Trash2, AlertCircle } from "lucide-react"

const EditJob = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [userType, setUserType] = useState(null)
  const [isDraft, setIsDraft] = useState(false)

  const [jobData, setJobData] = useState({
    title: "",
    company: "",
    location: "",
    type: "Full-time",
    salary: "",
    description: "",
    requirements: [""],
    responsibilities: [""],
    benefits: [""],
    applicationDeadline: "",
    applicationEmail: "",
    applicationUrl: "",
    isRemote: false,
    experienceLevel: "Entry-level",
  })

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
    const fetchJob = async () => {
      try {
        setIsFetching(true)
        const response = await fetch(`/api/jobs/${id}`, {
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          }
        })

        if (!response.ok) {
          throw new Error("Failed to fetch job")
        }

        const data = await response.json()
        setJobData({
          title: data.title || "",
          company: data.company || "",
          location: data.location || "",
          type: data.type || "Full-time",
          salary: data.salary || "",
          description: data.description || "",
          requirements: data.requirements ? JSON.parse(data.requirements) : [""],
          responsibilities: data.responsibilities ? JSON.parse(data.responsibilities) : [""],
          benefits: data.benefits ? JSON.parse(data.benefits) : [""],
          applicationDeadline: data.applicationDeadline || "",
          applicationEmail: data.applicationEmail || "",
          applicationUrl: data.applicationUrl || "",
          isRemote: data.isRemote || false,
          experienceLevel: data.experienceLevel || "Entry-level",
        })
        setIsDraft(data.isDraft || false)
      } catch (err) {
        console.error("Error fetching job:", err)
        setError(err.message || "Failed to fetch job details")
      } finally {
        setIsFetching(false)
      }
    }

    if (id) {
      fetchJob()
    }
  }, [id])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setJobData({
      ...jobData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleArrayItemChange = (field, index, value) => {
    const newArray = [...jobData[field]]
    newArray[index] = value
    setJobData({
      ...jobData,
      [field]: newArray,
    })
  }

  const addArrayItem = (field) => {
    setJobData({
      ...jobData,
      [field]: [...jobData[field], ""],
    })
  }

  const removeArrayItem = (field, index) => {
    const newArray = [...jobData[field]]
    newArray.splice(index, 1)
    setJobData({
      ...jobData,
      [field]: newArray,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      if (!jobData.title || !jobData.description) {
        throw new Error("Job title and description are required")
      }

      const response = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(jobData),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update job")
      }

      setSuccess("Job updated successfully!")
      setTimeout(() => {
        navigate("/jobs/manage")
      }, 2000)
    } catch (err) {
      console.error("Error updating job:", err)
      setError(err.message || "An error occurred while updating the job")
    } finally {
      setIsLoading(false)
    }
  }

  if (userType && userType !== 'employer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            Only employers can edit jobs. Please log in as an employer to continue.
          </p>
          <Link
            to="/signin"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign In as Employer
          </Link>
        </div>
      </div>
    )
  }

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link to="/jobs/manage" className="text-blue-600 hover:text-blue-800 mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Edit Job</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">{error}</div>}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-600 rounded-md">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-6">
              {/* Basic Job Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Job Title */}
                  <div className="md:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="title"
                        name="title"
                        type="text"
                        required
                        value={jobData.title}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. Senior Frontend Developer"
                      />
                    </div>
                  </div>

                  {/* Company Name */}
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      required
                      value={jobData.company}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your company name"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="location"
                        name="location"
                        type="text"
                        required
                        value={jobData.location}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. Karachi, Pakistan"
                      />
                    </div>
                  </div>

                  {/* Job Type */}
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                      Job Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="type"
                      name="type"
                      required
                      value={jobData.type}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-1">
                      Experience Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="experienceLevel"
                      name="experienceLevel"
                      required
                      value={jobData.experienceLevel}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Entry-level">Entry-level</option>
                      <option value="Mid-level">Mid-level</option>
                      <option value="Senior-level">Senior-level</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </div>

                  {/* Salary */}
                  <div>
                    <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                      Salary (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="salary"
                        name="salary"
                        type="text"
                        value={jobData.salary}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. 50,000 - 75,000 PKR"
                      />
                    </div>
                  </div>

                  {/* Remote Option */}
                  <div className="flex items-center">
                    <input
                      id="isRemote"
                      name="isRemote"
                      type="checkbox"
                      checked={jobData.isRemote}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isRemote" className="ml-2 text-sm font-medium text-gray-700">
                      Remote Friendly
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  required
                  value={jobData.description}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter the full job description"
                ></textarea>
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                <div className="space-y-2">
                  {jobData.requirements.map((req, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) => handleArrayItemChange("requirements", index, e.target.value)}
                        className="block flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. 5+ years of experience"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem("requirements", index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addArrayItem("requirements")}
                  className="mt-2 px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Requirement
                </button>
              </div>

              {/* Responsibilities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Responsibilities</label>
                <div className="space-y-2">
                  {jobData.responsibilities.map((resp, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={resp}
                        onChange={(e) => handleArrayItemChange("responsibilities", index, e.target.value)}
                        className="block flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. Lead frontend development"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem("responsibilities", index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addArrayItem("responsibilities")}
                  className="mt-2 px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Responsibility
                </button>
              </div>

              {/* Benefits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Benefits</label>
                <div className="space-y-2">
                  {jobData.benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={benefit}
                        onChange={(e) => handleArrayItemChange("benefits", index, e.target.value)}
                        className="block flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. Health insurance"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem("benefits", index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addArrayItem("benefits")}
                  className="mt-2 px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Benefit
                </button>
              </div>

              {/* Application Details */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Application Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Application Deadline */}
                  <div>
                    <label htmlFor="applicationDeadline" className="block text-sm font-medium text-gray-700 mb-1">
                      Application Deadline
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="applicationDeadline"
                        name="applicationDeadline"
                        type="date"
                        value={jobData.applicationDeadline}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Application Email */}
                  <div>
                    <label htmlFor="applicationEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      Application Email
                    </label>
                    <input
                      id="applicationEmail"
                      name="applicationEmail"
                      type="email"
                      value={jobData.applicationEmail}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. careers@company.com"
                    />
                  </div>

                  {/* Application URL */}
                  <div className="md:col-span-2">
                    <label htmlFor="applicationUrl" className="block text-sm font-medium text-gray-700 mb-1">
                      Application URL
                    </label>
                    <input
                      id="applicationUrl"
                      name="applicationUrl"
                      type="url"
                      value={jobData.applicationUrl}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. https://careers.company.com/job/123"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div className="flex items-center">
                  <input
                    id="isDraft"
                    type="checkbox"
                    checked={isDraft}
                    onChange={(e) => setIsDraft(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isDraft" className="ml-2 text-sm font-medium text-gray-700">
                    Save as Draft
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center ${
                    isLoading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default EditJob
