"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Copy, Check, Loader, AlertCircle } from "lucide-react"
import EventStatusBadge from "../../components/events/EventStatusBadge"
import BoothMap from "../../components/events/BoothMap"

const EventDashboard = () => {
  const { eventId } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [copied, setCopied] = useState(false)
  const [employers, setEmployers] = useState([])
  const [booths, setBooths] = useState([])
  const [attendees, setAttendees] = useState([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [attendeeFilter, setAttendeeFilter] = useState('all')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const fetchData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setEvent(data)

        // Fetch related data
        const [employersRes, boothsRes, attendeesRes] = await Promise.all([
          fetch(`http://localhost:5000/api/events/${eventId}/employers`, { credentials: 'include' }),
          fetch(`http://localhost:5000/api/events/${eventId}/booths`, { credentials: 'include' }),
          fetch(`http://localhost:5000/api/events/${eventId}/attendees`, { credentials: 'include' })
        ])

        if (employersRes.ok) setEmployers(await employersRes.json())
        if (boothsRes.ok) setBooths(await boothsRes.json())
        if (attendeesRes.ok) setAttendees(await attendeesRes.json())
      }

      setLoading(false)
    } catch (_err) { // eslint-disable-line no-unused-vars
      setError('Failed to load event')
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/events/${eventId}/publish`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setEvent(data)
      }
    } catch (_err) { // eslint-disable-line no-unused-vars
      setError('Failed to publish event')
    }
  }

  const handleInviteEmployer = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch(`http://localhost:5000/api/events/${eventId}/employers/invite`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail })
      })

      if (response.ok) {
        setInviteEmail('')
        await fetchData()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to invite employer')
      }
    } catch (_err) { // eslint-disable-line no-unused-vars
      setError('Failed to send invite')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproveAttendee = async (attendeeId, status) => {
    try {
      await fetch(`http://localhost:5000/api/events/${eventId}/attendees/${attendeeId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      await fetchData()
    } catch (_err) { // eslint-disable-line no-unused-vars
      setError('Failed to update attendee status')
    }
  }

  const handleGenerateBooths = async () => {
    try {
      await fetch(`http://localhost:5000/api/events/${eventId}/booths/generate`, {
        method: 'POST',
        credentials: 'include'
      })

      await fetchData()
    } catch (_err) { // eslint-disable-line no-unused-vars
      setError('Failed to generate booths')
    }
  }

  const copyInviteLink = () => {
    const link = `${window.location.origin}/events/join/${event.inviteToken}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Event Not Found</h1>
        </div>
      </main>
    )
  }

  const filteredAttendees = attendeeFilter === 'all'
    ? attendees
    : attendees.filter(a => a.status === attendeeFilter)

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{event.title}</h1>
            <EventStatusBadge status={event.status} />
          </div>
          {event.status === 'draft' && (
            <button
              onClick={handlePublish}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Publish Event
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8 border-b border-gray-200">
          <div className="flex">
            {['overview', 'employers', 'booths', 'attendees'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-semibold transition ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Event Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Venue</p>
                  <p className="text-lg font-semibold text-gray-800">{event.venueName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Location</p>
                  <p className="text-lg font-semibold text-gray-800">{event.venueCity}, {event.venueCountry}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Start</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {new Date(event.eventStart).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">End</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {new Date(event.eventEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {event.description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 font-medium mb-2">Description</p>
                  <p className="text-gray-700">{event.description}</p>
                </div>
              )}
            </div>

            {event.status === 'published' && event.inviteToken && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Share Invite Link</h3>
                <div className="flex items-center space-x-2 bg-white p-3 rounded border border-blue-300">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/events/join/${event.inviteToken}`}
                    className="flex-1 outline-none"
                  />
                  <button
                    onClick={copyInviteLink}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Employers Tab */}
        {activeTab === 'employers' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Invite Employers</h2>

              <form onSubmit={handleInviteEmployer} className="flex gap-3 mb-6">
                <input
                  type="email"
                  placeholder="Enter employer email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Invite'}
                </button>
              </form>

              <h3 className="font-bold text-gray-800 mb-3">Invited Employers</h3>
              <div className="space-y-3">
                {employers.map((employer) => (
                  <div key={employer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                    <div>
                      <p className="font-semibold text-gray-800">{employer.employer?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{employer.invitedByEmail}</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded mt-1 ${
                        employer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        employer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {employer.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Booths Tab */}
        {activeTab === 'booths' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Manage Booths</h2>

              <button
                onClick={handleGenerateBooths}
                className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Generate Booths
              </button>

              {booths.length > 0 && (
                <BoothMap
                  layout={event.boothLayout}
                  booths={booths}
                  mode="edit"
                />
              )}
            </div>
          </div>
        )}

        {/* Attendees Tab */}
        {activeTab === 'attendees' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Attendance Requests</h2>

            <div className="flex gap-3 mb-6">
              {['all', 'requested', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setAttendeeFilter(status)}
                  className={`px-4 py-2 rounded transition ${
                    attendeeFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendees.map((attendee) => (
                    <tr key={attendee.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3">{attendee.seekerName}</td>
                      <td className="px-4 py-3">{attendee.seekerEmail}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded font-semibold ${
                          attendee.status === 'approved' ? 'bg-green-100 text-green-800' :
                          attendee.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {attendee.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        {attendee.status === 'requested' && (
                          <>
                            <button
                              onClick={() => handleApproveAttendee(attendee.id, 'approved')}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveAttendee(attendee.id, 'rejected')}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default EventDashboard

// Feature: Array utility functions
const arrayUtils = {
  unique: (arr) => [...new Set(arr)],
  flatten: (arr) => arr.reduce((flat, item) => flat.concat(item), []),
  chunk: (arr, size) => Array.from({ length: Math.ceil(arr.length / size) },
    (_, i) => arr.slice(i * size, i * size + size))
};

// Feature: Notification system
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
};

// Feature: State management
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'SET_DATA': return { ...state, data: action.payload };
    default: return state;
  }
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

// Feature: Notification system
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
};

// Feature: Array utility functions
const arrayUtils = {
  unique: (arr) => [...new Set(arr)],
  flatten: (arr) => arr.reduce((flat, item) => flat.concat(item), []),
  chunk: (arr, size) => Array.from({ length: Math.ceil(arr.length / size) },
    (_, i) => arr.slice(i * size, i * size + size))
};

// Feature: User authentication
const authenticateUser = async (email, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await response.json();
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
};

// Feature: Error handling wrapper
const handleAsyncError = async (asyncFunction) => {
  try {
    return await asyncFunction();
  } catch (error) {
    console.error('Error:', error.message);
    throw new Error(`Operation failed: ${error.message}`);
  }
};
