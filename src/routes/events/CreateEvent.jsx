"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ChevronRight, ChevronLeft } from "lucide-react"
import Toast from "../../components/Toast"

const CreateEvent = () => {
  const navigate = useNavigate()
  const { eventId } = useParams()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'job_fair',
    venueName: '',
    venueAddress: '',
    venueCity: '',
    venueCountry: '',
    eventStart: '',
    eventEnd: '',
    registrationDeadline: '',
    maxAttendees: '',
    maxEmployers: '',
    boothLayout: {
      rows: ['A', 'B', 'C'],
      booths_per_row: 3
    }
  })

  useEffect(() => {
    if (eventId) {
      // Load event for editing
      const fetchEvent = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
            credentials: 'include'
          })
          if (response.ok) {
            const data = await response.json()
            setFormData({
              title: data.title || '',
              description: data.description || '',
              eventType: data.eventType || 'job_fair',
              venueName: data.venueName || '',
              venueAddress: data.venueAddress || '',
              venueCity: data.venueCity || '',
              venueCountry: data.venueCountry || '',
              eventStart: data.eventStart || '',
              eventEnd: data.eventEnd || '',
              registrationDeadline: data.registrationDeadline || '',
              maxAttendees: data.maxAttendees || '',
              maxEmployers: data.maxEmployers || '',
              boothLayout: data.boothLayout || { rows: ['A', 'B', 'C'], booths_per_row: 3 }
            })
          }
        } catch (_err) { // eslint-disable-line no-unused-vars
          setError('Failed to load event')
        }
      }
      fetchEvent()
    }
  }, [eventId])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleBoothLayoutChange = (field, value) => {
    if (field === 'rows') {
      // Split by comma and extract single letters from each entry
      const rows = value
        .split(',')
        .map(r => r.trim().toUpperCase())
        .flatMap(r => {
          // If entry is multi-character, split it into individual letters
          return r.split('').filter(char => /^[A-Z]$/.test(char))
        })
        .filter((r, index, self) => self.indexOf(r) === index) // Remove duplicates
        .slice(0, 10) // Limit to 10 rows max

      setFormData(prev => ({
        ...prev,
        boothLayout: { ...prev.boothLayout, rows }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        boothLayout: { ...prev.boothLayout, [field]: parseInt(value) }
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const method = eventId ? 'PUT' : 'POST'
      const url = eventId
        ? `http://localhost:5000/api/events/${eventId}`
        : 'http://localhost:5000/api/events'

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to save event')
        setLoading(false)
        return
      }

      const data = await response.json()
      setSuccess(true)
      setTimeout(() => {
        navigate(`/events/${data.id}/dashboard`)
      }, 1500)
    } catch (_err) { // eslint-disable-line no-unused-vars
      setError('Failed to save event')
      setLoading(false)
    }
  }

  const goToStep = (newStep) => {
    if (newStep >= 1 && newStep <= 4) {
      setStep(newStep)
    }
  }

  const stepTitles = ['Basics', 'Venue', 'Booth Layout', 'Review']
  const isStep = (s) => step === s

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {eventId ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p className="text-gray-600">Set up your job fair or open house event</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between mb-4">
            {stepTitles.map((title, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold mb-1 cursor-pointer transition ${
                    step === idx + 1
                      ? 'bg-blue-600 text-white'
                      : idx + 1 < step
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-700'
                  }`}
                  onClick={() => goToStep(idx + 1)}
                >
                  {idx + 1 < step ? '✓' : idx + 1}
                </div>
                <span className="text-sm font-medium text-gray-700">{title}</span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-gray-200 rounded">
            <div
              className="h-full bg-blue-600 rounded transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-8">
          {error && <Toast message={error} type="error" />}
          {success && <Toast message="Event saved successfully!" type="success" />}

          {/* Step 1: Basics */}
          {isStep(1) && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Event Basics</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Tech Conference 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Describe your event..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Event Type</label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="job_fair">Job Fair</option>
                  <option value="open_house">Open House</option>
                  <option value="career_day">Career Day</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Venue */}
          {isStep(2) && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Venue Details</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Venue Name *</label>
                <input
                  type="text"
                  name="venueName"
                  value={formData.venueName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Convention Center"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  name="venueAddress"
                  value={formData.venueAddress}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="venueCity"
                    value={formData.venueCity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    name="venueCountry"
                    value={formData.venueCountry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Country"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Event Start *</label>
                  <input
                    type="datetime-local"
                    name="eventStart"
                    value={formData.eventStart}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Event End *</label>
                  <input
                    type="datetime-local"
                    name="eventEnd"
                    value={formData.eventEnd}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Registration Deadline</label>
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Booth Layout */}
          {isStep(3) && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Booth Layout</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rows (single letters, comma-separated)</label>
                <input
                  type="text"
                  value={formData.boothLayout.rows.join(', ')}
                  onChange={(e) => handleBoothLayoutChange('rows', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="A, B, C, D"
                />
                <p className="text-xs text-gray-600 mt-2">
                  💡 Type single letters separated by commas. Each row label should be one character.
                </p>
                <p className="text-xs text-gray-500 mt-1">Active rows: {formData.boothLayout.rows.join(', ') || 'None'}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Booths Per Row</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.boothLayout.booths_per_row}
                  onChange={(e) => handleBoothLayoutChange('booths_per_row', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Preview */}
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm font-semibold text-gray-700 mb-3">Preview:</p>
                <div className="space-y-2">
                  {formData.boothLayout.rows.map((row) => (
                    <div key={row} className="flex items-center space-x-1">
                      <span className="font-bold w-6">{row}</span>
                      {Array.from({ length: formData.boothLayout.booths_per_row }).map((_, idx) => (
                        <div key={idx} className="w-12 h-12 bg-gray-200 border border-gray-300 rounded flex items-center justify-center text-xs font-semibold">
                          {idx + 1}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Max Attendees</label>
                  <input
                    type="number"
                    name="maxAttendees"
                    value={formData.maxAttendees}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Max Employers</label>
                  <input
                    type="number"
                    name="maxEmployers"
                    value={formData.maxEmployers}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {isStep(4) && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">Review & Confirm</h2>

              <div className="space-y-4 p-4 bg-gray-50 rounded">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Title</p>
                    <p className="text-lg font-semibold text-gray-800">{formData.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Type</p>
                    <p className="text-lg font-semibold text-gray-800">{formData.eventType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Venue</p>
                    <p className="text-lg font-semibold text-gray-800">{formData.venueName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Location</p>
                    <p className="text-lg font-semibold text-gray-800">{formData.venueCity}, {formData.venueCountry}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Booth Layout</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {formData.boothLayout.rows.join(', ')} × {formData.boothLayout.booths_per_row}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">Start Date</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {new Date(formData.eventStart).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Please review the details above. You can still edit each step by clicking the step numbers above.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => goToStep(step - 1)}
              disabled={step === 1}
              className="flex items-center space-x-2 px-6 py-2 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-900 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-4">
              {step < 4 && (
                <button
                  type="button"
                  onClick={() => goToStep(step + 1)}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              {step === 4 && (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Create Event'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}

export default CreateEvent

// Feature: Error handling wrapper
const handleAsyncError = async (asyncFunction) => {
  try {
    return await asyncFunction();
  } catch (error) {
    console.error('Error:', error.message);
    throw new Error(`Operation failed: ${error.message}`);
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
