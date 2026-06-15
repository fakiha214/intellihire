"use client"

const EventStatusBadge = ({ status }) => {
  const statusConfig = {
    draft: { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Draft' },
    published: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Published' },
    ongoing: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Ongoing' },
    completed: { color: 'bg-slate-100 text-slate-800 border-slate-300', label: 'Completed' },
    cancelled: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Cancelled' }
  }

  const config = statusConfig[status] || statusConfig.draft

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
      {config.label}
    </span>
  )
}

export default EventStatusBadge
