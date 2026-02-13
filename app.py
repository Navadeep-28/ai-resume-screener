#!/usr/bin/env python3
from flask import (
    Flask, request, render_template,
    send_file, jsonify, redirect, url_for, session
)
import os, re, json, joblib, sqlite3, io
import numpy as np
import PyPDF2
import spacy
# Email imports
import smtplib
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
# Auth module
import auth 

from sklearn.metrics.pairwise import cosine_similarity
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from spacy.cli import download
from math import ceil

# ================= NLP =================
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")


# ================= APP SETUP =================
app = Flask(__name__)
app.secret_key = "change-this-secret-key"

UPLOAD = "uploads"
DB = "users.db"

os.makedirs(UPLOAD, exist_ok=True)
os.makedirs("models", exist_ok=True)

# ================= EMAIL CONFIGURATION =================
# ⚠️ REPLACE WITH YOUR REAL GMAIL CREDENTIALS
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'resumescreener963@gmail.com' 
app.config['MAIL_PASSWORD'] = 'ocvs irmv jogk zstz'  # Use App Password if 2FA is on
app.config['MAIL_DEFAULT_SENDER'] = 'resumescreener963@gmail.com'

mail = Mail(app)
s = URLSafeTimedSerializer(app.secret_key)

# ================= DATABASE INIT =================
# Handled by auth module
auth.init_db()

# ================= JOB DESCRIPTION TEMPLATES =================
JOB_TEMPLATES = {
    "python_dev": "Python Developer with Flask, Django, REST APIs and SQL.",
    "data_scientist": "Data Scientist skilled in Python, Pandas, NumPy, ML, NLP.",
    "ml_engineer": "ML Engineer with model training, deployment, NLP.",
    "frontend_dev": "Frontend Developer with HTML, CSS, JavaScript, React, UI/UX.",
    "backend_dev": "Backend Developer with APIs, databases, authentication."
}

# ================= HELPERS (ENHANCED) =================

def clean_text(text):
    """
    Cleans text for better processing of complex layouts.
    - Lowercases
    - Preserves numbers (crucial for years of exp, GPA)
    - Removes special characters but keeps essential punctuation for separation
    - Lemmatizes
    """
    # Convert to lowercase
    text = text.lower()
    
    # Replace newlines and multiple spaces with a single space
    text = re.sub(r"\s+", " ", text)
    
    # Remove non-alphanumeric characters (keeping spaces and digits)
    # We keep digits because "3 years", "2016", "3.93 GPA" are important
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    
    # Tokenize and lemmatize using Spacy
    doc = nlp(text)
    
    # Remove stop words and short tokens (1-2 chars), but keep numbers if relevant
    tokens = [
        token.lemma_ for token in doc 
        if not token.is_stop and (len(token.text) > 2 or token.like_num)
    ]
    
    return " ".join(tokens)

def extract_keywords(text):
    """
    Extracts distinct keywords (nouns, proper nouns, and numbers)
    """
    doc = nlp(text.lower())
    # Extract noun chunks (phrases) and individual interesting tokens
    keywords = set()
    
    # Add individual tokens (nouns, proper nouns, adjectives)
    for token in doc:
        if (token.pos_ in ["NOUN", "PROPN", "ADJ"] or token.like_num) and not token.is_stop and len(token.text) > 2:
            keywords.add(token.text)
            
    # Add named entities (like "University of California", "Python", "Google")
    for ent in doc.ents:
        keywords.add(ent.text)
        
    return keywords

def login_required():
    return "user" in session

def send_verification_email(email):
    token = s.dumps(email, salt='email-confirm')
    link = url_for('verify_email', token=token, _external=True)
    msg = Message('Confirm Email - AI Resume Screener', recipients=[email])
    msg.body = f'Click the link to verify your account: {link}'
    try:
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Mail Error: {e}")
        return False

# ================= ATS DECISION LOGIC (HIGH ACCURACY) =================

PASS_THRESHOLD = 0.65      # Overall Score (65%)
MATCH_THRESHOLD = 0.50     # Job Relevance (50% - more lenient, focuses on final score)
QUALITY_THRESHOLD = 0.50   # Resume Quality (50%)

def ats_decision(final, quality, match):
    # ✅ IMPROVEMENT: High Impact Pass
    # If final score is very high, pass immediately regardless of sub-scores
    if final >= 0.75:
        return "PASS"
    
    # Standard Pass: Must meet overall threshold AND have decent relevance
    if final >= PASS_THRESHOLD and match >= MATCH_THRESHOLD:
        return "PASS"
        
    return "FAIL"

def decision_reason(decision, quality, match):
    """Generate human-readable reason for the decision"""
    if decision == "PASS":
        if match >= 0.8:
            return "Excellent match! Candidate skills highly align with the job."
        return "Candidate meets the core requirements for this position."
    else:
        reasons = []
        if match < MATCH_THRESHOLD:
            reasons.append("low relevance to job description")
        if quality < QUALITY_THRESHOLD:
            reasons.append("resume structure needs improvement")
        
        if reasons:
            return f"Candidate failed due to: {', '.join(reasons)}."
        return "Overall score did not meet the hiring benchmark."

def calculate_confidence(final, quality, match):
    """
    Calculate confidence based on score decisiveness.
    High scores (>80%) or Low scores (<40%) have high confidence.
    Borderline scores (60-70%) have lower confidence.
    """
    dist_from_borderline = abs(final - 0.65) # Distance from the "maybe" zone
    confidence = 0.5 + (dist_from_borderline * 1.5) # Scale it up
    return min(confidence, 0.98) # Cap at 98%

def failure_reasons(quality, match):
    reasons = []
    if quality < QUALITY_THRESHOLD:
        reasons.append("Resume formatting or structure is below standard")
    if match < MATCH_THRESHOLD:
        reasons.append("Skills do not sufficiently match the job description")
    if not reasons:
        reasons.append("Cumulative score falls below the 65% hiring threshold")
    return reasons

def skill_gap_analysis(resume_text, job_desc):
    resume_skills = extract_keywords(resume_text)
    job_skills = extract_keywords(job_desc)
    missing = sorted(list(job_skills - resume_skills))
    matched = sorted(list(job_skills & resume_skills))
    return matched[:10], missing[:10]

def improvement_tips(missing_skills):
    tips = []
    for skill in missing_skills[:5]:
        tips.append(f"Highlight experience with '{skill}' if applicable")
    if not tips:
        tips.append("Resume is strong — focus on quantifying achievements")
    return tips

def ai_explanation(final, quality, match, decision):
    if decision == "PASS":
        return (
            f"Strong candidate with a {int(final*100)}% match score. "
            "Key skills are present and resume quality is acceptable."
        )
    return (
        "Candidate does not meet the threshold. "
        "The resume lacks key terminology found in the job description."
    )


# ================= LOAD MODELS =================
try:
    tfidf_general = joblib.load("models/tfidf_general.pkl")
    model_general = joblib.load("models/model_general.pkl")
    tfidf_match = joblib.load("models/tfidf_match.pkl")
    model_match = joblib.load("models/model_match.pkl")
    skills_list = json.load(open("models/skills.json"))
    MODELS = True
except Exception as e:
    print("⚠️ Models not loaded:", e)
    MODELS = False

# =========================================================
# 🔥 CORE RESUME SCORING FUNCTION (HIGH ACCURACY)
# =========================================================
def score_resume(resume_text, job_desc):
    """
    Reusable function to score a resume against a job description.
    Designed to handle complex/dense resumes.
    """
    clean_resume = clean_text(resume_text)
    clean_jd = clean_text(job_desc)

    # 1. Quality Score (Structure/Grammar - ML Model)
    # Dense resumes might have unusual structures, so we trust the content match more
    try:
        q_vec = tfidf_general.transform([clean_resume])
        q = model_general.predict(q_vec)[0]
    except:
        q = 0.5 # Fallback if model fails

    # 2. Match Score (Semantic Similarity - Cosine)
    resume_vec = tfidf_match.transform([clean_resume])
    jd_vec = tfidf_match.transform([clean_jd])
    m = cosine_similarity(resume_vec, jd_vec)[0][0]

    # 3. Keyword Coverage (Hard Skills & Entities)
    # This is critical for "hard" resumes where specific skills are listed in tables
    resume_keywords = extract_keywords(resume_text)
    jd_keywords = extract_keywords(job_desc)
    
    # Intersection of keywords
    matched = resume_keywords & jd_keywords
    
    # Calculate coverage based on JD requirements
    # We use a logarithmic scale for coverage to avoid penalizing long JDs too much
    if len(jd_keywords) > 0:
        coverage = round((len(matched) / len(jd_keywords)) * 100, 2)
    else:
        coverage = 0

    # ✅ ACCURACY BOOST LOGIC:
    # 1. Base Score: Weighted average of semantic match (m) and quality (q)
    #    We give high weight to 'm' because dense resumes are content-rich.
    final = (0.75 * m) + (0.25 * q)

    # 2. Coverage Boost: If specific keywords match well, boost the score.
    #    This helps with resumes that have the right skills but might be formatted weirdly.
    if coverage > 40: # If >40% of JD keywords are found
        final += 0.10 # +10% boost
    if coverage > 60: # If >60% of JD keywords are found
        final += 0.05 # Additional +5% boost

    # 3. Penalty for very low match
    if m < 0.2:
        final -= 0.1 # Penalize irrelevant resumes

    # Cap final score at 1.0 (100%)
    final = min(final, 1.0)
    final = max(final, 0.0) # Ensure no negative score

    return {
        "final": float(final),
        "quality": float(q),
        "match": float(m),
        "coverage": coverage,
        "matched_skills": sorted(list(matched))[:10]
    }

# ================= AUTH ROUTES =================
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        email = request.form.get("email") # Use .get() to prevent KeyError if missing
        password = request.form["password"]
        role = request.form.get("role")

        if not email:
            return render_template("register.html", error="Email is required")

        if auth.register_user(username, email, password, role):
            if send_verification_email(email):
                return render_template(
                    "login.html", 
                    success="Account created! Please check your email to verify."
                )
            else:
                return render_template(
                    "register.html", 
                    error="Account created, but email failed to send."
                )
        
        return render_template("register.html", error="Username or Email already exists")
    
    return render_template("register.html")

@app.route('/verify_email/<token>')
def verify_email(token):
    try:
        email = s.loads(token, salt='email-confirm', max_age=3600)
        if auth.verify_user_email(email):
            return render_template("login.html", success="Email verified! You can now login.")
        else:
            return render_template("login.html", error="Verification failed. User not found.")
    except Exception:
        return render_template("login.html", error="The confirmation link is invalid or has expired.")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        
        result = auth.authenticate_user(username, password)
        
        if result:
            role, is_verified = result
            if not is_verified:
                return render_template("login.html", error="Please verify your email first.")
            
            session["user"] = username
            session["role"] = role
            return redirect(url_for("index"))
        
        return render_template("login.html", error="Invalid credentials")
    
    return render_template("login.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

@app.route("/clear")
def clear():
    """Clear results and start new analysis"""
    if 'last_result' in session:
        del session['last_result']
    return redirect(url_for("index"))

# ================= RESULTS ROUTE =================
@app.route("/results")
def results():
    if not login_required():
        return redirect(url_for("login"))
    
    result_data = session.get('last_result')
    if not result_data:
        return redirect(url_for("index"))
    
    return render_template(
        "index.html",
        job_templates=JOB_TEMPLATES,
        **result_data
    )

# ================= MAIN APP =================
@app.route("/", methods=["GET", "POST"])
def index():
    if not login_required():
        return redirect(url_for("login"))

    if request.method == "POST":
        job_desc = request.form.get("job_desc", "")
        job_role = request.form.get("job_role")

        if job_role in JOB_TEMPLATES and not job_desc.strip():
            job_desc = JOB_TEMPLATES[job_role]

        file = request.files.get("resume")
        if not file or not file.filename.endswith(".pdf"):
            return render_template(
                "index.html",
                error="Upload PDF only",
                job_templates=JOB_TEMPLATES
            )

        path = os.path.join(UPLOAD, file.filename)
        file.save(path)

        text = ""
        with open(path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for p in reader.pages:
                if p.extract_text():
                    text += p.extract_text()

        if not text.strip():
            return render_template(
                "index.html",
                error="Scanned PDF not supported",
                job_templates=JOB_TEMPLATES
            )

        clean_resume = clean_text(text)
        clean_jd = clean_text(job_desc)

        # 🔒 SAFETY CHECK
        if not MODELS:
            return render_template(
                "index.html",
                error="⚠️ ML models not trained. Run train_model.py first.",
                job_templates=JOB_TEMPLATES
            )

        # ================= ML SCORING =================
        scores = score_resume(text, job_desc)
        final = scores["final"]
        q = scores["quality"]
        m = scores["match"]
        jd_coverage = scores["coverage"]
        matched_skills = scores["matched_skills"]
        
        # ================= ENHANCED FEATURES =================
        # Determine status with configurable threshold
        status = ats_decision(final, q, m)
        
        # Enhanced failure reasons with detailed criteria
        enhanced_failure_reasons = []
        if q < 0.5:
            enhanced_failure_reasons.append("Low resume quality (format, clarity, or structure issues)")
        if m < 0.5:
            enhanced_failure_reasons.append("Poor alignment with the job description")
        if jd_coverage < 40:
            enhanced_failure_reasons.append("Critical skills missing from the resume")
        if status == "PASS":
            enhanced_failure_reasons = []
        
        # Calculate hiring risk
        if final >= 0.8:
            hiring_risk = "LOW"
        elif final >= 0.6:
            hiring_risk = "MEDIUM"
        else:
            hiring_risk = "HIGH"
        
        # Explainability module
        explainability = {
            "quality_explanation": (
                "Resume shows strong structure and clarity"
                if q >= 0.6 else
                "Resume structure or clarity needs improvement"
            ),
            "match_explanation": (
                "Resume aligns well with the job role"
                if m >= 0.6 else
                "Resume does not sufficiently match the job requirements"
            ),
            "coverage_explanation": f"{jd_coverage}% of job description skills were found in the resume",
            "decision_explanation": (
                "Candidate meets the criteria for this role"
                if status == "PASS"
                else "Candidate does not meet the minimum criteria"
            )
        }
        
        # Keep existing features
        decision = status
        reasons = failure_reasons(q, m)
        matched_skills, missing_skills = skill_gap_analysis(text, job_desc)
        recommendations = improvement_tips(missing_skills)
        explanation = ai_explanation(final, q, m, decision)
        confidence = calculate_confidence(final, q, m)
        decision_text = decision_reason(decision, q, m)

        resume_vec = tfidf_general.transform([clean_resume])
        skills_vec = tfidf_general.transform(skills_list)
        sims = cosine_similarity(resume_vec, skills_vec)[0]

        top_skills = [
            {"name": skills_list[i], "score": float(sims[i])}
            for i in np.argsort(sims)[-8:][::-1]
        ]

        # ================= HEATMAP =================
        heatmap_words = list(
            extract_keywords(text)
            .intersection(extract_keywords(job_desc))
        )

        # ================= PDF REPORT =================
        report = os.path.join(UPLOAD, "report.pdf")
        doc = SimpleDocTemplate(report, pagesize=letter)
        styles = getSampleStyleSheet()
        doc.build([
            Paragraph("AI Resume Screening Report", styles["Title"]),
            Spacer(1, 12),
            Paragraph(f"Decision: {decision}", styles["Normal"]),
            Paragraph(f"Status: {status}", styles["Normal"]),
            Paragraph(f"Confidence: {confidence:.1%}", styles["Normal"]),
            Spacer(1, 12),
            Paragraph(f"Final Score: {final:.1%}", styles["Normal"]),
            Paragraph(f"Quality Score: {q:.1%}", styles["Normal"]),
            Paragraph(f"Job Match Score: {m:.1%}", styles["Normal"]),
            Paragraph(f"JD Coverage: {jd_coverage}%", styles["Normal"]),
            Paragraph(f"Hiring Risk: {hiring_risk}", styles["Normal"]),
        ])

        os.remove(path)

        # Store results in session to enable proper redirect
        session['last_result'] = {
            'success': True,
            'score': final,
            'quality': q,
            'match': m,
            'decision': decision,
            'decision_reason': decision_text,
            'confidence': confidence,
            'reasons': reasons,
            'matched_skills': matched_skills,
            'missing_skills': missing_skills,
            'recommendations': recommendations,
            'explanation': explanation,
            'top_skills': top_skills,
            'report': "report.pdf",
            'preview': text[:500] + "...",
            'heatmap': heatmap_words,
            # Enhanced features
            'status': status,
            'jd_coverage': jd_coverage,
            'hiring_risk': hiring_risk,
            'failure_reasons_enhanced': enhanced_failure_reasons,
            'explainability': explainability
        }
        
        return redirect(url_for('results'))

    return render_template(
        "index.html",
        job_templates=JOB_TEMPLATES
    )

# =========================================================
# 🔥 BATCH RESUME SCREENING
# =========================================================
@app.route("/batch-screen", methods=["POST"])
def batch_screen():
    try:
        if not login_required():
            return redirect(url_for("login"))

        if not MODELS:
            return render_template("batch_results.html", error="ML models not loaded")

        files = request.files.getlist("resumes")
        job_desc = request.form.get("job_desc", "")
        job_role = request.form.get("job_role")

        if job_role in JOB_TEMPLATES and not job_desc.strip():
            job_desc = JOB_TEMPLATES[job_role]

        results = []

        for file in files:
            if not file.filename.lower().endswith(".pdf"):
                continue

            try:
                reader = PyPDF2.PdfReader(file)
                text = "".join(page.extract_text() or "" for page in reader.pages)

                if not text.strip():
                    continue

                scores = score_resume(text, job_desc)

                results.append({
                    "filename": file.filename,
                    "final": round(scores["final"] * 100, 1),
                    "quality": round(scores["quality"] * 100, 1),
                    "match": round(scores["match"] * 100, 1),
                    "coverage": scores["coverage"]
                })
            except Exception as e:
                print(f"Error processing {file.filename}: {e}")
                continue

        if not results:
            return render_template("batch_results.html", error="No valid resumes found")

        # 🔥 SORT
        results.sort(key=lambda x: x["final"], reverse=True)

        # 🔥 PAGINATION
        page = int(request.args.get("page", 1))
        per_page = 10
        total = len(results)
        total_pages = ceil(total / per_page)

        start = (page - 1) * per_page
        end = start + per_page
        paginated_results = results[start:end]

        # Store full results for comparison and export
        session["last_batch_results"] = results
        session["last_job_role"] = job_role
        session["last_job_desc"] = job_desc

        return render_template(
            "batch_results.html",
            ranked_results=paginated_results,
            page=page,
            total_pages=total_pages,
            total_results=total
        )

    except Exception as e:
        print("BATCH ERROR:", e)
        import traceback
        traceback.print_exc()
        return render_template("batch_results.html", error="Internal server error")

@app.route("/export-batch-pdf")
def export_batch_pdf():
    if not login_required():
        return redirect("/login")

    results = session.get("last_batch_results")
    job_role = session.get("last_job_role", "N/A")

    if not results:
        return "No batch data to export", 400

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)

    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(
        f"<b>Batch Resume Screening Report</b><br/>Job Role: {job_role}",
        styles["Title"]
    ))
    elements.append(Spacer(1, 20))

    table_data = [["Rank", "Filename", "Final %", "Quality %", "Match %", "Coverage %"]]

    for i, r in enumerate(results, start=1):
        table_data.append([
            str(i), 
            r["filename"][:30] + "..." if len(r["filename"]) > 30 else r["filename"], 
            str(r["final"]), 
            str(r["quality"]), 
            str(r["match"]), 
            str(r["coverage"])
        ])

    table = Table(table_data, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.darkblue),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 1, colors.grey),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
        ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
    ]))

    elements.append(table)
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(
        f"Total Candidates: {len(results)} | Generated by AI Resume Screener",
        styles["Normal"]
    ))

    doc.build(elements)

    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        download_name="batch_screening_results.pdf",
        mimetype="application/pdf"
    )


# =========================================================
# 🔥 COMPARE TWO RESUMES
# =========================================================
@app.route("/compare-resumes", methods=["POST"])
def compare_resumes():
    if not login_required():
        return redirect(url_for("login"))

    if not MODELS:
        return render_template(
            "compare_results.html",
            error="⚠️ ML models not loaded."
        )

    r1 = request.files.get("resume1")
    r2 = request.files.get("resume2")
    job_desc = request.form.get("job_desc", "")
    job_role = request.form.get("job_role")

    # Validate files
    if not r1 or not r2:
        return render_template(
            "compare_results.html",
            error="Please upload both resumes for comparison."
        )

    if not r1.filename.lower().endswith(".pdf") or not r2.filename.lower().endswith(".pdf"):
        return render_template(
            "compare_results.html",
            error="Both files must be PDF format."
        )

    if job_role in JOB_TEMPLATES and not job_desc.strip():
        job_desc = JOB_TEMPLATES[job_role]

    def extract_text(file):
        try:
            reader = PyPDF2.PdfReader(file)
            return " ".join(
                p.extract_text() for p in reader.pages if p.extract_text()
            )
        except Exception as e:
            print(f"Error extracting text: {e}")
            return ""

    t1 = extract_text(r1)
    t2 = extract_text(r2)

    if not t1.strip() or not t2.strip():
        return render_template(
            "compare_results.html",
            error="Could not extract text from one or both PDFs."
        )

    s1 = score_resume(t1, job_desc)
    s2 = score_resume(t2, job_desc)

    # Create result dictionaries with proper structure
    resume_1 = {
        "final": s1["final"],
        "match": s1["match"],
        "quality": s1["quality"],
        "coverage": s1["coverage"]
    }
    
    resume_2 = {
        "final": s2["final"],
        "match": s2["match"],
        "quality": s2["quality"],
        "coverage": s2["coverage"]
    }

    winner = "resume_1" if s1["final"] > s2["final"] else "resume_2"

    # 🔐 store for PDF export
    session["last_compare_result"] = {
        "resume_1": {
            "final": round(s1["final"] * 100, 2),
            "match": round(s1["match"] * 100, 2),
            "quality": round(s1["quality"] * 100, 2),
            "coverage": s1["coverage"]
        },
        "resume_2": {
            "final": round(s2["final"] * 100, 2),
            "match": round(s2["match"] * 100, 2),
            "quality": round(s2["quality"] * 100, 2),
            "coverage": s2["coverage"]
        },
        "winner": winner
    }

    return render_template(
        "compare_results.html",
        resume_1=resume_1,
        resume_2=resume_2,
        winner=winner
    )


@app.route("/export-compare-pdf")
def export_compare_pdf():
    if not login_required():
        return redirect("/login")

    data = session.get("last_compare_result")
    if not data:
        return "No comparison data", 400

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("<b>Resume Comparison Report</b>", styles["Title"]))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(
        f"Winner: <b>{data['winner'].replace('_', ' ').upper()}</b>",
        styles["Heading2"]
    ))
    elements.append(Spacer(1, 20))

    table_data = [
        ["Metric", "Resume 1", "Resume 2"],
        ["Final Score", f"{data['resume_1']['final']}%", f"{data['resume_2']['final']}%"],
        ["Job Match", f"{data['resume_1']['match']}%", f"{data['resume_2']['match']}%"],
        ["JD Coverage", f"{data['resume_1']['coverage']}%", f"{data['resume_2']['coverage']}%"],
    ]

    table = Table(table_data, colWidths=[150, 120, 120])
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 1, colors.grey),
        ("BACKGROUND", (0, 0), (-1, 0), colors.darkblue),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
        ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
    ]))

    elements.append(table)
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(
        "Generated by AI Resume Screener",
        styles["Normal"]
    ))

    doc.build(elements)

    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        download_name="resume_comparison.pdf",
        mimetype="application/pdf"
    )

@app.route("/compare-from-batch", methods=["POST"])
def compare_from_batch():
    if not login_required():
        return redirect(url_for("login"))

    selected = request.form.getlist("compare_ids")

    if len(selected) != 2:
        return render_template(
            "batch_results.html",
            error="Please select exactly 2 resumes to compare",
            ranked_results=session.get("last_batch_results", [])
        )

    batch = session.get("last_batch_results")
    if not batch:
        return render_template(
            "batch_results.html",
            error="Batch results expired. Please re-run batch screening."
        )

    try:
        idx1 = int(selected[0])
        idx2 = int(selected[1])
        
        if idx1 >= len(batch) or idx2 >= len(batch):
            return render_template(
                "batch_results.html",
                error="Invalid selection. Please try again.",
                ranked_results=batch
            )
        
        r1 = batch[idx1]
        r2 = batch[idx2]
    except (ValueError, IndexError) as e:
        print(f"Error selecting resumes: {e}")
        return render_template(
            "batch_results.html",
            error="Invalid selection. Please try again.",
            ranked_results=batch
        )

    # Convert batch results format to comparison format
    # Batch results are already in percentage (e.g., 75.5)
    # Comparison template expects decimals for some calculations
    resume_1 = {
        "final": r1["final"] / 100,  # Convert to decimal for template
        "match": r1["match"] / 100,
        "quality": r1.get("quality", 70) / 100,
        "coverage": r1["coverage"],
        "filename": r1["filename"]
    }
    
    resume_2 = {
        "final": r2["final"] / 100,
        "match": r2["match"] / 100,
        "quality": r2.get("quality", 70) / 100,
        "coverage": r2["coverage"],
        "filename": r2["filename"]
    }

    winner = "resume_1" if r1["final"] > r2["final"] else "resume_2"

    # Store for PDF export (in percentage format)
    session["last_compare_result"] = {
        "resume_1": {
            "final": r1["final"],
            "match": r1["match"],
            "quality": r1.get("quality", 70),
            "coverage": r1["coverage"]
        },
        "resume_2": {
            "final": r2["final"],
            "match": r2["match"],
            "quality": r2.get("quality", 70),
            "coverage": r2["coverage"]
        },
        "winner": winner
    }

    return render_template(
        "compare_results.html",
        resume_1=resume_1,
        resume_2=resume_2,
        winner=winner,
        from_batch=True
    )


# =========================================================
# 🔥 API ENDPOINTS FOR AJAX REQUESTS
# =========================================================
@app.route("/api/batch-screen", methods=["POST"])
def api_batch_screen():
    """API endpoint for batch screening (returns JSON)"""
    try:
        if not login_required():
            return jsonify({"error": "Unauthorized"}), 401

        if not MODELS:
            return jsonify({"error": "ML models not loaded"}), 500

        files = request.files.getlist("resumes")
        job_desc = request.form.get("job_desc", "")
        job_role = request.form.get("job_role")

        if job_role in JOB_TEMPLATES and not job_desc.strip():
            job_desc = JOB_TEMPLATES[job_role]

        results = []

        for file in files:
            if not file.filename.lower().endswith(".pdf"):
                continue

            try:
                reader = PyPDF2.PdfReader(file)
                text = "".join(page.extract_text() or "" for page in reader.pages)

                if not text.strip():
                    continue

                scores = score_resume(text, job_desc)

                results.append({
                    "filename": file.filename,
                    "final": round(scores["final"] * 100, 1),
                    "quality": round(scores["quality"] * 100, 1),
                    "match": round(scores["match"] * 100, 1),
                    "coverage": scores["coverage"]
                })
            except Exception as e:
                print(f"Error processing {file.filename}: {e}")
                continue

        if not results:
            return jsonify({"error": "No valid resumes found"}), 400

        results.sort(key=lambda x: x["final"], reverse=True)
        
        session["last_batch_results"] = results
        session["last_job_role"] = job_role

        return jsonify({"ranked_results": results})

    except Exception as e:
        print("API BATCH ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/compare-resumes", methods=["POST"])
def api_compare_resumes():
    """API endpoint for resume comparison (returns JSON)"""
    if not login_required():
        return jsonify({"error": "Unauthorized"}), 401

    if not MODELS:
        return jsonify({"error": "ML models not loaded"}), 500

    r1 = request.files.get("resume1")
    r2 = request.files.get("resume2")
    job_desc = request.form.get("job_desc", "")
    job_role = request.form.get("job_role")

    if not r1 or not r2:
        return jsonify({"error": "Please upload both resumes"}), 400

    if job_role in JOB_TEMPLATES and not job_desc.strip():
        job_desc = JOB_TEMPLATES[job_role]

    def extract_text(file):
        try:
            reader = PyPDF2.PdfReader(file)
            return " ".join(
                p.extract_text() for p in reader.pages if p.extract_text()
            )
        except:
            return ""

    t1 = extract_text(r1)
    t2 = extract_text(r2)

    if not t1.strip() or not t2.strip():
        return jsonify({"error": "Could not extract text from PDFs"}), 400

    s1 = score_resume(t1, job_desc)
    s2 = score_resume(t2, job_desc)

    result = {
        "resume_1": {
            "final": s1["final"],
            "match": s1["match"],
            "coverage": s1["coverage"]
        },
        "resume_2": {
            "final": s2["final"],
            "match": s2["match"],
            "coverage": s2["coverage"]
        },
        "winner": "resume_1" if s1["final"] > s2["final"] else "resume_2"
    }

    session["last_compare_result"] = result

    return jsonify(result)


# ================= UTIL =================
@app.route("/download/<f>")
def download_file(f):
    if not login_required():
        return redirect(url_for("login"))
    
    filepath = os.path.join(UPLOAD, f)
    if not os.path.exists(filepath):
        return "File not found", 404
    
    return send_file(filepath, as_attachment=True)

@app.route("/api/health")
def health():
    return jsonify({
        "models_loaded": MODELS,
        "auth": "enabled",
        "batch_screening": True,
        "resume_comparison": True,
        "features": [
            "single_resume_analysis",
            "batch_screening",
            "resume_comparison",
            "pdf_report_generation",
            "skill_gap_analysis",
            "ats_decision_logic"
        ]
    })

# ================= ERROR HANDLERS =================
@app.errorhandler(404)
def not_found(e):
    return render_template("login.html", error="Page not found"), 404

@app.errorhandler(500)
def server_error(e):
    return render_template("login.html", error="Internal server error"), 500

# ================= RUN =================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
