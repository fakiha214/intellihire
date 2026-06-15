# utils/matching.py
"""Utility functions for text preprocessing and skill / domain extraction plus
the scoring helpers used by the Flask app.

Scores returned to the application layer are **integer percentages (0-100)** so
that the frontend (which renders ``{matchScore}%`` and thresholds like ``>= 80``)
and the backend filters (``score > 50``) are consistent. Internally we combine a
technical-skill overlap signal with a TF-IDF cosine similarity signal.
"""

import re
from typing import List, Set, Dict, Any

# ---------------------------------------------------------------------------
# Simple preprocessing - lower-case, strip punctuation, collapse spaces
# ---------------------------------------------------------------------------
def preprocess_text(text: str | None) -> str:
    """Return a cleaned, lower-cased version of *text*.

    * If *text* is ``None`` or an empty string the function returns ``""``.
    * Non-alphanumeric characters are replaced by spaces so that words stay
      separate (e.g. ``"Python/Java"`` -> ``"python java"``).
    """
    if not text:
        return ""
    cleaned = re.sub(r"[^a-z0-9+.# ]+", " ", text.lower())
    return re.sub(r"\s+", " ", cleaned).strip()

# ---------------------------------------------------------------------------
# Technical skill extraction
# ---------------------------------------------------------------------------
# A curated skill list - the real project may have a larger one.
TECHNICAL_SKILLS = {
    "languages": [
        "python", "java", "c", "c++", "c#", "javascript", "typescript",
        "go", "golang", "ruby", "php", "swift", "kotlin",
    ],
    "frontend": [
        "react", "angular", "vue", "svelte", "nextjs", "nuxt", "ember",
    ],
    "backend": [
        "django", "flask", "fastapi", "spring", "nodejs", "express",
        "rails", "laravel", "asp.net",
    ],
    "databases": [
        "postgresql", "mysql", "mongodb", "sqlite", "redis", "elasticsearch",
        "firebase", "oracle", "cassandra",
    ],
    "devops": [
        "docker", "kubernetes", "aws", "azure", "gcp", "jenkins",
        "gitlab", "github", "heroku", "netlify", "terraform",
    ],
    "ai_ml": [
        "tensorflow", "pytorch", "nlp", "opencv", "scikit-learn", "pandas", "numpy",
    ],
    "tools": [
        "git", "linux", "bash", "powershell", "windows",
        "graphql", "rest", "webpack", "vite", "npm", "yarn",
    ],
}


def extract_technical_skills(text: str) -> List[str]:
    """Return a list of recognized technical skills found in *text*.

    The function performs a case-insensitive search for words in the
    ``TECHNICAL_SKILLS`` dict. It returns the skills in the order they appear
    (duplicates are removed while preserving order).
    """
    cleaned = preprocess_text(text)
    found: List[str] = []
    for category_skills in TECHNICAL_SKILLS.values():
        for skill in category_skills:
            # Use word boundaries so ``java`` does not match ``javascript``.
            # ``re.escape`` handles the ``+``/``#``/``.`` in c++ / c# / asp.net.
            pattern = r"(?<![a-z0-9])" + re.escape(skill) + r"(?![a-z0-9])"
            if re.search(pattern, cleaned):
                if skill not in found:
                    found.append(skill)
    return found

# ---------------------------------------------------------------------------
# Experience level extraction
# ---------------------------------------------------------------------------
def extract_experience_level(text: str) -> str:
    """Determine a simple experience level from *text*.

    Returns one of ``"entry"``, ``"mid"`` or ``"senior"``.
    """
    lowered = preprocess_text(text)
    if any(word in lowered for word in ["senior", "lead", "principal", "architect"]):
        return "senior"
    if any(word in lowered for word in ["entry", "junior", "fresher", "intern"]):
        return "entry"
    return "mid"

# ---------------------------------------------------------------------------
# Job domain extraction
# ---------------------------------------------------------------------------
def extract_job_domain(text: str) -> str:
    """Return a high-level domain (backend, frontend, fullstack, data, mobile)."""
    lowered = preprocess_text(text)
    if "backend" in lowered:
        return "backend"
    if "frontend" in lowered:
        return "frontend"
    if "fullstack" in lowered:
        return "fullstack"
    if "data" in lowered or "ml" in lowered or "machine learning" in lowered:
        return "data"
    if "mobile" in lowered or "ios" in lowered or "android" in lowered:
        return "mobile"
    return "fullstack"

# ---------------------------------------------------------------------------
# Core scoring helpers
# ---------------------------------------------------------------------------
def _tfidf_cosine(text_a: str, text_b: str) -> float:
    """Return TF-IDF cosine similarity (0-1) between two documents.

    Returns ``0.0`` when either side is empty or the shared vocabulary is empty
    (e.g. only stop-words), which would otherwise make scikit-learn raise.
    """
    a = preprocess_text(text_a)
    b = preprocess_text(text_b)
    if not a or not b:
        return 0.0
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        tfidf = TfidfVectorizer(stop_words="english").fit_transform([a, b])
        return float(cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0])
    except Exception:
        return 0.0


def _skill_set(skills: List[str]) -> Set[str]:
    """Build a comparable set of skill tokens from a list of free-text skills."""
    result: Set[str] = set(extract_technical_skills(" ".join(skills or [])))
    for s in (skills or []):
        token = preprocess_text(s)
        if token:
            result.add(token)
    return result


def _combine(skill_overlap: float, cosine: float) -> int:
    """Blend the two signals into an integer 0-100 score."""
    score = 0.65 * skill_overlap + 0.35 * cosine
    return int(round(min(max(score, 0.0), 1.0) * 100))


def calculate_match_score(model, seeker_skills: List[str], job_description: str) -> int:
    """Match a seeker's skills against a single job description.

    ``model`` is accepted for API compatibility but not used. Returns an integer
    percentage 0-100.
    """
    job_text = job_description or ""
    job_skills = set(extract_technical_skills(job_text))
    seeker_skillset = _skill_set(seeker_skills)

    if job_skills:
        skill_overlap = len(job_skills & seeker_skillset) / len(job_skills)
    else:
        skill_overlap = 0.0

    cosine = _tfidf_cosine(" ".join(seeker_skills or []), job_text)
    return _combine(skill_overlap, cosine)


def calculate_seeker_to_jobs_scores(
    model,
    seeker_skills: List[str],
    job_descriptions: List[str],
    jobs: List[Any] = None,
) -> List[int]:
    """Return an integer 0-100 score for each job, in the input order."""
    return [calculate_match_score(model, seeker_skills, desc) for desc in job_descriptions]


def calculate_resume_to_job_match(resume_text: str, job_description: str) -> Dict[str, Any]:
    """Score a raw resume text against a job description.

    Returns a dict consumed by ``/api/resumes/analyze`` with keys: ``matchScore``
    (0-100 int), ``matchedSkills`` (list), ``breakdown`` (dict) and the skill
    counts used to compute the score.
    """
    resume_skills = set(extract_technical_skills(resume_text))
    job_skills = set(extract_technical_skills(job_description))
    matched = sorted(resume_skills & job_skills)

    skill_overlap = (len(matched) / len(job_skills)) if job_skills else 0.0
    cosine = _tfidf_cosine(resume_text, job_description)
    score = _combine(skill_overlap, cosine)

    return {
        "matchScore": score,
        "matchedSkills": matched,
        "breakdown": {
            "skillMatchPercent": int(round(skill_overlap * 100)),
            "textSimilarityPercent": int(round(cosine * 100)),
            "weightSkills": 65,
            "weightText": 35,
        },
        "resumeSkillCount": len(resume_skills),
        "jobSkillCount": len(job_skills),
        "matchedSkillCount": len(matched),
    }


def load_model():
    """Placeholder model loader.

    The matching functions use TF-IDF + skill overlap internally, so no external
    model is required. Returns ``None`` (kept for API compatibility).
    """
    return None

# End of utils/matching.py
