from fastapi import APIRouter, HTTPException
from app.schemas.analysis import (
    AnalyzeRequest,
    AnalyzeResponse,
    ChatRequest,
    ChatResponse,
    TechStackItem,
    FolderExplanationItem,
    RoadmapStep,
    ImportantFileItem,
    TopLevelFolderItem,
)
from app.services import RepositoryService, ParserService

router = APIRouter()
repository_service = RepositoryService()
parser_service = ParserService()

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_repository(payload: AnalyzeRequest):
    """
    Analyzes a GitHub repository URL: validates and clones the repository,
    and returns a summary, tech stack, folder explanation, onboarding roadmap,
    and clone metadata.
    """
    try:
        clone_info = repository_service.clone_repository(payload.repo_url)
        parser_info = parser_service.parse_repository(clone_info["local_clone_path"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Dynamically build tech_stack from detected frameworks and languages
    tech_stack = []
    for framework in parser_info["detected_frameworks"]:
        category = "Frontend"
        if framework in ("FastAPI", "Django", "Flask", "Express"):
            category = "Backend"
        elif framework in ("Vite", "Turbopack", "Webpack"):
            category = "DevOps"
        tech_stack.append(TechStackItem(name=framework, category=category, icon=framework.lower()))
        
    for language in parser_info["detected_languages"]:
        tech_stack.append(TechStackItem(name=language, category="Language", icon=language.lower()))

    # Dynamically list top-level folders with purpose "Unknown"
    folder_explanation = [
        FolderExplanationItem(path=folder["name"] + "/", purpose=folder["purpose"])
        for folder in parser_info["top_level_folders"]
    ]

    # Generate a deterministic static roadmap based on the detected repository type
    repo_type = parser_info["repository_type"]
    roadmap = [
        RoadmapStep(
            step_number=1,
            title="Read Project Documentation",
            description=f"Start with README.md to understand the setup and design guidelines of this {repo_type}."
        ),
        RoadmapStep(
            step_number=2,
            title="Explore Configuration Files",
            description="Examine package.json, requirements.txt, or other config files to understand the dependencies."
        )
    ]

    return AnalyzeResponse(
        summary=parser_info["description"],
        tech_stack=tech_stack,
        folder_explanation=folder_explanation,
        roadmap=roadmap,
        repository_name=clone_info["repository_name"],
        default_branch=clone_info["default_branch"],
        local_clone_path=clone_info["local_clone_path"],
        clone_status=clone_info["clone_status"],
        project_name=parser_info["project_name"],
        description=parser_info["description"],
        repository_type=repo_type,
        detected_frameworks=parser_info["detected_frameworks"],
        detected_languages=parser_info["detected_languages"],
        important_files=[
            ImportantFileItem(file=f["file"], purpose=f["purpose"])
            for f in parser_info["important_files"]
        ],
        top_level_folders=[
            TopLevelFolderItem(name=f["name"], purpose=f["purpose"])
            for f in parser_info["top_level_folders"]
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
