import asyncio
from fastapi import APIRouter, HTTPException
from app.schemas.analysis import (
    AnalyzeRequest,
    AnalyzeResponse,
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


def _analyze_repository_sync(repo_url: str) -> AnalyzeResponse:
    """
    Blocking analysis pipeline. Runs in a worker thread so the API stays responsive.
    """
    clone_info = repository_service.clone_repository(repo_url)
    parser_info = parser_service.parse_repository(clone_info["local_clone_path"])
    detected_tech = tech_detector_service.detect_technologies(clone_info["local_clone_path"])
    tech_names = [t["display_name"] for t in detected_tech]

    rke_index = repository_knowledge_engine.get_index(clone_info["local_clone_path"])

    rich_folders = [
        repository_knowledge_engine.get_folder_summary(
            clone_info["local_clone_path"], "", tech_names, index=rke_index
        )
    ] + [
        repository_knowledge_engine.get_folder_summary(
            clone_info["local_clone_path"], f["name"], tech_names, index=rke_index
        )
        for f in parser_info["top_level_folders"]
    ]

    github_meta = repository_service.get_github_metadata(repo_url)

    tech_stack = []
    for t in detected_tech:
        tech_stack.append(
            TechStackItem(
                name=t["name"],
                category=t["category"],
                icon=t["name"].lower().replace(" ", "").replace(".", ""),
            )
        )

    folder_explanation = [
        FolderExplanationItem(path="Root/", purpose="Contains project configuration and entrypoints.")
    ] + [
        FolderExplanationItem(path=folder["name"] + "/", purpose=folder["purpose"])
        for folder in parser_info["top_level_folders"]
    ]

    repo_type = parser_info["repository_type"]
    roadmap = [
        RoadmapStep(
            step_number=1,
            title="Read Project Documentation",
            description=f"Start with README.md to understand the setup and design guidelines of this {repo_type}.",
        ),
        RoadmapStep(
            step_number=2,
            title="Explore Configuration Files",
            description="Examine package.json, requirements.txt, or other config files to understand the dependencies.",
        ),
    ]

    desc = github_meta["description"] if github_meta["description"] else parser_info["description"]
    branch = github_meta["default_branch"] if github_meta["default_branch"] else clone_info["default_branch"]

    return AnalyzeResponse(
        summary=desc,
        tech_stack=tech_stack,
        folder_explanation=folder_explanation,
        roadmap=roadmap,
        repository_name=clone_info["repository_name"],
        default_branch=branch,
        local_clone_path=clone_info["local_clone_path"],
        clone_status=clone_info["clone_status"],
        project_name=parser_info["project_name"],
        description=desc,
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
                version=t["version"],
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
                size_bytes=f.get("size_bytes", 0),
            )
            for f in rich_folders
        ],
        readme=parser_info.get("readme", ""),
        stars=github_meta["stars"],
        forks=github_meta["forks"],
        watchers=github_meta["watchers"],
        updated_at=github_meta["updated_at"],
    )


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_repository(payload: AnalyzeRequest):
    """
    Analyzes a GitHub repository URL: validates and clones the repository,
    and returns a summary, tech stack, folder explanation, onboarding roadmap,
    and clone metadata.
    """
    try:
        return await asyncio.to_thread(_analyze_repository_sync, payload.repo_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/graph", response_model=GraphResponse)
async def get_repository_graph(repo_url: str):
    """
    Exposes the unified knowledge graph and brain summary for a repository.
    Reads directly from the cached engine index.
    """
    try:
        local_clone_path = repository_service.resolve_clone_path(repo_url)

        if not local_clone_path.exists():
            raise HTTPException(
                status_code=404,
                detail="Repository must be analyzed first before querying its graph.",
            )

        rke_index = await asyncio.to_thread(
            repository_knowledge_engine.get_index, str(local_clone_path)
        )
        return GraphResponse(
            repository=rke_index["repository"],
            generated_at=rke_index["generated_at"],
            graph={
                "nodes": rke_index["graph"]["nodes"],
                "edges": rke_index["graph"]["edges"],
                "adjacency_map": rke_index["graph"]["adjacency_map"],
            },
            brain={
                "languages": rke_index["brain"]["languages"],
                "frameworks": rke_index["brain"]["frameworks"],
                "entry_points": rke_index["brain"]["entry_points"],
                "largest_folder": rke_index["brain"]["largest_folder"],
                "top_symbols": rke_index["brain"]["top_symbols"],
                "most_imported_module": rke_index["brain"]["most_imported_module"],
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve graph index: {str(e)}")
