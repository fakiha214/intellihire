/**
 * Form Validation Utility Functions
 * Comprehensive validation helpers for all form fields
 */

// ==================== EMAIL VALIDATION ====================
/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email
 */
export const isValidEmail = (email) => {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * More strict email validation (RFC 5322 simplified)
 */
export const isValidEmailStrict = (email) => {
  if (!email) return false
  const strictEmailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return strictEmailRegex.test(email.trim())
}

// ==================== PHONE VALIDATION ====================
/**
 * Validates Pakistan phone number
 * Accepts formats: 03XX-XXXXXXX, +923XX-XXXXXXX, 03XXXXXXXXX, +923XXXXXXXXX
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid Pakistan phone
 */
export const isValidPakistaniPhone = (phone) => {
  if (!phone) return false
  const cleaned = phone.replace(/\s|-/g, '')
  // 11 digits starting with 03 or +923
  const pkPhoneRegex = /^(?:03\d{9}|\+923\d{9})$/
  return pkPhoneRegex.test(cleaned)
}

/**
 * Validates international phone number (E.164 format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid international phone
 */
export const isValidInternationalPhone = (phone) => {
  if (!phone) return false
  const cleaned = phone.replace(/\D/g, '')
  // 7-15 digits, starts with country code
  const intlPhoneRegex = /^[1-9]\d{6,14}$/
  return intlPhoneRegex.test(cleaned)
}

/**
 * Validates any phone format (lenient)
 */
export const isValidPhone = (phone) => {
  if (!phone) return false
  const cleaned = phone.replace(/\D/g, '')
  // At least 7 digits, at most 15 digits
  return cleaned.length >= 7 && cleaned.length <= 15
}

// ==================== NAME VALIDATION ====================
/**
 * Validates person/company name
 * @param {string} name - Name to validate
 * @param {number} minLength - Minimum length (default: 2)
 * @param {number} maxLength - Maximum length (default: 100)
 * @returns {boolean} - True if valid name
 */
export const isValidName = (name, minLength = 2, maxLength = 100) => {
  if (!name) return false
  const trimmed = name.trim()

  // Check length
  if (trimmed.length < minLength || trimmed.length > maxLength) {
    return false
  }

  // Only alphanumeric, spaces, hyphens, apostrophes, and periods
  const nameRegex = /^[a-zA-Z\s'.-]+$/
  return nameRegex.test(trimmed)
}

/**
 * Validates company name (more permissive)
 */
export const isValidCompanyName = (name) => {
  if (!name) return false
  const trimmed = name.trim()

  if (trimmed.length < 2 || trimmed.length > 150) {
    return false
  }

  // Allow alphanumeric, spaces, hyphens, ampersand, parentheses
  const companyNameRegex = /^[a-zA-Z0-9\s'&.()-]+$/
  return companyNameRegex.test(trimmed)
}

// ==================== URL VALIDATION ====================
/**
 * Validates URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid URL
 */
export const isValidUrl = (url) => {
  if (!url) return false
  try {
    const urlObj = new URL(url)
    // Must be http or https
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Validates LinkedIn profile URL
 */
export const isValidLinkedInUrl = (url) => {
  if (!url) return false
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes('linkedin.com')
  } catch {
    return false
  }
}

/**
 * Validates Twitter profile URL
 */
export const isValidTwitterUrl = (url) => {
  if (!url) return false
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com')
  } catch {
    return false
  }
}

/**
 * Validates GitHub profile URL
 */
export const isValidGitHubUrl = (url) => {
  if (!url) return false
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes('github.com')
  } catch {
    return false
  }
}

// ==================== SALARY/NUMBER VALIDATION ====================
/**
 * Validates salary input
 * @param {string|number} salary - Salary to validate
 * @returns {boolean} - True if valid salary (non-negative number)
 */
export const isValidSalary = (salary) => {
  if (salary === '' || salary === null || salary === undefined) return false
  const num = parseFloat(salary)
  return !isNaN(num) && num >= 0 && isFinite(num)
}

/**
 * Validates salary range
 */
export const isValidSalaryRange = (minSalary, maxSalary) => {
  const minValid = isValidSalary(minSalary)
  const maxValid = isValidSalary(maxSalary)

  if (!minValid || !maxValid) return false

  return parseFloat(minSalary) <= parseFloat(maxSalary)
}

// ==================== PASSWORD VALIDATION ====================
/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {object} - { isValid: boolean, requirements: object }
 */
export const validatePassword = (password) => {
  if (!password) {
    return {
      isValid: false,
      requirements: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      },
    }
  }

  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }

  const isValid = Object.values(requirements).every(Boolean)

  return { isValid, requirements }
}

/**
 * Validates password match
 */
export const passwordsMatch = (password, confirmPassword) => {
  if (!password || !confirmPassword) return false
  return password === confirmPassword
}

// ==================== DATE VALIDATION ====================
/**
 * Validates date is in the future
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if date is in future
 */
export const isValidFutureDate = (dateString) => {
  if (!dateString) return false
  const date = new Date(dateString)
  if (isNaN(date)) return false
  return date > new Date()
}

/**
 * Validates date is in the past
 */
export const isValidPastDate = (dateString) => {
  if (!dateString) return false
  const date = new Date(dateString)
  if (isNaN(date)) return false
  return date < new Date()
}

/**
 * Validates date range (start < end)
 */
export const isValidDateRange = (startDateString, endDateString) => {
  if (!startDateString || !endDateString) return false

  const startDate = new Date(startDateString)
  const endDate = new Date(endDateString)

  if (isNaN(startDate) || isNaN(endDate)) return false

  return startDate < endDate
}

/**
 * Validates date format (YYYY-MM-DD)
 */
export const isValidDateFormat = (dateString) => {
  if (!dateString) return false
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) return false

  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date)
}

// ==================== TEXT LENGTH VALIDATION ====================
/**
 * Validates text length
 */
export const isValidLength = (text, minLength = 1, maxLength = Infinity) => {
  if (!text) return minLength === 0
  const length = text.trim().length
  return length >= minLength && length <= maxLength
}

/**
 * Validates text is not just spaces
 */
export const isNotEmpty = (text) => {
  return text && text.trim().length > 0
}

// ==================== FILE VALIDATION ====================
/**
 * Validates file upload
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum file size in MB
 * @param {array} allowedExtensions - Allowed file extensions
 * @returns {object} - { valid: boolean, error?: string }
 */
export const isValidFile = (
  file,
  maxSizeMB = 5,
  allowedExtensions = ['pdf', 'doc', 'docx']
) => {
  if (!file) {
    return { valid: false, error: 'No file selected' }
  }

  // Check file size
  const maxBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    }
  }

  // Check file extension
  const extension = file.name.split('.').pop().toLowerCase()
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Only ${allowedExtensions.join(', ')} files are allowed. Got: ${extension}`
    }
  }

  return { valid: true }
}

/**
 * Validates image file
 */
export const isValidImageFile = (file, maxSizeMB = 2) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
  return isValidFile(file, maxSizeMB, imageExtensions)
}

// ==================== TEXT SANITIZATION ====================
/**
 * Sanitizes text input (trim and normalize whitespace)
 */
export const sanitizeText = (text) => {
  if (!text) return ''
  return text.trim().replace(/\s+/g, ' ')
}

/**
 * Removes all HTML tags
 */
export const stripHtmlTags = (text) => {
  if (!text) return ''
  return text.replace(/<[^>]*>/g, '')
}

/**
 * Escapes special HTML characters
 */
export const escapeHtml = (text) => {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// ==================== CHARACTER VALIDATION ====================
/**
 * Validates text contains only alphanumeric characters
 */
export const isAlphanumeric = (text) => {
  if (!text) return false
  return /^[a-zA-Z0-9]+$/.test(text)
}

/**
 * Validates text contains only letters
 */
export const isAlphabetic = (text) => {
  if (!text) return false
  return /^[a-zA-Z\s]+$/.test(text)
}

/**
 * Validates text contains only numbers
 */
export const isNumeric = (text) => {
  if (!text) return false
  return /^[0-9]+$/.test(text)
}

// ==================== COLLECTION VALIDATION ====================
/**
 * Validates at least one item selected
 */
export const hasSelection = (array) => {
  return Array.isArray(array) && array.length > 0
}

/**
 * Validates all required fields have values
 */
export const hasAllRequired = (data, requiredFields) => {
  return requiredFields.every(field => {
    const value = data[field]
    if (Array.isArray(value)) return value.length > 0
    return value && value.toString().trim().length > 0
  })
}

// ==================== COMBINED FORM VALIDATION ====================
/**
 * Validates entire form data against schema
 */
export const validateForm = (data, schema) => {
  const errors = {}

  Object.keys(schema).forEach(field => {
    const rules = schema[field]
    const value = data[field]

    // Required check
    if (rules.required && !value) {
      errors[field] = `${rules.label || field} is required`
      return
    }

    // Custom validator
    if (rules.validate && value) {
      const customError = rules.validate(value)
      if (customError) {
        errors[field] = customError
      }
    }

    // Type-specific validators
    if (value) {
      switch (rules.type) {
        case 'email':
          if (!isValidEmail(value)) {
            errors[field] = `${rules.label || field} must be a valid email`
          }
          break
        case 'phone':
          if (!isValidPhone(value)) {
            errors[field] = `${rules.label || field} must be a valid phone number`
          }
          break
        case 'url':
          if (!isValidUrl(value)) {
            errors[field] = `${rules.label || field} must be a valid URL`
          }
          break
        case 'number':
          if (isNaN(value)) {
            errors[field] = `${rules.label || field} must be a number`
          }
          break
        default:
          break
      }
    }
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export default {
  isValidEmail,
  isValidEmailStrict,
  isValidPakistaniPhone,
  isValidInternationalPhone,
  isValidPhone,
  isValidName,
  isValidCompanyName,
  isValidUrl,
  isValidLinkedInUrl,
  isValidTwitterUrl,
  isValidGitHubUrl,
  isValidSalary,
  isValidSalaryRange,
  validatePassword,
  passwordsMatch,
  isValidFutureDate,
  isValidPastDate,
  isValidDateRange,
  isValidDateFormat,
  isValidLength,
  isNotEmpty,
  isValidFile,
  isValidImageFile,
  sanitizeText,
  stripHtmlTags,
  escapeHtml,
  isAlphanumeric,
  isAlphabetic,
  isNumeric,
  hasSelection,
  hasAllRequired,
  validateForm,
}
