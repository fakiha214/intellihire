"""Seed the IntelliHire database with demo data for manual testing.

Creates two logins (one employer/recruiter, one job seeker) plus jobs,
applications (with match scores), saved jobs, notifications and a fully paid,
published Open House event so every feature has something to show.

Run from the backend directory:
    python seed.py

It is idempotent: re-running purges the two demo accounts and their data first,
so you always get a clean, predictable dataset. Existing (non-demo) data is left
untouched.
"""

import json
from datetime import datetime, timedelta

from werkzeug.security import generate_password_hash

# Importing app sets up the Flask app, database and runs the schema migration.
from app import app, db
from models import (
    User, Profile, Skill, JobPreference, Experience, Education, Job,
    JobApplication, SavedJob, Notification, OpenHouseEvent, EventEmployer,
    EventBooth, EventJob, EventAttendee, EventApplication, ChatHistory,
)

EMPLOYER_EMAIL = "recruiter@intellihire.test"
SEEKER_EMAIL = "seeker@intellihire.test"
PASSWORD = "Test@1234"

# Existing files already present in backend/uploads so the links resolve.
DEMO_RESUME_URL = "/uploads/4848e6d1-4e64-4795-948c-5b6ad5323cf0_Resume_-_Nelayn_Abbas.pdf"
DEMO_LOGO_URL = "/uploads/e0fac76d-e191-4949-9379-8498afc2c2ca_updated_logo.png"


def purge_user(email):
    """Delete a user and every record that depends on them, in FK-safe order."""
    user = User.query.filter_by(email=email).first()
    if not user:
        return
    uid = user.id

    # Events hosted by this user (cascades to booths/jobs/attendees/applications).
    for ev in OpenHouseEvent.query.filter_by(host_employer_id=uid).all():
        db.session.delete(ev)

    # Event participation in other people's events.
    EventEmployer.query.filter_by(employer_id=uid).delete()
    EventAttendee.query.filter_by(seeker_id=uid).delete()

    # Jobs posted by this user (and their dependent rows).
    for job in Job.query.filter_by(employer_id=uid).all():
        JobApplication.query.filter_by(job_id=job.id).delete()
        SavedJob.query.filter_by(job_id=job.id).delete()
        db.session.delete(job)

    JobApplication.query.filter_by(applicant_id=uid).delete()
    SavedJob.query.filter_by(user_id=uid).delete()
    Skill.query.filter_by(user_id=uid).delete()
    Experience.query.filter_by(user_id=uid).delete()
    Education.query.filter_by(user_id=uid).delete()
    JobPreference.query.filter_by(user_id=uid).delete()
    Notification.query.filter_by(user_id=uid).delete()
    ChatHistory.query.filter_by(user_id=uid).delete()
    Profile.query.filter_by(user_id=uid).delete()

    db.session.delete(user)
    db.session.commit()


def seed():
    now = datetime.utcnow()

    # ---- Clean slate for the demo accounts -------------------------------
    purge_user(EMPLOYER_EMAIL)
    purge_user(SEEKER_EMAIL)

    # ---- Users -----------------------------------------------------------
    employer = User(
        email=EMPLOYER_EMAIL,
        password=generate_password_hash(PASSWORD),
        full_name="Sarah Recruiter",
        user_type="employer",
        created_at=now,
    )
    seeker = User(
        email=SEEKER_EMAIL,
        password=generate_password_hash(PASSWORD),
        full_name="Ali Khan",
        user_type="jobSeeker",
        created_at=now,
    )
    db.session.add_all([employer, seeker])
    db.session.commit()

    # ---- Profiles --------------------------------------------------------
    employer_profile = Profile(
        user_id=employer.id,
        company_name="TechNova Solutions",
        industry="Software & IT Services",
        company_size="51-200",
        founded_year="2015",
        company_website="https://technova.example.com",
        company_location="Lahore, Pakistan",
        company_description=(
            "TechNova Solutions builds modern web and data products for clients "
            "across fintech, e-commerce and logistics. We are a fast-growing "
            "engineering-led company headquartered in Lahore."
        ),
        logo_url=DEMO_LOGO_URL,
        contact_name="Sarah Recruiter",
        contact_title="Head of Talent",
        contact_email=EMPLOYER_EMAIL,
        contact_phone="+92 300 1234567",
        linkedin_url="https://linkedin.com/company/technova",
        created_at=now,
    )

    seeker_profile = Profile(
        user_id=seeker.id,
        title="Full Stack Developer",
        bio=(
            "Full stack developer with 4+ years building web applications with "
            "Python (Flask/Django) and React. Comfortable across the stack, from "
            "PostgreSQL data modelling to Dockerized deployments on AWS."
        ),
        phone="+92 321 9876543",
        location="Lahore, Pakistan",
        resume_url=DEMO_RESUME_URL,
        created_at=now,
    )
    db.session.add_all([employer_profile, seeker_profile])
    db.session.commit()

    # ---- Seeker skills / experience / education / preferences ------------
    seeker_skills = ["Python", "Flask", "Django", "React", "JavaScript",
                     "TypeScript", "PostgreSQL", "Docker", "AWS", "Git"]
    for name in seeker_skills:
        db.session.add(Skill(user_id=seeker.id, name=name, created_at=now))

    db.session.add(Experience(
        user_id=seeker.id, title="Software Engineer", company="Cloudbyte",
        location="Lahore, Pakistan", start_date=now - timedelta(days=365 * 2),
        end_date=None, current=True,
        description="Built and maintained REST APIs in Flask and React frontends; "
                    "migrated services to Docker and AWS.",
        created_at=now,
    ))
    db.session.add(Experience(
        user_id=seeker.id, title="Junior Developer", company="WebWorks",
        location="Faisalabad, Pakistan", start_date=now - timedelta(days=365 * 4),
        end_date=now - timedelta(days=365 * 2), current=False,
        description="Developed internal tools with Django and PostgreSQL.",
        created_at=now,
    ))
    db.session.add(Education(
        user_id=seeker.id, degree="BS Computer Science",
        institution="University of Engineering and Technology, Lahore",
        location="Lahore, Pakistan",
        start_date=now - timedelta(days=365 * 8),
        end_date=now - timedelta(days=365 * 4), current=False,
        created_at=now,
    ))
    db.session.add(JobPreference(
        user_id=seeker.id,
        job_types=json.dumps(["Full-time", "Contract"]),
        locations=json.dumps(["Lahore", "Remote"]),
        industries=json.dumps(["Software & IT Services"]),
        min_salary="150000",
        availability="2 weeks",
        remote_preference="hybrid",
        created_at=now,
    ))
    db.session.commit()

    # ---- Jobs (posted by the employer) -----------------------------------
    jobs_spec = [
        {
            "title": "Senior Python Backend Engineer",
            "type": "Full-time", "salary": "250000", "location": "Lahore, Pakistan",
            "experience_level": "Senior", "is_remote": False,
            "description": "We are hiring a Senior Python Backend Engineer to design and "
                           "build scalable APIs. You will work with Flask, PostgreSQL, "
                           "Docker and AWS to deliver reliable backend services.",
            "requirements": ["5+ years of Python", "Strong Flask or Django experience",
                             "PostgreSQL", "Docker", "AWS", "REST API design"],
            "responsibilities": ["Design and build REST APIs", "Own database schema design",
                                 "Deploy services with Docker on AWS"],
            "benefits": ["Health insurance", "Annual bonus", "Hybrid work"],
        },
        {
            "title": "Frontend React Developer",
            "type": "Full-time", "salary": "180000", "location": "Lahore, Pakistan",
            "experience_level": "Mid", "is_remote": True,
            "description": "Build delightful user interfaces with React, TypeScript and "
                           "Tailwind CSS. Collaborate with designers and backend engineers.",
            "requirements": ["3+ years with React", "JavaScript and TypeScript",
                             "Tailwind CSS", "REST API integration"],
            "responsibilities": ["Build responsive React UIs", "Integrate REST APIs",
                                 "Write reusable components"],
            "benefits": ["Remote-first", "Learning budget"],
        },
        {
            "title": "Full Stack Engineer",
            "type": "Full-time", "salary": "220000", "location": "Remote",
            "experience_level": "Mid", "is_remote": True,
            "description": "Full stack role spanning Python on the backend and React on the "
                           "frontend. Experience with PostgreSQL and Docker is a plus.",
            "requirements": ["Python", "Flask", "React", "PostgreSQL", "Docker", "Git"],
            "responsibilities": ["Ship features end to end", "Maintain CI/CD pipelines"],
            "benefits": ["Stock options", "Flexible hours"],
        },
        {
            "title": "DevOps Engineer",
            "type": "Full-time", "salary": "240000", "location": "Karachi, Pakistan",
            "experience_level": "Senior", "is_remote": False,
            "description": "Own our infrastructure: Docker, Kubernetes, AWS, Jenkins and "
                           "Terraform. Improve reliability and automate deployments.",
            "requirements": ["Docker", "Kubernetes", "AWS", "Jenkins", "Terraform", "Linux"],
            "responsibilities": ["Manage Kubernetes clusters", "Automate CI/CD",
                                 "Infrastructure as code with Terraform"],
            "benefits": ["Health insurance", "On-call allowance"],
        },
        {
            "title": "Data Scientist",
            "type": "Full-time", "salary": "260000", "location": "Islamabad, Pakistan",
            "experience_level": "Mid", "is_remote": False,
            "description": "Work on machine learning models using Python, Pandas, NumPy, "
                           "scikit-learn and TensorFlow. Strong NLP background preferred.",
            "requirements": ["Python", "Pandas", "NumPy", "scikit-learn", "TensorFlow", "NLP"],
            "responsibilities": ["Build ML models", "Analyze large datasets"],
            "benefits": ["Conference budget", "Hybrid work"],
        },
    ]

    jobs = []
    for i, spec in enumerate(jobs_spec):
        job = Job(
            employer_id=employer.id,
            title=spec["title"],
            company="TechNova Solutions",
            location=spec["location"],
            type=spec["type"],
            salary=spec["salary"],
            description=spec["description"],
            requirements=json.dumps(spec["requirements"]),
            responsibilities=json.dumps(spec["responsibilities"]),
            benefits=json.dumps(spec["benefits"]),
            is_remote=spec["is_remote"],
            experience_level=spec["experience_level"],
            application_deadline=now + timedelta(days=30),
            application_email=EMPLOYER_EMAIL,
            is_active=True,
            is_draft=False,
            created_at=now - timedelta(days=i * 5),
        )
        db.session.add(job)
        jobs.append(job)
    db.session.commit()

    # ---- Applications (seeker -> jobs) -----------------------------------
    app1 = JobApplication(
        job_id=jobs[2].id, applicant_id=seeker.id, resume_url=DEMO_RESUME_URL,
        cover_letter="I'm excited about this full stack role and my Python/React "
                     "background is a strong fit.",
        status="pending", created_at=now - timedelta(days=2),
    )
    app2 = JobApplication(
        job_id=jobs[0].id, applicant_id=seeker.id, resume_url=DEMO_RESUME_URL,
        cover_letter="My backend experience with Flask, PostgreSQL and AWS maps well "
                     "to this position.",
        status="reviewed", created_at=now - timedelta(days=4),
    )
    app3 = JobApplication(
        job_id=jobs[1].id, applicant_id=seeker.id, resume_url=DEMO_RESUME_URL,
        cover_letter="Keen to bring my React and TypeScript skills to your team.",
        status="interviewed", interview_notes="Date: next Tuesday | Time: 3pm | Zoom",
        created_at=now - timedelta(days=6),
    )
    db.session.add_all([app1, app2, app3])

    # ---- Saved jobs ------------------------------------------------------
    db.session.add(SavedJob(user_id=seeker.id, job_id=jobs[3].id, created_at=now))

    # ---- Notifications for the seeker ------------------------------------
    db.session.add(Notification(
        user_id=seeker.id, type="status_update",
        title="Application Reviewed: Senior Python Backend Engineer",
        message="Your application has been reviewed by the employer.",
        is_read=False, related_id=jobs[0].id, created_at=now - timedelta(hours=5),
    ))
    db.session.add(Notification(
        user_id=seeker.id, type="status_update",
        title="Interview Scheduled: Frontend React Developer",
        message="Good news! An interview has been scheduled.",
        is_read=False, related_id=jobs[1].id, created_at=now - timedelta(hours=2),
    ))
    db.session.commit()

    # ---- A paid, published Open House event ------------------------------
    event = OpenHouseEvent(
        host_employer_id=employer.id,
        title="TechNova Open House 2026",
        description="Meet the TechNova team, explore open roles and interview on the spot.",
        event_type="job_fair",
        venue_name="Arfa Software Technology Park",
        venue_address="346-B Ferozepur Road",
        venue_city="Lahore",
        venue_country="Pakistan",
        booth_layout=json.dumps({"rows": ["A", "B"], "booths_per_row": 3}),
        event_start=now + timedelta(days=14),
        event_end=now + timedelta(days=14, hours=6),
        registration_deadline=now + timedelta(days=10),
        status="published",
        invite_token="demo-openhouse-token-2026",
        max_attendees=200,
        max_employers=20,
        payment_status="paid",
        amount_paid=4900,
        paid_at=now,
        created_at=now - timedelta(days=3),
    )
    db.session.add(event)
    db.session.commit()

    # Booths
    for row in ["A", "B"]:
        for num in range(1, 4):
            db.session.add(EventBooth(event_id=event.id, row_label=row, booth_number=num))
    db.session.commit()

    # Host participates as an accepted employer so they can post event jobs.
    event_employer = EventEmployer(
        event_id=event.id, employer_id=employer.id, invited_by_email=EMPLOYER_EMAIL,
        status="accepted", responded_at=now, profile_completed=True,
        event_company_tagline="Engineering-led, product-focused",
        event_contact_name="Sarah Recruiter", event_contact_email=EMPLOYER_EMAIL,
        created_at=now,
    )
    db.session.add(event_employer)
    db.session.commit()

    # Assign the host to booth A1
    booth_a1 = EventBooth.query.filter_by(event_id=event.id, row_label="A", booth_number=1).first()
    if booth_a1:
        booth_a1.event_employer_id = event_employer.id
        db.session.commit()

    # Event jobs
    ejob = EventJob(
        event_id=event.id, event_employer_id=event_employer.id,
        title="Full Stack Engineer (On-site Interview)",
        description="Interview on the day for our full stack role. Python + React.",
        job_type="Full-time", salary="220000", experience_level="Mid",
        industry="Software & IT Services", location="Lahore, Pakistan",
        requirements=json.dumps(["Python", "React", "PostgreSQL", "Docker"]),
        is_active=True, created_at=now,
    )
    db.session.add(ejob)
    db.session.commit()

    # Seeker is an approved attendee, and has applied to the event job.
    attendee = EventAttendee(
        event_id=event.id, seeker_id=seeker.id, status="approved",
        requested_at=now - timedelta(days=1), reviewed_at=now, join_token_used=True,
    )
    db.session.add(attendee)
    db.session.commit()

    db.session.add(EventApplication(
        event_id=event.id, event_job_id=ejob.id, event_attendee_id=attendee.id,
        resume_url=DEMO_RESUME_URL,
        cover_letter="Looking forward to interviewing at the open house.",
        status="pending", created_at=now,
    ))
    db.session.commit()

    print("=" * 60)
    print("  IntelliHire demo data seeded successfully")
    print("=" * 60)
    print(f"  Recruiter (employer): {EMPLOYER_EMAIL}  /  {PASSWORD}")
    print(f"  Candidate (jobSeeker): {SEEKER_EMAIL}  /  {PASSWORD}")
    print("-" * 60)
    print(f"  Jobs posted: {len(jobs)}")
    print("  Applications by candidate: 3 (pending / reviewed / interviewed)")
    print("  Saved jobs: 1   Notifications: 2")
    print("  Open House event: 'TechNova Open House 2026' (paid + published)")
    print("    invite link: /events/join/demo-openhouse-token-2026")
    print("=" * 60)


if __name__ == "__main__":
    with app.app_context():
        seed()
