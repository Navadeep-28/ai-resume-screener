import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

DB = "users.db"

# ================= DATABASE INIT =================
def init_db():
    """
    Initializes the users table.
    Role is OPTIONAL and defaults to 'hr'.
    """
    with sqlite3.connect(DB) as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'hr'
        )
        """)

# ================= REGISTER =================
def register_user(username, password, role=None):
    """
    Registers a user.
    - Default role: hr
    - Optional role: admin
    """
    role = role if role in ["admin", "hr"] else "hr"
    hashed_password = generate_password_hash(password)

    try:
        with sqlite3.connect(DB) as conn:
            conn.execute(
                "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                (username, hashed_password, role)
            )
        return True
    except sqlite3.IntegrityError:
        # Username already exists
        return False

# ================= AUTHENTICATE =================
def authenticate_user(username, password):
    """
    Authenticates user credentials.
    Returns role if valid, else None.
    """
    with sqlite3.connect(DB) as conn:
        row = conn.execute(
            "SELECT password, role FROM users WHERE username=?",
            (username,)
        ).fetchone()

    if row and check_password_hash(row[0], password):
        return row[1]

    return None

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
