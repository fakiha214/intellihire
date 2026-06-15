"""
Context extractor for gathering relevant data from database for chatbot.
Extracts user skills, job details, application info, etc.
"""

from typing import Dict, Any, Optional
import json
import logging

logger = logging.getLogger(__name__)


class ContextExtractor:
    """Extracts context data from database for chatbot prompts."""

    @staticmethod
    def extract_user_data(user_id: int) -> Dict[str, Any]:
        """
        Extract user profile and skills data.

        Args:
            user_id: User ID to extract data for

        Returns:
            Dict with user profile and skills
        """
        from models import User, Profile, Skill

        try:
            user = User.query.get(user_id)
            if not user:
                return {}

            profile = Profile.query.filter_by(user_id=user_id).first()
            skills = Skill.query.filter_by(user_id=user_id).all()

            return {
                "user_id": user_id,
                "email": user.email,
                "full_name": user.full_name,
                "user_type": user.user_type,
                "profile": {
                    "title": profile.title if profile else None,
                    "bio": profile.bio if profile else None,
                    "location": profile.location if profile else None,
                    "company_name": profile.company_name if profile else None,
                } if profile else {},
                "skills": [skill.name for skill in skills],
            }
        except Exception as e:
            logger.error(f"Error extracting user data: {str(e)}")
            return {}

    @staticmethod
    def extract_job_data(job_id: int) -> Dict[str, Any]:
        """
        Extract job posting details.

        Args:
            job_id: Job ID to extract data for

        Returns:
            Dict with job details
        """
        from models import Job, User, Profile

        try:
            job = Job.query.get(job_id)
            if not job:
                return {}

            employer = User.query.get(job.employer_id)
            employer_profile = Profile.query.filter_by(user_id=job.employer_id).first()

            return {
                "id": job.id,
                "title": job.title,
                "company": job.company or (employer_profile.company_name if employer_profile else None),
                "location": job.location,
                "type": job.type,
                "salary": job.salary,
                "description": job.description,
                "requirements": json.loads(job.requirements) if job.requirements else [],
                "responsibilities": json.loads(job.responsibilities) if job.responsibilities else [],
                "benefits": json.loads(job.benefits) if job.benefits else [],
                "experience_level": job.experience_level,
                "is_remote": job.is_remote,
            }
        except Exception as e:
            logger.error(f"Error extracting job data: {str(e)}")
            return {}

    @staticmethod
    def extract_application_data(application_id: int) -> Dict[str, Any]:
        """
        Extract job application details.

        Args:
            application_id: Application ID to extract data for

        Returns:
            Dict with application details
        """
        from models import JobApplication, Job, User

        try:
            app = JobApplication.query.get(application_id)
            if not app:
                return {}

            job = Job.query.get(app.job_id)
            applicant = User.query.get(app.applicant_id)

            return {
                "id": app.id,
                "job_id": app.job_id,
                "applicant_id": app.applicant_id,
                "applicant_name": applicant.full_name if applicant else None,
                "status": app.status,
                "cover_letter": app.cover_letter,
                "resume_url": app.resume_url,
                "feedback": app.feedback,
                "applied_date": app.created_at.isoformat() if app.created_at else None,
                "job": ContextExtractor.extract_job_data(app.job_id) if job else {},
            }
        except Exception as e:
            logger.error(f"Error extracting application data: {str(e)}")
            return {}

    @staticmethod
    def extract_skill_gaps(user_skills: list, job_requirements: list) -> Dict[str, Any]:
        """
        Calculate skill gaps between user and job requirements.

        Args:
            user_skills: List of user skills
            job_requirements: List of job requirements

        Returns:
            Dict with matched and missing skills
        """
        if not user_skills or not job_requirements:
            return {
                "matched_skills": [],
                "missing_skills": job_requirements[:10] if job_requirements else [],
                "match_percentage": 0,
            }

        # Normalize skills for comparison
        user_skills_lower = [s.lower() for s in user_skills]

        matched = []
        missing = []

        for req in job_requirements[:20]:  # Limit to first 20 requirements
            req_lower = req.lower()
            # Check for exact match or partial match
            if any(req_lower in skill or skill in req_lower for skill in user_skills_lower):
                matched.append(req)
            else:
                missing.append(req)

        match_percentage = int(
            (len(matched) / len(job_requirements) * 100)
            if job_requirements
            else 0
        )

        return {
            "matched_skills": matched,
            "missing_skills": missing,
            "match_percentage": match_percentage,
            "total_required": len(job_requirements),
        }

    @staticmethod
    def extract_candidates_data(job_id: int, limit: int = 10) -> Dict[str, Any]:
        """
        Extract candidates who applied for a job (for employer view).

        Args:
            job_id: Job ID
            limit: Max number of candidates to extract

        Returns:
            Dict with candidate applications
        """
        from models import JobApplication, User, Skill

        try:
            applications = (
                JobApplication.query.filter_by(job_id=job_id)
                .order_by(JobApplication.created_at.desc())
                .limit(limit)
                .all()
            )

            candidates = []
            for app in applications:
                applicant = User.query.get(app.applicant_id)
                skills = Skill.query.filter_by(user_id=app.applicant_id).all()

                candidates.append({
                    "application_id": app.id,
                    "name": applicant.full_name if applicant else "Unknown",
                    "email": applicant.email if applicant else None,
                    "status": app.status,
                    "applied_date": app.created_at.isoformat() if app.created_at else None,
                    "skills": [skill.name for skill in skills],
                    "has_resume": bool(app.resume_url),
                    "has_cover_letter": bool(app.cover_letter),
                })

            return {
                "job_id": job_id,
                "total_candidates": len(applications),
                "candidates": candidates,
            }
        except Exception as e:
            logger.error(f"Error extracting candidates data: {str(e)}")
            return {"job_id": job_id, "total_candidates": 0, "candidates": []}

    @staticmethod
    def build_context(
        user_id: int,
        context_type: str,
        context_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Build complete context dictionary for chatbot.

        Args:
            user_id: User making the chat request
            context_type: Type of context (job, application, etc)
            context_data: Additional context data provided by frontend

        Returns:
            Complete context dict for prompt building
        """
        context = {}
        logger.info(f"[DEBUG] build_context called with user_id={user_id}, context_type={context_type}, context_data={context_data}")

        try:
            # Always include user data
            context["user"] = ContextExtractor.extract_user_data(user_id)
            logger.info(f"[DEBUG] User data extracted: {bool(context['user'])}")

            if not context_data:
                context_data = {}

            # Extract based on context type
            if context_type == "job" and context_data.get("job_id"):
                job_id = context_data["job_id"]
                logger.info(f"[DEBUG] Extracting job context for job_id={job_id}")
                context["job"] = ContextExtractor.extract_job_data(job_id)
                logger.info(f"[DEBUG] Job data extracted: {bool(context.get('job'))}, job keys: {list(context.get('job', {}).keys())}")

                # Include user's experience and education
                from models import Experience, Education
                experience = Experience.query.filter_by(user_id=user_id).all()
                education = Education.query.filter_by(user_id=user_id).all()
                logger.info(f"[DEBUG] Experience records found: {len(experience)}, Education records found: {len(education)}")

                context["experience"] = [
                    {
                        "title": exp.title,
                        "company": exp.company,
                        "duration": f"{exp.start_date.strftime('%Y-%m-%d') if exp.start_date else 'N/A'} - {exp.end_date.strftime('%Y-%m-%d') if exp.end_date else 'Present'}",
                        "description": exp.description,
                    }
                    for exp in experience
                ]

                context["education"] = [
                    {
                        "degree": edu.degree,
                        "institution": edu.institution,
                        "location": edu.location,
                        "duration": f"{edu.start_date.strftime('%Y') if edu.start_date else 'N/A'} - {edu.end_date.strftime('%Y') if edu.end_date else 'Present'}",
                    }
                    for edu in education
                ]

                # Calculate skill gaps if user is a job seeker
                if context["user"].get("user_type") == "jobSeeker":
                    context["skill_gaps"] = ContextExtractor.extract_skill_gaps(
                        context["user"].get("skills", []),
                        context["job"].get("requirements", []),
                    )
                    logger.info(f"[DEBUG] Skill gaps calculated for jobSeeker")

            elif context_type == "application" and context_data.get("application_id"):
                application_id = context_data["application_id"]
                context["application"] = ContextExtractor.extract_application_data(
                    application_id
                )

            elif context_type == "applications" and context_data.get("job_id"):
                job_id = context_data["job_id"]
                context["job"] = ContextExtractor.extract_job_data(job_id)
                context["candidates"] = ContextExtractor.extract_candidates_data(
                    job_id
                )

            elif context_type == "resume" and context_data.get("job_id"):
                job_id = context_data["job_id"]
                context["job"] = ContextExtractor.extract_job_data(job_id)
                # Resume content would be passed directly from frontend

            elif context_type == "profile":
                # Profile data is already in user context
                context["profile"] = context["user"].get("profile", {})

            # Add any additional context data from frontend
            if context_data:
                for key, value in context_data.items():
                    if key not in context and key not in ["job_id", "application_id"]:
                        context[key] = value

            logger.info(f"[DEBUG] Final context keys: {list(context.keys())}")
            return context

        except Exception as e:
            logger.error(f"Error building context: {str(e)}")
            logger.error(f"[DEBUG] Exception in build_context: {str(e)}", exc_info=True)
            return {"user": ContextExtractor.extract_user_data(user_id)}
