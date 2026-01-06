"use client"

import { Briefcase, MapPin, DollarSign } from "lucide-react"

const EventJobCard = ({ job, employer, onApply, isApplied, userType, onboothClick }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-1">{job.title}</h3>
          <p className="text-sm text-gray-600 font-medium">{employer?.company || 'Company'}</p>
        </div>
        {job.jobType && (
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
            {job.jobType}
          </span>
        )}
      </div>

      {/* Booth Location Tag */}
      {employer?.booth && (
        <button
          onClick={onboothClick}
          className="mb-3 px-2 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded hover:bg-amber-100 transition"
        >
          📍 Booth: {employer.booth.rowLabel}{employer.booth.boothNumber}
        </button>
      )}

      {/* Job Details */}
      <div className="space-y-2 mb-4 text-sm text-gray-600">
        {job.salary && (
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <span>{job.salary}</span>
          </div>
        )}

        {job.location && (
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>{job.location}</span>
          </div>
        )}

        {job.experienceLevel && (
          <div className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4" />
            <span>{job.experienceLevel} Level</span>
          </div>
        )}
      </div>

      {/* Description */}
      {job.description && (
        <p className="text-sm text-gray-700 mb-4 line-clamp-2">{job.description}</p>
      )}

      {/* Requirements */}
      {job.requirements && job.requirements.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-700 mb-1">Requirements:</p>
          <div className="flex flex-wrap gap-1">
            {job.requirements.slice(0, 3).map((req, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                {req}
              </span>
            ))}
            {job.requirements.length > 3 && (
              <span className="px-2 py-1 text-gray-600 text-xs">+{job.requirements.length - 3} more</span>
            )}
          </div>
        </div>
      )}

      {/* Apply Button */}
      {userType === 'jobSeeker' && (
        <button
          onClick={onApply}
          disabled={isApplied}
          className={`w-full py-2 px-4 rounded font-semibold transition ${
            isApplied
              ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isApplied ? '✓ Applied' : 'Apply Now'}
        </button>
      )}
    </div>
  )
}

export default EventJobCard

// Feature: Job search and filtering
const searchJobs = (jobs, filters) => {
  return jobs.filter(job => {
    return (!filters.title || job.title.includes(filters.title)) &&
           (!filters.location || job.location === filters.location) &&
           (!filters.salary || job.salary >= filters.salary);
  });
};
