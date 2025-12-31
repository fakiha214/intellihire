"use client"

import { useState } from "react"

const INDUSTRY_COLORS = {
  'Technology': 'bg-blue-100 border-blue-300',
  'Finance': 'bg-green-100 border-green-300',
  'Healthcare': 'bg-red-100 border-red-300',
  'Education': 'bg-yellow-100 border-yellow-300',
  'Retail': 'bg-purple-100 border-purple-300',
  'Manufacturing': 'bg-indigo-100 border-indigo-300',
  'Energy': 'bg-orange-100 border-orange-300',
  'Telecommunications': 'bg-cyan-100 border-cyan-300',
  'Real Estate': 'bg-pink-100 border-pink-300',
  'Transportation': 'bg-teal-100 border-teal-300'
}

const DEFAULT_COLOR = 'bg-gray-100 border-gray-300'

const BoothMap = ({ layout, booths, mode = 'view', onBoothClick, highlightedEmployerId }) => {
  const [showAssignMenu, setShowAssignMenu] = useState(false)

  // Parse layout
  const rows = layout?.rows || ['A', 'B', 'C']
  const boothsPerRow = layout?.booths_per_row || 3

  // Build booth map
  const boothMap = {}
  booths.forEach((booth) => {
    const key = `${booth.rowLabel}-${booth.boothNumber}`
    boothMap[key] = booth
  })

  const getColorClass = (industry) => {
    return INDUSTRY_COLORS[industry] || DEFAULT_COLOR
  }

  const getBoothContent = (booth) => {
    if (!booth.employer) {
      return mode === 'edit' ? '+ Assign' : 'Empty'
    }

    return (
      <div className="text-center">
        <p className="text-xs font-bold truncate">{booth.employer.company}</p>
        <p className="text-xs text-gray-600">{booth.employer.industry || 'N/A'}</p>
      </div>
    )
  }

  return (
    <div className="w-full p-6 bg-white rounded-lg border border-gray-200">
      <h3 className="text-xl font-bold mb-6">Booth Map</h3>

      {/* Booth Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-12 h-12 border border-gray-300"></th>
              {Array.from({ length: boothsPerRow }).map((_, idx) => (
                <th key={idx} className="h-12 border border-gray-300 bg-gray-50 font-semibold">
                  Booth {idx + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row}>
                <td className="w-12 h-16 border border-gray-300 bg-gray-50 font-semibold text-center">
                  {row}
                </td>
                {Array.from({ length: boothsPerRow }).map((_, idx) => {
                  const boothNum = idx + 1
                  const boothKey = `${row}-${boothNum}`
                  const booth = boothMap[boothKey]
                  const isHighlighted = booth?.employer?.id === highlightedEmployerId

                  return (
                    <td
                      key={boothKey}
                      className={`h-16 border border-gray-300 p-2 cursor-pointer transition ${
                        booth?.employer
                          ? `${getColorClass(booth.employer.industry)} ${
                              isHighlighted ? 'ring-4 ring-yellow-400' : ''
                            }`
                          : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (mode === 'view') {
                          onBoothClick?.(booth)
                        } else {
                          setShowAssignMenu(!showAssignMenu)
                        }
                      }}
                    >
                      <div className="text-xs text-center">
                        {booth && getBoothContent(booth)}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Color Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm font-semibold mb-3">Industry Colors:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(INDUSTRY_COLORS).map(([industry, color]) => (
            <div key={industry} className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded border ${color}`}></div>
              <span className="text-xs text-gray-700">{industry}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BoothMap

// Feature: Error handling wrapper
const handleAsyncError = async (asyncFunction) => {
  try {
    return await asyncFunction();
  } catch (error) {
    console.error('Error:', error.message);
    throw new Error(`Operation failed: ${error.message}`);
  }
};
