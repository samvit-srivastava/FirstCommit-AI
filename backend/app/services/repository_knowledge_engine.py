import os
import json
import hashlib
import subprocess
import re
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional, Set

# Languages mapping
EXT_TO_LANG = {
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".mjs": "JavaScript",
    ".cjs": "JavaScript",
    ".py": "Python",
    ".go": "Go",
    ".rs": "Rust",
    ".java": "Java",
    ".cs": "C#",
    ".php": "PHP",
    ".rb": "Ruby",
    ".c": "C",
    ".cpp": "C++",
    ".cc": "C++",
    ".cxx": "C++",
    ".h": "C++",
    ".hpp": "C++"
}

IGNORE_DIRECTORIES = {
    ".git",
    "node_modules",
    ".next",
    "dist",
    "build",
    "coverage",
    ".cache",
    "vendor",
    ".venv",
    "venv",
    "__pycache__",
    "target"
}

# Predefined templates from previous FolderExplanationService for clean O(1) matching in RKE summary
FOLDER_TEMPLATES = {
    ".devcontainer": {
        "category": "Infrastructure",
        "description": "Dev container configuration setting up reproducible local development environments.",
        "contains": ["devcontainer.json"],
        "importance": "Low"
    },
    ".vscode": {
        "category": "Infrastructure",
        "description": "VS Code workspace editor settings, recommended plugins, and launch configurations.",
        "contains": ["settings.json", "launch.json"],
        "importance": "Low"
    },
    ".idea": {
        "category": "Infrastructure",
        "description": "JetBrains IntelliJ/PyCharm editor workspace project settings.",
        "contains": ["workspace.xml"],
        "importance": "Low"
    },
    "config": {
        "category": "Infrastructure",
        "description": "Global environment settings, application setup configurations, and database credentials.",
        "contains": ["config.json", "settings.py"],
        "importance": "High"
    },
    "configs": {
        "category": "Infrastructure",
        "description": "Global environment settings, application setup configurations, and database credentials.",
        "contains": ["config.json", "settings.py"],
        "importance": "High"
    },
    "scripts": {
        "category": "Infrastructure",
        "description": "Contains automation scripts, utility helpers, build runs, and administrative shell programs.",
        "contains": ["deploy.sh", "setup.py", "build.js"],
        "importance": "Low"
    },
    "bin": {
        "category": "Infrastructure",
        "description": "Compiled binaries, wrapper executables, and shell command entrypoints.",
        "contains": ["start.sh", "run.exe"],
        "importance": "Medium"
    },
    "docs": {
        "category": "Documentation",
        "description": "Markdown or HTML documentation detailing API design, setup, architecture, and developer guidelines.",
        "contains": ["architecture.md", "setup.md", "api.md"],
        "importance": "Low"
    },
    "examples": {
        "category": "Documentation",
        "description": "Sample API requests, code integration examples, and demo runs helping developers get started.",
        "contains": ["demo.py", "sample.json"],
        "importance": "Low"
    },
    "packages": {
        "category": "Infrastructure",
        "description": "Sub-packages within a monorepo workspace containing separate modules and libraries.",
        "contains": ["core", "ui", "api"],
        "importance": "High"
    },
    "apps": {
        "category": "Infrastructure",
        "description": "Applications in a monorepo workspace structured alongside shared packages.",
        "contains": ["web", "docs", "api"],
        "importance": "High"
    },
    "plugins": {
        "category": "Infrastructure",
        "description": "Optional modular plugins, middleware add-ons, or custom hooks extending application capabilities.",
        "contains": ["plugin.ts"],
        "importance": "Medium"
    },
    "extensions": {
        "category": "Infrastructure",
        "description": "Optional modular plugins, middleware add-ons, or custom hooks extending application capabilities.",
        "contains": ["extension.ts"],
        "importance": "Medium"
    },
    "assets": {
        "category": "Assets",
        "description": "Static assets like images, fonts, logo vectors, and media files.",
        "contains": ["logo.png", "fonts/"],
        "importance": "Low"
    },
    "static": {
        "category": "Assets",
        "description": "Static media, raw public assets, and build outputs served directly by the web server.",
        "contains": ["favicon.ico", "robots.txt"],
        "importance": "Low"
    },
    "shared": {
        "category": "Infrastructure",
        "description": "Shared utility helpers, standard libraries, types, and configs reused across multiple workspaces.",
        "contains": ["utils.ts", "constants.ts"],
        "importance": "High"
    },
    "common": {
        "category": "Infrastructure",
        "description": "Shared utility helpers, standard libraries, types, and configs reused across multiple workspaces.",
        "contains": ["utils.ts", "constants.ts"],
        "importance": "High"
    },
    "core": {
        "category": "Backend",
        "description": "The main architectural heart of the application, implementing primary domain logic, services, and business rules.",
        "contains": ["engine.ts", "main.go", "core.py"],
        "importance": "High"
    },
    "server": {
        "category": "Backend",
        "description": "Backend server-side code containing routes, controllers, database connections, and APIs.",
        "contains": ["index.js", "routes", "server.py"],
        "importance": "High"
    },
    "client": {
        "category": "Frontend",
        "description": "Frontend client-side code, including views, components, style templates, and HTTP requests.",
        "contains": ["index.html", "src/", "App.tsx"],
        "importance": "High"
    },
    "tests": {
        "category": "Testing",
        "description": "Comprehensive test suite containing unit tests, integration tests, E2E plays, and fixtures.",
        "contains": ["app.test.ts", "conftest.py"],
        "importance": "Medium"
    },
    "fixtures": {
        "category": "Testing",
        "description": "Mock database states, mock JSON payloads, and test fixtures supporting assertion runs.",
        "contains": ["mockUsers.json"],
        "importance": "Medium"
    },
    "migrations": {
        "category": "Backend",
        "description": "SQL scripts or ORM migration files modifying database schema layout over time.",
        "contains": ["20230101_init.sql"],
        "importance": "High"
    },
    "database": {
        "category": "Backend",
        "description": "Database configuration, connection pools, seeds, schema setup, and migration scripts.",
        "contains": ["connection.ts", "seed.ts", "schema.sql"],
        "importance": "High"
    },
    "db": {
        "category": "Backend",
        "description": "Database configuration, connection pools, seeds, schema setup, and migration scripts.",
        "contains": ["connection.ts", "seed.ts", "schema.sql"],
        "importance": "High"
    },
    "seed": {
        "category": "Backend",
        "description": "Database seeding scripts populating initial, default, or mock records into tables.",
        "contains": ["seedUsers.js", "defaultSettings.json"],
        "importance": "Medium"
    },
    "docker": {
        "category": "Infrastructure",
        "description": "Dockerfiles, build targets, and compose configuration files orchestrating project containers.",
        "contains": ["Dockerfile", "docker-compose.yml"],
        "importance": "Medium"
    },
    "k8s": {
        "category": "Infrastructure",
        "description": "Kubernetes manifest YAML files outlining pods, services, ingress routing, and configs.",
        "contains": ["deployment.yaml", "service.yaml"],
        "importance": "Medium"
    },
    "helm": {
        "category": "Infrastructure",
        "description": "Helm charts packaging kubernetes resources for deployment releases.",
        "contains": ["Chart.yaml", "values.yaml"],
        "importance": "Medium"
    },
    "infra": {
        "category": "Infrastructure",
        "description": "DevOps pipelines, build orchestration, cloud configurations, and deployment definitions.",
        "contains": ["deploy.yml", "terraform/"],
        "importance": "Medium"
    },
    "terraform": {
        "category": "Infrastructure",
        "description": "Terraform Infrastructure as Code (IaC) files defining cloud resources (AWS, GCP).",
        "contains": ["main.tf", "variables.tf"],
        "importance": "Medium"
    },
    "vendor": {
        "category": "Infrastructure",
        "description": "Third-party libraries, vendor scripts, and dependencies bundled locally inside the project.",
        "contains": ["jquery.min.js"],
        "importance": "Low"
    },
    "internal": {
        "category": "Backend",
        "description": "Private modules and shared libraries isolated to prevent external workspace imports.",
        "contains": ["core", "utils", "api"],
        "importance": "High"
    },
    "cmd": {
        "category": "Backend",
        "description": "Go-style package directories containing the entrypoint binaries of the project application.",
        "contains": ["server", "cli"],
        "importance": "High"
    },
    "pkg": {
        "category": "Backend",
        "description": "Private modules and shared libraries isolated to prevent external workspace imports.",
        "contains": ["core", "utils", "api"],
        "importance": "High"
    },
    "services": {
        "category": "Backend",
        "description": "Business logic service components separating API controllers from data layers.",
        "contains": ["userService.ts"],
        "importance": "Medium"
    },
    "workers": {
        "category": "Backend",
        "description": "Background workers, queue subscribers, and CRON task runners handling async workloads.",
        "contains": ["worker.js", "emailJob.py"],
        "importance": "High"
    },
    "jobs": {
        "category": "Backend",
        "description": "Background workers, queue subscribers, and CRON task runners handling async workloads.",
        "contains": ["worker.js", "emailJob.py"],
        "importance": "High"
    },
    "modules": {
        "category": "Backend",
        "description": "Self-contained code units grouping related logic, controllers, and services together.",
        "contains": ["user", "auth", "admin"],
        "importance": "High"
    },
    "routes": {
        "category": "Backend",
        "description": "API routing definitions matching HTTP endpoints to corresponding controller functions.",
        "contains": ["users.ts", "auth.py"],
        "importance": "High"
    },
    "controllers": {
        "category": "Backend",
        "description": "HTTP request controllers handling payload extractions and calling domain services.",
        "contains": ["userController.ts"],
        "importance": "High"
    },
    "models": {
        "category": "Backend",
        "description": "Database models defining table properties and ORM schema attributes.",
        "contains": ["User.js", "models.py"],
        "importance": "High"
    },
    "middlewares": {
        "category": "Backend",
        "description": "Request interceptors executing operations before reaching route controllers.",
        "contains": ["authMiddleware.ts", "logger.ts"],
        "importance": "Medium"
    },
    "storage": {
        "category": "Assets",
        "description": "Storage space for dynamic file uploads, disk backups, and temporary files.",
        "contains": ["uploads/", "backups/"],
        "importance": "Low"
    },
    "uploads": {
        "category": "Assets",
        "description": "Storage space for dynamic file uploads, disk backups, and temporary files.",
        "contains": ["uploads/", "backups/"],
        "importance": "Low"
    },
    "logs": {
        "category": "Documentation",
        "description": "System execution logs capturing execution data and error traces.",
        "contains": ["error.log", "access.log"],
        "importance": "Low"
    },
    "cache": {
        "category": "Infrastructure",
        "description": "Temporary compilation files, cache caches, and bundler cache files.",
        "contains": ["package.hash"],
        "importance": "Low"
    }
}

# Fixed stable UUID namespace v5
RKE_NAMESPACE = uuid.UUID("3289196b-0b53-4628-98e3-cf7e1933ba20")

class RepositoryKnowledgeEngine:
    def __init__(self):
        from pathlib import Path

        self.cache_dir = (
            Path.home()
            / ".gemini"
            / "antigravity"
            / "brain"
            / "54442039-6681-46f8-aef3-919486f33e98"
        )
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_cache_path(self, local_path: str) -> Path:
        path_hash = hashlib.sha256(local_path.encode("utf-8")).hexdigest()[:16]
        repo_name = Path(local_path).name
        return self.cache_dir / f"rke_index_{repo_name}_{path_hash}.json"

    def _calculate_sha256(self, file_path: Path) -> str:
        sha256_hash = hashlib.sha256()
        try:
            with open(file_path, "rb") as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            return sha256_hash.hexdigest()
        except Exception:
            return ""

    def _is_typescript_installed(self, root_path: Path) -> bool:
        ts_dir = root_path / "node_modules" / "typescript"
        return ts_dir.exists() and ts_dir.is_dir()

    def get_index(self, local_path: str) -> Dict[str, Any]:
        """
        Main entrypoint. Traverses directories, checks for changes via mtime and SHA256,
        runs AST parsers emitting language-independent IR, and constructs the Unified Graph
        with stable UUID v5 keys.
        """
        root = Path(local_path)
        if not root.exists() or not root.is_dir():
            raise ValueError(f"Invalid path: {local_path}")

        cache_path = self._get_cache_path(local_path)
        index = self._load_cached_index(cache_path)

        # Versioned cache structure (Step 8)
        if not index or index.get("schema_version") != "1.0.0":
            index = {
                "schema_version": "1.0.0",
                "repository": root.name,
                "generated_at": "",
                "languages": [],
                "files": {},
                "graph": {"nodes": [], "edges": []}
            }

        # 1. Scanning directories (Step 1 & 2)
        current_files = {}
        detected_langs = set()

        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRECTORIES]
            
            for fname in filenames:
                fp = Path(dirpath) / fname
                rel_path = str(fp.relative_to(root)).replace("\\", "/")
                ext = fp.suffix.lower()
                lang = EXT_TO_LANG.get(ext, "Unknown")
                detected_langs.add(lang)
                
                try:
                    mtime = fp.stat().st_mtime
                    size = fp.stat().st_size
                except OSError:
                    continue

                current_files[rel_path] = {
                    "abs_path": str(fp).replace("\\", "/"),
                    "extension": ext,
                    "language": lang,
                    "size": size,
                    "mtime": mtime
                }

        # 2. Incremental checks (Step 7)
        files_to_parse = []
        cached_files = index.get("files", {})

        for rel_path, meta in current_files.items():
            cached_meta = cached_files.get(rel_path)
            if not cached_meta or cached_meta.get("mtime") != meta["mtime"] or cached_meta.get("size") != meta["size"]:
                files_to_parse.append(rel_path)
            else:
                # Keep cached metadata
                current_files[rel_path].update(cached_meta)

        # Deleted files pruning
        deleted_files = set(cached_files.keys()) - set(current_files.keys())
        index["files"] = current_files

        # 3. AST/Regex parses outputting the uniform IR (Step 3 & 4)
        use_ts_ast = self._is_typescript_installed(root)
        ts_parser_path = Path(__file__).parent.parent / "utils" / "ts_parser.js"

        for rel_path in files_to_parse:
            meta = index["files"][rel_path]
            abs_path = meta["abs_path"]
            
            # Hash (Step 1)
            file_hash = self._calculate_sha256(Path(abs_path))
            index["files"][rel_path]["hash"] = file_hash
            
            # Run parser and retrieve standard IR
            ir_result = self._parse_file_ir(Path(abs_path), meta["language"], use_ts_ast, ts_parser_path)
            index["files"][rel_path]["symbols"] = ir_result["symbols"]
            index["files"][rel_path]["imports"] = ir_result["imports"]

        # 4. Building the Unified Knowledge Graph (Step 5)
        nodes = []
        edges = []
        all_folders = set()

        repo_name = root.name
        # Stable UUID v5 for repository
        repo_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"repo:{repo_name}"))
        nodes.append({
            "id": repo_uuid,
            "name": repo_name,
            "type": "Repository",
            "location": ""
        })

        for rel_path, file_meta in index["files"].items():
            file_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"file:{repo_name}:{rel_path}"))
            
            # Register directories
            parent_dir = str(Path(rel_path).parent).replace("\\", "/")
            if parent_dir == ".":
                parent_dir = ""

            nodes.append({
                "id": file_uuid,
                "name": Path(rel_path).name,
                "type": "File",
                "language": file_meta["language"],
                "location": rel_path
            })

            # Link file to repo
            edges.append({
                "source": repo_uuid,
                "target": file_uuid,
                "relation": "contains"
            })

            # Process folder nodes
            curr_dir = Path(rel_path).parent
            while str(curr_dir) != ".":
                dir_rel = str(curr_dir).replace("\\", "/")
                if dir_rel not in all_folders:
                    all_folders.add(dir_rel)
                    f_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"folder:{repo_name}:{dir_rel}"))
                    nodes.append({
                        "id": f_uuid,
                        "name": curr_dir.name,
                        "type": "Folder",
                        "location": dir_rel
                    })
                curr_dir = curr_dir.parent

            # Link file to folder
            if parent_dir:
                parent_fld_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"folder:{repo_name}:{parent_dir}"))
                edges.append({
                    "source": parent_fld_uuid,
                    "target": file_uuid,
                    "relation": "belongs_to"
                })

            # Process Symbols (Step 4)
            file_symbols = file_meta.get("symbols", [])
            for sym in file_symbols:
                sym_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"symbol:{repo_name}:{rel_path}:{sym['name']}"))
                
                nodes.append({
                    "id": sym_uuid,
                    "name": sym["name"],
                    "type": sym["type"],
                    "language": file_meta["language"],
                    "location": f"{rel_path}#L{sym['startLine']}-{sym['endLine']}"
                })

                # Link symbol to file
                edges.append({
                    "source": file_uuid,
                    "target": sym_uuid,
                    "relation": "exports" if sym.get("exported", False) else "defines"
                })

            # Process file imports
            file_imports = file_meta.get("imports", [])
            for imp in file_imports:
                resolved_rel = self._resolve_relative_path(rel_path, imp, index["files"])
                if resolved_rel:
                    target_file_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"file:{repo_name}:{resolved_rel}"))
                    edges.append({
                        "source": file_uuid,
                        "target": target_file_uuid,
                        "relation": "imports"
                    })

        # Add Folder Hierarchy Edges
        for fld in all_folders:
            fld_path = Path(fld)
            fld_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"folder:{repo_name}:{fld}"))
            f_parent = str(fld_path.parent).replace("\\", "/")
            
            if f_parent != ".":
                parent_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"folder:{repo_name}:{f_parent}"))
                edges.append({
                    "source": parent_uuid,
                    "target": fld_uuid,
                    "relation": "contains"
                })

        # Format and save cache
        index["graph"]["nodes"] = nodes
        index["graph"]["edges"] = edges
        index["languages"] = sorted(list(detected_langs))
        index["generated_at"] = str(Path(local_path).stat().st_mtime)

        self._save_index(cache_path, index)
        return index

    def _load_cached_index(self, cache_path: Path) -> Optional[Dict[str, Any]]:
        if cache_path.exists():
            try:
                return json.loads(cache_path.read_text(encoding="utf-8"))
            except Exception:
                pass
        return None

    def _save_index(self, cache_path: Path, index: Dict[str, Any]) -> None:
        try:
            cache_path.write_text(json.dumps(index, indent=2), encoding="utf-8")
        except Exception:
            pass

    def _resolve_relative_path(self, current_file: str, import_path: str, files_index: Dict[str, Any]) -> Optional[str]:
        if not import_path.startswith("."):
            return None
        import_clean = import_path.replace("\\", "/")
        parts = import_clean.split("/")
        resolved_parts = current_file.split("/")[:-1]
        
        for p in parts:
            if p == ".":
                continue
            elif p == "..":
                if resolved_parts:
                    resolved_parts.pop()
            else:
                resolved_parts.append(p)
                
        candidate_rel = "/".join(resolved_parts)
        if candidate_rel in files_index:
            return candidate_rel
        for ext in [".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js"]:
            test_path = candidate_rel + ext
            if test_path in files_index:
                return test_path
        return None

    def _parse_file_ir(self, file_path: Path, language: str, use_ts_ast: bool, ts_parser_path: Path) -> Dict[str, Any]:
        """
        Parses source code files to emit the clean, language-independent IR structure.
        """
        symbols = []
        imports = []

        # 1. TS/JS AST
        if language in ("TypeScript", "JavaScript") and use_ts_ast and ts_parser_path.exists():
            try:
                proc = subprocess.run(
                    ["node", str(ts_parser_path), str(file_path)],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if proc.returncode == 0:
                    data = json.loads(proc.stdout.strip())
                    return {
                        "symbols": data.get("symbols", []),
                        "imports": data.get("imports", [])
                    }
            except Exception:
                pass

        # 2. Python AST
        if language == "Python":
            try:
                import ast
                code = file_path.read_text(encoding="utf-8", errors="ignore")
                tree = ast.parse(code, filename=str(file_path))
                
                for node in ast.walk(tree):
                    if isinstance(node, ast.Import):
                        for name in node.names:
                            imports.append(name.name)
                    elif isinstance(node, ast.ImportFrom):
                        if node.module:
                            imports.append(node.module)
                    elif isinstance(node, ast.ClassDef):
                        symbols.append({
                            "name": node.name,
                            "type": "Class",
                            "startLine": node.lineno,
                            "endLine": getattr(node, "end_lineno", node.lineno),
                            "exported": True
                        })
                    elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        symbols.append({
                            "name": node.name,
                            "type": "Function",
                            "startLine": node.lineno,
                            "endLine": getattr(node, "end_lineno", node.lineno),
                            "exported": True
                        })
                return {"symbols": symbols, "imports": imports}
            except Exception:
                pass

        # 3. Regex Fallback
        try:
            code = file_path.read_text(encoding="utf-8", errors="ignore")
            lines = code.splitlines()
            
            class_pattern = re.compile(r'^\s*(?:export\s+)?class\s+(\w+)')
            func_pattern = re.compile(r'^\s*(?:export\s+)?(?:async\s+)?def\s+(\w+)|function\s+(\w+)')
            import_pattern = re.compile(r'import\s+.*?from\s+[\'"](.*?)[\'"]|require\([\'"](.*?)[\'"]')

            for idx, line in enumerate(lines):
                line_num = idx + 1
                
                match_class = class_pattern.search(line)
                if match_class:
                    symbols.append({
                        "name": match_class.group(1),
                        "type": "Class",
                        "startLine": line_num,
                        "endLine": line_num,
                        "exported": "export" in line
                    })
                    continue
                
                match_func = func_pattern.search(line)
                if match_func:
                    fname = match_func.group(1) or match_func.group(2)
                    sym_type = "Function"
                    if fname.startswith("use") and fname[3].isupper():
                        sym_type = "Hook"
                    elif fname[0].isupper():
                        sym_type = "Component"
                        
                    symbols.append({
                        "name": fname,
                        "type": sym_type,
                        "startLine": line_num,
                        "endLine": line_num,
                        "exported": "export" in line
                    })
                    continue

                match_import = import_pattern.search(line)
                if match_import:
                    imp_module = match_import.group(1) or match_import.group(2)
                    if imp_module:
                        imports.append(imp_module)
        except Exception:
            pass

        return {"symbols": symbols, "imports": imports}

    def get_folder_summary(self, local_path: str, folder_rel: str, tech_stack: List[str]) -> Dict[str, Any]:
        """
        Decoupled folder mapping. Resolves files and directory statistics directly
        from the index. Matches standard definitions using static templates.
        No intelligence layer is used in Phase 5.1.
        """
        index = self.get_index(local_path)
        folder_clean = folder_rel.strip("/").replace("\\", "/")
        
        real_files = []
        folder_symbols = []
        size_bytes = 0
        files_count = 0

        immediate_contents = set()
        for r_path, f_meta in index["files"].items():
            # Match files inside this folder recursively
            if not folder_clean or r_path.startswith(folder_clean + "/"):
                files_count += 1
                size_bytes += f_meta.get("size", 0)
                
                # Extract immediate child parts (file or folder)
                if folder_clean:
                    sub_path = r_path[len(folder_clean) + 1:]
                else:
                    sub_path = r_path
                
                first_part = sub_path.split("/")[0]
                immediate_contents.add(first_part)
                
                for s in f_meta.get("symbols", []):
                    folder_symbols.append(s["name"])

        # O(1) Template matching
        template_match = FOLDER_TEMPLATES.get(folder_clean, FOLDER_TEMPLATES.get(Path(folder_clean).name))
        
        if template_match:
            category = template_match["category"]
            description = template_match["description"]
            importance = template_match["importance"]
        else:
            category = "Infrastructure"
            description = f"Custom module folder holding project files and logic routes for {folder_clean or 'root'}."
            importance = "Medium"

        return {
            "name": folder_clean or Path(local_path).name,
            "category": category,
            "description": description,
            "contains": sorted(list(immediate_contents)),
            "importance": importance,
            "confidence": 100,
            "source": "template", # Standard static source
            "files_count": files_count,
            "size_bytes": size_bytes,
            "detected_features": ["Module Configurations"],
            "related_modules": ["Main Core", "Utilities"],
            "common_questions": [
                f"Where are configurations set up in {folder_clean or 'root'}?",
                f"Which scripts import files from this folder?"
            ],
            "exported_symbols": sorted(list(set(folder_symbols)))[:8]
        }
