from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import json
from datetime import datetime, timedelta
import uuid
import requests

import io
from flask import make_response
import re

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()
from models import db, User, Profile, Skill, JobPreference, Experience, Education, Job, JobApplication, SavedJob, Notification, OpenHouseEvent, EventEmployer, EventBooth, EventJob, EventAttendee, EventApplication, ChatHistory
from sklearn.feature_extraction.text import TfidfVectorizer
from utils.matching import calculate_seeker_to_jobs_scores
try:
    from PyPDF2 import PdfReader
except ImportError:
    PdfReader = None
try:
    from fpdf import FPDF
except ImportError:
    FPDF = None
import re

app = Flask(__name__)
app.config.from_object('config.Config')

# Configure CORS to allow credentials
frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5174')
CORS(app,
     origins=[frontend_url, 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Initialize database
db.init_app(app)


def ensure_schema():
    """Lightweight, non-destructive migration.

    ``db.create_all()`` never alters existing tables, so newly added columns
    (e.g. the event payment fields) must be added by hand for databases that
    were created before the column existed. This adds any missing columns and
    grandfathers pre-existing events as already paid so the paywall only applies
    to events created from now on.
    """
    from sqlalchemy import inspect as sa_inspect, text as sa_text

    inspector = sa_inspect(db.engine)
    try:
        existing = {c['name'] for c in inspector.get_columns('open_house_events')}
    except Exception:
        return  # table not created yet; create_all handled fresh schema

    new_columns = {
        'payment_status': "VARCHAR(20) DEFAULT 'unpaid'",
        'stripe_session_id': 'VARCHAR(255)',
        'amount_paid': 'INTEGER',
        'paid_at': 'DATETIME',
    }

    added = False
    for name, ddl in new_columns.items():
        if name not in existing:
            try:
                db.session.execute(sa_text(f'ALTER TABLE open_house_events ADD COLUMN {name} {ddl}'))
                added = True
            except Exception as e:
                print(f"[schema] could not add column {name}: {e}")

    if added:
        # Grandfather every event that existed before the paywall as 'paid'
        # so previously-created events keep working.
        try:
            db.session.execute(sa_text(
                "UPDATE open_house_events SET payment_status='paid' "
                "WHERE payment_status IS NULL OR payment_status='unpaid'"
            ))
        except Exception as e:
            print(f"[schema] could not grandfather events: {e}")
        db.session.commit()


# Create tables
with app.app_context():
    db.create_all()
    ensure_schema()

# Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    
    # Check if user already exists
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'error': 'Email already registered'}), 409
    
    # Create new user
    new_user = User(
        email=data['email'],
        password=generate_password_hash(data['password']),
        full_name=data['fullName'],
        user_type=data['userType'],
        created_at=datetime.utcnow()
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    # Create empty profile
    new_profile = Profile(
        user_id=new_user.id,
        created_at=datetime.utcnow()
    )
    
    db.session.add(new_profile)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully', 'userId': new_user.id}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Set session
    session['user_id'] = user.id
    
    return jsonify({
        'message': 'Login successful',
        'user': {
            'id': user.id,
            'email': user.email,
            'fullName': user.full_name,
            'userType': user.user_type
        }
    }), 200

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logout successful'}), 200

@app.route('/api/auth/password', methods=['PUT'])
def change_password():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    user = User.query.get(user_id)

    data = request.json
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')

    if not current_password or not new_password:
        return jsonify({'error': 'Current and new password are required'}), 400

    # Verify current password
    if not check_password_hash(user.password, current_password):
        return jsonify({'error': 'Current password is incorrect'}), 401

    # Update password
    user.password = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({'message': 'Password changed successfully'}), 200

@app.route('/api/auth/account', methods=['DELETE'])
def delete_account():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    user = User.query.get(user_id)

    # Delete all related data
    # Delete saved jobs
    SavedJob.query.filter_by(user_id=user_id).delete()

    # Delete job applications
    JobApplication.query.filter(
        JobApplication.applicant_id == user_id
    ).delete()

    # Delete skills
    Skill.query.filter_by(user_id=user_id).delete()

    # Delete experiences
    Experience.query.filter_by(user_id=user_id).delete()

    # Delete education
    Education.query.filter_by(user_id=user_id).delete()

    # Delete job preferences
    JobPreference.query.filter_by(user_id=user_id).delete()

    # Delete jobs (for employers)
    Job.query.filter_by(employer_id=user_id).delete()

    # Delete profile
    Profile.query.filter_by(user_id=user_id).delete()

    # Delete user
    db.session.delete(user)
    db.session.commit()

    # Clear session
    session.pop('user_id', None)

    return jsonify({'message': 'Account deleted successfully'}), 200

@app.route('/api/auth/status', methods=['GET'])
def auth_status():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user:
            return jsonify({
                'isAuthenticated': True,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'fullName': user.full_name,
                    'userType': user.user_type
                }
            }), 200
    
    return jsonify({'isAuthenticated': False}), 200

# Update the get_profile route to handle employer profiles
@app.route('/api/profile', methods=['GET'])
def get_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    user = User.query.get(user_id)
    profile = Profile.query.filter_by(user_id=user_id).first()

    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    # Check if profile is complete based on user type
    is_profile_complete = False
    
    if user.user_type == 'jobSeeker':
        # Check required fields for job seeker
        is_profile_complete = bool(
            profile.title and 
            profile.phone and 
            profile.location and 
            profile.bio and 
            Skill.query.filter_by(user_id=user_id).first()  # At least one skill
        )
    elif user.user_type == 'employer':
        # Check required fields for employer
        is_profile_complete = bool(
            profile.company_name and 
            profile.industry and 
            profile.company_location and 
            profile.company_description
        )

    if not is_profile_complete:
        return jsonify({'error': 'Profile incomplete'}), 404

    # Common profile data
    profile_data = {
        'fullName': user.full_name,
        'email': user.email,
        'userType': user.user_type
    }

    # Handle job seeker profile
    if user.user_type == 'jobSeeker':
        # Get skills
        skills = [skill.name for skill in Skill.query.filter_by(user_id=user_id).all()]
        
        # Get job preferences
        job_preference = JobPreference.query.filter_by(user_id=user_id).first()
        job_preferences = {}
        
        if job_preference:
            job_preferences = {
                'jobTypes': json.loads(job_preference.job_types) if job_preference.job_types else [],
                'locations': json.loads(job_preference.locations) if job_preference.locations else [],
                'industries': json.loads(job_preference.industries) if job_preference.industries else [],
                'minSalary': job_preference.min_salary,
                'availability': job_preference.availability,
                'remotePreference': job_preference.remote_preference
            }
        
        # Get experience
        experiences = []
        for exp in Experience.query.filter_by(user_id=user_id).order_by(Experience.start_date.desc()).all():
            experiences.append({
                'id': exp.id,
                'title': exp.title,
                'company': exp.company,
                'location': exp.location,
                'startDate': exp.start_date.strftime('%Y-%m-%d') if exp.start_date else '',
                'endDate': exp.end_date.strftime('%Y-%m-%d') if exp.end_date else 'Present',
                'description': exp.description
            })
        
        # Get education
        education = []
        for edu in Education.query.filter_by(user_id=user_id).order_by(Education.start_date.desc()).all():
            education.append({
                'id': edu.id,
                'degree': edu.degree,
                'institution': edu.institution,
                'location': edu.location,
                'startDate': edu.start_date.strftime('%Y-%m-%d') if edu.start_date else '',
                'endDate': edu.end_date.strftime('%Y-%m-%d') if edu.end_date else 'Present'
            })
        
        # Add job seeker specific data
        profile_data.update({
            'phone': profile.phone,
            'location': profile.location,
            'title': profile.title,
            'bio': profile.bio,
            'resumeUrl': profile.resume_url,
            'skills': skills,
            'experiences': experiences,
            'education': education,
            'jobPreferences': job_preferences
        })

    # Handle employer profile
    elif user.user_type == 'employer':
        # Get job postings
        job_postings = []
        for job in Job.query.filter_by(employer_id=user_id).all():
            job_postings.append(job.to_dict())
        
        # Count total applications
        total_applications = JobApplication.query.join(Job).filter(Job.employer_id == user_id).count()
        
        # Add employer specific data
        profile_data.update({
            'companyName': profile.company_name,
            'industry': profile.industry,
            'companySize': profile.company_size,
            'foundedYear': profile.founded_year,
            'companyWebsite': profile.company_website,
            'companyLocation': profile.company_location,
            'companyDescription': profile.company_description,
            'logoUrl': profile.logo_url,
            'contactName': profile.contact_name,
            'contactTitle': profile.contact_title,
            'contactEmail': profile.contact_email,
            'contactPhone': profile.contact_phone,
            'linkedinUrl': profile.linkedin_url,
            'twitterUrl': profile.twitter_url,
            'facebookUrl': profile.facebook_url,
            'jobPostings': job_postings,
            'totalApplications': total_applications
        })

    # Calculate profile completion percentage
    completion_percent = 0
    if user.user_type == 'jobSeeker':
        # 10 points each for: title, phone, location, bio, resume, skills, experience, education, salary prefs, job types
        checks = [
            profile.title,
            profile.phone,
            profile.location,
            profile.bio,
            profile.resume_url,
            len(skills) > 0,
            len(experiences) > 0,
            len(education) > 0,
            job_preference and job_preference.min_salary,
            job_preference and job_preference.job_types and len(job_preference.job_types) > 0
        ]
        completion_percent = sum(1 for check in checks if check) * 10
        # Ensure it doesn't exceed 100
        completion_percent = min(completion_percent, 100)
    elif user.user_type == 'employer':
        # 10 points each for: company_name, industry, company_size, company_location, company_description, logo_url, contact_name, contact_email, contact_phone, linkedin_url
        checks = [
            profile.company_name,
            profile.industry,
            profile.company_size,
            profile.company_location,
            profile.company_description,
            profile.logo_url,
            profile.contact_name,
            profile.contact_email,
            profile.contact_phone,
            profile.linkedin_url
        ]
        completion_percent = sum(1 for check in checks if check) * 10

    profile_data['completionPercent'] = min(completion_percent, 100)
    return jsonify(profile_data), 200

# Update the update_profile route to handle employer profiles
@app.route('/api/profile', methods=['POST'])
def update_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    user = User.query.get(user_id)
    profile = Profile.query.filter_by(user_id=user_id).first()

    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    # Common profile update
    profile.updated_at = datetime.utcnow()

    # Handle job seeker profile update
    if user.user_type == 'jobSeeker':
        # Handle file upload
        resume_file = request.files.get('resume')
        if resume_file:
            filename = secure_filename(f"{uuid.uuid4()}_{resume_file.filename}")
            resume_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            resume_file.save(resume_path)
            profile.resume_url = f"/uploads/{filename}"
        
        # Update profile fields
        profile.title = request.form.get('title', profile.title)
        profile.phone = request.form.get('phone', profile.phone)
        profile.location = request.form.get('location', profile.location)
        profile.bio = request.form.get('bio', profile.bio)
        
        # Update skills
        if 'skills' in request.form:
            # Delete existing skills
            Skill.query.filter_by(user_id=user_id).delete()

            # Add new skills
            skills = json.loads(request.form.get('skills'))
            for skill_name in skills:
                new_skill = Skill(
                    user_id=user_id,
                    name=skill_name,
                    created_at=datetime.utcnow()
                )
                db.session.add(new_skill)

        # Update experiences
        if 'experiences' in request.form:
            # Delete existing experiences
            Experience.query.filter_by(user_id=user_id).delete()

            # Add new experiences
            experiences = json.loads(request.form.get('experiences'))
            for exp in experiences:
                new_exp = Experience(
                    user_id=user_id,
                    company=exp.get('company'),
                    title=exp.get('title'),
                    location=exp.get('location'),
                    start_date=datetime.strptime(exp.get('startDate'), '%Y-%m-%d') if exp.get('startDate') else None,
                    end_date=datetime.strptime(exp.get('endDate'), '%Y-%m-%d') if exp.get('endDate') and exp.get('endDate') != 'Present' else None,
                    description=exp.get('description'),
                    created_at=datetime.utcnow()
                )
                db.session.add(new_exp)

        # Update education
        if 'education' in request.form:
            # Delete existing education
            Education.query.filter_by(user_id=user_id).delete()

            # Add new education
            education = json.loads(request.form.get('education'))
            for edu in education:
                new_edu = Education(
                    user_id=user_id,
                    degree=edu.get('degree'),
                    institution=edu.get('institution'),
                    location=edu.get('location'),
                    start_date=datetime.strptime(edu.get('startDate'), '%Y-%m-%d') if edu.get('startDate') else None,
                    end_date=datetime.strptime(edu.get('endDate'), '%Y-%m-%d') if edu.get('endDate') and edu.get('endDate') != 'Present' else None,
                    created_at=datetime.utcnow()
                )
                db.session.add(new_edu)

        # Update job preferences
        job_preference = JobPreference.query.filter_by(user_id=user_id).first()
        
        if not job_preference:
            job_preference = JobPreference(user_id=user_id)
            db.session.add(job_preference)
        
        if 'jobTypes' in request.form:
            job_preference.job_types = request.form.get('jobTypes')
        
        if 'locations' in request.form:
            job_preference.locations = request.form.get('locations')
        
        if 'industries' in request.form:
            job_preference.industries = request.form.get('industries')
        
        if 'minSalary' in request.form:
            job_preference.min_salary = request.form.get('minSalary')
        
        if 'availability' in request.form:
            job_preference.availability = request.form.get('availability')
        
        if 'remotePreference' in request.form:
            job_preference.remote_preference = request.form.get('remotePreference')
        
        job_preference.updated_at = datetime.utcnow()

    # Handle employer profile update
    elif user.user_type == 'employer':
        # Handle logo upload
        logo_file = request.files.get('logo')
        if logo_file:
            filename = secure_filename(f"{uuid.uuid4()}_{logo_file.filename}")
            logo_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            logo_file.save(logo_path)
            profile.logo_url = f"/uploads/{filename}"
        
        # Update company information
        profile.company_name = request.form.get('companyName', profile.company_name)
        profile.industry = request.form.get('industry', profile.industry)
        profile.company_size = request.form.get('companySize', profile.company_size)
        profile.founded_year = request.form.get('foundedYear', profile.founded_year)
        profile.company_website = request.form.get('companyWebsite', profile.company_website)
        profile.company_location = request.form.get('companyLocation', profile.company_location)
        profile.company_description = request.form.get('companyDescription', profile.company_description)
        
        # Update contact information
        profile.contact_name = request.form.get('contactName', profile.contact_name)
        profile.contact_title = request.form.get('contactTitle', profile.contact_title)
        profile.contact_email = request.form.get('contactEmail', profile.contact_email)
        profile.contact_phone = request.form.get('contactPhone', profile.contact_phone)
        
        # Update social media
        profile.linkedin_url = request.form.get('linkedinUrl', profile.linkedin_url)
        profile.twitter_url = request.form.get('twitterUrl', profile.twitter_url)
        profile.facebook_url = request.form.get('facebookUrl', profile.facebook_url)

    db.session.commit()

    return jsonify({'message': 'Profile updated successfully'}), 200

@app.route('/api/jobs/<int:job_id>/skill-gap', methods=['GET'])
def analyze_skill_gap(job_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    user = User.query.get(user_id)

    # Check if user is a job seeker
    if user.user_type != 'jobSeeker':
        return jsonify({'error': 'Only job seekers can view skill gap'}), 403

    # Get job details
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404

    # Define comprehensive technical skills list
    technical_skills = {
        # Programming Languages
        'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'golang', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
        # Frontend Frameworks
        'react', 'react native', 'vue', 'angular', 'svelte', 'nextjs', 'next.js', 'nuxt', 'ember',
        # Backend Frameworks
        'node.js', 'nodejs', 'express', 'django', 'flask', 'fastapi', 'spring', 'rails', 'laravel', 'asp.net',
        # Databases
        'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'firebase', 'oracle', 'cassandra',
        # DevOps/Cloud
        'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jenkins', 'gitlab', 'github', 'heroku', 'netlify',
        # Testing
        'jest', 'testing library', 'pytest', 'mocha', 'chai', 'rspec', 'junit', 'selenium',
        # CSS/Styling
        'css', 'tailwind', 'sass', 'scss', 'less', 'bootstrap', 'material ui', 'styled components',
        # Version Control
        'git', 'svn', 'mercurial',
        # Other Tools
        'rest api', 'graphql', 'api', 'webpack', 'vite', 'babel', 'npm', 'yarn', 'terraform',
        # Soft Skills (when explicitly mentioned as technical requirements)
        'agile', 'scrum', 'design patterns', 'oop', 'functional programming'
    }

    # Get user's skills
    user_skills = set([skill.name.lower() for skill in Skill.query.filter_by(user_id=user_id).all()])

    # Extract skills from job requirements and description
    combined_text = ""
    if job.requirements:
        try:
            reqs = json.loads(job.requirements)
            combined_text += " ".join(reqs) + " "
        except:
            pass

    if job.description:
        combined_text += job.description + " "

    # Convert to lowercase and find technical skills mentioned
    combined_text_lower = combined_text.lower()
    job_skills = []

    for skill in technical_skills:
        if skill in combined_text_lower:
            job_skills.append(skill)

    # Remove duplicates
    job_skills = list(set(job_skills))

    # Find matched and missing skills
    matched_skills = []
    for job_skill in job_skills:
        for user_skill in user_skills:
            if job_skill in user_skill or user_skill in job_skill:
                matched_skills.append(job_skill)
                break

    missing_skills = [skill for skill in job_skills if skill not in matched_skills]

    # Calculate match percentage
    match_percentage = int((len(matched_skills) / len(job_skills) * 100)) if job_skills else 0

    # Generate recommendation
    if match_percentage >= 80:
        recommendation = f"Excellent match! You have {match_percentage}% of the required skills."
    elif match_percentage >= 60:
        recommendation = f"Good match! You have {match_percentage}% of the required skills. Consider learning the missing skills to boost your candidacy."
    elif match_percentage >= 40:
        recommendation = f"Moderate match ({match_percentage}%). Focus on developing the missing skills to strengthen your application."
    else:
        recommendation = f"You have {match_percentage}% of the required skills. This role might be challenging without additional training."

    return jsonify({
        'jobId': job_id,
        'matchedSkills': matched_skills[:10],  # Limit to top 10
        'missingSkills': missing_skills[:10],  # Limit to top 10
        'matchPercentage': match_percentage,
        'recommendation': recommendation
    }), 200

@app.route('/api/trends', methods=['GET'])
def get_trends():
    from collections import Counter
    import re
    import json
    # Matching utilities se technical skills ki list mangwaein
    from utils.matching import TECHNICAL_SKILLS

    # 1. Location Mapping: Short forms ko ek standard naam mein merge karna
    LOCATION_MAPPING = {
        'Faisalabad': ['fsd', 'faisalabad', 'faislabad', 'faisalabad fsd'],
        'Lahore': ['lhr', 'lahore', 'lahore pk', 'lahore city'],
        'Karachi': ['khi', 'karachi', 'karachi city'],
        'Islamabad': ['isb', 'islamabad', 'islamabad capital'],
        'Rawalpindi': ['pindi', 'rwp', 'rawalpindi'],
        'Multan': ['multan', 'mux'],
        'Peshawar': ['pew', 'peshawar']
    }

    def normalize_location(loc_name):
        if not loc_name: return "Remote"
        l = loc_name.lower().strip()
        for standard_name, variations in LOCATION_MAPPING.items():
            if any(v in l for v in variations):
                return standard_name
        return loc_name.title()

    # 2. Technical Skills set taiyar karein (Filtering ke liye)
    valid_skills_set = set()
    for category in TECHNICAL_SKILLS.values():
        for s in category:
            valid_skills_set.add(s.lower())

    # 3. Active jobs fetch karein
    jobs = Job.query.filter_by(is_active=True).all()

    if not jobs:
        return jsonify({
            'topSkills': [], 'jobTypeDistribution': [],
            'experienceLevelDistribution': [], 'topLocations': [],
            'monthlyTrend': [], 'averageSalary': 0
        }), 200

    # Counters initialize karein
    skills_counter = Counter()
    location_counter = Counter()
    job_type_counter = Counter()
    exp_level_counter = Counter()
    monthly_counter = Counter()
    salaries = []

    for job in jobs:
        # A. SMART SKILLS FILTER (Sirf technical skills pick karein)
        combined_text = f"{job.title} {job.description} ".lower()
        if job.requirements:
            try:
                reqs = json.loads(job.requirements)
                combined_text += " ".join(reqs).lower()
            except: pass
        
        for skill in valid_skills_set:
            # Word boundary (\b) ensure karta hai ke 'java' aur 'javascript' sahi count hon
            if re.search(r'\b' + re.escape(skill) + r'\b', combined_text):
                skills_counter[skill] += 1

        # B. SMART LOCATION MERGING (FSD/LHR logic)
        norm_loc = normalize_location(job.location)
        location_counter[norm_loc] += 1

        # C. Monthly Trend Logic
        if job.created_at:
            month_key = job.created_at.strftime('%Y-%m')
            monthly_counter[month_key] += 1

        # D. Other counters
        if job.type: job_type_counter[job.type] += 1
        if job.experience_level: exp_level_counter[job.experience_level] += 1
        
        # E. Salary Calculation
        if job.salary:
            nums = re.findall(r'\d+', job.salary.replace(',', ''))
            if nums: salaries.append(int(nums[0]))

    # Final Response structure
    top_skills = [{'skill': s.upper(), 'count': c} for s, c in skills_counter.most_common(10)]
    top_locations = [{'location': loc, 'count': count} for loc, count in location_counter.most_common(5)]
    job_type_dist = [{'type': t, 'count': c} for t, c in job_type_counter.items()]
    exp_dist = [{'level': l, 'count': c} for l, c in exp_level_counter.items()]
    monthly_trend = [{'month': m, 'count': c} for m, c in sorted(monthly_counter.items())]
    average_salary = int(sum(salaries) / len(salaries)) if salaries else 0

    return jsonify({
        'topSkills': top_skills,
        'jobTypeDistribution': job_type_dist,
        'experienceLevelDistribution': exp_dist,
        'topLocations': top_locations,
        'monthlyTrend': monthly_trend,
        'averageSalary': average_salary
    }), 200
@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    user = User.query.get(user_id)

    if user.user_type == 'jobSeeker':
        # Get application stats. NOTE: JobApplication uses `applicant_id`.
        applications = JobApplication.query.filter_by(applicant_id=user_id).all()
        # Active = still in the running (not rejected).
        active_applications = len([app for app in applications if app.status != 'rejected'])
        pending_applications = len([app for app in applications if app.status == 'pending'])
        # Reviewed = the employer has progressed it beyond the initial 'pending'.
        reviewed_applications = len([app for app in applications if app.status != 'pending'])

        return jsonify({
            'activeApplications': active_applications,
            'pendingApplications': pending_applications,
            'reviewedApplications': reviewed_applications
        }), 200

    elif user.user_type == 'employer':
        # Get employer stats
        jobs = Job.query.filter_by(employer_id=user_id).all()
        total_jobs = len(jobs)

        # Count applications for employer's jobs
        total_applications = JobApplication.query.join(Job).filter(Job.employer_id == user_id).count()

        # Count new applications from last 7 days
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        new_applications = JobApplication.query.join(Job).filter(
            (Job.employer_id == user_id) &
            (JobApplication.created_at >= seven_days_ago)
        ).count()

        return jsonify({
            'totalJobs': total_jobs,
            'totalApplications': total_applications,
            'newApplications': new_applications
        }), 200

    return jsonify({'error': 'Invalid user type'}), 400

@app.route('/api/resume/analyze', methods=['GET'])
def analyze_resume():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    user = User.query.get(user_id)

    # Only job seekers can analyze their resume
    if user.user_type != 'jobSeeker':
        return jsonify({'error': 'Only job seekers can analyze resumes'}), 403

    # Get user skills
    skills = Skill.query.filter_by(user_id=user_id).all()
    skill_names = [skill.name for skill in skills]

    if not skill_names:
        return jsonify({
            'totalJobMatches': 0,
            'topMatchingJobs': [],
            'suggestedSkills': [],
            'profileStrength': 0
        }), 200

    # Get all active jobs
    jobs = Job.query.filter_by(is_active=True).all()

    if not jobs:
        return jsonify({
            'totalJobMatches': 0,
            'topMatchingJobs': [],
            'suggestedSkills': [],
            'profileStrength': calculate_profile_completion_percentage(user)
        }), 200

    # Calculate match scores for all jobs
    vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
    job_descriptions = [job.description for job in jobs]
    scores = calculate_seeker_to_jobs_scores(vectorizer, skill_names, job_descriptions, jobs)

    # Get top matching jobs
    job_scores = list(zip(jobs, scores))
    job_scores.sort(key=lambda x: x[1], reverse=True)
    top_jobs = job_scores[:5]

    # Define comprehensive technical skills list
    technical_skills = {
        'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'golang', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
        'react', 'react native', 'vue', 'angular', 'svelte', 'nextjs', 'next.js', 'nuxt', 'ember',
        'node.js', 'nodejs', 'express', 'django', 'flask', 'fastapi', 'spring', 'rails', 'laravel', 'asp.net',
        'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'firebase', 'oracle', 'cassandra',
        'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jenkins', 'gitlab', 'github', 'heroku', 'netlify',
        'jest', 'testing library', 'pytest', 'mocha', 'chai', 'rspec', 'junit', 'selenium',
        'css', 'tailwind', 'sass', 'scss', 'less', 'bootstrap', 'material ui', 'styled components',
        'git', 'svn', 'mercurial', 'rest api', 'graphql', 'api', 'webpack', 'vite', 'babel', 'npm', 'yarn',
        'agile', 'scrum', 'design patterns', 'oop', 'functional programming'
    }

    # Extract suggested skills from top jobs
    suggested_skills = set()
    for job, score in top_jobs:
        if score >= 50:  # Only consider jobs with good match
            # Extract skills from job requirements and description
            requirements_text = ' '.join(job.requirements) if job.requirements else ''
            combined_text = f"{job.description} {requirements_text}".lower()

            # Find technical skills mentioned in the job
            for skill in technical_skills:
                if skill in combined_text and skill not in skill_names:
                    suggested_skills.add(skill)

    # Calculate profile strength (0-100)
    profile_strength = calculate_profile_completion_percentage(user)

    return jsonify({
        'totalJobMatches': len([score for score in scores if score >= 50]),
        'topMatchingJobs': [
            {
                'id': job.id,
                'title': job.title,
                'company': job.company,
                'location': job.location,
                'matchScore': score
            }
            for job, score in top_jobs
        ],
        'suggestedSkills': list(suggested_skills)[:10],
        'profileStrength': profile_strength
    }), 200

# Job posting routes
@app.route('/api/jobs', methods=['POST'])
def create_job():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    user = User.query.get(user_id)
    
    # Check if user is an employer
    if user.user_type != 'employer':
        return jsonify({'error': 'Only employers can post jobs'}), 403
    
    data = request.json
    
    # Create new job
    new_job = Job(
        employer_id=user_id,
        title=data['title'],
        company=data.get('company', user.profile.company_name),
        location=data.get('location', ''),
        type=data.get('type', ''),
        salary=data.get('salary', ''),
        description=data['description'],
        requirements=json.dumps(data.get('requirements', [])),
        responsibilities=json.dumps(data.get('responsibilities', [])),
        benefits=json.dumps(data.get('benefits', [])),
        is_remote=data.get('isRemote', False),
        experience_level=data.get('experienceLevel', ''),
        application_deadline=datetime.fromisoformat(data['applicationDeadline']) if data.get('applicationDeadline') else None,
        application_email=data.get('applicationEmail', ''),
        application_url=data.get('applicationUrl', ''),
        is_active=True,
        is_draft=False,
        created_at=datetime.utcnow()
    )
    
    db.session.add(new_job)
    db.session.commit()
    
    return jsonify({'message': 'Job posted successfully', 'jobId': new_job.id}), 201

@app.route('/api/jobs/employer', methods=['GET'])
def get_employer_jobs():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    user = User.query.get(user_id)
    
    # Check if user is an employer
    if user.user_type != 'employer':
        return jsonify({'error': 'Only employers can access this endpoint'}), 403
    
    # Get all jobs posted by the employer
    jobs = Job.query.filter_by(employer_id=user_id).all()
    
    # Convert jobs to dict
    jobs_data = [job.to_dict() for job in jobs]
    
    return jsonify(jobs_data), 200

# Import the matching utilities
from utils.matching import load_model, calculate_match_score, calculate_seeker_to_jobs_scores

# Load the Word2Vec model
word2vec_model = load_model()

@app.route('/api/jobs', methods=['GET'])
def search_jobs():
    # Get query parameters
    search = request.args.get('search', '')
    job_type = request.args.getlist('jobType')
    location = request.args.getlist('location')
    experience_level = request.args.getlist('experienceLevel')
    remote = request.args.get('remote', '').lower() == 'true'
    limit = request.args.get('limit', type=int)
    exclude_id = request.args.get('exclude', type=int)

    # Build query
    query = Job.query.filter_by(is_active=True)

    # Apply filters
    if search:
        query = query.filter(
            (Job.title.ilike(f'%{search}%')) |
            (Job.company.ilike(f'%{search}%')) |
            (Job.description.ilike(f'%{search}%'))
        )

    if job_type:
        query = query.filter(Job.type.in_(job_type))

    if location:
        location_filters = []
        for loc in location:
            location_filters.append(Job.location.ilike(f'%{loc}%'))
        query = query.filter(db.or_(*location_filters))

    if experience_level:
        query = query.filter(Job.experience_level.in_(experience_level))

    if remote:
        query = query.filter(Job.is_remote == True)

    # Exclude specific job ID if provided
    if exclude_id:
        query = query.filter(Job.id != exclude_id)

    # Apply limit if provided
    if limit:
        query = query.limit(limit)

    # Get results
    jobs = query.all()

    # Convert to dict
    jobs_data = [job.to_dict() for job in jobs]

    # If user is logged in, calculate match scores and check saved status
    if 'user_id' in session:
        user_id = session['user_id']
        user = User.query.get(user_id)

        # Get all saved jobs for user for efficient lookup
        saved_job_ids = set()
        saved_jobs = SavedJob.query.filter_by(user_id=user_id).all()
        for saved_job in saved_jobs:
            saved_job_ids.add(saved_job.job_id)

        # Add is_saved flag to all jobs
        for job_data in jobs_data:
            job_data['isSaved'] = job_data['id'] in saved_job_ids

        if user.user_type == 'jobSeeker':
            # Get user's skills
            skills = [skill.name for skill in Skill.query.filter_by(user_id=user_id).all()]

            if skills:  # Only calculate scores if user has skills
                # Get job descriptions
                job_descriptions = [job.description for job in jobs]

                # Calculate match scores for all jobs at once
                match_scores = calculate_seeker_to_jobs_scores(word2vec_model, skills, job_descriptions)

                # Add scores to job data
                for job_data, score in zip(jobs_data, match_scores):
                    job_data['matchScore'] = score

                # Sort by match score (highest first)
                jobs_data.sort(key=lambda x: x.get('matchScore', 0), reverse=True)
            else:
                # If no skills, set all scores to None
                for job_data in jobs_data:
                    job_data['matchScore'] = None
        else:
            # For employers or non-logged in users, set scores to None
            for job_data in jobs_data:
                job_data['matchScore'] = None
    else:
        # For non-logged in users, mark all as not saved
        for job_data in jobs_data:
            job_data['isSaved'] = False

    # Return with jobs wrapper for consistency
    return jsonify({'jobs': jobs_data}), 200

@app.route('/api/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    job = Job.query.get(job_id)
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    # Get employer profile
    employer = User.query.get(job.employer_id)
    employer_profile = Profile.query.filter_by(user_id=job.employer_id).first()
    
    # Add employer info to job data
    job_data = job.to_dict()
    job_data.update({
        'companyLogo': employer_profile.logo_url,
        'companyDescription': employer_profile.company_description,
        'companySize': employer_profile.company_size,
        'companyIndustry': employer_profile.industry,
        'companyWebsite': employer_profile.company_website
    })
    
    # Check if user has saved this job
    is_saved = False
    if 'user_id' in session:
        user_id = session['user_id']
        user = User.query.get(user_id)

        # Check if saved
        saved_job = SavedJob.query.filter_by(user_id=user_id, job_id=job_id).first()
        is_saved = saved_job is not None

        # Calculate match score if job seeker
        if user.user_type == 'jobSeeker' and word2vec_model:
            # Get user's skills
            skills = [skill.name for skill in Skill.query.filter_by(user_id=user_id).all()]

            # Calculate match score
            match_score = calculate_match_score(word2vec_model, skills, job.description)
            job_data['matchScore'] = match_score

    job_data['isSaved'] = is_saved
    return jsonify(job_data), 200

@app.route('/api/jobs/<int:job_id>', methods=['PUT'])
def update_job(job_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    job = Job.query.get(job_id)
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    # Check if user is the employer who posted the job
    if job.employer_id != user_id:
        return jsonify({'error': 'You can only edit your own job postings'}), 403
    
    data = request.json
    
    # Update job fields
    job.title = data.get('title', job.title)
    job.company = data.get('company', job.company)
    job.location = data.get('location', job.location)
    job.type = data.get('type', job.type)
    job.salary = data.get('salary', job.salary)
    job.description = data.get('description', job.description)
    job.requirements = json.dumps(data.get('requirements', json.loads(job.requirements) if job.requirements else []))
    job.responsibilities = json.dumps(data.get('responsibilities', json.loads(job.responsibilities) if job.responsibilities else []))
    job.benefits = json.dumps(data.get('benefits', json.loads(job.benefits) if job.benefits else []))
    job.is_remote = data.get('isRemote', job.is_remote)
    job.experience_level = data.get('experienceLevel', job.experience_level)
    job.application_deadline = datetime.fromisoformat(data['applicationDeadline']) if data.get('applicationDeadline') else job.application_deadline
    job.application_email = data.get('applicationEmail', job.application_email)
    job.application_url = data.get('applicationUrl', job.application_url)
    job.is_active = data.get('isActive', job.is_active)
    job.is_draft = data.get('isDraft', job.is_draft)
    job.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'message': 'Job updated successfully'}), 200

@app.route('/api/jobs/<int:job_id>', methods=['DELETE'])
def delete_job(job_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    job = Job.query.get(job_id)
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    # Check if user is the employer who posted the job
    if job.employer_id != user_id:
        return jsonify({'error': 'You can only delete your own job postings'}), 403
    
    # Delete job applications first
    JobApplication.query.filter_by(job_id=job_id).delete()
    
    # Delete job
    db.session.delete(job)
    db.session.commit()
    
    return jsonify({'message': 'Job deleted successfully'}), 200

@app.route('/api/recommendations/jobs', methods=['GET'])
def get_job_recommendations():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    user = User.query.get(user_id)
    
    # Check if user is a job seeker
    if user.user_type != 'jobSeeker':
        return jsonify({'error': 'Only job seekers can access job recommendations'}), 403
    
    # Get user's skills
    skills = [skill.name for skill in Skill.query.filter_by(user_id=user_id).all()]
    
    if not skills:
        return jsonify({'error': 'Please add skills to your profile to get recommendations'}), 400
    
    # Get all active jobs
    jobs = Job.query.filter_by(is_active=True).all()
    
    if not jobs:
        return jsonify([]), 200
    
    # If Word2Vec model is not loaded
    if not word2vec_model:
        # Fallback to random recommendations
        import random
        recommended_jobs = random.sample(jobs, min(5, len(jobs)))
        job_data = [job.to_dict() for job in recommended_jobs]
        for data in job_data:
            data['matchScore'] = random.randint(70, 95)
        return jsonify(job_data), 200
    
    # Calculate match scores for all jobs
    job_scores = []
    for job in jobs:
        score = calculate_match_score(word2vec_model, skills, job.description)
        job_scores.append((job, score))
    
    # Sort by match score (highest first)
    job_scores.sort(key=lambda x: x[1], reverse=True)
    
    # Get top recommendations (limit to 10)
    top_recommendations = job_scores[:10]
    
    # Prepare response data
    recommendations_data = []
    for job, score in top_recommendations:
        job_data = job.to_dict()
        job_data['matchScore'] = score
        recommendations_data.append(job_data)
    
    return jsonify(recommendations_data), 200

@app.route('/api/recommendations/candidates/<int:job_id>', methods=['GET'])
def get_candidate_recommendations(job_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    # Get the job
    job = Job.query.get(job_id)
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    # Check if user is the employer who posted the job
    if job.employer_id != user_id:
        return jsonify({'error': 'You can only view candidates for your own job postings'}), 403
    
    # Get all job seekers
    job_seekers = User.query.filter_by(user_type='jobSeeker').all()
    
    if not job_seekers:
        return jsonify([]), 200
    
    # If Word2Vec model is not loaded
    if not word2vec_model:
        # Fallback to random recommendations
        import random
        recommended_seekers = random.sample(job_seekers, min(5, len(job_seekers)))
        seeker_data = []
        for seeker in recommended_seekers:
            profile = Profile.query.filter_by(user_id=seeker.id).first()
            seeker_data.append({
                'id': seeker.id,
                'fullName': seeker.full_name,
                'title': profile.title,
                'location': profile.location,
                'skills': [skill.name for skill in Skill.query.filter_by(user_id=seeker.id).all()],
                'matchScore': random.randint(70, 95)
            })
        return jsonify(seeker_data), 200
    
    # Calculate match scores for all job seekers
    seeker_scores = []
    for seeker in job_seekers:
        # Get skills for this seeker
        skills = [skill.name for skill in Skill.query.filter_by(user_id=seeker.id).all()]
        
        if skills:  # Only include seekers with skills
            score = calculate_match_score(word2vec_model, skills, job.description)
            if score > 50:  # Only include seekers with decent match
                seeker_scores.append((seeker, score))
    
    # Sort by match score (highest first)
    seeker_scores.sort(key=lambda x: x[1], reverse=True)
    
    # Get top recommendations (limit to 10)
    top_recommendations = seeker_scores[:10]
    
    # Prepare response data
    recommendations_data = []
    for seeker, score in top_recommendations:
        profile = Profile.query.filter_by(user_id=seeker.id).first()
        recommendations_data.append({
            'id': seeker.id,
            'fullName': seeker.full_name,
            'title': profile.title,
            'location': profile.location,
            'skills': [skill.name for skill in Skill.query.filter_by(user_id=seeker.id).all()],
            'matchScore': score
        })
    
    return jsonify(recommendations_data), 200

@app.route('/api/jobs/<int:job_id>/apply', methods=['POST'])
def apply_for_job(job_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    user = User.query.get(user_id)
    
    # Check if user is a job seeker
    if user.user_type != 'jobSeeker':
        return jsonify({'error': 'Only job seekers can apply for jobs'}), 403
    
    job = Job.query.get(job_id)
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    # Check if user has already applied
    existing_application = JobApplication.query.filter_by(job_id=job_id, applicant_id=user_id).first()
    if existing_application:
        return jsonify({'error': 'You have already applied for this job'}), 400
    
    # Handle resume file
    resume_url = user.profile.resume_url
    resume_file = request.files.get('resume')
    if resume_file:
        filename = secure_filename(f"{uuid.uuid4()}_{resume_file.filename}")
        resume_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        resume_file.save(resume_path)
        resume_url = f"/uploads/{filename}"
    
    # Create application
    new_application = JobApplication(
        job_id=job_id,
        applicant_id=user_id,
        resume_url=resume_url,
        cover_letter=request.form.get('coverLetter', ''),
        status='pending',
        created_at=datetime.utcnow()
    )
    
    db.session.add(new_application)
    db.session.commit()
    
    return jsonify({'message': 'Application submitted successfully'}), 201

@app.route('/api/applications', methods=['GET'])
def get_user_applications():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    user = User.query.get(user_id)
    
    # Check if user is a job seeker
    if user.user_type != 'jobSeeker':
        return jsonify({'error': 'Only job seekers can access this endpoint'}), 403
    
    # Get all applications submitted by the user
    applications = JobApplication.query.filter_by(applicant_id=user_id).all()
    
    # Prepare response data
    applications_data = []
    for application in applications:
        job = Job.query.get(application.job_id)
        employer = User.query.get(job.employer_id)
        
        application_data = application.to_dict()
        application_data.update({
            'jobTitle': job.title,
            'company': job.company or employer.profile.company_name,
            'location': job.location,
            'jobType': job.type
        })
        
        applications_data.append(application_data)
    
    return jsonify(applications_data), 200

@app.route('/api/jobs/<int:job_id>/applications', methods=['GET'])
def get_job_applications(job_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    
    # Get the job
    job = Job.query.get(job_id)
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    # Check if user is the employer who posted the job
    if job.employer_id != user_id:
        return jsonify({'error': 'You can only view applications for your own job postings'}), 403
    
    # Get all applications for this job
    applications = JobApplication.query.filter_by(job_id=job_id).all()

    # Prepare response data
    applications_data = []
    for application in applications:
        applicant = User.query.get(application.applicant_id)

        # Match score: how well this applicant's skills fit the job.
        applicant_skills = [skill.name for skill in Skill.query.filter_by(user_id=applicant.id).all()]
        match_score = calculate_match_score(word2vec_model, applicant_skills, job.description) if applicant_skills else None

        application_data = application.to_dict()
        application_data.update({
            'userId': applicant.id,
            'applicantName': applicant.full_name,
            'applicantEmail': applicant.email,
            'applicantPhone': applicant.profile.phone,
            'matchScore': match_score
        })

        applications_data.append(application_data)

    return jsonify(applications_data), 200

@app.route('/api/users/<int:user_id>/profile', methods=['GET'])
def get_user_profile_public(user_id):
    """Get a user's profile (for employers viewing applicants)"""
    # Check if requester is authenticated and is an employer
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    requester_id = session['user_id']
    requester = User.query.get(requester_id)

    # Only allow employers to view applicant profiles
    if requester.user_type != 'employer':
        return jsonify({'error': 'Only employers can view applicant profiles'}), 403

    # Get the user's profile
    user = User.query.get(user_id)
    if not user or user.user_type != 'jobSeeker':
        return jsonify({'error': 'Job seeker not found'}), 404

    profile = Profile.query.filter_by(user_id=user_id).first()
    skills = Skill.query.filter_by(user_id=user_id).all()
    experiences = Experience.query.filter_by(user_id=user_id).all()
    education = Education.query.filter_by(user_id=user_id).all()

    return jsonify({
        'id': user.id,
        'fullName': user.full_name,
        'email': user.email,
        'title': profile.title if profile else None,
        'phone': profile.phone if profile else None,
        'location': profile.location if profile else None,
        'bio': profile.bio if profile else None,
        'skills': [{'id': skill.id, 'name': skill.name} for skill in skills],
        'experiences': [{
            'id': exp.id,
            'company': exp.company,
            'title': exp.title,
            'location': exp.location,
            'description': exp.description,
            'startDate': exp.start_date.strftime('%Y-%m') if exp.start_date else None,
            'endDate': exp.end_date.strftime('%Y-%m') if exp.end_date else None
        } for exp in experiences],
        'education': [{
            'id': edu.id,
            'degree': edu.degree,
            'institution': edu.institution,
            'location': edu.location,
            'startDate': edu.start_date.strftime('%Y-%m') if edu.start_date else None,
            'endDate': edu.end_date.strftime('%Y-%m') if edu.end_date else None
        } for edu in education]
    }), 200

@app.route('/api/applications/<int:application_id>/status', methods=['PUT'])
def update_application_status(application_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    application = JobApplication.query.get(application_id)
    
    if not application:
        return jsonify({'error': 'Application not found'}), 404
    
    job = Job.query.get(application.job_id)
    if job.employer_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    new_status = data.get('status')
    
    # Update fields
    application.status = new_status
    if 'feedback' in data:
        application.feedback = data.get('feedback')
    if 'interview_notes' in data:
        application.interview_notes = data.get('interview_notes')
    
    application.updated_at = datetime.utcnow()
    
    # --- NOTIFICATION LOGIC START ---
    notif_title = ""
    notif_msg = ""
    
    if new_status == 'interviewed':
        notif_title = f"Interview Scheduled: {job.title}"
        notif_msg = f"Good news! An interview has been scheduled. Details: {application.interview_notes}"
    elif new_status == 'reviewed':
        notif_title = f"Application Reviewed: {job.title}"
        notif_msg = f"Your application for {job.title} has been reviewed by the employer."
    elif new_status == 'rejected':
        notif_title = f"Update on Application: {job.title}"
        notif_msg = f"Status updated to rejected. Feedback: {application.feedback}"
    elif new_status == 'hired':
        notif_title = f"Congratulations! You're Hired for {job.title}"
        notif_msg = f"The employer has updated your status to Hired."

    if notif_title:
        create_notification(
            user_id=application.applicant_id, # Seeker ID
            notification_type="status_update",
            title=notif_title,
            message=notif_msg,
            related_id=job.id
        )
    # --- NOTIFICATION LOGIC END ---

    db.session.commit()
    return jsonify({'message': 'Status updated and notification sent'}), 200

# SavedJob endpoints
@app.route('/api/jobs/<int:job_id>/save', methods=['POST'])
def save_job(job_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    user = User.query.get(user_id)

    # Check if user is a job seeker
    if user.user_type != 'jobSeeker':
        return jsonify({'error': 'Only job seekers can save jobs'}), 403

    # Check if job exists
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404

    # Check if already saved (unique constraint will prevent duplicates)
    existing = SavedJob.query.filter_by(user_id=user_id, job_id=job_id).first()
    if existing:
        return jsonify({'message': 'Job already saved'}), 200

    # Create new saved job record
    saved_job = SavedJob(user_id=user_id, job_id=job_id)
    db.session.add(saved_job)
    db.session.commit()

    return jsonify({'message': 'Job saved successfully', 'savedJob': saved_job.to_dict()}), 201

@app.route('/api/jobs/<int:job_id>/save', methods=['DELETE'])
def unsave_job(job_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']

    # Find and delete the saved job record
    saved_job = SavedJob.query.filter_by(user_id=user_id, job_id=job_id).first()

    if not saved_job:
        return jsonify({'error': 'Saved job not found'}), 404

    db.session.delete(saved_job)
    db.session.commit()

    return jsonify({'message': 'Job removed from saved'}), 200

@app.route('/api/jobs/saved', methods=['GET'])
def get_saved_jobs():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']

    # Get all saved jobs for the user
    saved_jobs = SavedJob.query.filter_by(user_id=user_id).all()

    # Fetch the actual job details
    jobs_data = []
    for saved_job in saved_jobs:
        job = Job.query.get(saved_job.job_id)
        if job:
            job_dict = job.to_dict()
            job_dict['isSaved'] = True
            jobs_data.append(job_dict)

    return jsonify({'jobs': jobs_data}), 200

# Notification endpoints
@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']

    # Get notifications (latest 50)
    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).limit(50).all()

    notifications_data = [notif.to_dict() for notif in notifications]

    return jsonify(notifications_data), 200

@app.route('/api/notifications/<int:notif_id>/read', methods=['PUT'])
def mark_notification_read(notif_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']

    notification = Notification.query.get(notif_id)

    if not notification:
        return jsonify({'error': 'Notification not found'}), 404

    if notification.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    notification.is_read = True
    db.session.commit()

    return jsonify({'message': 'Notification marked as read'}), 200

@app.route('/api/notifications/read-all', methods=['PUT'])
def mark_all_notifications_read():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']

    # Mark all unread notifications as read
    Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
    db.session.commit()

    return jsonify({'message': 'All notifications marked as read'}), 200

@app.route('/api/notifications/unread-count', methods=['GET'])
def get_unread_notifications_count():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']

    # Count unread notifications
    count = Notification.query.filter_by(user_id=user_id, is_read=False).count()

    return jsonify({'count': count}), 200

# Helper function to create notifications
def create_notification(user_id, notification_type, title, message, related_id=None):
    """Create a notification for a user"""
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        related_id=related_id
    )
    db.session.add(notification)
    db.session.commit()
    return notification

# ===== Open House Event Routes =====

# 2A. Event CRUD (Host Employer)
@app.route('/api/events', methods=['POST'])
def create_event():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    user = User.query.get(user_id)

    if not user or user.user_type != 'employer':
        return jsonify({'error': 'Only employers can create events'}), 403

    data = request.json

    new_event = OpenHouseEvent(
        host_employer_id=user_id,
        title=data.get('title'),
        description=data.get('description'),
        event_type=data.get('eventType'),
        venue_name=data.get('venueName'),
        venue_address=data.get('venueAddress'),
        venue_city=data.get('venueCity'),
        venue_country=data.get('venueCountry'),
        booth_layout=json.dumps(data.get('boothLayout', {})),
        event_start=datetime.fromisoformat(data['eventStart'].replace('Z', '+00:00')) if data.get('eventStart') else None,
        event_end=datetime.fromisoformat(data['eventEnd'].replace('Z', '+00:00')) if data.get('eventEnd') else None,
        registration_deadline=datetime.fromisoformat(data['registrationDeadline'].replace('Z', '+00:00')) if data.get('registrationDeadline') else None,
        status='draft',
        max_attendees=data.get('maxAttendees'),
        max_employers=data.get('maxEmployers')
    )

    db.session.add(new_event)
    db.session.commit()

    return jsonify(new_event.to_dict()), 201

@app.route('/api/events/my', methods=['GET'])
def list_my_events():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    events = OpenHouseEvent.query.filter_by(host_employer_id=user_id).all()

    return jsonify([event.to_dict() for event in events]), 200

@app.route('/api/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    event = OpenHouseEvent.query.get(event_id)

    if not event:
        return jsonify({'error': 'Event not found'}), 404

    return jsonify(event.to_dict()), 200

@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    event = OpenHouseEvent.query.get(event_id)

    if not event:
        return jsonify({'error': 'Event not found'}), 404

    if event.host_employer_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403

    data = request.json

    event.title = data.get('title', event.title)
    event.description = data.get('description', event.description)
    event.event_type = data.get('eventType', event.event_type)
    event.venue_name = data.get('venueName', event.venue_name)
    event.venue_address = data.get('venueAddress', event.venue_address)
    event.venue_city = data.get('venueCity', event.venue_city)
    event.venue_country = data.get('venueCountry', event.venue_country)

    if data.get('boothLayout'):
        event.booth_layout = json.dumps(data['boothLayout'])

    if data.get('eventStart'):
        event.event_start = datetime.fromisoformat(data['eventStart'].replace('Z', '+00:00'))
    if data.get('eventEnd'):
        event.event_end = datetime.fromisoformat(data['eventEnd'].replace('Z', '+00:00'))
    if data.get('registrationDeadline'):
        event.registration_deadline = datetime.fromisoformat(data['registrationDeadline'].replace('Z', '+00:00'))

    event.max_attendees = data.get('maxAttendees', event.max_attendees)
    event.max_employers = data.get('maxEmployers', event.max_employers)
    event.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify(event.to_dict()), 200

@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def cancel_event(event_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    event = OpenHouseEvent.query.get(event_id)

    if not event:
        return jsonify({'error': 'Event not found'}), 404

    if event.host_employer_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403

    event.status = 'cancelled'
    event.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'message': 'Event cancelled'}), 200

@app.route('/api/events/<int:event_id>/publish', methods=['POST'])
def publish_event(event_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    event = OpenHouseEvent.query.get(event_id)

    if not event:
        return jsonify({'error': 'Event not found'}), 404

    if event.host_employer_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403

    if (event.payment_status or 'unpaid') != 'paid':
        return jsonify({
            'error': 'Payment required before publishing this event.',
            'paymentRequired': True
        }), 402

    event.status = 'published'
    event.invite_token = str(uuid.uuid4())
    event.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify(event.to_dict()), 200

# 2B. Employer Invitation & Management (Host)
@app.route('/api/events/<int:event_id>/employers/invite', methods=['POST'])
def invite_employer(event_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    event = OpenHouseEvent.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    if event.host_employer_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403

    if (event.payment_status or 'unpaid') != 'paid':
        return jsonify({'error': 'Complete payment to manage this event.', 'paymentRequired': True}), 402

    data = request.json
    # Efficiency fix: strip whitespace and convert to lowercase
    raw_email = data.get('email', '')
    email = raw_email.strip().lower()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    # Find user by email using case-insensitive search (ilike)
    invited_user = User.query.filter(User.email.ilike(email)).first()

    if not invited_user:
        return jsonify({'error': f'No account found for {raw_email}. Please ensure the employer has registered on IntelliHire first.'}), 404

    if invited_user.user_type != 'employer':
        return jsonify({'error': 'This user is registered as a Job Seeker. You can only invite Employer accounts.'}), 400

    # Check if already invited
    existing = EventEmployer.query.filter_by(event_id=event_id, employer_id=invited_user.id).first()
    if existing:
        return jsonify({'error': 'Employer already invited'}), 409

    event_employer = EventEmployer(
        event_id=event_id,
        employer_id=invited_user.id,
        invited_by_email=email,
        status='invited'
    )

    db.session.add(event_employer)
    db.session.commit()

    # Create notification
    create_notification(
        invited_user.id,
        'event_invite',
        f'You are invited to {event.title}',
        f'You have been invited to participate in {event.title}',
        event_id
    )

    return jsonify(event_employer.to_dict()), 201

@app.route('/api/events/<int:event_id>/employers', methods=['GET'])
def list_event_employers(event_id):
    event = OpenHouseEvent.query.get(event_id)

    if not event:
        return jsonify({'error': 'Event not found'}), 404

    employers = EventEmployer.query.filter_by(event_id=event_id).all()

    return jsonify([employer.to_dict() for employer in employers]), 200

@app.route('/api/events/<int:event_id>/employers/<int:ee_id>/status', methods=['PUT'])
def update_employer_status(event_id, ee_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    event = OpenHouseEvent.query.get(event_id)

    if not event:
        return jsonify({'error': 'Event not found'}), 404

    if event.host_employer_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403

    event_employer = EventEmployer.query.get(ee_id)

    if not event_employer or event_employer.event_id != event_id:
        return jsonify({'error': 'Event employer not found'}), 404

    data = request.json
    old_status = event_employer.status
    event_employer.status = data.get('status')
    event_employer.updated_at = datetime.utcnow()
    db.session.commit()

    # Notify employer of status change
    create_notification(
        event_employer.employer_id,
        'event_response',
        f'Status update for {event.title}',
        f'Your status for {event.title} has been updated to {data.get("status")}',
        event_id
    )

    return jsonify(event_employer.to_dict()), 200

@app.route('/api/events/<int:event_id>/employers/<int:ee_id>', methods=['DELETE'])
def remove_employer(event_id, ee_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    event = OpenHouseEvent.query.get(event_id)

    if not event:
        return jsonify({'error': 'Event not found'}), 404

    if event.host_employer_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403

    event_employer = EventEmployer.query.get(ee_id)

    if not event_employer or event_employer.event_id != event_id:
        return jsonify({'error': 'Event employer not found'}), 404

    # Nullify booth assignment
    booth = EventBooth.query.filter_by(event_employer_id=ee_id).first()
    if booth:
        booth.event_employer_id = None
        db.session.commit()

    db.session.delete(event_employer)
    db.session.commit()

    return jsonify({'message': 'Employer removed'}), 200

# 2C. Event Invitations (Unified for Employers & Seekers)
@app.route('/api/events/invitations', methods=['GET'])
def list_invitations():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    user = User.query.get(user_id)
    
    result = []
    
    if user.user_type == 'employer':
        # Get employer invitations
        invitations = EventEmployer.query.filter_by(employer_id=user_id, status='invited').all()
        for inv in invitations:
            inv_dict = inv.to_dict()
            inv_dict['event'] = inv.event.to_dict()
            result.append(inv_dict)
    else:
        # Get seeker invitations
        invitations = EventAttendee.query.filter_by(seeker_id=user_id, status='invited').all()
        for inv in invitations:
            inv_dict = inv.to_dict()
            inv_dict['event'] = inv.event.to_dict()
            # Add host info for better UI
            host = User.query.get(inv.event.host_employer_id)
            inv_dict['hostName'] = host.full_name if host else 'System'
            result.append(inv_dict)

    return jsonify(result), 200

@app.route('/api/events/<int:event_id>/employers/accept', methods=['POST'])
def accept_invitation(event_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    event_employer = EventEmployer.query.filter_by(
        event_id=event_id,
        employer_id=user_id
    ).first()

    if not event_employer:
        return jsonify({'error': 'Invitation not found'}), 404

    event_employer.status = 'accepted'
    event_employer.responded_at = datetime.utcnow()
    event_employer.updated_at = datetime.utcnow()
    db.session.commit()

    # Notify host
    event = OpenHouseEvent.query.get(event_id)
    create_notification(
        event.host_employer_id,
        'event_response',
        f'Employer accepted {event.title}',
        f'An employer has accepted your invitation to {event.title}',
        event_id
    )

    return jsonify(event_employer.to_dict()), 200

@app.route('/api/events/<int:event_id>/employers/decline', methods=['POST'])
def decline_invitation(event_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    event_employer = EventEmployer.query.filter_by(
        event_id=event_id,
        employer_id=user_id
    ).first()

    if not event_employer:
        return jsonify({'error': 'Invitation not found'}), 404

    event_employer.status = 'rejected'
    event_employer.responded_at = datetime.utcnow()
    event_employer.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify(event_employer.to_dict()), 200

@app.route('/api/events/<int:event_id>/my-profile', methods=['GET'])
def get_employer_event_profile(event_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    event_employer = EventEmployer.query.filter_by(
        event_id=event_id,
        employer_id=user_id
    ).first()

    if not event_employer:
        return jsonify({'error': 'Not an event employer'}), 404

    return jsonify(event_employer.to_dict()), 200

@app.route('/api/events/<int:event_id>/my-profile', methods=['PUT'])
def update_employer_event_profile(event_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    event_employer = EventEmployer.query.filter_by(
        event_id=event_id,
        employer_id=user_id
    ).first()

    if not event_employer:
        return jsonify({'error': 'Not an event employer'}), 404

    data = request.json

    event_employer.event_company_tagline = data.get('eventCompanyTagline', event_employer.event_company_tagline)
    event_employer.event_company_culture = data.get('eventCompanyCulture', event_employer.event_company_culture)
    event_employer.event_openings_context = data.get('eventOpeningsContext', event_employer.event_openings_context)
    event_employer.event_contact_name = data.get('eventContactName', event_employer.event_contact_name)
    event_employer.event_contact_email = data.get('eventContactEmail', event_employer.event_contact_email)
    event_employer.event_contact_phone = data.get('eventContactPhone', event_employer.event_contact_phone)
    event_employer.profile_completed = True
    event_employer.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify(event_employer.to_dict()), 200

# 2D. Booth Management (Host)
@app.route('/api/events/<int:event_id>/booths/generate', methods=['POST'])
def generate_booths(event_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    event = OpenHouseEvent.query.get(event_id)

    if not event:
        return jsonify({'error': 'Event not found'}), 404

    if event.host_employer_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403

    if (event.payment_status or 'unpaid') != 'paid':
        return jsonify({'error': 'Complete payment to manage this event.', 'paymentRequired': True}), 402

    # Delete existing booths
    EventBooth.query.filter_by(event_id=event_id).delete()

    # Parse booth layout
    layout = json.loads(event.booth_layout) if event.booth_layout else {}
    rows = layout.get('rows', ['A', 'B', 'C'])
    booths_per_row = layout.get('booths_per_row', 3)

    # Create new booths
    for row in rows:
        for booth_num in range(1, booths_per_row + 1):
            booth = EventBooth(
                event_id=event_id,
                row_label=row,
                booth_number=booth_num
            )
            db.session.add(booth)

    db.session.commit()

    return jsonify({'message': 'Booths generated successfully'}), 200

@app.route('/api/events/<int:event_id>/booths', methods=['GET'])
def list_booths(event_id):
    event = OpenHouseEvent.query.get(event_id)

    if not event:
        return jsonify({'error': 'Event not found'}), 404

    booths = EventBooth.query.filter_by(event_id=event_id).all()

    result = []
    for booth in booths:
        booth_dict = booth.to_dict()

        if booth.event_employer_id:
            employer = EventEmployer.query.get(booth.event_employer_id)
            user = User.query.get(employer.employer_id)
            profile = Profile.query.filter_by(user_id=employer.employer_id).first()

            booth_dict['employer'] = {
                'id': user.id,
                'name': user.full_name,
                'email': user.email,
                'company': profile.company_name if profile else None,
                'industry': profile.industry if profile else None,
                'logo': profile.logo_url if profile else None
            }

        result.append(booth_dict)

    return jsonify(result), 200

@app.route('/api/events/<int:event_id>/booths/<int:booth_id>/assign', methods=['PUT'])
def assign_booth(event_id, booth_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    event = OpenHouseEvent.query.get(event_id)

    if not event:
        return jsonify({'error': 'Event not found'}), 404

    if event.host_employer_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403

    booth = EventBooth.query.get(booth_id)

    if not booth or booth.event_id != event_id:
        return jsonify({'error': 'Booth not found'}), 404

    data = request.json
    booth.event_employer_id = data.get('eventEmployerId')
    booth.notes = data.get('notes', booth.notes)
    db.session.commit()

    return jsonify(booth.to_dict()), 200

# 2E. Event Job Management (Invited Employer)
@app.route('/api/events/<int:event_id>/jobs', methods=['POST'])
def create_event_job(event_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    event_employer = EventEmployer.query.filter_by(
        event_id=event_id,
        employer_id=user_id,
        status='accepted'
    ).first()

    if not event_employer:
        return jsonify({'error': 'Not an accepted employer for this event'}), 403

    data = request.json

    event_job = EventJob(
        event_id=event_id,
        event_employer_id=event_employer.id,
        linked_job_id=data.get('linkedJobId'),
        title=data.get('title'),
        description=data.get('description'),
        job_type=data.get('jobType'),
        salary=data.get('salary'),
        experience_level=data.get('experienceLevel'),
        industry=data.get('industry'),
        location=data.get('location'),
        requirements=json.dumps(data.get('requirements', [])),
        is_active=True
    )

    db.session.add(event_job)
    db.session.commit()

    return jsonify(event_job.to_dict()), 201

@app.route('/api/events/<int:event_id>/jobs', methods=['GET'])
def list_event_jobs(event_id):
    event = OpenHouseEvent.query.get(event_id)

    if not event:
        return jsonify({'error': 'Event not found'}), 404

    # Get query parameters for filtering
    job_type = request.args.get('jobType')
    industry = request.args.get('industry')
    search = request.args.get('search', '').lower()

    query = EventJob.query.filter_by(event_id=event_id, is_active=True)

    if job_type:
        query = query.filter_by(job_type=job_type)
    if industry:
        query = query.filter_by(industry=industry)

    jobs = query.all()

    # Apply search filter
    if search:
        jobs = [j for j in jobs if search in j.title.lower() or search in (j.description or '').lower()]

    return jsonify([job.to_dict() for job in jobs]), 200

@app.route('/api/events/<int:event_id>/my-jobs', methods=['GET'])
def list_my_event_jobs(event_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    event_employer = EventEmployer.query.filter_by(
        event_id=event_id,
        employer_id=user_id
    ).first()

    if not event_employer:
        return jsonify({'error': 'Not an event employer'}), 404

    jobs = EventJob.query.filter_by(event_employer_id=event_employer.id).all()

    return jsonify([job.to_dict() for job in jobs]), 200

@app.route('/api/events/<int:event_id>/jobs/<int:ejob_id>', methods=['PUT'])
def update_event_job(event_id, ejob_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    event_job = EventJob.query.get(ejob_id)

    if not event_job or event_job.event_id != event_id:
        return jsonify({'error': 'Job not found'}), 404

    if event_job.event_employer.employer_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403

    data = request.json

    event_job.title = data.get('title', event_job.title)
    event_job.description = data.get('description', event_job.description)
    event_job.job_type = data.get('jobType', event_job.job_type)
    event_job.salary = data.get('salary', event_job.salary)
    event_job.experience_level = data.get('experienceLevel', event_job.experience_level)
    event_job.industry = data.get('industry', event_job.industry)
    event_job.location = data.get('location', event_job.location)

    if data.get('requirements'):
        event_job.requirements = json.dumps(data['requirements'])

    event_job.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify(event_job.to_dict()), 200

@app.route('/api/events/<int:event_id>/jobs/<int:ejob_id>', methods=['DELETE'])
def delete_event_job(event_id, ejob_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    event_job = EventJob.query.get(ejob_id)

    if not event_job or event_job.event_id != event_id:
        return jsonify({'error': 'Job not found'}), 404

    if event_job.event_employer.employer_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403

    db.session.delete(event_job)
    db.session.commit()

    return jsonify({'message': 'Job deleted'}), 200

# 2F. Seeker Registration (NOTE: GET /join/<token> has NO auth guard)
@app.route('/api/events/join/<token>', methods=['GET'])
def get_event_by_token(token):
    """PUBLIC endpoint - no session check"""
    event = OpenHouseEvent.query.filter_by(invite_token=token).first()

    if not event:
        return jsonify({'error': 'Invalid or expired invite link'}), 404

    return jsonify(event.to_dict()), 200

@app.route('/api/events/join/<token>/request', methods=['POST'])
def request_event_attendance(token):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    user = User.query.get(user_id)

    if not user or user.user_type != 'jobSeeker':
        return jsonify({'error': 'Only job seekers can request attendance'}), 403

    event = OpenHouseEvent.query.filter_by(invite_token=token).first()

    if not event:
        return jsonify({'error': 'Invalid or expired invite link'}), 404

    # Check if already requested or approved
    existing = EventAttendee.query.filter_by(event_id=event.id, seeker_id=user_id).first()
    if existing:
        return jsonify({'error': 'Already registered for this event'}), 409

    attendee = EventAttendee(
        event_id=event.id,
        seeker_id=user_id,
        status='requested',
        join_token_used=True
    )

    db.session.add(attendee)
    db.session.commit()

    # Notify event host
    create_notification(
        event.host_employer_id,
        'event_request',
        f'New registration request for {event.title}',
        f'{user.full_name} has requested to attend {event.title}',
        event.id
    )

    return jsonify(attendee.to_dict()), 201

@app.route('/api/events/<int:event_id>/my-attendance', methods=['GET'])
def get_my_attendance(event_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    attendee = EventAttendee.query.filter_by(event_id=event_id, seeker_id=user_id).first()

    if not attendee:
        return jsonify({'error': 'Not registered for this event'}), 404

    return jsonify(attendee.to_dict()), 200

# 2G. Attendee Management (Host)
@app.route('/api/events/<int:event_id>/attendees', methods=['GET'])
def list_event_attendees(event_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    event = OpenHouseEvent.query.get(event_id)

    if not event:
        return jsonify({'error': 'Event not found'}), 404

    if event.host_employer_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403

    status_filter = request.args.get('status')

    query = EventAttendee.query.filter_by(event_id=event_id)
    if status_filter:
        query = query.filter_by(status=status_filter)

    attendees = query.all()

    result = []
    for attendee in attendees:
        attendee_dict = attendee.to_dict()
        user = User.query.get(attendee.seeker_id)
        attendee_dict['seekerName'] = user.full_name
        attendee_dict['seekerEmail'] = user.email
        result.append(attendee_dict)

    return jsonify(result), 200

@app.route('/api/events/<int:event_id>/attendees/invite', methods=['POST'])
def invite_attendee(event_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    event = OpenHouseEvent.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    if event.host_employer_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403

    if (event.payment_status or 'unpaid') != 'paid':
        return jsonify({'error': 'Complete payment to manage this event.', 'paymentRequired': True}), 402

    data = request.json
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    invited_user = User.query.filter(User.email.ilike(email)).first()

    if not invited_user:
        return jsonify({'error': f'No job seeker found for {email}. Please ensure they are registered first.'}), 404

    if invited_user.user_type != 'jobSeeker':
        return jsonify({'error': 'You can only invite Job Seekers using this form. Use the Employers tab to invite other companies.'}), 400

    # Check if already invited or attending
    existing = EventAttendee.query.filter_by(event_id=event_id, seeker_id=invited_user.id).first()
    if existing:
        return jsonify({'error': 'This user is already invited or has requested attendance.'}), 409

    attendee = EventAttendee(
        event_id=event_id,
        seeker_id=invited_user.id,
        status='invited'
    )

    db.session.add(attendee)
    db.session.commit()

    # Create notification
    create_notification(
        invited_user.id,
        'event_invite',
        f'You are invited to join {event.title}',
        f'The host of {event.title} has sent you a direct invitation to attend.',
        event_id
    )

    return jsonify(attendee.to_dict()), 201

@app.route('/api/events/<int:event_id>/attendees/accept', methods=['POST'])
def accept_attendee_invitation(event_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    attendee = EventAttendee.query.filter_by(
        event_id=event_id,
        seeker_id=user_id,
        status='invited'
    ).first()

    if not attendee:
        return jsonify({'error': 'Invitation not found'}), 404

    attendee.status = 'approved'
    attendee.reviewed_at = datetime.utcnow()
    db.session.commit()

    # Notify host
    event = OpenHouseEvent.query.get(event_id)
    create_notification(
        event.host_employer_id,
        'event_response',
        f'Invitation accepted for {event.title}',
        f'A job seeker has accepted your invitation to {event.title}',
        event_id
    )

    return jsonify(attendee.to_dict()), 200

@app.route('/api/events/<int:event_id>/attendees/decline', methods=['POST'])
def decline_attendee_invitation(event_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    attendee = EventAttendee.query.filter_by(
        event_id=event_id,
        seeker_id=user_id,
        status='invited'
    ).first()

    if not attendee:
        return jsonify({'error': 'Invitation not found'}), 404

    attendee.status = 'rejected'
    attendee.reviewed_at = datetime.utcnow()
    db.session.commit()

    return jsonify(attendee.to_dict()), 200

@app.route('/api/events/<int:event_id>/attendees/<int:attendee_id>/status', methods=['PUT'])
def update_attendee_status(event_id, attendee_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    event = OpenHouseEvent.query.get(event_id)

    if not event:
        return jsonify({'error': 'Event not found'}), 404

    if event.host_employer_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403

    attendee = EventAttendee.query.get(attendee_id)

    if not attendee or attendee.event_id != event_id:
        return jsonify({'error': 'Attendee not found'}), 404

    data = request.json

    attendee.status = data.get('status')
    attendee.review_note = data.get('reviewNote')
    attendee.reviewed_at = datetime.utcnow()
    attendee.updated_at = datetime.utcnow()
    db.session.commit()

    # Notify seeker
    notification_title = f'Your request for {event.title}'
    if data.get('status') == 'approved':
        notification_title = f'Approved for {event.title}'
    elif data.get('status') == 'rejected':
        notification_title = f'Not approved for {event.title}'

    create_notification(
        attendee.seeker_id,
        'event_status_update',
        notification_title,
        f'Your attendance request for {event.title} has been {data.get("status")}. {data.get("reviewNote", "")}',
        event_id
    )

    return jsonify(attendee.to_dict()), 200

# 2H. Event Applications
@app.route('/api/events/<int:event_id>/jobs/<int:ejob_id>/apply', methods=['POST'])
def apply_to_event_job(event_id, ejob_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']

    # Verify attendee is approved
    attendee = EventAttendee.query.filter_by(event_id=event_id, seeker_id=user_id).first()

    if not attendee or attendee.status != 'approved':
        return jsonify({'error': 'Not approved to attend this event'}), 403

    event_job = EventJob.query.get(ejob_id)

    if not event_job or event_job.event_id != event_id:
        return jsonify({'error': 'Job not found'}), 404

    # Check if already applied
    existing = EventApplication.query.filter_by(
        event_job_id=ejob_id,
        event_attendee_id=attendee.id
    ).first()

    if existing:
        return jsonify({'error': 'Already applied to this job'}), 409

    resume_url = None

    # Handle file upload if present
    if 'resume' in request.files:
        file = request.files['resume']
        if file:
            filename = secure_filename(file.filename)
            timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
            filename = f"{timestamp}_{filename}"
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            resume_url = f"/uploads/{filename}"

    cover_letter = request.form.get('coverLetter', '')

    application = EventApplication(
        event_id=event_id,
        event_job_id=ejob_id,
        event_attendee_id=attendee.id,
        resume_url=resume_url,
        cover_letter=cover_letter,
        status='pending'
    )

    db.session.add(application)
    db.session.commit()

    # Notify job employer
    user = User.query.get(user_id)
    create_notification(
        event_job.event_employer.employer_id,
        'event_application',
        f'New application for {event_job.title}',
        f'{user.full_name} has applied for {event_job.title}',
        ejob_id
    )

    return jsonify(application.to_dict()), 201

@app.route('/api/events/<int:event_id>/my-applications', methods=['GET'])
def list_my_event_applications(event_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    attendee = EventAttendee.query.filter_by(event_id=event_id, seeker_id=user_id).first()

    if not attendee:
        return jsonify({'error': 'Not registered for this event'}), 404

    applications = EventApplication.query.filter_by(event_attendee_id=attendee.id).all()

    result = []
    for app in applications:
        app_dict = app.to_dict()
        app_dict['job'] = app.job.to_dict()
        result.append(app_dict)

    return jsonify(result), 200

@app.route('/api/events/<int:event_id>/jobs/<int:ejob_id>/applications', methods=['GET'])
def list_job_applications(event_id, ejob_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    event_job = EventJob.query.get(ejob_id)

    if not event_job or event_job.event_id != event_id:
        return jsonify({'error': 'Job not found'}), 404

    if event_job.event_employer.employer_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403

    applications = EventApplication.query.filter_by(event_job_id=ejob_id).all()

    result = []
    for app in applications:
        app_dict = app.to_dict()
        seeker = User.query.get(app.attendee.seeker_id)
        app_dict['seekerName'] = seeker.full_name
        app_dict['seekerEmail'] = seeker.email
        result.append(app_dict)

    return jsonify(result), 200

@app.route('/api/events/<int:event_id>/applications/<int:app_id>/status', methods=['PUT'])
def update_event_application_status(event_id, app_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    application = EventApplication.query.get(app_id)

    if not application or application.event_id != event_id:
        return jsonify({'error': 'Application not found'}), 404

    if application.job.event_employer.employer_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403

    data = request.json

    application.status = data.get('status')
    application.feedback = data.get('feedback')
    application.updated_at = datetime.utcnow()
    db.session.commit()

    # Notify seeker
    seeker_id = application.attendee.seeker_id
    create_notification(
        seeker_id,
        'event_application_update',
        f'Application status update',
        f'Your application for {application.job.title} has been {data.get("status")}. {data.get("feedback", "")}',
        app_id
    )

    return jsonify(application.to_dict()), 200

@app.route('/api/resumes/analyze', methods=['POST'])
def analyze_resumes():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    user = User.query.get(user_id)

    # Only employers can analyze resumes
    if user.user_type != 'employer':
        return jsonify({'error': 'Only employers can analyze resumes'}), 403

    # Get job description
    job_description = request.form.get('jobDescription', '')
    if not job_description:
        return jsonify({'error': 'Job description is required'}), 400

    # Get uploaded files
    uploaded_files = request.files.getlist('resumes')
    if not uploaded_files:
        return jsonify({'error': 'No resumes uploaded'}), 400

    # Import the improved matching function
    from utils.matching import calculate_resume_to_job_match

    # Extract text from resumes and analyze
    results = []

    for file in uploaded_files:
        try:
            # Extract text from resume
            resume_text = ""

            if file.filename.endswith('.pdf'):
                if PdfReader:
                    try:
                        pdf_reader = PdfReader(file.stream)
                        for page in pdf_reader.pages:
                            resume_text += page.extract_text() + " "
                    except:
                        resume_text = file.read().decode('utf-8', errors='ignore')
                else:
                    resume_text = file.read().decode('utf-8', errors='ignore')
            else:
                # For .doc, .docx, .txt files
                resume_text = file.read().decode('utf-8', errors='ignore')

            if not resume_text.strip():
                continue

            # Calculate match score using improved algorithm
            match_result = calculate_resume_to_job_match(resume_text, job_description)
            match_score = match_result['matchScore']
            matched_skills = match_result['matchedSkills']
            breakdown = match_result['breakdown']

            results.append({
                'id': hash(file.filename) % 10000,
                'fileName': file.filename,
                'matchScore': match_score,
                'extractedText': resume_text[:500],  # First 500 chars
                'matchedKeywords': matched_skills,  # Now contains actual technical skills
                'breakdown': breakdown,
                'resumeSkillCount': match_result['resumeSkillCount'],
                'jobSkillCount': match_result['jobSkillCount'],
                'matchedSkillCount': match_result['matchedSkillCount'],
            })

        except Exception as e:
            print(f"Error processing resume {file.filename}: {str(e)}")
            continue

    # Sort by match score
    results.sort(key=lambda x: x['matchScore'], reverse=True)

    return jsonify({
        'results': results,
        'totalResumes': len(results),
        'message': f'Analyzed {len(results)} resumes'
    }), 200

@app.route('/uploads/<path:filename>')
def download_file(filename):
    """Serve uploaded files directly to the browser (for images)"""
    try:
        # We set as_attachment=False so the browser displays the image
        return send_from_directory(
            app.config['UPLOAD_FOLDER'],
            filename,
            as_attachment=False
        )
    except Exception as e:
        return jsonify({'error': 'File not found'}), 404

# ===== AI Content Generation Routes =====

@app.route('/api/ai/generate-job-content', methods=['POST'])
def generate_job_content():
    """Generate AI-assisted job content using OpenRouter API"""
    try:
        # Check if user is authenticated
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized'}), 401

        # Check if OpenRouter API key is configured
        openrouter_api_key = os.environ.get('OPENROUTER_API_KEY')
        if not openrouter_api_key:
            return jsonify({'error': 'AI service not configured. Please add OPENROUTER_API_KEY to environment variables.'}), 500

        data = request.json
        job_title = data.get('jobTitle', '')
        job_type = data.get('jobType', 'Full-time')
        experience_level = data.get('experienceLevel', 'Mid-level')
        field = data.get('field', 'description')  # 'description', 'requirements', 'skills'

        if not job_title:
            return jsonify({'error': 'Job title is required'}), 400

        # Generate content based on field type
        if field == 'description':
            content = call_openrouter_ai(
                prompt=get_description_prompt(job_title, job_type, experience_level),
                api_key=openrouter_api_key
            )
            return jsonify({'content': content}), 200
        elif field == 'requirements':
            response = call_openrouter_ai(
                prompt=get_requirements_prompt(job_title, experience_level),
                api_key=openrouter_api_key
            )
            items = parse_list_response(response)
            return jsonify({'items': items}), 200
        elif field == 'skills':
            response = call_openrouter_ai(
                prompt=get_skills_prompt(job_title, experience_level),
                api_key=openrouter_api_key
            )
            items = parse_list_response(response)
            return jsonify({'items': items}), 200
        else:
            return jsonify({'error': 'Invalid field type'}), 400

    except Exception as e:
        print(f"Error generating content: {str(e)}")
        return jsonify({'error': f'Failed to generate content: {str(e)}'}), 500
    
@app.route('/api/chat/generate-cv-pdf', methods=['POST'])
def generate_cv_pdf():
    try:
        if FPDF is None:
            return jsonify({'error': 'PDF generation is unavailable. Install fpdf2 (pip install -r requirements.txt).'}), 503

        data = request.json
        content = data.get('content', '')

        if not content:
            return jsonify({'error': 'Empty content'}), 400

        # EFFICIENT CLEANING: Map common AI symbols to PDF-safe characters
        replacements = {
            '\u2022': '-', '\u2023': '-', '\u2014': '-', '\u2013': '-',
            '\u201c': '"', '\u201d': '"', '\u2018': "'", '\u2019': "'",
            '\u2605': '*', '\u2713': 'ok'
        }
        for char, replacement in replacements.items():
            content = content.replace(char, replacement)
        
        # Strip remaining non-latin1 characters to prevent 500 error
        content = content.encode('ascii', 'ignore').decode('ascii')

        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)
        
        # Header
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(0, 10, "CURRICULUM VITAE", ln=True, align='C')
        pdf.ln(10)
        
        # Content
        pdf.set_font("Arial", size=11)
        pdf.multi_cell(0, 7, content)

        # Generate response. fpdf2's output() returns a bytearray; wrap in bytes()
        # so Werkzeug sends the binary body instead of iterating it into an empty response.
        response = make_response(bytes(pdf.output()))
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = 'attachment; filename=cv.pdf'
        return response

    except Exception as e:
        print(f"CRITICAL PDF ERROR: {str(e)}")
        return jsonify({'error': 'PDF Generation Failed'}), 500

def call_openrouter_ai(prompt, api_key):
    """Call OpenRouter API to generate content using Claude"""
    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': os.environ.get('FRONTEND_URL', 'http://localhost:5174'),
            'X-Title': 'CareerConnect - Job Posting Assistant'
        }

        payload = {
            'model': 'claude-3-haiku',  # Using Claude Haiku via OpenRouter (cheaper)
            'messages': [
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            'temperature': 0.7,
            'max_tokens': 800
        }

        print(f"[AI] Calling OpenRouter API with model: claude-3-haiku")
        print(f"[AI] API Key present: {bool(api_key and len(api_key) > 0)}")

        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=30
        )

        print(f"[AI] Response Status: {response.status_code}")

        if response.status_code != 200:
            error_data = response.json()
            print(f"[AI] Error Response: {error_data}")
            error_msg = error_data.get('error', {})
            if isinstance(error_msg, dict):
                error_msg = error_msg.get('message', str(error_msg))
            raise Exception(f"OpenRouter API error ({response.status_code}): {error_msg}")

        result = response.json()
        print(f"[AI] Success! Generated content length: {len(result.get('choices', [{}])[0].get('message', {}).get('content', ''))}")
        content = result['choices'][0]['message']['content']
        return content.strip()

    except requests.exceptions.Timeout:
        print(f"[AI] Timeout error")
        raise Exception('AI request timed out. Please try again.')
    except requests.exceptions.RequestException as e:
        print(f"[AI] Request exception: {str(e)}")
        raise Exception(f'Failed to connect to AI service: {str(e)}')
    except Exception as e:
        print(f"[AI] Exception: {str(e)}")
        raise Exception(f'Error calling AI: {str(e)}')


def parse_list_response(response):
    """Parse AI response into a list of items"""
    lines = response.strip().split('\n')
    items = []
    for line in lines:
        line = line.strip()
        # Remove numbering, bullets, dashes
        if line:
            line = line.lstrip('0123456789.-•*) ')
            line = line.strip()
            if line:
                items.append(line)
    return items[:10]  # Return max 10 items


def get_description_prompt(job_title, job_type, experience_level):
    """Generate prompt for job description"""
    return f"""Write a professional and compelling job description for the following position:

Job Title: {job_title}
Employment Type: {job_type}
Experience Level: {experience_level}

Please write a 4-5 sentence job description that:
1. Starts with an engaging introduction
2. Describes the role responsibilities and what the candidate will work on


Make it specific and appealing to potential candidates."""


def get_requirements_prompt(job_title, experience_level):
    """Generate prompt for job requirements"""
    return f"""Generate a list of 8-10 key job requirements for a {job_title} position at {experience_level} level.

Requirements should include:
- Technical skills specific to the role
- Experience level expectations
- Professional qualities
- Any certifications if relevant

Format: Return each requirement as a simple line item without numbering or bullets. One requirement per line."""


def get_skills_prompt(job_title, experience_level):
    """Generate prompt for required skills"""
    return f"""Generate a list of 8-12 essential technical and soft skills for a {job_title} position at {experience_level} level.

Include:
- Programming languages/frameworks relevant to {job_title}
- Tools and technologies
- Soft skills
- Industry-specific skills

Format: Return each skill as a simple line item without numbering or bullets. One skill per line."""


# Register chat blueprint
from routes.chat_routes import chat_bp
app.register_blueprint(chat_bp)

# Register payment blueprint (Stripe - paid Open House Events)
from routes.payment_routes import payment_bp
app.register_blueprint(payment_bp)

if __name__ == '__main__':
    app.run(debug=True)

