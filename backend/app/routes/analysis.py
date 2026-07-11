from fastapi import APIRouter
from app.schemas.analysis import (
    AnalyzeRequest,
    AnalyzeResponse,
    ChatRequest,
    ChatResponse,
    TechStackItem,
    FolderExplanationItem,
    RoadmapStep,
)

router = APIRouter()

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_repository(payload: AnalyzeRequest):
    """
    Analyzes a GitHub repository URL and returns a summary, tech stack,
    folder explanation, and onboarding roadmap.
    Returns realistic mock data for this phase of the hackathon demo.
    """
    # TODO: Implement repository cloning, parsing, and LLM analysis in future phases.
    return AnalyzeResponse(
        summary=(
            "FirstCommit AI is a specialized onboarding assistant designed to help developers "
            "understand any repository and make their first meaningful contribution in minutes. "
            "It automatically parses repository structures, extracts technologies, and generates "
            "interactive roadmaps using Gemini."
        ),
        tech_stack=[
            TechStackItem(name="Next.js", category="Frontend", icon="nextjs"),
            TechStackItem(name="FastAPI", category="Backend", icon="fastapi"),
            TechStackItem(name="Python", category="Language", icon="python"),
            TechStackItem(name="TypeScript", category="Language", icon="typescript"),
            TechStackItem(name="ChromaDB", category="Database", icon="chromadb")
        ],
        folder_explanation=[
            FolderExplanationItem(
                path="backend/",
                purpose="FastAPI backend application including routers, schemas, and LLM orchestration logic."
            ),
            FolderExplanationItem(
                path="frontend/",
                purpose="Next.js frontend application containing user interfaces, dashboard, and interactive chatbot."
            ),
            FolderExplanationItem(
                path="docs/",
                purpose="Project documentation, architectural plans, and developer setup instructions."
            )
        ],
        roadmap=[
            RoadmapStep(
                step_number=1,
                title="Review Project Context",
                description="Read TEAM_CONTEXT.md to align on the project scope, technical stack, and contribution workflow."
            ),
            RoadmapStep(
                step_number=2,
                title="Initialize Backend",
                description="Navigate to the backend/ folder, install requirements, and run the FastAPI server locally."
            ),
            RoadmapStep(
                step_number=3,
                title="Explore the Codebase Structure",
                description="Browse the schemas/ and routes/ directories to understand how the API contract is structured."
            ),
            RoadmapStep(
                step_number=4,
                title="Implement Feature",
                description="Identify a feature on the roadmap or task list and implement it following modular code standards."
            )
        ]
    )

@router.post("/chat", response_model=ChatResponse)
async def chat_with_repository(payload: ChatRequest):
    """
    Answers questions about a repository using RAG.
    Returns realistic mock data for this phase of the hackathon demo.
    """
    # TODO: Implement ChromaDB and Gemini RAG search in future phases.
    return ChatResponse(
        answer=(
            f"To run the backend development server for the repository (ID: {payload.repo_id}), "
            "navigate to the 'backend/' directory, install the required libraries with 'pip install -r requirements.txt', "
            "and start the application using the command: 'uvicorn app.main:app --reload'."
        ),
        referenced_files=[
            "backend/requirements.txt",
            "backend/app/main.py",
            "backend/app/routes/analysis.py"
        ]
    )
