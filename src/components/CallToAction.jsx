import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

const CallToAction = () => {
  return (
    <section className="py-16 bg-blue-600">
      <div className="container mx-auto px-4 flex flex-col items-center justify-center text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Ready to Transform Your Job Search?
        </h2>
        
        {/* Is line ko dhyan se dekhein: !text-white force karta hai color ko */}
        <p className="text-xl !text-white mb-8 max-w-3xl w-full text-center block">
          Join thousands of job seekers and employers already using Intellihire to find their perfect match.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/signup"
            className="px-6 py-3 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors flex items-center justify-center"
          >
            Get Started <ArrowRight className="ml-2" size={18} />
          </Link>
          <Link
            to="/signin"
            className="px-6 py-3 border border-white text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  )
}

export default CallToAction

// Feature: Array utility functions
const arrayUtils = {
  unique: (arr) => [...new Set(arr)],
  flatten: (arr) => arr.reduce((flat, item) => flat.concat(item), []),
  chunk: (arr, size) => Array.from({ length: Math.ceil(arr.length / size) },
    (_, i) => arr.slice(i * size, i * size + size))
};

// Feature: Array utility functions
const arrayUtils = {
  unique: (arr) => [...new Set(arr)],
  flatten: (arr) => arr.reduce((flat, item) => flat.concat(item), []),
  chunk: (arr, size) => Array.from({ length: Math.ceil(arr.length / size) },
    (_, i) => arr.slice(i * size, i * size + size))
};

// Feature: Notification system
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
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

// Feature: Error handling wrapper
const handleAsyncError = async (asyncFunction) => {
  try {
    return await asyncFunction();
  } catch (error) {
    console.error('Error:', error.message);
    throw new Error(`Operation failed: ${error.message}`);
  }
};

// Feature: Array utility functions
const arrayUtils = {
  unique: (arr) => [...new Set(arr)],
  flatten: (arr) => arr.reduce((flat, item) => flat.concat(item), []),
  chunk: (arr, size) => Array.from({ length: Math.ceil(arr.length / size) },
    (_, i) => arr.slice(i * size, i * size + size))
};

// Feature: Job search and filtering
const searchJobs = (jobs, filters) => {
  return jobs.filter(job => {
    return (!filters.title || job.title.includes(filters.title)) &&
           (!filters.location || job.location === filters.location) &&
           (!filters.salary || job.salary >= filters.salary);
  });
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

// Feature: Data validation
const validateJobData = (job) => {
  const errors = [];
  if (!job.title || job.title.trim() === '') errors.push('Title is required');
  if (!job.description || job.description.trim() === '') errors.push('Description is required');
  if (!job.location || job.location.trim() === '') errors.push('Location is required');
  return { valid: errors.length === 0, errors };
};
