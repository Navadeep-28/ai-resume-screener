import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

DB = "users.db"

# ================= DATABASE INIT =================
def init_db():
    """
    Initializes the users table with email and verification status.
    Role defaults to 'hr'. is_verified defaults to 1 (True - Auto-Verified).
    """
    with sqlite3.connect(DB) as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'hr',
            is_verified BOOLEAN DEFAULT 1
        )
        """)

# ================= REGISTER =================
def register_user(username, email, password, role=None):
    """
    Registers a new user.
    - Default role: hr
    - is_verified: 1 (True - Auto-Verified)
    Returns True if successful, False if username/email exists.
    """
    role = role if role in ["admin", "hr"] else "hr"
    hashed_password = generate_password_hash(password)
    email = email.lower().strip() # ✅ Force lowercase

    try:
        with sqlite3.connect(DB) as conn:
            cursor = conn.cursor()
            # ✅ is_verified set to 1 by default now
            cursor.execute(
                "INSERT INTO users (username, email, password, role, is_verified) VALUES (?, ?, ?, ?, 1)",
                (username, email, hashed_password, role)
            )
            conn.commit() # ✅ Explicit commit
        return True
    except sqlite3.IntegrityError:
        # Username or Email already exists
        return False

# ================= AUTHENTICATE =================
def authenticate_user(username, password):
    """
    Authenticates user credentials.
    Returns tuple: (role, is_verified) if credentials valid.
    Returns None if invalid.
    """
    with sqlite3.connect(DB) as conn:
        row = conn.execute(
            "SELECT password, role, is_verified FROM users WHERE username=?",
            (username,)
        ).fetchone()

    if row and check_password_hash(row[0], password):
        # Return role and verification status
        return row[1], bool(row[2])

    return None

# ================= VERIFICATION HELPERS =================
def verify_user_email(email):
    """
    Sets is_verified = 1 for the given email.
    (Kept for compatibility, but now users are auto-verified)
    """
    email = email.lower().strip() # ✅ Force lowercase
    try:
        with sqlite3.connect(DB) as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET is_verified = 1 WHERE email = ?", (email,))
            if cursor.rowcount > 0:
                conn.commit() # ✅ Explicit commit
                return True
            return False
    except Exception as e:
        print(f"DB Error verifying email: {e}")
        return False

def get_user_by_email(email):
    """
    Checks if a user exists with this email.
    Returns user row or None.
    """
    email = email.lower().strip() # ✅ Force lowercase
    with sqlite3.connect(DB) as conn:
        row = conn.execute(
            "SELECT username FROM users WHERE email=?",
            (email,)
        ).fetchone()
    return row

# ================= ROLE HELPERS (OPTIONAL) =================
def is_admin(username):
    with sqlite3.connect(DB) as conn:
        row = conn.execute(
            "SELECT role FROM users WHERE username=?",
            (username,)
        ).fetchone()
    return row and row[0] == "admin"

def user_exists(username):
    with sqlite3.connect(DB) as conn:
        row = conn.execute(
            "SELECT 1 FROM users WHERE username=?",
            (username,)
        ).fetchone()
    return row is not None
