from typing import List
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

class AnalyzeResponse(BaseModel):
    summary: str
    tech_stack: List[TechStackItem]
    folder_explanation: List[FolderExplanationItem]
    roadmap: List[RoadmapStep]
    repository_name: str
    default_branch: str
    local_clone_path: str
    clone_status: str

class ChatRequest(BaseModel):
    repo_id: str
    question: str

class ChatResponse(BaseModel):
    answer: str
    referenced_files: List[str]
