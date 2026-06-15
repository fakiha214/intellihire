/**
 * Chat Constants and Configuration
 */

// Chat service configuration
export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 5000,
  DEFAULT_RATE_LIMIT: 5,
  DEFAULT_CONTEXT_WINDOW: 10,
  API_TIMEOUT: 30000, // 30 seconds
};

// Context types
export const CONTEXT_TYPES = {
  JOB: 'job',
  APPLICATION: 'application',
  RESUME: 'resume',
  PROFILE: 'profile',
  EVENT: 'event',
  APPLICATIONS: 'applications',
  CANDIDATES: 'candidates',
  JOB_POSTING: 'job_posting',
  GENERIC: '',
};

// Chat message roles
export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
};

// Chat message statuses
export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  ERROR: 'error',
};

// Help prompts for different pages
export const HELP_PROMPTS = {
  [CONTEXT_TYPES.JOB]: 'Ask me about job requirements, responsibilities, or how to apply',
  [CONTEXT_TYPES.APPLICATION]: 'Ask me about your application status or next steps',
  [CONTEXT_TYPES.RESUME]: 'Ask me about your skills, experience, or career recommendations',
  [CONTEXT_TYPES.PROFILE]: 'Ask me about optimizing your profile or improving your visibility',
  [CONTEXT_TYPES.EVENT]: 'Ask me about the job fair, attending, or companies attending',
  [CONTEXT_TYPES.APPLICATIONS]: 'Ask me about reviewing applications or candidate insights',
  [CONTEXT_TYPES.CANDIDATES]: 'Ask me about candidate matching or recruitment insights',
  [CONTEXT_TYPES.JOB_POSTING]: 'Ask me about job requirements, attracting candidates, or posting optimization',
  [CONTEXT_TYPES.GENERIC]: 'How can I assist you today?',
};

// Error messages
export const ERROR_MESSAGES = {
  RATE_LIMIT: 'You\'ve reached the chat limit. Please try again in a moment.',
  SERVICE_UNAVAILABLE: 'Chat service is temporarily unavailable. Please try again later.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  EMPTY_MESSAGE: 'Please enter a message before sending.',
  TOO_LONG: `Message must be less than ${CHAT_CONFIG.MAX_MESSAGE_LENGTH} characters.`,
  AUTH_REQUIRED: 'You must be logged in to use chat.',
  UNKNOWN_ERROR: 'An error occurred. Please try again.',
};

// Chat status colors (Tailwind)
export const STATUS_COLORS = {
  online: 'bg-green-500',
  offline: 'bg-gray-500',
  loading: 'bg-yellow-500',
};

// Message bubble styles
export const MESSAGE_STYLES = {
  user: {
    container: 'justify-end',
    bubble: 'bg-blue-500 text-white rounded-l-lg rounded-tr-none',
  },
  assistant: {
    container: 'justify-start',
    bubble: 'bg-gray-200 text-gray-900 rounded-r-lg rounded-tl-none',
  },
};

/**
 * Validate message before sending
 */
export const validateMessage = (message) => {
  if (!message || !message.trim()) {
    return { valid: false, error: ERROR_MESSAGES.EMPTY_MESSAGE };
  }

  if (message.length > CHAT_CONFIG.MAX_MESSAGE_LENGTH) {
    return { valid: false, error: ERROR_MESSAGES.TOO_LONG };
  }

  return { valid: true };
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'just now';

  try {
    let date;
    if (typeof timestamp === 'string') {
      // Force 'Z' at the end to tell the browser this IS UTC time
      const cleanTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
      date = new Date(cleanTimestamp);
    } else {
      date = new Date(timestamp);
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    // If clock skew makes it negative, show just now
    if (diffInSeconds < 30) return 'just now';
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    return date.toLocaleDateString();
  } catch (err) {
    return 'just now';
  }
};
/**
 * Get help text for current context
 */
export const getHelpPrompt = (contextType = '') => {
  return HELP_PROMPTS[contextType] || HELP_PROMPTS[CONTEXT_TYPES.GENERIC];
};

/**
 * Sanitize message for display
 */
export const sanitizeMessage = (message) => {
  // Remove potential XSS attempts
  return message
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Format message content with markdown-like formatting
 */
export const formatMessageContent = (content) => {
  // Bold: **text** -> <strong>text</strong>
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic: *text* -> <em>text</em>
  content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Line breaks: \n -> <br>
  content = content.replace(/\n/g, '<br />');

  return content;
};
