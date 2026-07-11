from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import api_router

app = FastAPI(
    title="FirstCommit AI API",
    description="Backend API for FirstCommit AI Developer Onboarding Assistant",
    version="0.1.0"
)

# Configure CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allowed all origins for smooth hackathon demo integration
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the centralized API router
app.include_router(api_router)

@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify backend service status.
    """
    return {"status": "healthy", "service": "FirstCommit AI Backend"}
