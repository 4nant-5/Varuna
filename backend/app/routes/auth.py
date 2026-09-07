"""
Varuna API — Authentication Routes (JWT-based)
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta
import hashlib
import json
import os
import secrets

router = APIRouter()

USERS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "users.json")

# JWT configuration
JWT_SECRET = os.environ.get("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

try:
    from jose import jwt as jose_jwt
    HAS_JOSE = True
except ImportError:
    HAS_JOSE = False
    import base64

DEFAULT_USERS = {
    "officer@sail.gov.in": {
        "name": "Rajesh Sharma",
        "email": "officer@sail.gov.in",
        "password_hash": hashlib.sha256("steel2026".encode()).hexdigest(),
        "company": "Steel Authority of India Ltd (SAIL)",
        "role": "Chief Procurement & Chartering Officer",
    },
    "admin@ministryofsteel.gov.in": {
        "name": "Dr. V. Ramanathan",
        "email": "admin@ministryofsteel.gov.in",
        "password_hash": hashlib.sha256("admin123".encode()).hexdigest(),
        "company": "Ministry of Steel, Govt of India",
        "role": "Joint Secretary (Raw Materials & Logistics)",
    },
    "charterer@vizagsteel.com": {
        "name": "K. Srinivas",
        "email": "charterer@vizagsteel.com",
        "password_hash": hashlib.sha256("vizag2026".encode()).hexdigest(),
        "company": "Rashtriya Ispat Nigam Ltd (RINL)",
        "role": "Maritime Chartering Specialist",
    },
}


def _load_users():
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    _save_users(DEFAULT_USERS)
    return DEFAULT_USERS


def _save_users(users):
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _generate_token(email: str, name: str) -> str:
    """Generate a JWT token with email, name, and expiration."""
    payload = {
        "sub": email,
        "name": name,
        "iat": datetime.utcnow().isoformat(),
        "exp": (datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)).isoformat(),
    }
    if HAS_JOSE:
        return jose_jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    else:
        # Fallback: base64 JSON (less secure but functional)
        import base64
        return base64.b64encode(json.dumps(payload).encode()).decode()


def _decode_token(token: str) -> dict:
    """Decode and validate a JWT token. Returns payload or raises."""
    try:
        if HAS_JOSE:
            payload = jose_jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        else:
            import base64
            payload = json.loads(base64.b64decode(token).decode())
        
        # Check expiration
        exp_str = payload.get("exp", "")
        if exp_str:
            exp_dt = datetime.fromisoformat(exp_str)
            if datetime.utcnow() > exp_dt:
                raise HTTPException(status_code=401, detail="Token expired")
        
        return payload
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


def _extract_token(authorization: str) -> str:
    """Extract Bearer token from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    return authorization[7:]


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    organization: str = "Steel Authority of India Ltd (SAIL)"
    company: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
async def register(req: RegisterRequest):
    users = _load_users()
    email_clean = req.email.strip().lower()
    
    if email_clean in users:
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please sign in instead.")
    
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
    
    users[email_clean] = {
        "name": req.name,
        "email": email_clean,
        "password_hash": _hash_password(req.password),
        "company": req.organization or req.company or "Maritime Enterprise",
        "role": "Procurement Specialist",
        "created_at": datetime.now().isoformat(),
    }
    _save_users(users)
    
    token = _generate_token(email_clean, req.name)
    return {
        "token": token,
        "user": {
            "name": req.name,
            "email": email_clean,
            "organization": users[email_clean]["company"],
            "role": users[email_clean]["role"],
        }
    }


@router.post("/login")
async def login(req: LoginRequest):
    users = _load_users()
    email_clean = req.email.strip().lower()
    
    if email_clean not in users:
        raise HTTPException(status_code=401, detail="No account found with this email. Please register first.")
    
    u = users[email_clean]
    
    # Verify password
    if u.get("password_hash") != _hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid password. Please try again.")
    
    token = _generate_token(email_clean, u["name"])
    return {
        "token": token,
        "user": {
            "name": u["name"],
            "email": u["email"],
            "organization": u.get("company", "Maritime Enterprise"),
            "role": u.get("role", "Chartering Officer"),
        }
    }


@router.get("/me")
async def get_current_user(authorization: str = ""):
    """Validate token and return current user info."""
    # Try from header or query
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    payload = _decode_token(token)
    
    email = payload.get("sub", "")
    users = _load_users()
    
    if email not in users:
        raise HTTPException(status_code=401, detail="User not found")
    
    u = users[email]
    return {
        "user": {
            "name": u["name"],
            "email": u["email"],
            "organization": u.get("company", "Maritime Enterprise"),
            "role": u.get("role", "Chartering Officer"),
        }
    }
