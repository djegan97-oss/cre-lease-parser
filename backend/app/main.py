"""
IOS Zoning MVP - FastAPI Application
Main entry point for the backend API
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import parcels

app = FastAPI(
    title="IOS Zoning Intelligence Platform",
    description="API for analyzing Industrial Outdoor Storage zoning opportunities",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(parcels.router, prefix="/parcels", tags=["parcels"])

@app.get("/")
async def root():
    return {
        "message": "IOS Zoning Intelligence Platform API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
