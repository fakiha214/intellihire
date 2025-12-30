"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Loader, AlertCircle } from "lucide-react"
import EventJobCard from "../../components/events/EventJobCard"
import BoothMap from "../../components/events/BoothMap"
import Toast from "../../components/Toast"

const EventBrowsePage = ({ user }) => {
  const { eventId } = useParams()
  const [event, setEvent] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [jobs, setJobs] = useState([])
  const [booths, setBooths] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [highlightedEmployerId, setHighlightedEmployerId] = useState(null)
  // eslint-disable-next-line no-unused-vars
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const fetchData = async () => {
    try {
      const [eventRes, attendanceRes, jobsRes, boothsRes, applicationsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/events/${eventId}`, { credentials: 'include' }),
        fetch(`http://localhost:5000/api/events/${eventId}/my-attendance`, { credentials: 'include' }),
        fetch(`http://localhost:5000/api/events/${eventId}/jobs`, { credentials: 'include' }),
        fetch(`http://localhost:5000/api/events/${eventId}/booths`, { credentials: 'include' }),
        fetch(`http://localhost:5000/api/events/${eventId}/my-applications`, { credentials: 'include' })
      ])

      if (!attendanceRes.ok) {
        setError('You do not have access to this event')
        setLoading(false)
        return
      }

      if (eventRes.ok) setEvent(await eventRes.json())
      if (attendanceRes.ok) {
        const data = await attendanceRes.json()
        setAttendance(data)
        if (data.status !== 'approved') {
          setError('Your registration is still pending approval')
          setLoading(false)
          return
        }
      }
      if (jobsRes.ok) setJobs(await jobsRes.json())
      if (boothsRes.ok) setBooths(await boothsRes.json())
      if (applicationsRes.ok) setApplications(await applicationsRes.json())

      setLoading(false)
    } catch (_err) { // eslint-disable-line no-unused-vars
      setError('Failed to load event')
      setLoading(false)
    }
  }

  const handleApply = async (jobId) => {
    setSubmitting(true)

    try {
      const response = await fetch(`http://localhost:5000/api/events/${eventId}/jobs/${jobId}/apply`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverLetter: '' })
      })

      if (response.ok) {
        setToast({ message: 'Application submitted successfully!', type: 'success' })
        await fetchData()
      } else {
        const data = await response.json()
        setToast({ message: data.error || 'Failed to submit application', type: 'error' })
      }
    } catch (_err) { // eslint-disable-line no-unused-vars
      setToast({ message: 'Failed to submit application', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleBoothClick = (booth) => {
    if (booth.employer) {
      setHighlightedEmployerId(booth.employer.id)
      // Filter jobs by this employer
    } else {
      setHighlightedEmployerId(null)
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (job.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesIndustry = !selectedIndustry || job.industry === selectedIndustry

    return matchesSearch && matchesIndustry
  })

  const industries = [...new Set(jobs.map(j => j.industry).filter(Boolean))]

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </main>
    )
  }

  if (!attendance || attendance.status !== 'approved') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">{error || 'Your registration is still pending approval.'}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{event?.title}</h1>
          <p className="text-gray-600">Browse opportunities and apply to jobs</p>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Jobs & Filters */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search & Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Find Jobs</h2>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">All Industries</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Jobs Grid */}
            <div className="space-y-4">
              {filteredJobs.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No jobs match your search</p>
                </div>
              ) : (
                filteredJobs.map(job => {
                  const isApplied = applications.some(app => app.eventJobId === job.id)
                  const employer = booths.find(b => b.eventEmployerId)?.employer

                  return (
                    <EventJobCard
                      key={job.id}
                      job={job}
                      employer={employer}
                      onApply={() => handleApply(job.id)}
                      isApplied={isApplied}
                      userType={user?.userType}
                      onboothClick={handleBoothClick}
                    />
                  )
                })
              )}
            </div>
          </div>

          {/* Right: Booth Map */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <BoothMap
                layout={event?.boothLayout}
                booths={booths}
                mode="view"
                onBoothClick={handleBoothClick}
                highlightedEmployerId={highlightedEmployerId}
              />
            </div>
          </div>
        </div>

        {/* My Applications Section */}
        {applications.length > 0 && (
          <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Applications</h2>

            <div className="space-y-4">
              {applications.map(app => (
                <div key={app.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-800">{app.job.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">Applied on {new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded font-semibold ${
                      app.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  {app.feedback && (
                    <p className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      <strong>Feedback:</strong> {app.feedback}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default EventBrowsePage

// Feature: Notification system
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
};

// Feature: Job search and filtering
const searchJobs = (jobs, filters) => {
  return jobs.filter(job => {
    return (!filters.title || job.title.includes(filters.title)) &&
           (!filters.location || job.location === filters.location) &&
           (!filters.salary || job.salary >= filters.salary);
  });
};

// Feature: Notification system
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
};

// Feature: Form submission handler
const handleFormSubmit = (e, formData, callback) => {
  e.preventDefault();
  if (!formData.email || !formData.password) {
    console.error('Missing required fields');
    return;
  }
  callback(formData);
};
