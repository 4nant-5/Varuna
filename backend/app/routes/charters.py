"""
Charter CRUD Routes - Supports saving optimization results, archiving past fixtures,
and retrieving historical charter party records with dispatcher logs.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any, List
from datetime import datetime
import json
import os
import uuid

router = APIRouter()

CHARTERS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "charters.json")
PAST_CHARTERS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "past_charters.json")


def _load_json(file_path: str) -> list:
    if os.path.exists(file_path):
        try:
            with open(file_path, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return []


def _save_json(file_path: str, data: list):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "w") as f:
        json.dump(data, f, indent=2)


DEMO_PAST_CHARTERS = [
    {
        "id": "FX-2026-0891",
        "cargoType": "Coking Coal",
        "quantity": 80000,
        "loadPort": "Hay Point, Australia",
        "dischargePort": "Paradip, India",
        "vesselName": "MV Kamsar Leader",
        "vesselClass": "Panamax",
        "actualFreight": 23.40,
        "benchmarkRate": 25.80,
        "realizedSavings": 192000,
        "voyageDays": 21.5,
        "completedDate": "2026-08-18",
        "dispatcherName": "Capt. Rajesh Nair",
        "status": "completed",
        "despatchEarned": 14200,
        "demurrageIncurred": 0,
    },
    {
        "id": "FX-2026-0744",
        "cargoType": "Iron Ore Fines",
        "quantity": 175000,
        "loadPort": "Port Hedland, Australia",
        "dischargePort": "Dhamra, India",
        "vesselName": "MV Ocean Cape",
        "vesselClass": "Capesize",
        "actualFreight": 16.80,
        "benchmarkRate": 18.50,
        "realizedSavings": 297500,
        "voyageDays": 17.8,
        "completedDate": "2026-07-29",
        "dispatcherName": "Capt. Rajesh Nair",
        "status": "completed",
        "despatchEarned": 22000,
        "demurrageIncurred": 0,
    },
    {
        "id": "FX-2026-0612",
        "cargoType": "Thermal Coal",
        "quantity": 62000,
        "loadPort": "Muara Berau, Indonesia",
        "dischargePort": "Visakhapatnam, India",
        "vesselName": "MV Ultramax Voyager",
        "vesselClass": "Supramax",
        "actualFreight": 12.90,
        "benchmarkRate": 14.10,
        "realizedSavings": 74400,
        "voyageDays": 14.2,
        "completedDate": "2026-07-10",
        "dispatcherName": "Capt. S. Sengupta",
        "status": "completed",
        "despatchEarned": 8500,
        "demurrageIncurred": 0,
    },
]


@router.post("/saved")
@router.post("/save")
async def save_charter(payload: Dict[str, Any]):
    """Save an active or recommended charter strategy."""
    charters = _load_json(CHARTERS_FILE)
    
    charter_id = payload.get("id") or f"CH-{str(uuid.uuid4())[:6].upper()}"
    new_charter = {
        "id": charter_id,
        "status": "saved",
        "created_at": datetime.now().isoformat(),
        **payload,
    }
    
    charters.insert(0, new_charter)
    _save_json(CHARTERS_FILE, charters)
    return {"message": "Charter successfully saved", "charter": new_charter}


@router.get("/saved")
async def get_saved_charters():
    """Retrieve all saved charters."""
    charters = _load_json(CHARTERS_FILE)
    return charters if isinstance(charters, list) else []


@router.post("/past")
async def record_past_charter(payload: Dict[str, Any]):
    """Record an executed fixture into past charters."""
    past = _load_json(PAST_CHARTERS_FILE)
    if not past:
        past = list(DEMO_PAST_CHARTERS)
    
    fixture_id = payload.get("id") or f"FX-{str(uuid.uuid4())[:6].upper()}"
    new_fixture = {
        "id": fixture_id,
        "completedDate": datetime.now().strftime("%Y-%m-%d"),
        "status": "completed",
        **payload,
    }
    past.insert(0, new_fixture)
    _save_json(PAST_CHARTERS_FILE, past)
    return {"message": "Past fixture recorded", "fixture": new_fixture}


@router.get("/past")
async def get_past_charters():
    """Retrieve past executed charters and fixtures."""
    past = _load_json(PAST_CHARTERS_FILE)
    if not past:
        past = list(DEMO_PAST_CHARTERS)
        _save_json(PAST_CHARTERS_FILE, past)
    return past
