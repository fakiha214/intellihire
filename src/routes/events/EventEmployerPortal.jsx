"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Loader, AlertCircle } from "lucide-react"
import BoothMap from "../../components/events/BoothMap"

const EventEmployerPortal = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [eventEmployer, setEventEmployer] = useState(null)
  const [jobs, setJobs] = useState([])
  const [booths, setBooths] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('invitation')
  const [submitting, setSubmitting] = useState(false)
  const [profileForm, setProfileForm] = useState({
    eventCompanyTagline: '',
    eventCompanyCulture: '',
    eventOpeningsContext: '',
    eventContactName: '',
    eventContactEmail: '',
    eventContactPhone: ''
  })
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    jobType: '',
    salary: '',
    experienceLevel: '',
    industry: '',
    location: '',
    requirements: ''
  })

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const fetchData = async () => {
    try {
      const [eventRes, profileRes, jobsRes, boothsRes] = await Promise.all([
        fetch(`/api/events/${eventId}`, { credentials: 'include' }),
        fetch(`/api/events/${eventId}/my-profile`, { credentials: 'include' }),
        fetch(`/api/events/${eventId}/my-jobs`, { credentials: 'include' }),
        fetch(`/api/events/${eventId}/booths`, { credentials: 'include' })
      ])

      if (eventRes.ok) setEvent(await eventRes.json())
      if (profileRes.ok) {
        const data = await profileRes.json()
        setEventEmployer(data)
        setProfileForm({
          eventCompanyTagline: data.eventCompanyTagline || '',
          eventCompanyCulture: data.eventCompanyCulture || '',
          eventOpeningsContext: data.eventOpeningsContext || '',
          eventContactName: data.eventContactName || '',
          eventContactEmail: data.eventContactEmail || '',
          eventContactPhone: data.eventContactPhone || ''
        })
      }
      if (jobsRes.ok) setJobs(await jobsRes.json())
      if (boothsRes.ok) setBooths(await boothsRes.json())

      setLoading(false)
    } catch (_err) { // eslint-disable-line no-unused-vars
      setError('Failed to load portal')
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/events/${eventId}/employers/accept`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setEventEmployer(data)
        setActiveTab('my-profile')
      }
    } catch (_err) { // eslint-disable-line no-unused-vars
      setError('Failed to accept invitation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDecline = async () => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/events/${eventId}/employers/decline`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        navigate('/events/invitations')
      }
    } catch (_err) { // eslint-disable-line no-unused-vars
      setError('Failed to decline invitation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch(`/api/events/${eventId}/my-profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      })

      if (response.ok) {
        await fetchData()
        alert('Profile updated successfully!')
      }
    } catch (_err) { // eslint-disable-line no-unused-vars
      setError('Failed to update profile')
    } finally {
      setSubmitting(false)
    }
  }

  const handleJobSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch(`/api/events/${eventId}/jobs`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...jobForm,
          requirements: jobForm.requirements.split(',').map(r => r.trim())
        })
      })

      if (response.ok) {
        setJobForm({
          title: '',
          description: '',
          jobType: '',
          salary: '',
          experienceLevel: '',
          industry: '',
          location: '',
          requirements: ''
        })
        await fetchData()
        alert('Job added successfully!')
      }
    } catch (_err) { // eslint-disable-line no-unused-vars
      setError('Failed to add job')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </main>
    )
  }

  if (!event) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">Event Not Found</h1>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{event.title}</h1>
          <p className="text-gray-600">Employer Portal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8 border-b border-gray-200">
          <div className="flex">
            {['invitation', 'my-profile', 'my-jobs', 'booth'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                disabled={eventEmployer?.status === 'invited' && tab !== 'invitation'}
                className={`px-6 py-4 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab === 'my-profile' ? 'Profile' : tab === 'my-jobs' ? 'Jobs' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Invitation Tab */}
        {activeTab === 'invitation' && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Event Invitation</h2>

            <div className="space-y-6 mb-8">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Event Title</p>
                <p className="text-lg font-semibold text-gray-800">{event.title}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Venue</p>
                <p className="text-lg font-semibold text-gray-800">{event.venueName}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Date</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {new Date(event.eventStart).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Time</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {new Date(event.eventStart).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {event.description && (
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Description</p>
                  <p className="text-gray-700">{event.description}</p>
                </div>
              )}
            </div>

            {eventEmployer?.status === 'invited' && (
              <div className="flex gap-4">
                <button
                  onClick={handleAccept}
                  disabled={submitting}
                  className="px-6 py-3 bg-green-600 text-white rounded font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Accepting...' : 'Accept Invitation'}
                </button>
                <button
                  onClick={handleDecline}
                  disabled={submitting}
                  className="px-6 py-3 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Declining...' : 'Decline Invitation'}
                </button>
              </div>
            )}

            {eventEmployer?.status === 'accepted' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded text-green-800">
                ✓ You have accepted this invitation. Complete your profile to get started.
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'my-profile' && eventEmployer?.status === 'accepted' && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Event Profile</h2>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Tagline</label>
                <input
                  type="text"
                  value={profileForm.eventCompanyTagline}
                  onChange={(e) => setProfileForm({ ...profileForm, eventCompanyTagline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="What makes your company special?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Culture</label>
                <textarea
                  value={profileForm.eventCompanyCulture}
                  onChange={(e) => setProfileForm({ ...profileForm, eventCompanyCulture: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Describe your company culture..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Openings & Opportunities</label>
                <textarea
                  value={profileForm.eventOpeningsContext}
                  onChange={(e) => setProfileForm({ ...profileForm, eventOpeningsContext: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="What kind of positions are you hiring for?"
                />
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Contact Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Name</label>
                    <input
                      type="text"
                      value={profileForm.eventContactName}
                      onChange={(e) => setProfileForm({ ...profileForm, eventContactName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
                    <input
                      type="email"
                      value={profileForm.eventContactEmail}
                      onChange={(e) => setProfileForm({ ...profileForm, eventContactEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Phone</label>
                    <input
                      type="tel"
                      value={profileForm.eventContactPhone}
                      onChange={(e) => setProfileForm({ ...profileForm, eventContactPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'my-jobs' && eventEmployer?.status === 'accepted' && (
          <div className="space-y-6">
            {/* Add Job Form */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Event Job</h2>

              <form onSubmit={handleJobSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Job Type</label>
                    <select
                      value={jobForm.jobType}
                      onChange={(e) => setJobForm({ ...jobForm, jobType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option>Select job type</option>
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                      <option>Internship</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Experience Level</label>
                    <select
                      value={jobForm.experienceLevel}
                      onChange={(e) => setJobForm({ ...jobForm, experienceLevel: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option>Select level</option>
                      <option>Entry</option>
                      <option>Mid</option>
                      <option>Senior</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Salary</label>
                    <input
                      type="text"
                      value={jobForm.salary}
                      onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Industry</label>
                    <input
                      type="text"
                      value={jobForm.industry}
                      onChange={(e) => setJobForm({ ...jobForm, industry: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Requirements (comma-separated)</label>
                  <input
                    type="text"
                    value={jobForm.requirements}
                    onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Python, React, SQL"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Job'}
                </button>
              </form>
            </div>

            {/* Jobs List */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Your Event Jobs</h3>

              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                    <h4 className="font-bold text-gray-800">{job.title}</h4>
                    <p className="text-sm text-gray-600">{job.salary} • {job.jobType}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Booth Tab */}
        {activeTab === 'booth' && eventEmployer?.status === 'accepted' && booths.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Booth</h2>
            <BoothMap
              layout={event.boothLayout}
              booths={booths}
              mode="view"
              highlightedEmployerId={eventEmployer?.id}
            />
          </div>
        )}
      </div>
    </main>
  )
}

export default EventEmployerPortal
