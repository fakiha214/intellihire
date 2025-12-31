"use client"

import { useState } from "react"
import { ArrowLeft, Upload, Trash2, FileText, Search, Filter, ChevronDown, ChevronUp } from "lucide-react"
import { Link } from "react-router-dom"

const ResumeAnalyzer = () => {
  const [resumes, setResumes] = useState([])
  const [jobDescription, setJobDescription] = useState("")
  const [rankedResults, setRankedResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [expandedResume, setExpandedResume] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [minMatchScore, setMinMatchScore] = useState(0)
  const [sortBy, setSortBy] = useState("match") // match, name, upload

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const newResumes = files.map((file, idx) => ({
      id: Date.now() + idx,
      file,
      fileName: file.name,
    }))
    setResumes([...resumes, ...newResumes])
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files)
    const newResumes = files.map((file, idx) => ({
      id: Date.now() + idx,
      file,
      fileName: file.name,
    }))
    setResumes([...resumes, ...newResumes])
  }

  const removeResume = (id) => {
    setResumes(resumes.filter((r) => r.id !== id))
  }

  const analyzeResumes = async () => {
    if (resumes.length === 0) {
      setError("Please upload at least one resume")
      return
    }

    if (!jobDescription.trim()) {
      setError("Please enter a job description")
      return
    }

    setLoading(true)
    setError("")

    try {
      const formData = new FormData()
      resumes.forEach((resume) => {
        formData.append("resumes", resume.file)
      })
      formData.append("jobDescription", jobDescription)

      const response = await fetch("http://localhost:5000/api/resumes/analyze", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to analyze resumes")
      }

      const data = await response.json()
      setRankedResults(data.results || [])
    } catch (err) {
      console.error("Error analyzing resumes:", err)
      setError(err.message || "An error occurred while analyzing resumes")
    } finally {
      setLoading(false)
    }
  }

  const filteredResults = rankedResults
    .filter((result) => result.matchScore >= minMatchScore)
    .filter(
      (result) =>
        searchTerm === "" ||
        result.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (result.extractedText && result.extractedText.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === "match") return b.matchScore - a.matchScore
      if (sortBy === "name") return a.fileName.localeCompare(b.fileName)
      if (sortBy === "upload") return b.id - a.id
      return 0
    })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link to="/jobs/manage" className="text-blue-600 hover:text-blue-800 mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Resume Analyzer</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Upload & Input */}
          <div className="lg:col-span-1 space-y-6">
            {/* Resume Upload */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Resumes</h2>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
              >
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">
                    Drag resumes here or click to upload
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, or TXT files</p>
                </label>
              </div>

              {/* Resume List */}
              {resumes.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {resumes.length} file{resumes.length !== 1 ? "s" : ""} selected
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {resumes.map((resume) => (
                      <div key={resume.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                          <span className="text-xs text-gray-700 truncate">{resume.fileName}</span>
                        </div>
                        <button
                          onClick={() => removeResume(resume.id)}
                          className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Enter the job description, requirements, and qualifications..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 h-32"
              />
              <button
                onClick={analyzeResumes}
                disabled={loading || resumes.length === 0 || !jobDescription.trim()}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? "Analyzing..." : "Analyze Resumes"}
              </button>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {rankedResults.length > 0 && (
              <>
                {/* Filters and Sort */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search resumes..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Sort */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                    >
                      <option value="match">Sort by Match Score</option>
                      <option value="name">Sort by Name</option>
                      <option value="upload">Sort by Upload Time</option>
                    </select>
                  </div>

                  {/* Min Match Filter */}
                  <div className="flex items-center gap-4">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <label className="text-sm text-gray-700">Min Match Score:</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={minMatchScore}
                      onChange={(e) => setMinMatchScore(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {minMatchScore}%
                    </span>
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Showing {filteredResults.length} of {rankedResults.length} resumes
                  </p>

                  {filteredResults.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No resumes match your filter criteria</p>
                    </div>
                  ) : (
                    filteredResults.map((result) => (
                      <div key={result.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{result.fileName}</h3>
                              <p className="text-sm text-gray-600">
                                {result.extractedText ? result.extractedText.substring(0, 100) + "..." : "Resume content"}
                              </p>
                            </div>

                            <div className="text-right">
                              <div className="text-3xl font-bold text-blue-600">{result.matchScore}%</div>
                              <div className="text-xs text-gray-600">Match Score</div>
                            </div>
                          </div>

                          {/* Match Score Bar */}
                          <div className="mb-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  result.matchScore >= 80
                                    ? "bg-green-500"
                                    : result.matchScore >= 60
                                      ? "bg-yellow-500"
                                      : result.matchScore >= 40
                                        ? "bg-orange-500"
                                        : "bg-red-500"
                                }`}
                                style={{ width: `${result.matchScore}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Matched Keywords */}
                          {result.matchedKeywords && result.matchedKeywords.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Matched Keywords</h4>
                              <div className="flex flex-wrap gap-2">
                                {result.matchedKeywords.slice(0, 8).map((keyword, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                                {result.matchedKeywords.length > 8 && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 text-xs text-gray-600">
                                    +{result.matchedKeywords.length - 8} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Expand Button */}
                          <button
                            onClick={() =>
                              setExpandedResume(expandedResume === result.id ? null : result.id)
                            }
                            className="w-full mt-4 px-4 py-2 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center"
                          >
                            {expandedResume === result.id ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-2" />
                                Hide Details
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-2" />
                                Show Details
                              </>
                            )}
                          </button>

                          {/* Expanded Content */}
                          {expandedResume === result.id && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="bg-gray-50 p-4 rounded-md max-h-48 overflow-y-auto">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {result.extractedText || "No text content extracted"}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {rankedResults.length === 0 && resumes.length > 0 && jobDescription.trim() && !loading && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Click "Analyze Resumes" to get started</p>
              </div>
            )}

            {resumes.length === 0 && !loading && (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Upload resumes and enter a job description to begin</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default ResumeAnalyzer

// Feature: Job search and filtering
const searchJobs = (jobs, filters) => {
  return jobs.filter(job => {
    return (!filters.title || job.title.includes(filters.title)) &&
           (!filters.location || job.location === filters.location) &&
           (!filters.salary || job.salary >= filters.salary);
  });
};
