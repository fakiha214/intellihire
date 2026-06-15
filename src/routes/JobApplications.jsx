"use client"

import { useState, useEffect, useCallback } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft, Mail, Phone, FileText, Clock, CheckCircle, XCircle, 
  AlertCircle, Download, UserCheck, Briefcase, X, Calendar, MapPin, Loader, Trophy
} from "lucide-react"
import { getBackendUrl } from '../utils/getBackendUrl'
import { formatDate } from '../utils/dateUtils'

const JobApplications = () => {
  const { id: jobId } = useParams()
  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("all")
  
  // Modals State
  const [interviewModal, setInterviewModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState(null)
  
  // Form State
  const [interviewData, setInterviewData] = useState({ date: '', time: '', notes: '' })
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const jobRes = await fetch(`/api/jobs/${jobId}`, { credentials: "include" })
      const jobData = await jobRes.json()
      setJob(jobData)

      const appRes = await fetch(`/api/jobs/${jobId}/applications`, { credentials: "include" })
      const appData = await appRes.json()
      setApplications(Array.isArray(appData) ? appData : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => { fetchData() }, [fetchData])

  const updateStatus = async (appId, newStatus, extraInfo = "") => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            status: newStatus, 
            feedback: newStatus === 'rejected' ? "Application declined." : "",
            interview_notes: newStatus === 'interviewed' ? extraInfo : "" 
        }),
        credentials: "include",
      })
      if (res.ok) {
        setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a))
        setInterviewModal(false)
      }
    } catch (err) {
      alert("Error updating status")
    } finally {
      setActionLoading(false)
    }
  }

  const handleScheduleSubmit = () => {
    const info = `Date: ${interviewData.date} | Time: ${interviewData.time} | Instructions: ${interviewData.notes}`;
    updateStatus(selectedApplication.id, 'interviewed', info);
  }

  const filteredApps = applications.filter(app => filter === "all" || app.status === filter)

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader className="animate-spin text-blue-600" size={48} /></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10 p-6 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <Link to="/jobs/manage" className="text-blue-600 font-bold flex items-center gap-2 mb-2"><ArrowLeft size={16}/> BACK</Link>
          <h1 className="text-3xl font-black text-gray-900">{job?.title || "Job Details"}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        {/* Filter Bar with Hired added */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['all', 'pending', 'reviewed', 'interviewed', 'hired', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filter === s ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border'}`}>{s}</button>
          ))}
        </div>

        <div className="grid gap-6">
          {filteredApps.map((app) => (
            <div key={app.id} className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-black">{app.applicantName?.charAt(0)}</div>
                  <div>
                    <h3 className="text-xl font-bold">{app.applicantName}</h3>
                    <p className="text-sm text-gray-500">{app.applicantEmail}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                    {typeof app.matchScore === 'number' && (
                      <div className="flex items-center gap-2 mb-2" title="How well this candidate's skills match the job">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Match</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-black ${
                            app.matchScore >= 70 ? 'bg-green-100 text-green-700' :
                            app.matchScore >= 40 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }`}>{app.matchScore}%</span>
                      </div>
                    )}
                    <span className={`px-4 py-1 rounded-full text-xs font-black uppercase mb-2 ${
                        app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        app.status === 'hired' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                    }`}>{app.status}</span>
                    <a href={getBackendUrl(app.resumeUrl)} target="_blank" rel="noreferrer" className="text-blue-600 text-sm font-bold flex items-center gap-1"><Download size={14}/> Resume</a>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 pt-6 border-t">
                {/* Actions available if not rejected and not already hired */}
                {app.status !== 'rejected' && app.status !== 'hired' && (
                  <>
                    <button onClick={() => updateStatus(app.id, 'reviewed')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm">Mark Reviewed</button>
                    <button onClick={() => { setSelectedApplication(app); setInterviewModal(true); }} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold shadow-sm">Schedule Interview</button>
                    <button onClick={() => updateStatus(app.id, 'hired')} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2">
                        <Trophy size={16}/> Hire Candidate
                    </button>
                    <button onClick={() => updateStatus(app.id, 'rejected')} className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold">Reject</button>
                  </>
                )}
                
                {app.status === 'hired' && (
                    <div className="flex items-center gap-2 text-green-600 font-bold">
                        <CheckCircle size={20} /> Candidate has been hired for this role.
                    </div>
                )}

                {app.status === 'rejected' && (
                    <button onClick={() => updateStatus(app.id, 'pending')} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold">Undo Rejection</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {interviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-900">Schedule Interview</h3>
              <button onClick={() => setInterviewModal(false)}><X /></button>
            </div>
            <div className="space-y-4">
              <input type="date" className="w-full border rounded-xl p-3" value={interviewData.date} onChange={e => setInterviewData({...interviewData, date: e.target.value})} />
              <input type="time" className="w-full border rounded-xl p-3" value={interviewData.time} onChange={e => setInterviewData({...interviewData, time: e.target.value})} />
              <textarea className="w-full border rounded-xl p-3 h-24" placeholder="Meeting details..." value={interviewData.notes} onChange={e => setInterviewData({...interviewData, notes: e.target.value})} />
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={handleScheduleSubmit} className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold">Confirm</button>
              <button onClick={() => setInterviewModal(false)} className="px-6 py-3 text-gray-500 font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobApplications