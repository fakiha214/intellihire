"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { AlertCircle, CheckCircle, Loader } from "lucide-react"
import EventStatusBadge from "../../components/events/EventStatusBadge"

const EventJoinPage = ({ isAuthenticated, user }) => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/events/join/${token}`, {
          method: 'GET',
          credentials: 'include'
        })

        if (!response.ok) {
          setError('Invalid or expired invite link')
          setLoading(false)
          return
        }

        const data = await response.json()
        setEvent(data)
        setLoading(false)
      } catch (_err) { // eslint-disable-line no-unused-vars
        setError('Failed to load event')
        setLoading(false)
      }
    }

    fetchEvent()
  }, [token])

  const handleRequestAttendance = async () => {
    setSubmitting(true)
    try {
      const response = await fetch(`http://localhost:5000/api/events/join/${token}/request`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          navigate(`/events/${event.id}`)
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to request attendance')
      }
    } catch (_err) { // eslint-disable-line no-unused-vars
      setError('Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Invalid Link</h1>
          <p className="text-gray-600 text-center mb-6">{error || 'This invite link is invalid or has expired.'}</p>
          <Link to="/" className="block text-center text-blue-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Request Submitted!</h1>
          <p className="text-gray-600 text-center mb-6">
            Your request to attend {event.title} has been submitted. You'll be redirected soon.
          </p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Event Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{event.title}</h1>
              <EventStatusBadge status={event.status} />
            </div>
          </div>

          {event.description && (
            <p className="text-gray-600 text-lg mb-6">{event.description}</p>
          )}

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded">
            {event.eventStart && (
              <div>
                <p className="text-sm text-gray-600 font-medium">Start Date</p>
                <p className="text-lg font-semibold text-gray-800">
                  {new Date(event.eventStart).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}

            {event.eventEnd && (
              <div>
                <p className="text-sm text-gray-600 font-medium">End Date</p>
                <p className="text-lg font-semibold text-gray-800">
                  {new Date(event.eventEnd).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}

            {event.venueName && (
              <div>
                <p className="text-sm text-gray-600 font-medium">Venue</p>
                <p className="text-lg font-semibold text-gray-800">{event.venueName}</p>
              </div>
            )}

            {event.venueAddress && (
              <div>
                <p className="text-sm text-gray-600 font-medium">Location</p>
                <p className="text-lg font-semibold text-gray-800">
                  {event.venueAddress}, {event.venueCity}, {event.venueCountry}
                </p>
              </div>
            )}
          </div>

          {/* Action Section */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}

          {!isAuthenticated ? (
            <div className="bg-blue-50 border border-blue-200 rounded p-6">
              <p className="text-blue-900 mb-4">Sign in to request attendance at this event</p>
              <Link
                to={`/signin?redirect=/events/join/${token}`}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded font-semibold hover:bg-blue-700 transition"
              >
                Sign In
              </Link>
            </div>
          ) : user?.userType !== 'jobSeeker' ? (
            <div className="bg-amber-50 border border-amber-200 rounded p-6">
              <p className="text-amber-900">Only job seekers can request attendance at events.</p>
            </div>
          ) : (
            <button
              onClick={handleRequestAttendance}
              disabled={submitting}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Request to Attend'}
            </button>
          )}
        </div>

        {/* Event Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {event.maxAttendees && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600 text-sm font-medium mb-1">Max Attendees</p>
              <p className="text-2xl font-bold text-gray-800">{event.maxAttendees}</p>
            </div>
          )}

          {event.maxEmployers && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600 text-sm font-medium mb-1">Participating Companies</p>
              <p className="text-2xl font-bold text-gray-800">{event.maxEmployers}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default EventJoinPage

// Feature: Array utility functions
const arrayUtils = {
  unique: (arr) => [...new Set(arr)],
  flatten: (arr) => arr.reduce((flat, item) => flat.concat(item), []),
  chunk: (arr, size) => Array.from({ length: Math.ceil(arr.length / size) },
    (_, i) => arr.slice(i * size, i * size + size))
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

// Feature: Data validation
const validateJobData = (job) => {
  const errors = [];
  if (!job.title || job.title.trim() === '') errors.push('Title is required');
  if (!job.description || job.description.trim() === '') errors.push('Description is required');
  if (!job.location || job.location.trim() === '') errors.push('Location is required');
  return { valid: errors.length === 0, errors };
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

// Feature: Array utility functions
const arrayUtils = {
  unique: (arr) => [...new Set(arr)],
  flatten: (arr) => arr.reduce((flat, item) => flat.concat(item), []),
  chunk: (arr, size) => Array.from({ length: Math.ceil(arr.length / size) },
    (_, i) => arr.slice(i * size, i * size + size))
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

// Feature: Job search and filtering
const searchJobs = (jobs, filters) => {
  return jobs.filter(job => {
    return (!filters.title || job.title.includes(filters.title)) &&
           (!filters.location || job.location === filters.location) &&
           (!filters.salary || job.salary >= filters.salary);
  });
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

// Feature: State management
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'SET_DATA': return { ...state, data: action.payload };
    default: return state;
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
