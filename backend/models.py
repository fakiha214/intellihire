from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model):
  __tablename__ = 'users'
  
  id = db.Column(db.Integer, primary_key=True)
  email = db.Column(db.String(255), unique=True, nullable=False)
  password = db.Column(db.String(255), nullable=False)
  full_name = db.Column(db.String(255), nullable=False)
  user_type = db.Column(db.String(50), nullable=False)  # 'jobSeeker' or 'employer'
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
  
  # Relationships
  profile = db.relationship('Profile', backref='user', uselist=False)
  skills = db.relationship('Skill', backref='user')
  job_preferences = db.relationship('JobPreference', backref='user', uselist=False)
  experiences = db.relationship('Experience', backref='user')
  education = db.relationship('Education', backref='user')
  jobs = db.relationship('Job', backref='employer')
  applications = db.relationship('JobApplication', backref='applicant')

class Profile(db.Model):
  __tablename__ = 'profiles'
  
  id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
  
  # Job seeker fields
  title = db.Column(db.String(255))
  bio = db.Column(db.Text)
  phone = db.Column(db.String(20))
  location = db.Column(db.String(255))
  resume_url = db.Column(db.String(255))
  
  # Employer fields
  company_name = db.Column(db.String(255))
  industry = db.Column(db.String(255))
  company_size = db.Column(db.String(255))
  founded_year = db.Column(db.String(4))
  company_website = db.Column(db.String(255))
  company_location = db.Column(db.String(255))
  company_description = db.Column(db.Text)
  logo_url = db.Column(db.String(255))
  contact_name = db.Column(db.String(255))
  contact_title = db.Column(db.String(255))
  contact_email = db.Column(db.String(255))
  contact_phone = db.Column(db.String(20))
  linkedin_url = db.Column(db.String(255))
  twitter_url = db.Column(db.String(255))
  facebook_url = db.Column(db.String(255))
  
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

class Skill(db.Model):
  __tablename__ = 'skills'
  
  id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
  name = db.Column(db.String(100), nullable=False)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)

class JobPreference(db.Model):
  __tablename__ = 'job_preferences'
  
  id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
  job_types = db.Column(db.Text)  # JSON string array
  locations = db.Column(db.Text)  # JSON string array
  industries = db.Column(db.Text)  # JSON string array
  min_salary = db.Column(db.String(50))
  availability = db.Column(db.String(50))
  remote_preference = db.Column(db.String(50))
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

class Experience(db.Model):
  __tablename__ = 'experiences'
  
  id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
  title = db.Column(db.String(255), nullable=False)
  company = db.Column(db.String(255), nullable=False)
  location = db.Column(db.String(255))
  start_date = db.Column(db.DateTime)
  end_date = db.Column(db.DateTime)
  current = db.Column(db.Boolean, default=False)
  description = db.Column(db.Text)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

class Education(db.Model):
  __tablename__ = 'education'
  
  id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
  degree = db.Column(db.String(255), nullable=False)
  institution = db.Column(db.String(255), nullable=False)
  location = db.Column(db.String(255))
  start_date = db.Column(db.DateTime)
  end_date = db.Column(db.DateTime)
  current = db.Column(db.Boolean, default=False)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

class Job(db.Model):
  __tablename__ = 'jobs'
  
  id = db.Column(db.Integer, primary_key=True)
  employer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
  title = db.Column(db.String(255), nullable=False)
  company = db.Column(db.String(255))
  location = db.Column(db.String(255))
  type = db.Column(db.String(50))  # Full-time, Part-time, etc.
  salary = db.Column(db.String(100))
  description = db.Column(db.Text, nullable=False)
  requirements = db.Column(db.Text)  # JSON string array
  responsibilities = db.Column(db.Text)  # JSON string array
  benefits = db.Column(db.Text)  # JSON string array
  is_remote = db.Column(db.Boolean, default=False)
  experience_level = db.Column(db.String(50))
  application_deadline = db.Column(db.DateTime)
  application_email = db.Column(db.String(255))
  application_url = db.Column(db.String(255))
  is_active = db.Column(db.Boolean, default=True)
  is_draft = db.Column(db.Boolean, default=False)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
  
  # Relationships
  applications = db.relationship('JobApplication', backref='job')
  
  def to_dict(self):
    return {
      'id': self.id,
      'title': self.title,
      'company': self.company,
      'location': self.location,
      'type': self.type,
      'salary': self.salary,
      'description': self.description,
      'requirements': json.loads(self.requirements) if self.requirements else [],
      'responsibilities': json.loads(self.responsibilities) if self.responsibilities else [],
      'benefits': json.loads(self.benefits) if self.benefits else [],
      'isRemote': self.is_remote,
      'experienceLevel': self.experience_level,
      'applicationDeadline': self.application_deadline.isoformat() if self.application_deadline else None,
      'applicationEmail': self.application_email,
      'applicationUrl': self.application_url,
      'isActive': self.is_active,
      'isDraft': self.is_draft,
      'postedDate': self.created_at.isoformat(),
      'applicationsCount': len(self.applications)
    }

class JobApplication(db.Model):
  __tablename__ = 'job_applications'
  
  id = db.Column(db.Integer, primary_key=True)
  job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
  applicant_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
  resume_url = db.Column(db.String(255))
  cover_letter = db.Column(db.Text)
  status = db.Column(db.String(50), default='pending')  # pending, reviewed, interviewed, rejected, hired
  feedback = db.Column(db.Text)  # For rejection feedback
  interview_notes = db.Column(db.Text)  # For interview feedback
  offer_details = db.Column(db.Text)  # For job offer details
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
  
  def to_dict(self):
    return {
      'id': self.id,
      'jobId': self.job_id,
      'applicantId': self.applicant_id,
      'resumeUrl': self.resume_url,
      'coverLetter': self.cover_letter,
      'status': self.status,
      'feedback': self.feedback,
      'interviewNotes': self.interview_notes,
      'offerDetails': self.offer_details,
      'appliedDate': self.created_at.isoformat(),
      'updatedAt': self.updated_at.isoformat() if self.updated_at else None
    }

class SavedJob(db.Model):
  __tablename__ = 'saved_jobs'

  id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
  job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)

  # Add unique constraint to prevent duplicate saves
  __table_args__ = (db.UniqueConstraint('user_id', 'job_id', name='unique_saved_job'),)

  def to_dict(self):
    return {
      'id': self.id,
      'userId': self.user_id,
      'jobId': self.job_id,
      'savedDate': self.created_at.isoformat()
    }

class Notification(db.Model):
  __tablename__ = 'notifications'

  id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
  type = db.Column(db.String(50), nullable=False)  # application, status_update, job_match, recommendation
  title = db.Column(db.String(255), nullable=False)
  message = db.Column(db.Text)
  is_read = db.Column(db.Boolean, default=False)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  related_id = db.Column(db.Integer)  # job_id, application_id, etc.

  # Add relationship to user
  user = db.relationship('User', backref='notifications')

  def to_dict(self):
    return {
      'id': self.id,
      'userId': self.user_id,
      'type': self.type,
      'title': self.title,
      'message': self.message,
      'isRead': self.is_read,
      'createdAt': self.created_at.isoformat(),
      'relatedId': self.related_id
    }

# ===== Open House Event Models =====

class OpenHouseEvent(db.Model):
  __tablename__ = 'open_house_events'

  id = db.Column(db.Integer, primary_key=True)
  host_employer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
  title = db.Column(db.String(255), nullable=False)
  description = db.Column(db.Text)
  event_type = db.Column(db.String(100))  # 'job_fair', 'open_house', etc.
  venue_name = db.Column(db.String(255))
  venue_address = db.Column(db.String(255))
  venue_city = db.Column(db.String(100))
  venue_country = db.Column(db.String(100))
  booth_layout = db.Column(db.Text)  # JSON: {rows: ['A','B','C'], booths_per_row: 3}
  event_start = db.Column(db.DateTime)
  event_end = db.Column(db.DateTime)
  registration_deadline = db.Column(db.DateTime)
  status = db.Column(db.String(50), default='draft')  # draft, published, ongoing, completed, cancelled
  invite_token = db.Column(db.String(255), unique=True)
  max_attendees = db.Column(db.Integer)
  max_employers = db.Column(db.Integer)
  # Payment (Stripe) - host pays a one-time fee to activate the event
  payment_status = db.Column(db.String(20), default='unpaid')  # unpaid, paid
  stripe_session_id = db.Column(db.String(255))
  amount_paid = db.Column(db.Integer)  # amount in the smallest currency unit (e.g. cents)
  paid_at = db.Column(db.DateTime)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

  # Relationships
  host = db.relationship('User', foreign_keys=[host_employer_id], backref='hosted_events')
  event_employers = db.relationship('EventEmployer', backref='event', cascade='all, delete-orphan')
  booths = db.relationship('EventBooth', backref='event', cascade='all, delete-orphan')
  attendees = db.relationship('EventAttendee', backref='event', cascade='all, delete-orphan')
  event_jobs = db.relationship('EventJob', backref='event', cascade='all, delete-orphan')

  def to_dict(self):
    return {
      'id': self.id,
      'hostEmployerId': self.host_employer_id,
      'title': self.title,
      'description': self.description,
      'eventType': self.event_type,
      'venueName': self.venue_name,
      'venueAddress': self.venue_address,
      'venueCity': self.venue_city,
      'venueCountry': self.venue_country,
      'boothLayout': json.loads(self.booth_layout) if self.booth_layout else {},
      'eventStart': self.event_start.isoformat() if self.event_start else None,
      'eventEnd': self.event_end.isoformat() if self.event_end else None,
      'registrationDeadline': self.registration_deadline.isoformat() if self.registration_deadline else None,
      'status': self.status,
      'inviteToken': self.invite_token,
      'maxAttendees': self.max_attendees,
      'maxEmployers': self.max_employers,
      'paymentStatus': self.payment_status or 'unpaid',
      'amountPaid': self.amount_paid,
      'paidAt': self.paid_at.isoformat() if self.paid_at else None,
      'createdAt': self.created_at.isoformat(),
      'updatedAt': self.updated_at.isoformat() if self.updated_at else None
    }

class EventEmployer(db.Model):
  __tablename__ = 'event_employers'

  id = db.Column(db.Integer, primary_key=True)
  event_id = db.Column(db.Integer, db.ForeignKey('open_house_events.id'), nullable=False)
  employer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
  invited_by_email = db.Column(db.String(255))
  invited_at = db.Column(db.DateTime, default=datetime.utcnow)
  status = db.Column(db.String(50), default='invited')  # invited, accepted, rejected, removed
  responded_at = db.Column(db.DateTime)
  event_company_tagline = db.Column(db.String(255))
  event_company_culture = db.Column(db.Text)
  event_openings_context = db.Column(db.Text)
  event_contact_name = db.Column(db.String(255))
  event_contact_email = db.Column(db.String(255))
  event_contact_phone = db.Column(db.String(20))
  profile_completed = db.Column(db.Boolean, default=False)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

  __table_args__ = (db.UniqueConstraint('event_id', 'employer_id', name='unique_event_employer'),)

  # Relationships
  employer = db.relationship('User', foreign_keys=[employer_id], backref='event_invitations')
  booth = db.relationship('EventBooth', uselist=False, backref='event_employer')

  def to_dict(self):
    return {
      'id': self.id,
      'eventId': self.event_id,
      'employerId': self.employer_id,
      'invitedByEmail': self.invited_by_email,
      'invitedAt': self.invited_at.isoformat() if self.invited_at else None,
      'status': self.status,
      'respondedAt': self.responded_at.isoformat() if self.responded_at else None,
      'eventCompanyTagline': self.event_company_tagline,
      'eventCompanyCulture': self.event_company_culture,
      'eventOpeningsContext': self.event_openings_context,
      'eventContactName': self.event_contact_name,
      'eventContactEmail': self.event_contact_email,
      'eventContactPhone': self.event_contact_phone,
      'profileCompleted': self.profile_completed,
      'createdAt': self.created_at.isoformat(),
      'updatedAt': self.updated_at.isoformat() if self.updated_at else None
    }

class EventBooth(db.Model):
  __tablename__ = 'event_booths'

  id = db.Column(db.Integer, primary_key=True)
  event_id = db.Column(db.Integer, db.ForeignKey('open_house_events.id'), nullable=False)
  event_employer_id = db.Column(db.Integer, db.ForeignKey('event_employers.id'), nullable=True)
  row_label = db.Column(db.String(10), nullable=False)  # A, B, C, etc.
  booth_number = db.Column(db.Integer, nullable=False)
  notes = db.Column(db.Text)

  __table_args__ = (db.UniqueConstraint('event_id', 'row_label', 'booth_number', name='unique_booth_position'),)

  def to_dict(self):
    return {
      'id': self.id,
      'eventId': self.event_id,
      'eventEmployerId': self.event_employer_id,
      'rowLabel': self.row_label,
      'boothNumber': self.booth_number,
      'notes': self.notes
    }

class EventJob(db.Model):
  __tablename__ = 'event_jobs'

  id = db.Column(db.Integer, primary_key=True)
  event_id = db.Column(db.Integer, db.ForeignKey('open_house_events.id'), nullable=False)
  event_employer_id = db.Column(db.Integer, db.ForeignKey('event_employers.id'), nullable=False)
  linked_job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=True)
  title = db.Column(db.String(255), nullable=False)
  description = db.Column(db.Text)
  job_type = db.Column(db.String(50))  # Full-time, Part-time, etc.
  salary = db.Column(db.String(100))
  experience_level = db.Column(db.String(50))  # Entry, Mid, Senior
  industry = db.Column(db.String(100))
  location = db.Column(db.String(255))
  requirements = db.Column(db.Text)  # JSON array
  is_active = db.Column(db.Boolean, default=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

  # Relationships
  event_employer = db.relationship('EventEmployer', backref='jobs')
  event_applications = db.relationship('EventApplication', backref='job', cascade='all, delete-orphan')

  def to_dict(self):
    return {
      'id': self.id,
      'eventId': self.event_id,
      'eventEmployerId': self.event_employer_id,
      'linkedJobId': self.linked_job_id,
      'title': self.title,
      'description': self.description,
      'jobType': self.job_type,
      'salary': self.salary,
      'experienceLevel': self.experience_level,
      'industry': self.industry,
      'location': self.location,
      'requirements': json.loads(self.requirements) if self.requirements else [],
      'isActive': self.is_active,
      'createdAt': self.created_at.isoformat(),
      'updatedAt': self.updated_at.isoformat() if self.updated_at else None
    }

class EventAttendee(db.Model):
  __tablename__ = 'event_attendees'

  id = db.Column(db.Integer, primary_key=True)
  event_id = db.Column(db.Integer, db.ForeignKey('open_house_events.id'), nullable=False)
  seeker_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
  status = db.Column(db.String(50), default='requested')  # requested, approved, rejected
  requested_at = db.Column(db.DateTime, default=datetime.utcnow)
  reviewed_at = db.Column(db.DateTime)
  review_note = db.Column(db.Text)
  join_token_used = db.Column(db.Boolean, default=False)

  __table_args__ = (db.UniqueConstraint('event_id', 'seeker_id', name='unique_event_attendee'),)

  # Relationships
  seeker = db.relationship('User', foreign_keys=[seeker_id], backref='event_attendances')
  event_applications = db.relationship('EventApplication', backref='attendee', cascade='all, delete-orphan')

  def to_dict(self):
    return {
      'id': self.id,
      'eventId': self.event_id,
      'seekerId': self.seeker_id,
      'status': self.status,
      'requestedAt': self.requested_at.isoformat() if self.requested_at else None,
      'reviewedAt': self.reviewed_at.isoformat() if self.reviewed_at else None,
      'reviewNote': self.review_note,
      'joinTokenUsed': self.join_token_used
    }

class ChatHistory(db.Model):
  __tablename__ = 'chat_history'

  id = db.Column(db.Integer, primary_key=True)
  user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
  conversation_id = db.Column(db.String(255))  # Group messages into conversations
  message = db.Column(db.Text, nullable=False)  # User message
  response = db.Column(db.Text, nullable=False)  # AI response
  context_type = db.Column(db.String(50))  # Type of context (job, application, etc)
  context_id = db.Column(db.Integer)  # ID of related entity (job_id, application_id, etc)
  tokens_used = db.Column(db.Integer)  # Approximate tokens used in this exchange
  created_at = db.Column(db.DateTime, default=datetime.utcnow)

  # Relationship
  user = db.relationship('User', backref='chat_history')

  def to_dict(self):
    return {
      'id': self.id,
      'userId': self.user_id,
      'conversationId': self.conversation_id,
      'message': self.message,
      'response': self.response,
      'contextType': self.context_type,
      'contextId': self.context_id,
      'tokensUsed': self.tokens_used,
      'createdAt': self.created_at.isoformat() if self.created_at else None
    }


class EventApplication(db.Model):
  __tablename__ = 'event_applications'

  id = db.Column(db.Integer, primary_key=True)
  event_id = db.Column(db.Integer, db.ForeignKey('open_house_events.id'), nullable=False)
  event_job_id = db.Column(db.Integer, db.ForeignKey('event_jobs.id'), nullable=False)
  event_attendee_id = db.Column(db.Integer, db.ForeignKey('event_attendees.id'), nullable=False)
  resume_url = db.Column(db.String(255))
  cover_letter = db.Column(db.Text)
  status = db.Column(db.String(50), default='pending')  # pending, reviewed, shortlisted, rejected
  feedback = db.Column(db.Text)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

  __table_args__ = (db.UniqueConstraint('event_job_id', 'event_attendee_id', name='unique_event_application'),)

  def to_dict(self):
    return {
      'id': self.id,
      'eventId': self.event_id,
      'eventJobId': self.event_job_id,
      'eventAttendeeId': self.event_attendee_id,
      'resumeUrl': self.resume_url,
      'coverLetter': self.cover_letter,
      'status': self.status,
      'feedback': self.feedback,
      'createdAt': self.created_at.isoformat(),
      'updatedAt': self.updated_at.isoformat() if self.updated_at else None
    }

