"use client"

import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate, Navigate } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Plus,
  X,
  Check,
  CheckCircle,
  Circle,
  AlertCircle,
  Briefcase,
  MapPin,
  DollarSign,
  Phone,
  Mail,
  User,
  Globe,
} from "lucide-react"

const ProfileCompletion = ({ initialStep = 1 }) => {
  const navigate = useNavigate()
  const [step, setStep] = useState(initialStep)

  // Update step if initialStep prop changes (e.g. via routing)
  useEffect(() => {
    setStep(initialStep)
  }, [initialStep])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [userType, setUserType] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  const validatePhone = (phone) => {
    if (!phone) return ""
    const phoneRegex = /^\+?[0-9\-\s]{10,15}$/
    return phoneRegex.test(phone) ? "" : "Please enter a valid phone number (min 10 digits)"
  }

  const validateEmail = (email) => {
    if (!email) return ""
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) ? "" : "Please enter a valid email address"
  }

  // Job seeker form data
  const [jobSeekerData, setJobSeekerData] = useState({
    title: "",
    phone: "",
    location: "",
    bio: "",
    skills: [],
    experiences: [],
    education: [],
    jobTypes: [],
    locations: [],
    industries: [],
    minSalary: "",
    availability: "immediately",
    remotePreference: "hybrid",
  })

  // Employer form data
  const [employerData, setEmployerData] = useState({
    companyName: "",
    industry: "",
    companySize: "",
    foundedYear: "",
    companyWebsite: "",
    companyLocation: "",
    companyDescription: "",
    contactName: "",
    contactTitle: "",
    contactEmail: "",
    contactPhone: "",
    linkedinUrl: "",
    twitterUrl: "",
    facebookUrl: "",
  })

  // Fetch and populate profile data
  const fetchAndPopulateProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/profile", {
        credentials: "include",
      })
      const data = await response.json()

      if (response.ok) {
        if (userType === 'jobSeeker') {
          setJobSeekerData({
            title: data.title || "",
            phone: data.phone || "",
            location: data.location || "",
            bio: data.bio || "",
            skills: data.skills || [],
            experiences: data.experiences || [],
            education: data.education || [],
            jobTypes: data.jobPreferences?.jobTypes || [],
            locations: data.jobPreferences?.locations || [],
            industries: data.jobPreferences?.industries || [],
            minSalary: data.jobPreferences?.minSalary || "",
            availability: data.jobPreferences?.availability || "immediately",
            remotePreference: data.jobPreferences?.remotePreference || "hybrid",
          })
        } else {
          setEmployerData({
            companyName: data.companyName || "",
            industry: data.industry || "",
            companySize: data.companySize || "",
            foundedYear: data.foundedYear || "",
            companyWebsite: data.companyWebsite || "",
            companyLocation: data.companyLocation || "",
            companyDescription: data.companyDescription || "",
            contactName: data.contactName || "",
            contactTitle: data.contactTitle || "",
            contactEmail: data.contactEmail || "",
            contactPhone: data.contactPhone || "",
            linkedinUrl: data.linkedinUrl || "",
            twitterUrl: data.twitterUrl || "",
            facebookUrl: data.facebookUrl || "",
          })
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }, [userType])

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setCurrentUser(userData)
      setUserType(userData.userType)
      setLoading(false)
      return
    }

    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/status", {
          credentials: "include",
        })
        const data = await response.json()

        if (response.ok && data.isAuthenticated) {
          setCurrentUser(data.user)
          setUserType(data.user.userType)
          localStorage.setItem('user', JSON.stringify(data.user))
        } else {
          navigate("/signin")
        }
      } catch (error) {
        console.error("Error checking auth status:", error)
        navigate("/signin")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [navigate])

  useEffect(() => {
    if (currentUser && userType && loading === false) {
      fetchAndPopulateProfile()
    }
  }, [currentUser, userType, loading, fetchAndPopulateProfile])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/signin" replace />
  }

  const totalSteps = userType === 'jobSeeker' ? 5 : 3
  const isJobSeeker = userType === 'jobSeeker'

  const handleJobSeekerInputChange = (e) => {
    const { name, value } = e.target
    setJobSeekerData(prev => ({ ...prev, [name]: value }))

    if (name === "phone") {
      setFormErrors(prev => ({ ...prev, phone: validatePhone(value) }))
    }
  }

  const handleEmployerInputChange = (e) => {
    const { name, value } = e.target
    setEmployerData(prev => ({ ...prev, [name]: value }))

    if (name === "contactPhone") {
      setFormErrors(prev => ({ ...prev, contactPhone: validatePhone(value) }))
    }
    if (name === "contactEmail") {
      setFormErrors(prev => ({ ...prev, contactEmail: validateEmail(value) }))
    }
  }

  const handleSubmit = async () => {
    // Check for validation errors
    if (isJobSeeker && validatePhone(jobSeekerData.phone)) {
      setFormErrors(prev => ({ ...prev, phone: "Please enter a valid phone number" }));
      setError("Please fix the validation errors before saving");
      return;
    }

    if (!isJobSeeker) {
      const emailErr = validateEmail(employerData.contactEmail);
      const phoneErr = validatePhone(employerData.contactPhone);
      if (emailErr || phoneErr) {
        setFormErrors(prev => ({ ...prev, contactEmail: emailErr, contactPhone: phoneErr }));
        setError("Please fix the validation errors before saving");
        return;
      }
    }

    setError("")
    setSuccessMessage("")
    setIsLoading(true)

    try {
      const formData = new FormData()

      if (isJobSeeker) {
        formData.append("title", jobSeekerData.title)
        formData.append("phone", jobSeekerData.phone)
        formData.append("location", jobSeekerData.location)
        formData.append("bio", jobSeekerData.bio)
        formData.append("skills", JSON.stringify(jobSeekerData.skills))
        formData.append("experiences", JSON.stringify(jobSeekerData.experiences))
        formData.append("education", JSON.stringify(jobSeekerData.education))
        formData.append("jobTypes", JSON.stringify(jobSeekerData.jobTypes))
        formData.append("locations", JSON.stringify(jobSeekerData.locations))
        formData.append("industries", JSON.stringify(jobSeekerData.industries))
        formData.append("minSalary", jobSeekerData.minSalary)
        formData.append("availability", jobSeekerData.availability)
        formData.append("remotePreference", jobSeekerData.remotePreference)
      } else {
        Object.keys(employerData).forEach(key => {
          formData.append(key, employerData[key])
        })
      }

      const response = await fetch("/api/profile", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (response.ok) {
        setSuccessMessage("Profile completed successfully!")
        setTimeout(() => navigate("/dashboard"), 2000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to save profile")
      }
    } catch (err) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Step content components
  const renderJobSeekerStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
            <FormField
              label="Professional Title"
              value={jobSeekerData.title}
              name="title"
              onChange={handleJobSeekerInputChange}
              placeholder="e.g. Senior Software Engineer"
              icon={<Briefcase size={18} />}
              required
            />
            <FormField
              label="Phone Number"
              value={jobSeekerData.phone}
              name="phone"
              onChange={handleJobSeekerInputChange}
              placeholder="+92-300-1234567"
              icon={<Phone size={18} />}
              required
              error={formErrors.phone}
            />
            <FormField
              label="Location"
              value={jobSeekerData.location}
              name="location"
              onChange={handleJobSeekerInputChange}
              placeholder="e.g. Karachi, Pakistan"
              icon={<MapPin size={18} />}
              required
            />
            <FormField
              label="Bio"
              value={jobSeekerData.bio}
              name="bio"
              onChange={handleJobSeekerInputChange}
              placeholder="Tell us about yourself..."
              textarea
            />
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Skills</h2>
            <SkillsSelector
              skills={jobSeekerData.skills}
              onChange={(skills) => setJobSeekerData(prev => ({ ...prev, skills }))}
            />
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Work Experience</h2>
            <ExperienceSection
              experiences={jobSeekerData.experiences}
              onChange={(experiences) => setJobSeekerData(prev => ({ ...prev, experiences }))}
            />
          </div>
        )
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Education</h2>
            <EducationSection
              education={jobSeekerData.education}
              onChange={(education) => setJobSeekerData(prev => ({ ...prev, education }))}
            />
          </div>
        )
      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Job Preferences</h2>
            <FormField
              label="Minimum Salary (PKR)"
              value={jobSeekerData.minSalary}
              name="minSalary"
              onChange={handleJobSeekerInputChange}
              placeholder="e.g. 100000"
              icon={<DollarSign size={18} />}
            />
            <SelectField
              label="Availability"
              value={jobSeekerData.availability}
              name="availability"
              onChange={handleJobSeekerInputChange}
              options={[
                { value: 'immediately', label: 'Immediately' },
                { value: '2weeks', label: '2 Weeks' },
                { value: '1month', label: '1 Month' },
              ]}
            />
            <SelectField
              label="Remote Preference"
              value={jobSeekerData.remotePreference}
              name="remotePreference"
              onChange={handleJobSeekerInputChange}
              options={[
                { value: 'remote', label: 'Remote' },
                { value: 'onsite', label: 'On-site' },
                { value: 'hybrid', label: 'Hybrid' },
              ]}
            />
          </div>
        )
      default:
        return null
    }
  }

  const renderEmployerStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
            <FormField
              label="Company Name"
              value={employerData.companyName}
              name="companyName"
              onChange={handleEmployerInputChange}
              placeholder="Your company name"
              required
            />
            <FormField
              label="Industry"
              value={employerData.industry}
              name="industry"
              onChange={handleEmployerInputChange}
              placeholder="e.g. Technology, Finance"
            />
            <FormField
              label="Company Size"
              value={employerData.companySize}
              name="companySize"
              onChange={handleEmployerInputChange}
              placeholder="e.g. 50-100"
            />
            <FormField
              label="Founded Year"
              value={employerData.foundedYear}
              name="foundedYear"
              onChange={handleEmployerInputChange}
              placeholder="e.g. 2020"
            />
            <FormField
              label="Company Website"
              value={employerData.companyWebsite}
              name="companyWebsite"
              onChange={handleEmployerInputChange}
              placeholder="https://example.com"
              icon={<Globe size={18} />}
            />
            <FormField
              label="Location"
              value={employerData.companyLocation}
              name="companyLocation"
              onChange={handleEmployerInputChange}
              placeholder="City, Country"
              icon={<MapPin size={18} />}
            />
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
            <FormField
              label="Contact Name"
              value={employerData.contactName}
              name="contactName"
              onChange={handleEmployerInputChange}
              placeholder="Your name"
              icon={<User size={18} />}
            />
            <FormField
              label="Contact Title"
              value={employerData.contactTitle}
              name="contactTitle"
              onChange={handleEmployerInputChange}
              placeholder="e.g. HR Manager"
            />
            <FormField
              label="Email"
              value={employerData.contactEmail}
              name="contactEmail"
              onChange={handleEmployerInputChange}
              placeholder="contact@example.com"
              icon={<Mail size={18} />}
              error={formErrors.contactEmail}
            />
            <FormField
              label="Phone"
              value={employerData.contactPhone}
              name="contactPhone"
              onChange={handleEmployerInputChange}
              placeholder="+92-300-1234567"
              icon={<Phone size={18} />}
              error={formErrors.contactPhone}
            />
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Additional Information</h2>
            <FormField
              label="Company Description"
              value={employerData.companyDescription}
              name="companyDescription"
              onChange={handleEmployerInputChange}
              placeholder="Tell us about your company..."
              textarea
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isJobSeeker ? "Complete Your Profile" : "Complete Company Profile"}
          </h1>
          <p className="text-gray-600 mt-1">Step {step} of {totalSteps}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }).map((_, idx) => {
              const stepNum = idx + 1
              const isActive = step === stepNum
              const isCompleted = step > stepNum
              return (
                <div key={stepNum} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isCompleted
                      ? "bg-green-600 text-white"
                      : isActive
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                      }`}
                  >
                    {isCompleted ? <Check size={20} /> : stepNum}
                  </div>
                  {stepNum < totalSteps && (
                    <div className={`h-1 flex-1 mx-2 ${isCompleted ? "bg-green-600" : "bg-gray-300"}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="card p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
              <p className="text-green-700">{successMessage}</p>
            </div>
          )}

          {/* Form Content */}
          {isJobSeeker ? renderJobSeekerStep() : renderEmployerStep()}

          {/* Navigation Buttons */}
          <div className="mt-8 flex gap-3 justify-between">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            <button
              onClick={() => step === totalSteps ? handleSubmit() : setStep(step + 1)}
              disabled={isLoading}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {step === totalSteps ? (
                <>
                  {isLoading ? "Saving..." : "Complete Profile"}
                  <Check size={16} />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Reusable Form Components

function FormField({ label, value, name, onChange, placeholder, textarea, icon, required, error }) {
  return (
    <div className="w-full mb-4">
      <label className="block text-sm font-semibold text-gray-900 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative flex items-center">
        {/* Icon wrapper - isko z-index diya hai taake ye text ke niche na jaye */}
        {icon && (
          <div className="absolute left-3 flex items-center justify-center text-gray-400 pointer-events-none z-20">
            {icon}
          </div>
        )}
        
        {textarea ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={4}
            /* !pl-12 use kiya hai taake custom CSS isay override na kar sakay */
            className={`input-field w-full block rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 ${icon ? "!pl-12" : "!pl-4"} pt-2.5`}
          />
        ) : (
          <input
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            /* !pl-12 force karta hai ke text icon ke 3rem baad se shuru ho */
            className={`input-field w-full block h-12 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 ${icon ? "!pl-12" : "!pl-4"}`}
          />
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
function SelectField({ label, value, name, onChange, options, required }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select name={name} value={value} onChange={onChange} className="input-field w-full">
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

function SkillsSelector({ skills, onChange }) {
  const [newSkill, setNewSkill] = useState("")

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          placeholder="Add a skill..."
          className="input-field flex-1"
        />
        <button
          onClick={() => {
            if (newSkill && !skills.includes(newSkill)) {
              onChange([...skills, newSkill])
              setNewSkill("")
            }
          }}
          className="btn btn-primary"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span key={skill} className="badge badge-primary">
            {skill}
            <button onClick={() => onChange(skills.filter(s => s !== skill))} className="ml-1">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

function ExperienceSection({ experiences, onChange }) {
  const addExperience = () => {
    onChange([...experiences, { company: "", title: "", startDate: "", endDate: "", description: "" }])
  }

  const handleExpChange = (idx, field, value) => {
    const updated = [...experiences]
    updated[idx] = { ...updated[idx], [field]: value }
    onChange(updated)
  }

  const removeExperience = (idx) => {
    onChange(experiences.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-6">
      {experiences.map((exp, idx) => (
        <div key={idx} className="border border-gray-200 rounded-xl p-6 relative bg-white shadow-sm">
          <button
            onClick={() => removeExperience(idx)}
            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Company</label>
              <input
                type="text"
                placeholder="Company Name"
                className="input-field w-full"
                value={exp.company}
                onChange={(e) => handleExpChange(idx, 'company', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Job Title</label>
              <input
                type="text"
                placeholder="Software Engineer"
                className="input-field w-full"
                value={exp.title}
                onChange={(e) => handleExpChange(idx, 'title', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                className="input-field w-full"
                value={exp.startDate}
                onChange={(e) => handleExpChange(idx, 'startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                className="input-field w-full"
                value={exp.endDate}
                onChange={(e) => handleExpChange(idx, 'endDate', e.target.value)}
              />
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              placeholder="Describe your responsibilities and achievements..."
              rows={3}
              className="input-field w-full"
              value={exp.description}
              onChange={(e) => handleExpChange(idx, 'description', e.target.value)}
            />
          </div>
        </div>
      ))}
      <button
        onClick={addExperience}
        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Add Work Experience
      </button>
    </div>
  )
}

function EducationSection({ education, onChange }) {
  const addEducation = () => {
    onChange([...education, { institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "" }])
  }

  const handleEduChange = (idx, field, value) => {
    const updated = [...education]
    updated[idx] = { ...updated[idx], [field]: value }
    onChange(updated)
  }

  const removeEducation = (idx) => {
    onChange(education.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-6">
      {education.map((edu, idx) => (
        <div key={idx} className="border border-gray-200 rounded-xl p-6 relative bg-white shadow-sm">
          <button
            onClick={() => removeEducation(idx)}
            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Institution</label>
                <input
                  type="text"
                  placeholder="University Name"
                  className="input-field w-full"
                  value={edu.institution}
                  onChange={(e) => handleEduChange(idx, 'institution', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Degree</label>
                <input
                  type="text"
                  placeholder="Bachelor's, Master's, etc."
                  className="input-field w-full"
                  value={edu.degree}
                  onChange={(e) => handleEduChange(idx, 'degree', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Field of Study</label>
                <input
                  type="text"
                  placeholder="Computer Science"
                  className="input-field w-full"
                  value={edu.fieldOfStudy}
                  onChange={(e) => handleEduChange(idx, 'fieldOfStudy', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    className="input-field w-full"
                    value={edu.startDate}
                    onChange={(e) => handleEduChange(idx, 'startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    className="input-field w-full"
                    value={edu.endDate}
                    onChange={(e) => handleEduChange(idx, 'endDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={addEducation}
        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Add Education
      </button>
    </div>
  )
}


export default ProfileCompletion
