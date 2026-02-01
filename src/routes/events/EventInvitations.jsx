"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Loader, AlertCircle } from "lucide-react"

const EventInvitations = () => {
  const navigate = useNavigate()
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/events/invitations', {
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          setInvitations(data)
        } else {
          setError('Failed to load invitations')
        }

        setLoading(false)
      } catch (_err) { // eslint-disable-line no-unused-vars
        setError('Failed to load invitations')
        setLoading(false)
      }
    }

    fetchInvitations()
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Event Invitations</h1>
          <p className="text-gray-600">Review and respond to event invitations</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {invitations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No pending invitations</p>
            <button
              onClick={() => navigate('/events')}
              className="text-blue-600 hover:underline font-semibold"
            >
              View my events
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {invitations.map(invitation => (
              <div
                key={invitation.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-6 border-l-4 border-blue-500"
              >
                {/* Event Title & Status */}
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{invitation.event.title}</h2>
                  <span className={`inline-block px-3 py-1 text-xs rounded font-semibold ${
                    invitation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    invitation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {invitation.status === 'invited' ? 'Pending' : invitation.status}
                  </span>
                </div>

                {/* Event Details */}
                <div className="space-y-3 mb-6 text-sm text-gray-600">
                  {invitation.event.description && (
                    <p className="text-gray-700">{invitation.event.description}</p>
                  )}

                  {invitation.event.venueName && (
                    <div>
                      <p className="font-medium">📍 Venue</p>
                      <p>{invitation.event.venueName}</p>
                    </div>
                  )}

                  {invitation.event.eventStart && (
                    <div>
                      <p className="font-medium">📅 Date</p>
                      <p>{new Date(invitation.event.eventStart).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                  )}

                  {invitation.event.eventEnd && (
                    <div>
                      <p className="font-medium">⏱️ End Time</p>
                      <p>{new Date(invitation.event.eventEnd).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-gray-200">
                  {invitation.event.maxAttendees && (
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Max Attendees</p>
                      <p className="text-lg font-bold text-gray-800">{invitation.event.maxAttendees}</p>
                    </div>
                  )}

                  {invitation.event.maxEmployers && (
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Employers</p>
                      <p className="text-lg font-bold text-gray-800">{invitation.event.maxEmployers}</p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {invitation.status === 'invited' && (
                  <button
                    onClick={() => navigate(`/events/${invitation.eventId}/employer-portal`)}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    View Invitation
                  </button>
                )}

                {invitation.status === 'accepted' && (
                  <button
                    onClick={() => navigate(`/events/${invitation.eventId}/employer-portal`)}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    Go to Portal
                  </button>
                )}

                {invitation.status === 'rejected' && (
                  <div className="p-3 bg-red-50 rounded text-red-700 text-center text-sm font-medium">
                    You declined this invitation
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default EventInvitations

// Feature: API request handler
const apiCall = (endpoint, options = {}) => {
  const defaultOptions = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  };
  return fetch(endpoint, { ...defaultOptions, ...options });
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

// Feature: Notification system
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
};

// Feature: Notification system
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
};
