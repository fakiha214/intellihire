/**
 * Date Utility Functions
 * Handles date formatting, parsing, and display
 */

/**
 * Safely parse date string to Date object
 * @param {string|Date|null} dateInput - Date input to parse
 * @returns {Date|null} - Parsed date or null if invalid
 */
export const parseDate = (dateInput) => {
  if (!dateInput) return null

  if (dateInput instanceof Date) {
    return isValidDate(dateInput) ? dateInput : null
  }

  const parsed = new Date(dateInput)
  return isValidDate(parsed) ? parsed : null
}

/**
 * Check if date is valid
 * @param {Date} date - Date to validate
 * @returns {boolean} - True if valid date
 */
export const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Format date to readable string (e.g., "Jan 15, 2025")
 * @param {string|Date|null} dateInput - Date to format
 * @returns {string} - Formatted date or "Invalid date"
 */
export const formatDate = (dateInput) => {
  const date = parseDate(dateInput)
  if (!date) return "Invalid date"

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/**
 * Format date with time (e.g., "Jan 15, 2025 at 3:30 PM")
 * @param {string|Date|null} dateInput - Date to format
 * @returns {string} - Formatted date with time
 */
export const formatDateTime = (dateInput) => {
  const date = parseDate(dateInput)
  if (!date) return "Invalid date"

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    period: "short",
  })
}

/**
 * Get relative time display (e.g., "2 days ago", "1 hour ago")
 * @param {string|Date|null} dateInput - Date to format
 * @returns {string} - Relative time string
 */
export const getRelativeTime = (dateInput) => {
  const date = parseDate(dateInput)
  if (!date) return "Unknown date"

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  // Future dates
  if (diffMs < 0) {
    const absDiffSecs = Math.floor(-diffMs / 1000)
    const absDiffMins = Math.floor(absDiffSecs / 60)
    const absDiffHours = Math.floor(absDiffMins / 60)
    const absDiffDays = Math.floor(absDiffHours / 24)

    if (absDiffSecs < 60) return "in a moment"
    if (absDiffMins < 60) return `in ${absDiffMins} minute${absDiffMins > 1 ? "s" : ""}`
    if (absDiffHours < 24) return `in ${absDiffHours} hour${absDiffHours > 1 ? "s" : ""}`
    if (absDiffDays === 1) return "tomorrow"
    if (absDiffDays < 7) return `in ${absDiffDays} days`
    return formatDate(date)
  }

  // Past dates
  if (diffSecs < 60) return "just now"
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`
  return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`
}

/**
 * Get date status badge (e.g., "Today", "Upcoming", "Expired")
 * @param {string|Date|null} dateInput - Date to check
 * @returns {string} - Status badge text
 */
export const getDateStatus = (dateInput) => {
  const date = parseDate(dateInput)
  if (!date) return "Unknown"

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (checkDate.getTime() === today.getTime()) return "Today"
  if (checkDate.getTime() === tomorrow.getTime()) return "Tomorrow"
  if (checkDate < today) return "Expired"
  if (checkDate < new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) return "This week"
  if (checkDate < new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) return "This month"
  return "Upcoming"
}

/**
 * Check if date is in the past
 * @param {string|Date|null} dateInput - Date to check
 * @returns {boolean} - True if date is in the past
 */
export const isPastDate = (dateInput) => {
  const date = parseDate(dateInput)
  if (!date) return false
  return date < new Date()
}

/**
 * Check if date is in the future
 * @param {string|Date|null} dateInput - Date to check
 * @returns {boolean} - True if date is in the future
 */
export const isFutureDate = (dateInput) => {
  const date = parseDate(dateInput)
  if (!date) return false
  return date > new Date()
}

/**
 * Check if date is today
 * @param {string|Date|null} dateInput - Date to check
 * @returns {boolean} - True if date is today
 */
export const isToday = (dateInput) => {
  const date = parseDate(dateInput)
  if (!date) return false

  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

/**
 * Get days until deadline
 * @param {string|Date|null} dateInput - Deadline date
 * @returns {number|null} - Days remaining (negative if past), or null if invalid
 */
export const getDaysUntil = (dateInput) => {
  const date = parseDate(dateInput)
  if (!date) return null

  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Get deadline status for display
 * @param {string|Date|null} dateInput - Deadline date
 * @returns {object} - { text: string, status: 'expired'|'urgent'|'normal' }
 */
export const getDeadlineStatus = (dateInput) => {
  const days = getDaysUntil(dateInput)

  if (days === null) {
    return { text: "Invalid deadline", status: "expired" }
  }

  if (days < 0) {
    return { text: "Expired", status: "expired" }
  }

  if (days === 0) {
    return { text: "Expires today", status: "urgent" }
  }

  if (days === 1) {
    return { text: "Expires tomorrow", status: "urgent" }
  }

  if (days < 7) {
    return { text: `${days} days left`, status: "urgent" }
  }

  if (days < 30) {
    return { text: `${days} days left`, status: "normal" }
  }

  return { text: `${Math.floor(days / 7)} weeks left`, status: "normal" }
}

/**
 * Format date range (e.g., "Jan 15 - Jan 31, 2025")
 * @param {string|Date|null} startDate - Start date
 * @param {string|Date|null} endDate - End date
 * @returns {string} - Formatted date range
 */
export const formatDateRange = (startDate, endDate) => {
  const start = parseDate(startDate)
  const end = parseDate(endDate)

  if (!start || !end) return "Invalid dates"

  const startStr = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
  const endStr = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return `${startStr} - ${endStr}`
}

/**
 * Get safe date field from job object
 * Tries multiple possible field names
 * @param {object} job - Job object
 * @param {string} fieldType - 'posted' or 'deadline'
 * @returns {Date|null} - Parsed date or null
 */
export const getSafeJobDate = (job, fieldType = "posted") => {
  if (!job) return null

  let dateValue = null

  if (fieldType === "posted") {
    // Try multiple field names for posted date
    dateValue = job.created_at || job.postedDate || job.posted_at || job.createdAt
  } else if (fieldType === "deadline") {
    // Try multiple field names for deadline
    dateValue = job.application_deadline || job.deadline || job.applicationDeadline
  }

  return parseDate(dateValue)
}

export default {
  parseDate,
  isValidDate,
  formatDate,
  formatDateTime,
  getRelativeTime,
  getDateStatus,
  isPastDate,
  isFutureDate,
  isToday,
  getDaysUntil,
  getDeadlineStatus,
  formatDateRange,
  getSafeJobDate,
}
