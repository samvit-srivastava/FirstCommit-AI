import os
import json
import re
from pathlib import Path
from typing import Dict, List, Any

ALLOWED_CONFIG_FILES = {
    "README.md": "Contains project documentation, overview, and setup instructions.",
    "package.json": "Defines project metadata, scripts, and npm dependencies.",
    "requirements.txt": "Lists Python package dependencies required for the project.",
    "Dockerfile": "Configuration file for containerizing the application using Docker.",
    "docker-compose.yml": "Orchestrates multi-container Docker applications.",
    ".env.example": "Example environment variables configuration file.",
    "next.config.js": "Configuration file for Next.js framework settings.",
    "next.config.ts": "Configuration file for Next.js framework settings using TypeScript.",
    "vite.config.ts": "Configuration file for Vite build tool settings using TypeScript.",
    "vite.config.js": "Configuration file for Vite build tool settings.",
    "tsconfig.json": "TypeScript compiler settings and project configuration.",
    "main.py": "Main application entry point for the Python backend.",
    "server.js": "Main server entry point for the Node.js backend."
}

IGNORED_DIRECTORIES = {
    ".git",
    "node_modules",
    ".next",
    "__pycache__",
    ".venv",
    "env",
    "venv",
    ".pytest_cache",
    ".idea",
    ".vscode",
    "dist",
    "build",
    "out"
}

class ParserService:
    def parse_repository(self, local_clone_path: str) -> dict:
        """
        Exposes the single public method to parse the repository high-level metadata.
        Returns a structured dictionary matching the required output schema.
        Reads each allowed file at most once.
        """
        root = Path(local_clone_path)
        if not root.exists() or not root.is_dir():
            raise ValueError(f"Invalid repository path: {local_clone_path}")

        # 1. Read whitelisted files at most once
        readme_content = self._read_file_safe(root / "README.md")
        package_json_content = self._read_file_safe(root / "package.json")
        requirements_content = self._read_file_safe(root / "requirements.txt")

        # Parse package.json once
        package_json_data = None
        if package_json_content:
            try:
                package_json_data = json.loads(package_json_content)
            except Exception:
                pass

        result = {
            "project_name": root.name,
            "description": "",
            "repository_type": "Unknown",
            "detected_frameworks": [],
            "detected_languages": [],
            "important_files": [],
            "top_level_folders": [],
            "readme": readme_content
        }

        # 2. Extract Name & Description
        self._extract_metadata(root, readme_content, package_json_data, result)

        # 3. Detect Frameworks & Languages
        self._detect_tech_stack(root, package_json_data, requirements_content, result)

        # 4. Get Important Files list (checks existence without re-reading)
        self._collect_important_files(root, result)

        # 5. Get Top-Level Folders list
        self._collect_top_level_folders(root, result)

        # 6. Infer Repository Type
        self._infer_repository_type(result)

        return result

    def _read_file_safe(self, path: Path) -> str:
        """Reads a file safely, returning empty string on failure."""
        try:
            return path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            return ""

    def _clean_readme_formatting(self, text: str) -> str:
        """Removes HTML comments, badges, images, and HTML tags from markdown."""
        # 1. Remove HTML comments (multiline & single line)
        text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
        # 2. Remove link-wrapped badges/images: [![badge](url)](url)
        text = re.sub(r'\[\!\[.*?\]\(.*?\)\]\(.*?\)', '', text)
        # 3. Remove markdown images: ![alt](url)
        text = re.sub(r'\!\[.*?\]\(.*?\)', '', text)
        # 4. Remove HTML images: <img ...>
        text = re.sub(r'<img.*?>', '', text, flags=re.IGNORECASE | re.DOTALL)
        return text

    def _sanitize_prose(self, text: str) -> str:
        """
        Strips remaining HTML tags, converts Markdown links [text](url) to plain text (text),
        removes inline HTML attributes, normalizes whitespace, and cleans formatting symbols.
        """
        if not text:
            return ""

        # 1. Convert Markdown links [text](url) -> text
        text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)

        # 2. Strip remaining HTML tags but preserve inner text (e.g. <b>text</b> -> text)
        text = re.sub(r'<[^>]*>', '', text)

        # 3. Clean up Markdown inline formatting (bold, italics, code backticks)
        text = re.sub(r'\*\*([^*]+)\*\*|\*([^*]+)\*', r'\1\2', text)
        text = re.sub(r'__([^_]+)__|_([^_]+)_', r'\1\2', text)
        text = text.replace('`', '')

        # 4. Normalize whitespace
        text = re.sub(r'\s+', ' ', text)

        return text.strip()

    def _extract_metadata(self, root: Path, readme_content: str, package_json_data: dict, result: Dict[str, Any]) -> None:
        # Try package.json first
        if package_json_data:
            if package_json_data.get("name"):
                result["project_name"] = package_json_data["name"]
            if package_json_data.get("description"):
                result["description"] = package_json_data["description"]

        # Parse description from README.md if description not extracted from package.json or if name is still root.name
        if readme_content and (not result["description"] or result["project_name"] == root.name):
            cleaned_content = self._clean_readme_formatting(readme_content)
            lines = cleaned_content.splitlines()
            
            paragraph_lines = []
            title_found = False

            for line in lines:
                stripped = line.strip()
                if not stripped:
                    if paragraph_lines:
                        break # End of first paragraph
                    continue

                # Title detection
                if stripped.startswith("#"):
                    if paragraph_lines:
                        break # Hitting a new section, stop paragraph extraction
                    if not title_found:
                        if result["project_name"] == root.name:
                            result["project_name"] = stripped.lstrip("#").strip()
                        title_found = True
                    continue

                # Skip tables
                if stripped.startswith("|") or stripped.endswith("|") or ("|-" in stripped) or ("-|" in stripped) or (stripped.count("|") >= 2):
                    continue

                # Skip markdown line dividers, code blocks, or lists
                if stripped.startswith("---") or stripped.startswith("===") or stripped.startswith("```") or stripped.startswith("- ") or stripped.startswith("* ") or stripped.isdigit():
                    if paragraph_lines:
                        break
                    continue

                # Add normal text line to current paragraph
                paragraph_lines.append(stripped)

            extracted_desc = " ".join(paragraph_lines).strip()
            if extracted_desc and not result["description"]:
                result["description"] = extracted_desc

        # Final default fallback & sanitization
        if not result["description"]:
            result["description"] = "A software repository."
        else:
            result["description"] = self._sanitize_prose(result["description"])

    def _detect_tech_stack(self, root: Path, package_json_data: dict, requirements_content: str, result: Dict[str, Any]) -> None:
        frameworks = set()
        languages = set()

        # Check Python indicators: requirements.txt, pyproject.toml, main.py, or any root py file
        is_python_project = (
            bool(requirements_content) or
            (root / "pyproject.toml").exists() or
            (root / "main.py").exists() or
            any(root.glob("*.py"))
        )

        if is_python_project:
            languages.add("Python")

        # Check JS/TS indicators: package.json, tsconfig.json, server.js, or glob files
        is_ts = (root / "tsconfig.json").exists() or any(root.glob("*.ts")) or any(root.glob("*.tsx"))
        is_js = package_json_data is not None or (root / "server.js").exists() or any(root.glob("*.js"))

        if is_ts:
            languages.add("TypeScript")
        if is_js:
            languages.add("JavaScript")
        if (root / "Dockerfile").exists():
            languages.add("Docker")

        # Scan package.json dependencies for frameworks
        if package_json_data:
            deps = {**package_json_data.get("dependencies", {}), **package_json_data.get("devDependencies", {})}
            if "next" in deps:
                frameworks.add("Next.js")
            if "react" in deps:
                frameworks.add("React")
            if "vue" in deps:
                frameworks.add("Vue")
            if "svelte" in deps:
                frameworks.add("Svelte")
            if "express" in deps:
                frameworks.add("Express")
            if "vite" in deps:
                frameworks.add("Vite")
            if "tailwindcss" in deps:
                frameworks.add("TailwindCSS")

        # Scan requirements.txt content for FastAPI, Django, Flask
        if requirements_content:
            for line in requirements_content.splitlines():
                lowered = line.lower()
                # Use regex to match exact package name (e.g. fastapi==0.100.0 or fastapi>=0.9.0)
                if re.search(r'\bfastapi\b', lowered):
                    frameworks.add("FastAPI")
                elif re.search(r'\bdjango\b', lowered):
                    frameworks.add("Django")
                elif re.search(r'\bflask\b', lowered):
                    frameworks.add("Flask")

        # Direct root file framework checks
        if (root / "next.config.js").exists() or (root / "next.config.ts").exists():
            frameworks.add("Next.js")
        if (root / "vite.config.ts").exists() or (root / "vite.config.js").exists():
            frameworks.add("Vite")

        # Explicit fallback if main.py imports FastAPI but requirements.txt is empty or doesn't have it
        if "Python" in languages and (root / "main.py").exists():
            main_content = self._read_file_safe(root / "main.py")
            if "fastapi" in main_content.lower():
                frameworks.add("FastAPI")

        result["detected_frameworks"] = sorted(list(frameworks))
        result["detected_languages"] = sorted(list(languages))

    def _collect_important_files(self, root: Path, result: Dict[str, Any]) -> None:
        for filename, purpose in ALLOWED_CONFIG_FILES.items():
            file_path = root / filename
            if file_path.exists() and file_path.is_file():
                result["important_files"].append({
                    "file": filename,
                    "purpose": purpose
                })

    def _collect_top_level_folders(self, root: Path, result: Dict[str, Any]) -> None:
        try:
            for entry in os.scandir(root):
                if entry.is_dir() and entry.name not in IGNORED_DIRECTORIES:
                    result["top_level_folders"].append({
                        "name": entry.name,
                        "purpose": "Unknown"
                    })
            result["top_level_folders"].sort(key=lambda x: x["name"])
        except Exception:
            pass

    def _infer_repository_type(self, result: Dict[str, Any]) -> None:
        fw = result["detected_frameworks"]
        lang = result["detected_languages"]

        if "Next.js" in fw:
            result["repository_type"] = "Next.js App"
        elif "FastAPI" in fw:
            result["repository_type"] = "FastAPI Backend"
        elif "Django" in fw:
            result["repository_type"] = "Django Backend"
        elif "Express" in fw:
            result["repository_type"] = "Express Backend"
        elif "React" in fw and "Vite" in fw:
            result["repository_type"] = "Vite React App"
        elif "Python" in lang:
            result["repository_type"] = "Python Project"
        elif "TypeScript" in lang:
            result["repository_type"] = "TypeScript Project"
        elif "JavaScript" in lang:
            result["repository_type"] = "JavaScript Project"
        else:
            result["repository_type"] = "Unknown"
