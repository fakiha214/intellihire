"use client"

import { useState, useEffect, useCallback } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Building,
  Calendar,
  CheckCircle,
  Star,
  Bookmark,
  Send,
  AlertCircle,
  Loader,
  TrendingUp,
} from "lucide-react"
import { getBackendUrl } from '../utils/getBackendUrl'
import { formatDate, getSafeJobDate, getDeadlineStatus } from '../utils/dateUtils'

const JobDetail = () => {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isApplying, setIsApplying] = useState(false)
  const [applicationData, setApplicationData] = useState({
    coverLetter: "",
    resumeFile: null,
  })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [skillGapData, setSkillGapData] = useState(null)
  const [skillGapLoading, setSkillGapLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [userLoading, setUserLoading] = useState(true)

  const fetchJobDetails = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/jobs/${id}`, {
        credentials: "include",
        headers: { "Accept": "application/json" }
      })
      if (!response.ok) throw new Error("Failed to fetch job details")
      const jobData = await response.json()
      setJob(jobData)
      setIsSaved(jobData.isSaved || false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchSkillGap = useCallback(async (jobId) => {
    try {
      setSkillGapLoading(true)
      const response = await fetch(`/api/jobs/${jobId}/skill-gap`, {
        credentials: "include"
      })
      if (response.ok) {
        const data = await response.json()
        setSkillGapData(data)
      }
    } catch (err) {
      console.error("Skill Gap Error:", err)
    } finally {
      setSkillGapLoading(false)
    }
  }, [])

  const fetchUserStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: "include"
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (err) {
      console.error("User Status Error:", err)
    } finally {
      setUserLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobDetails()
    fetchUserStatus()
  }, [fetchJobDetails, fetchUserStatus])

  useEffect(() => {
    if (job?.id) fetchSkillGap(job.id)
  }, [job, fetchSkillGap])

  const handleApply = () => {
    if (!user) {
      setIsApplying(true) // Will show login message or form
      return
    }
    if (user.userType === 'employer') {
      setSubmitError("You must be logged in as a job seeker to apply for positions.")
      setIsApplying(true)
      return
    }
    setIsApplying(true)
  }

  const handleInputChange = (e) => setApplicationData({ ...applicationData, [e.target.name]: e.target.value })

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) setApplicationData({ ...applicationData, resumeFile: file })
  }

  const handleSubmitApplication = async (e) => {
    e.preventDefault()
    setSubmitLoading(true)
    try {
      const formData = new FormData()
      if (applicationData.resumeFile) formData.append('resume', applicationData.resumeFile)
      formData.append('coverLetter', applicationData.coverLetter)
      const res = await fetch(`/api/jobs/${id}/apply`, {
        method: 'POST', body: formData, credentials: 'include'
      })
      if (!res.ok) throw new Error("Submission failed")
      setSubmitSuccess(true)
    } catch (err) { setSubmitError(err.message) }
    finally { setSubmitLoading(false) }
  }

  const toggleSaveJob = async () => {
    if (!user) {
      setIsApplying(true)
      return
    }
    if (user.userType === 'employer') {
      setSubmitError("You must be logged in as a job seeker to save jobs.")
      setIsApplying(true)
      return
    }
    const method = isSaved ? 'DELETE' : 'POST'
    await fetch(`/api/jobs/${id}/save`, { method, credentials: 'include' })
    setIsSaved(!isSaved)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-blue-600" /></div>

  const deadlineStatus = job && getSafeJobDate(job, 'deadline') ? getDeadlineStatus(getSafeJobDate(job, 'deadline')) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b p-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <Link to="/jobs" className="text-blue-600 flex items-center gap-2 font-medium hover:text-blue-800 transition-colors">
            <ArrowLeft size={18} /> Back to Job List
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header Card */}
            <div className="card p-8 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex gap-6 items-center">
                {/* LOGO SECTION FIXED */}
                <div className="w-20 h-20 flex-shrink-0">
                   {job.companyLogo ? (
                     <img 
                       src={getBackendUrl(job.companyLogo)} 
                       alt="Logo"
                       className="w-full h-full object-contain rounded-lg border border-gray-100 bg-white"
                       onError={(e) => {
                         e.target.onerror = null;
                         e.target.src = `https://ui-avatars.com/api/?name=${job.company || 'C'}&background=random&size=128`;
                       }}
                     />
                   ) : (
                     <div className="w-full h-full bg-blue-50 rounded-lg border border-gray-100 flex items-center justify-center">
                       <Building size={32} className="text-blue-500" />
                     </div>
                   )}
                </div>
                
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{job.title}</h1>
                  <p className="text-gray-500 font-medium flex items-center gap-1 mb-3">
                    <Building size={16} /> {job.company}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge badge-primary bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                       <MapPin size={12} /> {job.location}
                    </span>
                    <span className="badge badge-primary bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                       <Briefcase size={12} /> {job.type}
                    </span>
                    {job.salary && (
                      <span className="badge badge-warning bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <DollarSign size={12} /> {job.salary}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-50 flex gap-6 text-sm text-gray-500">
                 <div className="flex items-center gap-1">
                   <Clock size={14} /> Posted {formatDate(getSafeJobDate(job, 'posted'))}
                 </div>
                 {deadlineStatus && (
                   <div className={`flex items-center gap-1 font-semibold ${deadlineStatus.status === 'expired' ? 'text-red-500' : 'text-green-600'}`}>
                     <Calendar size={14} /> Deadline: {deadlineStatus.text}
                   </div>
                 )}
              </div>
            </div>

            {/* Description */}
            <div className="card p-8 bg-white rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
            </div>

            {/* Apply Section */}
            {isApplying && (
              <div className="card p-8 bg-white border-2 border-blue-100 rounded-xl shadow-md">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Send size={20} className="text-blue-600" /> Apply for this position
                </h2>
                {!user ? (
                   <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 text-amber-800 text-center">
                     <AlertCircle size={40} className="mx-auto mb-3 opacity-50" />
                     <p className="font-bold text-lg mb-2">Login Required</p>
                     <p className="mb-4">You need to be logged in as a job seeker to apply.</p>
                     <div className="flex justify-center gap-3">
                       <Link to="/signin" className="px-6 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition">Signin</Link>
                       <button onClick={() => setIsApplying(false)} className="px-6 py-2 border border-amber-300 rounded-lg font-bold hover:bg-amber-100 transition">Cancel</button>
                     </div>
                   </div>
                ) : user.userType === 'employer' ? (
                   <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-red-800 text-center">
                     <AlertCircle size={40} className="mx-auto mb-3 opacity-50" />
                     <p className="font-bold text-lg mb-2">Recruiter Access</p>
                     <p className="mb-4">Employers cannot apply for job positions. Please log in with a job seeker account to submit applications.</p>
                     <button onClick={() => setIsApplying(false)} className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition">Close</button>
                   </div>
                ) : submitSuccess ? (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-green-700 flex items-center gap-3">
                    <CheckCircle /> <span className="font-bold">Application submitted successfully!</span>
                  </div>
                ) : (
                  <>
                    {submitError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded text-red-700 text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {submitError}
                      </div>
                    )}
                    <form onSubmit={handleSubmitApplication} className="space-y-5">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Upload Resume (PDF/DOC) *</label>
                        <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} required className="w-full border border-gray-300 p-2 rounded-lg bg-gray-50" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Cover Letter</label>
                        <textarea name="coverLetter" onChange={handleInputChange} className="w-full border border-gray-300 p-3 rounded-lg h-32 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Briefly describe why you are the perfect fit..." />
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" disabled={submitLoading} className="btn btn-primary px-8 py-2">
                          {submitLoading ? "Sending..." : "Submit"}
                        </button>
                        <button type="button" onClick={() => setIsApplying(false)} className="btn btn-secondary px-8 py-2 text-gray-600">Cancel</button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-6">
            <div className="card p-6 bg-white rounded-xl shadow-sm border border-gray-100 sticky top-24">
              <button onClick={handleApply} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all mb-3 flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
                <Send size={18} /> Apply Now
              </button>
              <button onClick={toggleSaveJob} className={`w-full py-3 border-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${isSaved ? 'bg-blue-50 border-blue-600 text-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <Bookmark size={18} /> {isSaved ? "Saved" : "Save Job"}
              </button>

              {user?.userType === 'employer' && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-blue-800 text-[11px] text-center italic">
                  Note: You are currently using an Employer account.
                </div>
              )}

              {/* Skill Gap Section */}
              {skillGapData && (
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-blue-600" />
                    Skill Gap Analysis
                  </h3>
                  
                  <div className="space-y-5">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-sm font-bold text-gray-700">Overall Match</span>
                       <span className="text-lg font-black text-blue-600">{skillGapData.matchPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                       <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${skillGapData.matchPercentage}%` }}></div>
                    </div>

                    <div>
                      <p className="text-[11px] font-black text-green-700 uppercase tracking-wider mb-2">Matching Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {skillGapData.matchedSkills?.length > 0 ? (
                          skillGapData.matchedSkills.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] rounded border border-green-100 font-bold">{s}</span>
                          ))
                        ) : <span className="text-xs text-gray-400">None detected</span>}
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-black text-orange-700 uppercase tracking-wider mb-2">Skills to Learn</p>
                      <div className="flex flex-wrap gap-1.5">
                        {skillGapData.missingSkills?.length > 0 ? (
                          skillGapData.missingSkills.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] rounded border border-orange-100 font-bold">{s}</span>
                          ))
                        ) : <span className="text-xs text-gray-400">All set!</span>}
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xs text-blue-800 italic leading-relaxed">
                        "{skillGapData.recommendation}"
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default JobDetail