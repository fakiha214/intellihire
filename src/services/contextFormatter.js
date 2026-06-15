/**
 * Context Formatter Service
 * Prepares context data for chat prompts based on page and user type
 */

export const contextFormatter = {
  /**
   * Format job context for chatbot
   */
  formatJobContext: (job) => {
    if (!job) return {};
    return {
      contextType: 'job',
      contextData: {
        job_id: job.id,
        title: job.title,
        company: job.company_name,
        description: job.description,
        jobType: job.job_type,
        salary: job.salary,
        location: job.location,
        industry: job.industry,
      },
    };
  },

  /**
   * Format job application context
   */
  formatApplicationContext: (application) => {
    if (!application) return {};
    return {
      contextType: 'application',
      contextData: {
        application_id: application.id,
        job_title: application.job?.title,
        company: application.job?.company_name,
        status: application.status,
        applied_date: application.created_at,
        job_id: application.job_id,
      },
    };
  },

  /**
   * Format resume context
   */
  formatResumeContext: (profile) => {
    if (!profile) return {};
    return {
      contextType: 'resume',
      contextData: {
        skills: profile.skills?.map((s) => s.name).join(', '),
        experience_years: profile.experience?.length || 0,
        education: profile.education?.map((e) => e.degree).join(', '),
        location: profile.location,
      },
    };
  },

  /**
   * Format profile context
   */
  formatProfileContext: (profile) => {
    if (!profile) return {};
    return {
      contextType: 'profile',
      contextData: {
        title: profile.title,
        bio: profile.bio,
        location: profile.location,
        skills_count: profile.skills?.length || 0,
      },
    };
  },

  /**
   * Format event context for job seeker
   */
  formatEventContext: (event) => {
    if (!event) return {};
    return {
      contextType: 'event',
      contextData: {
        event_id: event.id,
        title: event.title,
        venue: event.venue_name,
        date: event.event_start,
        employer_count: event.employer_count,
      },
    };
  },

  /**
   * Format employer applications context
   */
  formatEmployerApplicationsContext: (job = null) => {
    return {
      contextType: 'applications',
      contextData: {
        job_id: job?.id,
        job_title: job?.title,
      },
    };
  },

  /**
   * Format employer candidates context
   */
  formatEmployerCandidatesContext: () => {
    return {
      contextType: 'candidates',
      contextData: {},
    };
  },

  /**
   * Format job posting context for employer
   */
  formatJobPostingContext: (job) => {
    if (!job) return {};
    return {
      contextType: 'job_posting',
      contextData: {
        job_id: job.id,
        title: job.title,
        description: job.description,
        industry: job.industry,
        job_type: job.job_type,
      },
    };
  },

  /**
   * Generic context for pages without specific data
   */
  formatGenericContext: (contextType) => {
    return {
      contextType,
      contextData: {},
    };
  },

  /**
   * Extract context from current page based on route and data
   */
  extractContextFromPage: (location, data = {}) => {
    const pathname = location.pathname || '';

    // Job detail pages
    if (pathname.includes('/jobs/') && data.job) {
      return contextFormatter.formatJobContext(data.job);
    }

    // Application pages
    if (pathname.includes('/applications/') && data.application) {
      return contextFormatter.formatApplicationContext(data.application);
    }

    // Profile pages
    if (pathname.includes('/profile') && data.profile) {
      return contextFormatter.formatProfileContext(data.profile);
    }

    // Employer pages
    if (pathname.includes('/employer/applications')) {
      return contextFormatter.formatEmployerApplicationsContext(data.job);
    }

    if (pathname.includes('/employer/candidates')) {
      return contextFormatter.formatEmployerCandidatesContext();
    }

    if (pathname.includes('/employer/jobs') && data.job) {
      return contextFormatter.formatJobPostingContext(data.job);
    }

    // Event pages
    if (pathname.includes('/events') && data.event) {
      return contextFormatter.formatEventContext(data.event);
    }

    // Fallback: generic context based on current page
    return contextFormatter.formatGenericContext('');
  },
};
