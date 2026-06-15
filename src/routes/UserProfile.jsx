"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Edit,
  Download,
  Plus,
  Loader,
  Globe,
  Building,
  Users,
  Clock,
  DollarSign,
  Linkedin,
  Twitter,
  Facebook,
  Search,
  ArrowRight,
  FileText,
  Star,
  TrendingUp,
} from "lucide-react"
import { getBackendUrl } from '../utils/getBackendUrl'

const UserProfile = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userType, setUserType] = useState(null)
  const [applicationCounts, setApplicationCounts] = useState({ pending: 0, reviewed: 0, interviewed: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch user profile from backend
    const fetchProfile = async () => {
      try {
        setLoading(true)

        // Check authentication first
        const authResponse = await fetch("/api/auth/status", {
          credentials: "include",
          headers: {
            "Accept": "application/json"
          }
        })

        // Check if response is JSON
        const contentType = authResponse.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await authResponse.text();
          console.error("Non-JSON auth response:", text);
          navigate("/signin");
          return;
        }

        if (!authResponse.ok) {
          console.error("Auth status check failed:", authResponse.status);
          navigate("/signin")
          return
        }

        const authData = await authResponse.json()
        if (!authData.isAuthenticated) {
          navigate("/signin")
          return
        }

        // Set user type
        setUserType(authData.user.userType)

        // Fetch profile data
        const profileResponse = await fetch("/api/profile", {
          credentials: "include",
          headers: {
            "Accept": "application/json"
          }
        })

        // Check if response is JSON
        const profileContentType = profileResponse.headers.get("content-type");
        if (!profileContentType || !profileContentType.includes("application/json")) {
          const text = await profileResponse.text();
          console.error("Non-JSON profile response:", text);
          throw new Error("Server returned an invalid response");
        }

        if (!profileResponse.ok) {
          if (profileResponse.status === 404) {
            // Profile not found, redirect to profile completion
            navigate("/complete-profile")
            return
          }
          throw new Error("Failed to fetch profile")
        }

        const profileData = await profileResponse.json()
        console.log("Profile data received:", profileData) // Log the profile data to see its structure
        setProfile(profileData)
        // Fetch applications and count statuses
        const appRes = await fetch("/api/applications", { credentials: "include" })
        if (appRes.ok) {
          const applications = await appRes.json()
          const counts = { pending: 0, reviewed: 0, interviewed: 0 }
          applications.forEach(app => {
            if (counts[app.status] !== undefined) counts[app.status]++
          })
          setApplicationCounts(counts)
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
        setError(err.message || "An error occurred while fetching your profile")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
            <p>{error}</p>
          </div>
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg mb-4">
            <p>Your profile is not complete. Please complete your profile to continue.</p>
          </div>
          <Link
            to="/complete-profile"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Complete Profile
          </Link>
        </div>
      </div>
    )
  }

  // Render job seeker profile
  const renderJobSeekerProfile = () => (
    <>
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div className="flex items-end gap-6">
              <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-4xl font-bold shadow-md flex-shrink-0">
                {profile.fullName?.charAt(0) || <User size={32} />}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{profile.fullName || "Your Name"}</h1>
                <p className="text-xl text-gray-600 mt-1">{profile.title || "Professional Title"}</p>
                <div className="flex items-center gap-4 mt-3 text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin size={16} />
                    {profile.location || "Location"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 sm:flex-col">
              <Link
                to="/profile/edit"
                className="btn btn-primary flex items-center justify-center"
              >
                <Edit size={16} />
                Edit Profile
              </Link>
              {profile.resumeUrl && (
                <a
                  href={getBackendUrl(profile.resumeUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary flex items-center justify-center"
                >
                  <Download size={16} />
                  Download CV
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 66% */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <div className="card p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">About</h2>
                <Link to="/profile/edit/about" className="text-blue-600 hover:text-blue-700">
                  <Edit size={18} />
                </Link>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {profile.bio || "No professional summary provided yet. Add information about your background, skills, and career goals."}
              </p>
            </div>

            {/* Experience Section */}
            <div className="card p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Briefcase size={24} className="text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Experience</h2>
                </div>
                <Link to="/profile/edit/experience" className="text-blue-600 hover:text-blue-700">
                  <Edit size={18} />
                </Link>
              </div>
              {profile.experiences && profile.experiences.length > 0 ? (
                <div className="space-y-6">
                  {profile.experiences.map((exp, idx) => (
                    <div key={idx} className="border-l-4 border-blue-600 pl-4">
                      <h3 className="text-lg font-semibold text-gray-900">{exp.title}</h3>
                      <p className="text-gray-600">{exp.company}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {exp.startDate && exp.endDate && `${exp.startDate} - ${exp.endDate}`}
                      </p>
                      {exp.description && <p className="text-gray-700 mt-2">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No experience added yet</p>
              )}
            </div>

            {/* Education Section */}
            <div className="card p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Calendar size={24} className="text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Education</h2>
                </div>
                <Link to="/profile/edit/education" className="text-blue-600 hover:text-blue-700">
                  <Edit size={18} />
                </Link>
              </div>
              {profile.education && profile.education.length > 0 ? (
                <div className="space-y-6">
                  {profile.education.map((edu, idx) => (
                    <div key={idx} className="border-l-4 border-blue-600 pl-4">
                      <h3 className="text-lg font-semibold text-gray-900">{edu.degree}</h3>
                      <p className="text-gray-600">{edu.institution}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {edu.yearOfGraduation && `Graduated: ${edu.yearOfGraduation}`}
                      </p>
                      {edu.fieldOfStudy && <p className="text-gray-700 mt-1">Field: {edu.fieldOfStudy}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No education added yet</p>
              )}
            </div>

            {/* Skills Section */}
            <div className="card p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Star size={24} className="text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Skills</h2>
                </div>
                <Link to="/profile/edit/skills" className="text-blue-600 hover:text-blue-700">
                  <Edit size={18} />
                </Link>
              </div>
              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span key={index} className="badge badge-primary">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No skills added yet. Add your technical and professional skills.</p>
              )}
            </div>

            {/* Job Preferences Section */}
            <div className="card p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <TrendingUp size={24} className="text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Job Preferences</h2>
                </div>
                <Link to="/profile/edit/preferences" className="text-blue-600 hover:text-blue-700">
                  <Edit size={18} />
                </Link>
              </div>
              <div className="space-y-6">
                {profile.jobPreferences?.jobTypes && profile.jobPreferences.jobTypes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Preferred Job Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.jobPreferences.jobTypes.map((type, index) => (
                        <span key={index} className="badge badge-primary">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.jobPreferences?.locations && profile.jobPreferences.locations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Preferred Locations</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.jobPreferences.locations.map((location, index) => (
                        <span key={index} className="badge badge-primary">
                          <MapPin size={12} />
                          {location}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.jobPreferences?.industries && profile.jobPreferences.industries.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Industries</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.jobPreferences.industries.map((industry, index) => (
                        <span key={index} className="badge badge-primary">
                          {industry}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.jobPreferences?.minSalary && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Minimum Salary: <span className="font-semibold text-gray-900">PKR {profile.jobPreferences.minSalary}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - 33% */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Contact Info Card */}
            <div className="card p-6 sticky top-8">
              <h3 className="font-bold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-900 truncate">{profile.email || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{profile.phone || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  to="/jobs"
                  className="w-full btn btn-primary flex items-center justify-center"
                >
                  <Search size={16} />
                  Find Jobs
                </Link>
                <Link
                  to="/applications"
                  className="w-full btn btn-secondary flex items-center justify-center"
                >
                  <FileText size={16} />
                  My Applications
                </Link>
              </div>
            </div>

            {/* Applications Stats */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">Application Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Pending</span>
                  <span className="text-2xl font-bold text-gray-900">{applicationCounts.pending}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Reviewed</span>
                  <span className="text-2xl font-bold text-gray-900">{applicationCounts.reviewed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Interviewed</span>
                  <span className="text-2xl font-bold text-gray-900">{applicationCounts.interviewed}</span>
                </div>
              </div>
              <Link
                to="/applications"
                className="mt-4 block text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All →
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  )

  // Render employer profile
  const renderEmployerProfile = () => (
    <>
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div className="flex items-end gap-6">
              {profile.logoUrl ? (
                <img
                  src={getBackendUrl(profile.logoUrl) || "/placeholder.svg"}
                  alt={`${profile.companyName} logo`}
                  className="w-24 h-24 object-contain rounded-lg border border-gray-200 flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-md">
                  <Building size={32} />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{profile.companyName || "Company Name"}</h1>
                <p className="text-xl text-gray-600 mt-1">{profile.industry || "Industry"}</p>
                <div className="flex items-center gap-4 mt-3 text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin size={16} />
                    {profile.companyLocation || "Location"}
                  </span>
                  {profile.foundedYear && (
                    <span>Founded {profile.foundedYear}</span>
                  )}
                </div>
              </div>
            </div>
            <Link
              to="/profile/edit"
              className="btn btn-primary flex items-center justify-center"
            >
              <Edit size={16} />
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 66% */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Company */}
            <div className="card p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">About Company</h2>
                <Link to="/profile/edit/about" className="text-blue-600 hover:text-blue-700">
                  <Edit size={18} />
                </Link>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {profile.companyDescription || "No company description provided yet. Tell potential employees about your company culture and mission."}
              </p>
            </div>

            {/* Job Postings */}
            <div className="card p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Briefcase size={24} className="text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Job Postings</h2>
                </div>
                <Link
                  to="/jobs/post"
                  className="btn btn-primary flex items-center"
                >
                  <Plus size={16} />
                  Post Job
                </Link>
              </div>

              {profile.jobPostings && profile.jobPostings.length > 0 ? (
                <div className="space-y-4">
                  {profile.jobPostings.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-gray-900">{job.title}</h4>
                          <p className="text-gray-600 text-sm mt-1">{job.description?.substring(0, 100)}...</p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className="badge badge-primary">
                              <Briefcase size={12} />
                              {job.type}
                            </span>
                            <span className="badge badge-primary">
                              <MapPin size={12} />
                              {job.location}
                            </span>
                            {job.salary && (
                              <span className="badge badge-warning">
                                PKR {job.salary}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Link
                            to={`/jobs/${job.id}/edit`}
                            className="btn btn-sm btn-secondary"
                          >
                            Edit
                          </Link>
                          <Link
                            to={`/jobs/${job.id}/applications`}
                            className="btn btn-sm btn-primary"
                          >
                            Applications
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Job Postings Yet</h4>
                  <p className="text-gray-600 mb-4">Start attracting top talent by posting your first job.</p>
                  <Link
                    to="/jobs/post"
                    className="btn btn-primary inline-flex items-center"
                  >
                    <Plus size={16} />
                    Post a Job
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - 33% */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Company Info Card */}
            <div className="card p-6 sticky top-8">
              <h3 className="font-bold text-gray-900 mb-4">Company Info</h3>
              <div className="space-y-4">
                {profile.companyWebsite && (
                  <div>
                    <p className="text-xs text-gray-500">Website</p>
                    <a
                      href={profile.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 truncate flex items-center gap-2"
                    >
                      <Globe size={14} />
                      {profile.companyWebsite.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  </div>
                )}
                {profile.companySize && (
                  <div>
                    <p className="text-xs text-gray-500">Company Size</p>
                    <p className="text-sm text-gray-900">{profile.companySize}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">Contact</h3>
              <div className="space-y-3">
                {profile.contactName && (
                  <div>
                    <p className="text-xs text-gray-500">Contact Person</p>
                    <p className="text-sm text-gray-900">{profile.contactName}</p>
                    {profile.contactTitle && <p className="text-xs text-gray-600">{profile.contactTitle}</p>}
                  </div>
                )}
                {profile.contactEmail && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-900 break-all">{profile.contactEmail}</p>
                  </div>
                )}
                {profile.contactPhone && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{profile.contactPhone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Company Stats */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Job Postings</span>
                  <span className="text-2xl font-bold text-gray-900">{profile.jobPostings?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Active Jobs</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {profile.jobPostings?.filter((job) => job.status === "active").length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Applications</span>
                  <span className="text-2xl font-bold text-gray-900">{profile.totalApplications || 0}</span>
                </div>
              </div>
            </div>


          </aside>
        </div>
      </main>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {userType === "employer" ? renderEmployerProfile() : renderJobSeekerProfile()}
    </div>
  )
}

export default UserProfile

