"""
Varuna API — Main Application
Smarter Chartering, Brighter Trades
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth, charters, optimize, commodities

app = FastAPI(
    title="Varuna API",
    description="Varuna — Smarter Chartering, Brighter Trades. Intelligent Freight Forecasting & Charter Optimization Platform.",
    version="2.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(charters.router, prefix="/api/charters", tags=["Charters"])
app.include_router(optimize.router, prefix="/api/optimize", tags=["Optimization"])
app.include_router(commodities.router, prefix="/api/commodities", tags=["Commodities"])


@app.get("/")
async def root():
    return {"message": "Varuna API v2.0 — Smarter Chartering, Brighter Trades", "status": "operational"}


@app.get("/api/health")
async def health():
    return {"status": "healthy", "model_loaded": True}
