"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Loader, AlertCircle } from "lucide-react"
import EventStatusBadge from "../../components/events/EventStatusBadge"

const MyEvents = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, invitationsRes] = await Promise.all([
          fetch('http://localhost:5000/api/events/my', { credentials: 'include' }),
          fetch('http://localhost:5000/api/events/invitations', { credentials: 'include' })
        ])

        if (eventsRes.ok) {
          const data = await eventsRes.json()
          setEvents(data)
        }

        if (invitationsRes.ok) {
          const data = await invitationsRes.json()
          setInvitations(data)
        }

        setLoading(false)
      } catch (_err) { // eslint-disable-line no-unused-vars
        setError('Failed to load events')
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Events</h1>
            <p className="text-gray-600">Manage your job fairs and open house events</p>
          </div>
          <button
            onClick={() => navigate('/events/create')}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>New Event</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Hosted Events Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Hosted Events</h2>

          {events.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No events yet</p>
              <button
                onClick={() => navigate('/events/create')}
                className="text-blue-600 hover:underline font-semibold"
              >
                Create your first event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/events/${event.id}/dashboard`)}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition cursor-pointer p-6"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-800 flex-1">{event.title}</h3>
                    <EventStatusBadge status={event.status} />
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {event.venueName && (
                      <p>📍 {event.venueName}</p>
                    )}
                    {event.eventStart && (
                      <p>📅 {new Date(event.eventStart).toLocaleDateString()}</p>
                    )}
                  </div>

                  <button
                    className="w-full py-2 text-blue-600 font-semibold hover:bg-blue-50 rounded transition"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/events/${event.id}/dashboard`)
                    }}
                  >
                    Manage Event →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invitations Section */}
        {invitations.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Pending Invitations</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-amber-400"
                >
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{invitation.event.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{invitation.event.description}</p>

                  <div className="space-y-2 text-sm text-gray-600 mb-6">
                    {invitation.event.venueName && (
                      <p>📍 {invitation.event.venueName}</p>
                    )}
                    {invitation.event.eventStart && (
                      <p>📅 {new Date(invitation.event.eventStart).toLocaleDateString()}</p>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/events/${invitation.eventId}/employer-portal`)}
                    className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold text-sm"
                  >
                    View Invitation
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default MyEvents

// Feature: State management
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'SET_DATA': return { ...state, data: action.payload };
    default: return state;
  }
};
