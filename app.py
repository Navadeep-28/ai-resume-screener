#!/usr/bin/env python3
from flask import (
    Flask, request, render_template,
    send_file, jsonify, redirect, url_for, session
)
import os, re, json, joblib, sqlite3
import numpy as np
import PyPDF2
import spacy
from werkzeug.security import generate_password_hash, check_password_hash
from sklearn.metrics.pairwise import cosine_similarity
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet

# ================= APP SETUP =================
app = Flask(__name__)
app.secret_key = "change-this-secret-key"

UPLOAD = "uploads"
DB = "users.db"

os.makedirs(UPLOAD, exist_ok=True)
os.makedirs("models", exist_ok=True)

nlp = spacy.load("en_core_web_sm")

# ================= JOB DESCRIPTION TEMPLATES =================
JOB_TEMPLATES = {
    "python_dev": "Python Developer with Flask, Django, REST APIs and SQL.",
    "data_scientist": "Data Scientist skilled in Python, Pandas, NumPy, ML, NLP.",
    "ml_engineer": "ML Engineer with model training, deployment, NLP.",
    "frontend_dev": "Frontend Developer with HTML, CSS, JavaScript, React, UI/UX.",
    "backend_dev": "Backend Developer with APIs, databases, authentication."
}

# ================= DATABASE =================
def init_db():
    with sqlite3.connect(DB) as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'hr'
        )
        """)

init_db()

# ================= HELPERS =================
def clean_text(text):
    text = re.sub(r"\n+", " ", text.lower())
    text = re.sub(r"[^a-z\s]", " ", text)
    doc = nlp(text)
    return " ".join(t.lemma_ for t in doc if not t.is_stop)

def extract_keywords(text):
    doc = nlp(text.lower())
    return set(t.text for t in doc if t.is_alpha and not t.is_stop)

def register_user(username, password, role=None):
    role = role if role in ["admin", "hr"] else "hr"
    hashed = generate_password_hash(password)
    try:
        with sqlite3.connect(DB) as conn:
            conn.execute(
                "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                (username, hashed, role)
            )
        return True
    except sqlite3.IntegrityError:
        return False

def authenticate_user(username, password):
    with sqlite3.connect(DB) as conn:
        row = conn.execute(
            "SELECT password, role FROM users WHERE username=?",
            (username,)
        ).fetchone()
    if row and check_password_hash(row[0], password):
        return row[1]
    return None

def login_required():
    return "user" in session

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

# ================= AUTH ROUTES =================
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        role = authenticate_user(
            request.form["username"],
            request.form["password"]
        )
        if role:
            session["user"] = request.form["username"]
            session["role"] = role
            return redirect(url_for("index"))
        return render_template("login.html", error="Invalid credentials")
    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        if register_user(
            request.form["username"],
            request.form["password"],
            request.form.get("role")
        ):
            return redirect(url_for("login"))
        return render_template("register.html", error="User already exists")
    return render_template("register.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

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
        q = model_general.predict(
            tfidf_general.transform([clean_resume])
        )[0]

        m = model_match.predict(
            tfidf_match.transform([clean_resume + " " + clean_jd])
        )[0]

        final = 0.6 * q + 0.4 * m

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
            Paragraph(f"Final Score: {final:.1%}", styles["Normal"]),
            Paragraph(f"Quality Score: {q:.1%}", styles["Normal"]),
            Paragraph(f"Job Match Score: {m:.1%}", styles["Normal"]),
        ])

        os.remove(path)

        return render_template(
    "index.html",
    success=True,
    score=final,
    quality=q,
    match=m,
    top_skills=top_skills,
    report="report.pdf",
    preview=text[:500] + "...",
    job_templates=JOB_TEMPLATES,
    heatmap=heatmap_words   # ✅ PYTHON LIST
)


    return render_template(
        "index.html",
        job_templates=JOB_TEMPLATES
    )

# ================= UTIL =================
@app.route("/download/<f>")
def download(f):
    if not login_required():
        return redirect(url_for("login"))
    return send_file(os.path.join(UPLOAD, f), as_attachment=True)

@app.route("/api/health")
def health():
    return jsonify({
        "models_loaded": MODELS,
        "auth": "enabled"
    })

# ================= RUN =================
if __name__ == "__main__":
    app.run(debug=True)
