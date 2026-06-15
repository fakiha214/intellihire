"""
Prompt builder for constructing system and user prompts for the chatbot.
Handles role-specific and context-specific prompt generation.
"""

from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class PromptBuilder:
    """Builder for system and user prompts."""

    # System prompts for different user roles and contexts
    SYSTEM_PROMPTS = {
        "jobSeeker": {
            "job": """You are a helpful career advisor and job search assistant.
You are helping a job seeker understand a specific job posting and determine if they're a good fit.

Your responsibilities:
- Explain job requirements in clear, understandable terms
- Help identify skill gaps between the job requirements and the candidate's current skills
- Provide encouragement and practical advice for improving their candidacy
- Answer questions about the role, responsibilities, and growth opportunities
- Be honest but supportive about their qualifications
- Ask clarifying questions about their experience when needed

Keep your responses concise (under 300 words) and focused on the job at hand.
Use a friendly, supportive tone.""",

            "application": """You are a career coach helping a job seeker with their job application.
You have access to their application status, feedback from employers, and the job details.

Your responsibilities:
- Help them understand feedback they've received from employers
- Provide interview preparation guidance
- Suggest improvements for future applications
- Explain next steps in the application process
- Offer encouragement and realistic advice

Keep your responses concise and actionable.
Be supportive but honest about their situation.""",

            "resume": """You are an expert resume reviewer and career coach.
You are analyzing resumes and providing feedback on how well they match job requirements.

Your responsibilities:
- Provide specific, actionable feedback on resume improvements
- Highlight strengths and areas that need work
- Suggest relevant keywords and skills to add
- Help match skills shown in the resume to job requirements
- Explain how to better present experience and achievements

Focus on practical improvements the candidate can make immediately.
Be encouraging but thorough in your feedback.""",

            "profile": """You are a professional profile optimization expert.
You are helping a job seeker build and improve their professional profile.

Your responsibilities:
- Guide them through profile completion step by step
- Suggest what information would make them stand out
- Help them present their experience compellingly
- Explain the importance of different profile sections
- Provide examples of strong profile content

Be encouraging and practical.
Help them understand why each section matters.""",

            "event": """You are a helpful assistant for job seekers attending job fair events.
You have information about the event, participating companies, and job opportunities.

Your responsibilities:
- Answer questions about the event logistics and schedule
- Explain what companies are participating and their booth locations
- Help job seekers prepare for networking at the event
- Suggest which booths might be most relevant for their skills
- Provide tips for making a good impression at the event

Be encouraging and help them make the most of this opportunity.""",
        },

        "employer": {
            "applications": """You are an AI recruiting assistant helping an employer manage job applications.
You have access to all applicants for a job position, including match scores and their skills.

Your responsibilities:
- Help filter and analyze candidates based on specific criteria
- Identify top performers and explain why they stand out
- Highlight skill matches and mismatches
- Answer questions about specific applicants
- Suggest which candidates are worth interviewing
- Provide insights on candidate qualifications

Be objective and data-driven in your assessments.
Help the employer make informed hiring decisions.""",

            "candidates": """You are a talent analyst and recruitment expert.
You are explaining candidate recommendations and helping employers understand applicant qualifications.

Your responsibilities:
- Explain why candidates were recommended for a position
- Compare candidates and highlight key differences
- Analyze relevant skills and experience
- Assess cultural fit indicators if visible
- Provide objective analysis to support hiring decisions
- Answer questions about specific candidates

Be thorough, objective, and helpful.
Focus on information that helps the employer make good hiring decisions.""",

            "job_posting": """You are an expert in job descriptions and recruitment marketing.
You are helping employers create compelling and effective job postings.

Your responsibilities:
- Suggest improvements to job descriptions
- Help add or clarify relevant requirements and responsibilities
- Optimize postings to attract the right candidates
- Ensure descriptions are clear and compelling
- Provide examples of strong job posting language
- Explain how to structure information for maximum impact

Be practical and specific in your suggestions.
Focus on making the job posting more effective at attracting quality candidates.""",

            "event": """You are a helpful assistant for employers managing job fair events.
You have information about the event, job opportunities, and attendee details.

Your responsibilities:
- Help employers prepare for the event
- Answer questions about logistics and booth setup
- Provide tips for effective booth presentation
- Help plan which job openings to feature at the event
- Suggest outreach strategies for the event
- Answer questions about attendee profiles

Be helpful and focused on making the event successful for the employer.""",
        },
    }

    # Generic prompts for unknown contexts
    GENERIC_PROMPTS = {
        "jobSeeker": """You are a helpful career advisor and job search assistant.
Your goal is to help job seekers navigate their career, improve their skills, and find the right opportunities.
Be supportive, practical, and focused on actionable advice.
Ask clarifying questions when needed to provide better guidance.""",

        "employer": """You are a helpful recruiting and talent management assistant.
Your goal is to help employers find and hire the best candidates, manage their recruiting process, and optimize their hiring.
Be objective, data-driven, and focused on practical solutions.
Help employers make informed decisions.""",
    }

    @staticmethod
    def build_system_prompt(user_type: str, context_type: Optional[str] = None) -> str:
        """
        Build a system prompt for the specified user type and context.

        Args:
            user_type: Either 'jobSeeker' or 'employer'
            context_type: Specific context (e.g., 'job', 'application', 'candidates')

        Returns:
            System prompt string
        """
        if user_type in PromptBuilder.SYSTEM_PROMPTS:
            prompts = PromptBuilder.SYSTEM_PROMPTS[user_type]

            if context_type and context_type in prompts:
                return prompts[context_type]

            # Fallback to generic prompt
            return PromptBuilder.GENERIC_PROMPTS.get(
                user_type,
                "You are a helpful assistant. Provide clear, practical advice.",
            )

        return "You are a helpful assistant."

    @staticmethod
    def build_context_string(context_data: Dict[str, Any]) -> str:
        """
        Build a context string from context data to include in the prompt.
        Includes all job seeker information and job data for AI analysis.

        Args:
            context_data: Dictionary of context information

        Returns:
            Formatted context string
        """
        if not context_data:
            logger.debug("[DEBUG] build_context_string called with empty context_data")
            return ""

        logger.debug(f"[DEBUG] build_context_string called with keys: {list(context_data.keys())}")
        lines = ["\n=== JOB SEEKER DATA ==="]

        # User and profile data
        if "user" in context_data:
            user = context_data["user"]
            lines.append(f"Name: {user.get('full_name', 'N/A')}")
            lines.append(f"Email: {user.get('email', 'N/A')}")
            lines.append(f"User Type: {user.get('user_type', 'N/A')}")

            # Profile information
            if user.get("profile"):
                profile = user["profile"]
                lines.append(f"Professional Title: {profile.get('title', 'N/A')}")
                lines.append(f"Location: {profile.get('location', 'N/A')}")
                lines.append(f"Bio: {profile.get('bio', 'N/A')}")
                lines.append(f"Company: {profile.get('company_name', 'N/A')}")

            # Skills
            skills = user.get('skills', [])
            if skills:
                lines.append(f"Skills: {', '.join(skills)}")

        # Experience data
        if "experience" in context_data:
            experience = context_data["experience"]
            if experience:
                lines.append("\nExperience:")
                for exp in experience:
                    lines.append(f"  - {exp.get('title', 'N/A')} at {exp.get('company', 'N/A')} ({exp.get('duration', 'N/A')})")
                    if exp.get('description'):
                        lines.append(f"    {exp['description']}")

        # Education data
        if "education" in context_data:
            education = context_data["education"]
            if education:
                lines.append("\nEducation:")
                for edu in education:
                    lines.append(f"  - {edu.get('degree', 'N/A')} from {edu.get('institution', 'N/A')} ({edu.get('duration', 'N/A')})")

        # Job data
        if "job" in context_data:
            lines.append("\n=== JOB DATA ===")
            job = context_data["job"]
            lines.append(f"Title: {job.get('title', 'N/A')}")
            lines.append(f"Company: {job.get('company', 'N/A')}")
            lines.append(f"Location: {job.get('location', 'N/A')}")
            lines.append(f"Salary: {job.get('salary', 'N/A')}")
            lines.append(f"Job Type: {job.get('type', 'N/A')}")
            lines.append(f"Experience Level Required: {job.get('experience_level', 'N/A')}")
            lines.append(f"Remote: {job.get('is_remote', 'N/A')}")

            if job.get("description"):
                lines.append(f"\nDescription:\n{job['description']}")

            if job.get("responsibilities"):
                lines.append(f"\nResponsibilities:")
                for resp in job.get('responsibilities', []):
                    lines.append(f"  - {resp}")

            if job.get("requirements"):
                lines.append(f"\nRequirements:")
                for req in job.get('requirements', []):
                    lines.append(f"  - {req}")

            if job.get("benefits"):
                lines.append(f"\nBenefits:")
                for benefit in job.get('benefits', []):
                    lines.append(f"  - {benefit}")

        # Candidates/Applicants data (for employers)
        if "candidates" in context_data:
            candidates_data = context_data["candidates"]
            if candidates_data and candidates_data.get("candidates"):
                lines.append("\n=== APPLICANTS DATA ===")
                lines.append(f"Total Applicants: {candidates_data.get('total_candidates', 0)}")

                candidates = candidates_data.get("candidates", [])
                for idx, candidate in enumerate(candidates, 1):
                    lines.append(f"\n--- Applicant #{idx} ---")
                    lines.append(f"Name: {candidate.get('name', 'N/A')}")
                    lines.append(f"Email: {candidate.get('email', 'N/A')}")
                    lines.append(f"Applied Date: {candidate.get('applied_date', 'N/A')}")
                    lines.append(f"Status: {candidate.get('status', 'N/A')}")

                    # Skills
                    skills = candidate.get('skills', [])
                    if skills:
                        lines.append(f"Skills: {', '.join(skills)}")

                    # Resume and cover letter info
                    if candidate.get('has_resume'):
                        lines.append("Has Resume: Yes")
                    if candidate.get('has_cover_letter'):
                        lines.append("Has Cover Letter: Yes")

        lines.append("")
        return "\n".join(lines)

    @staticmethod
    def build_history_string(messages: List[Dict[str, str]]) -> str:
        """
        Build conversation history string to include in prompt.

        Args:
            messages: List of previous messages

        Returns:
            Formatted history string (limited to recent messages)
        """
        if not messages:
            return ""

        # Use only last 5 messages to keep prompt size manageable
        recent_messages = messages[-5:] if len(messages) > 5 else messages

        lines = ["\n--- Conversation History (Recent) ---"]
        for msg in recent_messages:
            role = msg.get("role", "unknown").capitalize()
            content = msg.get("content", "")[:100]  # Limit length
            lines.append(f"{role}: {content}")

        lines.append("---\n")
        return "\n".join(lines)

    @staticmethod
    def build_messages(
        system_prompt: str,
        context: Optional[Dict[str, Any]] = None,
        history: Optional[List[Dict[str, str]]] = None,
        user_message: Optional[str] = None,
    ) -> List[Dict[str, str]]:
        """
        Build the complete message list for API call.

        Args:
            system_prompt: System prompt for the assistant
            context: Context data to inject
            history: Previous conversation messages
            user_message: Current user message

        Returns:
            List of message dicts ready for API call
        """
        logger.debug(f"[DEBUG] build_messages called with context type: {type(context)}, has context: {context is not None}")
        messages = []

        # Build system prompt with context
        full_system = system_prompt
        if context:
            context_string = PromptBuilder.build_context_string(context)
            logger.debug(f"[DEBUG] Context string length: {len(context_string)}, contains 'JOB DATA': {'=== JOB DATA ===' in context_string}")
            full_system += context_string

        messages.append({"role": "system", "content": full_system})
        logger.debug(f"[DEBUG] System prompt built, length: {len(full_system)}")

        # Add conversation history
        if history:
            # Add recent messages from history (exclude system messages)
            for msg in history[-10:]:  # Last 10 messages
                if msg.get("role") != "system":
                    messages.append(
                        {
                            "role": msg.get("role", "user"),
                            "content": msg.get("content", ""),
                        }
                    )

        # Add current user message
        if user_message:
            messages.append({"role": "user", "content": user_message})

        logger.debug(f"[DEBUG] Final messages list built with {len(messages)} messages")
        logger.debug(f"[DEBUG] Message roles: {[msg.get('role') for msg in messages]}")
        return messages

    @staticmethod
    def validate_context_type(context_type: str) -> bool:
        """
        Check if context type is valid.

        Args:
            context_type: Context type to validate

        Returns:
            True if valid, False otherwise
        """
        valid_types = [
            "job",
            "application",
            "resume",
            "profile",
            "event",
            "applications",  # plural for employer
            "candidates",
            "job_posting",
        ]
        return context_type in valid_types
