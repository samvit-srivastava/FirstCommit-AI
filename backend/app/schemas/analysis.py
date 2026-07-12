from typing import List, Optional
from pydantic import BaseModel

class AnalyzeRequest(BaseModel):
    repo_url: str

class TechStackItem(BaseModel):
    name: str
    category: str
    icon: str

class FolderExplanationItem(BaseModel):
    path: str
    purpose: str

class RoadmapStep(BaseModel):
    step_number: int
    title: str
    description: str

class ImportantFileItem(BaseModel):
    file: str
    purpose: str

class TopLevelFolderItem(BaseModel):
    name: str
    purpose: str

class DetailedTechItem(BaseModel):
    id: str
    display_name: str
    name: str
    category: str
    confidence: int
    evidence: str
    coverage: int
    version: Optional[str] = None

class FolderExplanationRichItem(BaseModel):
    name: str
    category: str
    description: str
    contains: List[str]
    importance: str
    confidence: int
    source: str
    provider: Optional[str] = None
    model: Optional[str] = None
    files_count: int
    size_bytes: int

class AnalyzeResponse(BaseModel):
    summary: str
    tech_stack: List[TechStackItem]
    folder_explanation: List[FolderExplanationItem]
    roadmap: List[RoadmapStep]
    repository_name: str
    default_branch: str
    local_clone_path: str
    clone_status: str
    project_name: str
    description: str
    repository_type: str
    detected_frameworks: List[str]
    detected_languages: List[str]
    important_files: List[ImportantFileItem]
    top_level_folders: List[TopLevelFolderItem]
    technologies: List[DetailedTechItem]
    folders: List[FolderExplanationRichItem]
    readme: Optional[str] = None

class ChatRequest(BaseModel):
    repo_id: str
    question: str

class ChatResponse(BaseModel):
    answer: str
    referenced_files: List[str]

class GraphNode(BaseModel):
    id: str
    name: str
    type: str
    location: str
    language: Optional[str] = None
    importance_score: Optional[float] = None

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relation: str
    file_path: Optional[str] = None
    language: Optional[str] = None
    line_number: Optional[int] = None

class RepositoryBrain(BaseModel):
    languages: List[str]
    frameworks: List[str]
    entry_points: List[str]
    largest_folder: str
    top_symbols: List[str]
    most_imported_module: str

class UnifiedGraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    adjacency_map: dict

class GraphResponse(BaseModel):
    repository: str
    generated_at: str
    graph: UnifiedGraphData
    brain: RepositoryBrain

