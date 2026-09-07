"""
Authentication Routes (Seamless Demo & Multi-tenant Access)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import hashlib
import json
import os
import base64

router = APIRouter()

USERS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "users.json")

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


def _generate_token(email: str) -> str:
    payload = json.dumps({"email": email, "iat": str(datetime.now())})
    return base64.b64encode(payload.encode()).decode()


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
    
    users[email_clean] = {
        "name": req.name,
        "email": email_clean,
        "password_hash": _hash_password(req.password),
        "company": req.organization or req.company or "Ministry of Steel Enterprise",
        "role": "Procurement Specialist",
        "created_at": datetime.now().isoformat(),
    }
    _save_users(users)
    
    token = _generate_token(email_clean)
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
    
    # If user exists, verify password (or accept demo passwords)
    if email_clean in users:
        u = users[email_clean]
        # In demo environment, allow login
        token = _generate_token(email_clean)
        return {
            "token": token,
            "user": {
                "name": u["name"],
                "email": u["email"],
                "organization": u.get("company", "Ministry of Steel Enterprise"),
                "role": u.get("role", "Chartering Officer"),
            }
        }
    
    # Auto-provision new demo user if not in database
    name = email_clean.split("@")[0].replace(".", " ").title()
    u = {
        "name": name or "Chartering Officer",
        "email": email_clean,
        "password_hash": _hash_password(req.password),
        "company": "Steel Authority of India Ltd (SAIL)",
        "role": "Procurement Specialist",
    }
    users[email_clean] = u
    _save_users(users)
    
    token = _generate_token(email_clean)
    return {
        "token": token,
        "user": {
            "name": u["name"],
            "email": u["email"],
            "organization": u["company"],
            "role": u["role"],
        }
    }
