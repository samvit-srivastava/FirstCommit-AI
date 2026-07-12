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
    DetailedTechItem,
    FolderExplanationRichItem,
    GraphResponse,
)
from app.services import (
    RepositoryService,
    ParserService,
    TechDetectorService,
    FolderExplanationService,
    RepositoryKnowledgeEngine,
)

router = APIRouter()
repository_service = RepositoryService()
parser_service = ParserService()
tech_detector_service = TechDetectorService()
folder_explanation_service = FolderExplanationService()
repository_knowledge_engine = RepositoryKnowledgeEngine()

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
        detected_tech = tech_detector_service.detect_technologies(clone_info["local_clone_path"])
        tech_names = [t["display_name"] for t in detected_tech]
        
        # Query Repository Knowledge Engine (RKE) Core
        rke_index = repository_knowledge_engine.get_index(clone_info["local_clone_path"])
        
        # Always prepend root folder ("") summary so root files list and metadata is visible
        rich_folders = [
            repository_knowledge_engine.get_folder_summary(clone_info["local_clone_path"], "", tech_names)
        ] + [
            repository_knowledge_engine.get_folder_summary(clone_info["local_clone_path"], f["name"], tech_names)
            for f in parser_info["top_level_folders"]
        ]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Dynamically build tech_stack from detected frameworks and languages
    tech_stack = []
    for t in detected_tech:
        tech_stack.append(TechStackItem(
            name=t["name"],
            category=t["category"],
            icon=t["name"].lower().replace(" ", "").replace(".", "")
        ))

    # Dynamically list folders with Root prefixed
    folder_explanation = [
        FolderExplanationItem(path="Root/", purpose="Contains project configuration and entrypoints.")
    ] + [
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
        ],
        technologies=[
            DetailedTechItem(
                id=t["id"],
                display_name=t["display_name"],
                name=t["name"],
                category=t["category"],
                confidence=t["confidence"],
                evidence=t["evidence"],
                coverage=t["coverage"],
                version=t["version"]
            )
            for t in detected_tech
        ],
        folders=[
            FolderExplanationRichItem(
                name=f["name"],
                category=f["category"],
                description=f["description"],
                contains=f["contains"],
                importance=f["importance"],
                confidence=f["confidence"],
                source=f["source"],
                provider=f.get("provider"),
                model=f.get("model"),
                files_count=f.get("files_count", 0),
                size_bytes=f.get("size_bytes", 0)
            )
            for f in rich_folders
        ],
        readme=parser_info.get("readme", "")
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

@router.get("/graph", response_model=GraphResponse)
async def get_repository_graph(repo_url: str):
    """
    Exposes the unified knowledge graph and brain summary for a repository.
    Reads directly from the cached engine index.
    """
    try:
        # Resolve target clone path based on the validated URL
        owner, repo_name = repository_service._validate_and_parse_url(repo_url)
        import tempfile
        from pathlib import Path
        temp_dir = Path(tempfile.gettempdir()) / "firstcommit_ai"
        local_clone_path = temp_dir / f"{owner}_{repo_name}"
        
        if not local_clone_path.exists():
            raise HTTPException(status_code=404, detail="Repository must be analyzed first before querying its graph.")
            
        rke_index = repository_knowledge_engine.get_index(str(local_clone_path))
        return GraphResponse(
            repository=rke_index["repository"],
            generated_at=rke_index["generated_at"],
            graph={
                "nodes": rke_index["graph"]["nodes"],
                "edges": rke_index["graph"]["edges"],
                "adjacency_map": rke_index["graph"]["adjacency_map"]
            },
            brain={
                "languages": rke_index["brain"]["languages"],
                "frameworks": rke_index["brain"]["frameworks"],
                "entry_points": rke_index["brain"]["entry_points"],
                "largest_folder": rke_index["brain"]["largest_folder"],
                "top_symbols": rke_index["brain"]["top_symbols"],
                "most_imported_module": rke_index["brain"]["most_imported_module"]
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve graph index: {str(e)}")

