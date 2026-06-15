"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
  Wand2,
} from "lucide-react"

const PostJob = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [userType, setUserType] = useState(null)
  const [aiLoading, setAiLoading] = useState("")  // Track which field is being AI-generated

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

  const generateAIContent = async (field) => {
    try {
      if (!jobData.title) {
        setError("Please enter a job title first")
        return
      }

      setAiLoading(field)
      setError("")

      const prompt = getPromptForField(field)

      const response = await fetch("/api/ai/generate-job-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          jobTitle: jobData.title,
          jobType: jobData.type,
          experienceLevel: jobData.experienceLevel,
          field: field,
          prompt: prompt,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to generate content (Status: ${response.status})`
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (field === "description") {
        setJobData({ ...jobData, description: data.content })
      } else if (field === "requirements") {
        setJobData({ ...jobData, requirements: data.items || [] })
      } else if (field === "skills") {
        // Skills are stored as requirements, so we'll add them to requirements if needed
        setJobData({ ...jobData, requirements: [...jobData.requirements, ...data.items] })
      }

      setSuccess(`✨ ${field.charAt(0).toUpperCase() + field.slice(1)} generated successfully!`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      console.error("Error generating content:", err)
      setError(`Failed to generate ${field}. Please try again.`)
    } finally {
      setAiLoading("")
    }
  }

  const getPromptForField = (field) => {
    switch (field) {
      case "description":
        return `Generate a compelling job description for a ${jobData.type} ${jobData.title} position at ${jobData.experienceLevel} level.`
      case "requirements":
        return `Generate key requirements for a ${jobData.title} position at ${jobData.experienceLevel} level.`
      case "skills":
        return `Generate essential technical and soft skills for a ${jobData.title} position.`
      default:
        return ""
    }
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

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(jobData),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to post job")
      }

      setSuccess("Job posted successfully!")
      setTimeout(() => {
        navigate("/jobs/manage")
      }, 2000)
    } catch (err) {
      console.error("Error posting job:", err)
      setError(err.message || "An error occurred while posting the job")
    } finally {
      setIsLoading(false)
    }
  }

  if (userType && userType !== 'employer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center max-w-md w-full">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Only employers can post jobs. Please log in as an employer to continue.
          </p>
          <Link
            to="/signin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In as Employer
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            to="/jobs/manage"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 text-sm font-medium"
          >
            <ArrowLeft size={18} />
            Back to Jobs
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Post a New Job</h1>
          <p className="text-gray-600 text-sm mt-1">Fill in the details below to post your job opening</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-8">
          {/* Basic Information */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Job Title */}
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    value={jobData.title}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Senior Frontend Developer"
                  />
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  required
                  value={jobData.company}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your company name"
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    id="location"
                    name="location"
                    type="text"
                    required
                    value={jobData.location}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Karachi, Pakistan"
                  />
                </div>
              </div>

              {/* Job Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  value={jobData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level <span className="text-red-500">*</span>
                </label>
                <select
                  id="experienceLevel"
                  name="experienceLevel"
                  required
                  value={jobData.experienceLevel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Entry-level">Entry-level</option>
                  <option value="Mid-level">Mid-level</option>
                  <option value="Senior-level">Senior-level</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>

              {/* Salary */}
              <div>
                <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Range (Optional)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    id="salary"
                    name="salary"
                    type="text"
                    value={jobData.salary}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="PKR 80,000 - 120,000"
                  />
                </div>
              </div>

              {/* Application Deadline */}
              <div>
                <label htmlFor="applicationDeadline" className="block text-sm font-medium text-gray-700 mb-2">
                  Application Deadline (Optional)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    id="applicationDeadline"
                    name="applicationDeadline"
                    type="date"
                    value={jobData.applicationDeadline}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Remote Option */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    id="isRemote"
                    name="isRemote"
                    type="checkbox"
                    checked={jobData.isRemote}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">This is a remote position</span>
                </label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-10 pb-10 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Job Description</h2>
              <button
                type="button"
                onClick={() => generateAIContent("description")}
                disabled={aiLoading === "description"}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  aiLoading === "description"
                    ? "bg-blue-100 text-blue-700 cursor-not-allowed"
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                }`}
              >
                <Wand2 size={16} />
                {aiLoading === "description" ? "Generating..." : "✨ AI Assist"}
              </button>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                required
                value={jobData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Provide a detailed description of the job role, responsibilities, and what you're looking for in a candidate..."
              />
            </div>
          </div>

          {/* Requirements */}
          <div className="mb-10 pb-10 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Requirements</h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => generateAIContent("requirements")}
                  disabled={aiLoading === "requirements"}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    aiLoading === "requirements"
                      ? "bg-blue-100 text-blue-700 cursor-not-allowed"
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  }`}
                >
                  <Wand2 size={16} />
                  {aiLoading === "requirements" ? "Generating..." : "✨ AI Assist"}
                </button>
                <button
                  type="button"
                  onClick={() => addArrayItem("requirements")}
                  className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {jobData.requirements.map((req, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => handleArrayItemChange("requirements", index, e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`e.g. ${index === 0 ? '5+ years of experience' : '2+ years in this field'}`}
                  />
                  {jobData.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem("requirements", index)}
                      className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Responsibilities */}
          <div className="mb-10 pb-10 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Responsibilities</h2>
              <button
                type="button"
                onClick={() => addArrayItem("responsibilities")}
                className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Plus size={18} />
                Add
              </button>
            </div>
            <div className="space-y-3">
              {jobData.responsibilities.map((resp, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={resp}
                    onChange={(e) => handleArrayItemChange("responsibilities", index, e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`e.g. ${index === 0 ? 'Lead development of new features' : 'Collaborate with the team'}`}
                  />
                  {jobData.responsibilities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem("responsibilities", index)}
                      className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-10 pb-10 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Benefits</h2>
              <button
                type="button"
                onClick={() => addArrayItem("benefits")}
                className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <Plus size={18} />
                Add
              </button>
            </div>
            <div className="space-y-3">
              {jobData.benefits.map((benefit, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={benefit}
                    onChange={(e) => handleArrayItemChange("benefits", index, e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`e.g. ${index === 0 ? 'Health insurance' : 'Remote work'}`}
                  />
                  {jobData.benefits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem("benefits", index)}
                      className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Application Details */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Application Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="applicationEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Application Email (Optional)
                </label>
                <input
                  id="applicationEmail"
                  name="applicationEmail"
                  type="email"
                  value={jobData.applicationEmail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="careers@example.com"
                />
              </div>
              <div>
                <label htmlFor="applicationUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  External Application URL (Optional)
                </label>
                <input
                  id="applicationUrl"
                  name="applicationUrl"
                  type="url"
                  value={jobData.applicationUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/careers"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <Link
              to="/jobs/manage"
              className="px-6 py-2.5 text-gray-700 font-medium hover:text-gray-900 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-8 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Posting..." : "Post Job"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default PostJob

