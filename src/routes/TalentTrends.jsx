"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, TrendingUp, Briefcase, MapPin, DollarSign } from "lucide-react"

const TalentTrends = () => {
  const [trends, setTrends] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/trends", {
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          }
        })

        if (!response.ok) {
          throw new Error("Failed to fetch trends")
        }

        const data = await response.json()
        setTrends(data)
      } catch (err) {
        console.error("Error fetching trends:", err)
        setError(err.message || "Failed to load trends")
      } finally {
        setLoading(false)
      }
    }

    fetchTrends()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading trends...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Talent Trends</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2" />
              Talent Trends
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Average Salary */}
          {trends?.averageSalary && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-6 w-6 mr-2" />
                Average Salary
              </h2>
              <p className="text-4xl font-bold text-green-600">
                PKR {trends.averageSalary.toLocaleString()}
              </p>
              <p className="text-gray-600 mt-2">Across all active job postings</p>
            </div>
          )}

          {/* Top Skills */}
          {trends?.topSkills && trends.topSkills.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Top 10 In-Demand Skills</h2>
              <div className="space-y-3">
                {trends.topSkills.map((skill, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="flex-grow">
                      <p className="font-medium text-gray-900 capitalize">{skill.skill}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-64 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(skill.count / trends.topSkills[0].count) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-gray-600 font-semibold w-12 text-right">{skill.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Job Type Distribution */}
            {trends?.jobTypeDistribution && trends.jobTypeDistribution.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Job Type Distribution
                </h2>
                <div className="space-y-3">
                  {trends.jobTypeDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <p className="text-gray-700 font-medium">{item.type}</p>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${
                                (item.count /
                                  trends.jobTypeDistribution.reduce((sum, j) => sum + j.count, 0)) *
                                100
                              }%`
                            }}
                          ></div>
                        </div>
                        <span className="text-gray-600 font-semibold w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Level Distribution */}
            {trends?.experienceLevelDistribution && trends.experienceLevelDistribution.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Experience Level Distribution</h2>
                <div className="space-y-3">
                  {trends.experienceLevelDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <p className="text-gray-700 font-medium">{item.level}</p>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{
                              width: `${
                                (item.count /
                                  trends.experienceLevelDistribution.reduce((sum, j) => sum + j.count, 0)) *
                                100
                              }%`
                            }}
                          ></div>
                        </div>
                        <span className="text-gray-600 font-semibold w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Locations */}
          {trends?.topLocations && trends.topLocations.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Top 5 Hiring Locations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {trends.topLocations.map((location, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                    <p className="font-semibold text-gray-900">{location.location}</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">{location.count}</p>
                    <p className="text-xs text-gray-600 mt-1">job openings</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Trend */}
          {trends?.monthlyTrend && trends.monthlyTrend.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Postings Trend</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="pb-3 font-semibold text-gray-900">Month</th>
                      <th className="pb-3 font-semibold text-gray-900">New Postings</th>
                      <th className="pb-3 font-semibold text-gray-900">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.monthlyTrend.map((month, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 text-gray-900">{month.month}</td>
                        <td className="py-3 font-semibold text-gray-900">{month.count}</td>
                        <td className="py-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-orange-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  (month.count / Math.max(...trends.monthlyTrend.map((m) => m.count))) * 100
                                }%`
                              }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="flex justify-center">
            <Link
              to="/dashboard"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default TalentTrends
