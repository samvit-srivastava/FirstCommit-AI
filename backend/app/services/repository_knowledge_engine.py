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

# Cap AST parsing so large repos (e.g. microsoft/vscode) finish in reasonable time.
MAX_FILES_TO_PARSE = 200
MAX_GRAPH_FILES = 1500
PRIORITY_PATH_SEGMENTS = ("src", "lib", "app", "packages", "components", "api", "core", "server")
PRIORITY_ROOT_FILES = {
    "README.md", "package.json", "tsconfig.json", "main.py", "index.ts", "index.js",
    "Cargo.toml", "go.mod", "pyproject.toml",
}

EMPTY_IR = {
    "symbols": [],
    "imports": [],
    "calls": [],
    "components": [],
    "routes": [],
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

    def _prioritize_files_for_parsing(self, rel_paths: List[str]) -> List[str]:
        """Rank files so entry points and core source paths are parsed first."""
        def score(rel_path: str) -> tuple:
            name = Path(rel_path).name
            parts = rel_path.replace("\\", "/").lower().split("/")
            is_priority_root = name in PRIORITY_ROOT_FILES
            has_priority_segment = any(seg in PRIORITY_PATH_SEGMENTS for seg in parts)
            depth = len(parts)
            return (
                0 if is_priority_root else 1,
                0 if has_priority_segment else 1,
                depth,
                rel_path,
            )

        return sorted(rel_paths, key=score)

    def _apply_empty_ir(self, index: Dict[str, Any], rel_path: str) -> None:
        for key, value in EMPTY_IR.items():
            index["files"][rel_path][key] = list(value)

    def _is_typescript_installed(self, root_path: Path) -> bool:
        # Only use AST parsing when the cloned repo itself ships TypeScript.
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

        if len(files_to_parse) > MAX_FILES_TO_PARSE:
            prioritized = self._prioritize_files_for_parsing(files_to_parse)
            parse_batch = set(prioritized[:MAX_FILES_TO_PARSE])
            for rel_path in files_to_parse:
                if rel_path not in parse_batch:
                    self._apply_empty_ir(index, rel_path)
            files_to_parse = [rel_path for rel_path in prioritized if rel_path in parse_batch]

        for rel_path in files_to_parse:
            meta = index["files"][rel_path]
            abs_path = meta["abs_path"]

            # Run parser and retrieve standard IR (mtime/size already tracked for cache)
            ir_result = self._parse_file_ir(Path(abs_path), meta["language"], use_ts_ast, ts_parser_path)
            index["files"][rel_path]["symbols"] = ir_result["symbols"]
            index["files"][rel_path]["imports"] = ir_result["imports"]
            index["files"][rel_path]["calls"] = ir_result["calls"]
            index["files"][rel_path]["components"] = ir_result["components"]
            index["files"][rel_path]["routes"] = ir_result["routes"]

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

        # Helper to find a symbol UUID in a file
        def find_symbol_uuid(name: str, rel_path: str) -> Optional[str]:
            f_meta = index["files"].get(rel_path)
            if not f_meta:
                return None
            for s in f_meta.get("symbols", []):
                if s["name"] == name:
                    return str(uuid.uuid5(RKE_NAMESPACE, f"symbol:{repo_name}:{rel_path}:{name}"))
            return None

        # Helper to resolve imported or local symbol UUIDs
        def resolve_symbol_uuid(symbol_name: str, caller_rel: str) -> str:
            # 1. Check local file symbols
            local_uuid = find_symbol_uuid(symbol_name, caller_rel)
            if local_uuid:
                return local_uuid
            
            # 2. Check imports
            f_meta = index["files"].get(caller_rel)
            if f_meta:
                for imp in f_meta.get("imports", []):
                    resolved_rel = self._resolve_relative_path(caller_rel, imp, index["files"])
                    if resolved_rel:
                        target_uuid = find_symbol_uuid(symbol_name, resolved_rel)
                        if target_uuid:
                            return target_uuid
            
            # 3. Fallback: file node UUID
            return str(uuid.uuid5(RKE_NAMESPACE, f"file:{repo_name}:{caller_rel}"))

        graph_files = self._prioritize_files_for_parsing(list(index["files"].keys()))
        if len(graph_files) > MAX_GRAPH_FILES:
            graph_files = graph_files[:MAX_GRAPH_FILES]

        for rel_path in graph_files:
            file_meta = index["files"][rel_path]
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
            edge_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"edge:{repo_uuid}:{file_uuid}:contains:0"))
            edges.append({
                "id": edge_uuid,
                "source": repo_uuid,
                "target": file_uuid,
                "relation": "contains",
                "file_path": rel_path,
                "language": file_meta["language"],
                "line_number": 0
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
                    
                    # Link folder to repo
                    folder_edge_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"edge:{repo_uuid}:{f_uuid}:contains:0"))
                    edges.append({
                        "id": folder_edge_uuid,
                        "source": repo_uuid,
                        "target": f_uuid,
                        "relation": "contains",
                        "file_path": dir_rel,
                        "language": "Folder",
                        "line_number": 0
                    })
                curr_dir = curr_dir.parent

            # Link file to folder
            if parent_dir:
                parent_fld_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"folder:{repo_name}:{parent_dir}"))
                edge_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"edge:{file_uuid}:{parent_fld_uuid}:belongs_to:0"))
                edges.append({
                    "id": edge_uuid,
                    "source": file_uuid,
                    "target": parent_fld_uuid,
                    "relation": "belongs_to",
                    "file_path": rel_path,
                    "language": file_meta["language"],
                    "line_number": 0
                })
                
                # Bi-directional contains link
                edge_contains_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"edge:{parent_fld_uuid}:{file_uuid}:contains:0"))
                edges.append({
                    "id": edge_contains_uuid,
                    "source": parent_fld_uuid,
                    "target": file_uuid,
                    "relation": "contains",
                    "file_path": rel_path,
                    "language": file_meta["language"],
                    "line_number": 0
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
                edge_relation = "exports" if sym.get("exported", False) else "defines"
                edge_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"edge:{file_uuid}:{sym_uuid}:{edge_relation}:0"))
                edges.append({
                    "id": edge_uuid,
                    "source": file_uuid,
                    "target": sym_uuid,
                    "relation": edge_relation,
                    "file_path": rel_path,
                    "language": file_meta["language"],
                    "line_number": sym["startLine"]
                })

            # Process file imports
            file_imports = file_meta.get("imports", [])
            for imp in file_imports:
                resolved_rel = self._resolve_relative_path(rel_path, imp, index["files"])
                if resolved_rel:
                    target_file_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"file:{repo_name}:{resolved_rel}"))
                    edge_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"edge:{file_uuid}:{target_file_uuid}:imports:0"))
                    edges.append({
                        "id": edge_uuid,
                        "source": file_uuid,
                        "target": target_file_uuid,
                        "relation": "imports",
                        "file_path": rel_path,
                        "language": file_meta["language"],
                        "line_number": 0
                    })

            # 5. Extract Call Graph Edges (caller -> callee)
            for call in file_meta.get("calls", []):
                caller_uuid = file_uuid
                if call["caller"] != "global":
                    caller_uuid = resolve_symbol_uuid(call["caller"], rel_path)
                callee_uuid = resolve_symbol_uuid(call["callee"], rel_path)
                
                edge_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"edge:{caller_uuid}:{callee_uuid}:calls:{call['line']}"))
                edges.append({
                    "id": edge_uuid,
                    "source": caller_uuid,
                    "target": callee_uuid,
                    "relation": "calls",
                    "file_path": rel_path,
                    "language": file_meta["language"],
                    "line_number": call["line"]
                })

            # 6. Extract React Component Render Edges (parent -> child)
            for comp in file_meta.get("components", []):
                parent_uuid = file_uuid
                if comp["parent"]:
                    parent_uuid = resolve_symbol_uuid(comp["parent"], rel_path)
                
                # Resolve child component symbol
                child_uuid = find_symbol_uuid(comp["name"], rel_path)
                if not child_uuid:
                    # Check imports
                    for imp in file_meta.get("imports", []):
                        resolved_rel = self._resolve_relative_path(rel_path, imp, index["files"])
                        if resolved_rel:
                            child_uuid = find_symbol_uuid(comp["name"], resolved_rel)
                            if child_uuid:
                                break
                if not child_uuid:
                    # External or unmapped React component node
                    child_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"symbol:{repo_name}:external:{comp['name']}"))
                    # Register external component node dynamically
                    nodes.append({
                        "id": child_uuid,
                        "name": comp["name"],
                        "type": "Component",
                        "language": "TypeScript",
                        "location": f"external/{comp['name']}"
                    })

                edge_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"edge:{parent_uuid}:{child_uuid}:renders:{comp['line']}"))
                edges.append({
                    "id": edge_uuid,
                    "source": parent_uuid,
                    "target": child_uuid,
                    "relation": "renders",
                    "file_path": rel_path,
                    "language": file_meta["language"],
                    "line_number": comp["line"]
                })

            # 7. Extract Custom Route Handlers mapping
            for route in file_meta.get("routes", []):
                route_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"route:{repo_name}:{route['method']}:{route['path']}"))
                
                # Register Route Node dynamically
                nodes.append({
                    "id": route_uuid,
                    "name": f"{route['method'].upper()} {route['path']}",
                    "type": "Route",
                    "location": f"{rel_path}#L{route['line']}"
                })

                # Connect Route to handlers
                for h in route["handlers"]:
                    handler_uuid = resolve_symbol_uuid(h, rel_path)
                    edge_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"edge:{route_uuid}:{handler_uuid}:handled_by:{route['line']}"))
                    edges.append({
                        "id": edge_uuid,
                        "source": route_uuid,
                        "target": handler_uuid,
                        "relation": "handled_by",
                        "file_path": rel_path,
                        "language": file_meta["language"],
                        "line_number": route["line"]
                    })

            # 8. Next.js App Router routing folder conventions
            if rel_path.startswith("app/") and (rel_path.endswith("/page.tsx") or rel_path.endswith("/route.ts") or rel_path == "app/page.tsx" or rel_path == "app/route.ts"):
                parts = rel_path.split("/")
                url_parts = []
                for p in parts[1:-1]:
                    if not (p.startswith("(") and p.endswith(")")):
                        url_parts.append(p)
                url_path = "/" + "/".join(url_parts)
                url_path = url_path.replace("//", "/")
                
                methods = ["GET"]
                if rel_path.endswith("/route.ts"):
                    route_symbols = [s["name"] for s in file_meta.get("symbols", [])]
                    methods = [m for m in ("GET", "POST", "PUT", "DELETE", "PATCH") if m in route_symbols]
                    if not methods:
                        methods = ["GET"]

                for method in methods:
                    route_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"route:{repo_name}:{method.lower()}:{url_path}"))
                    
                    nodes.append({
                        "id": route_uuid,
                        "name": f"{method} {url_path}",
                        "type": "Route",
                        "location": rel_path
                    })
                    
                    edge_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"edge:{route_uuid}:{file_uuid}:handled_by:0"))
                    edges.append({
                        "id": edge_uuid,
                        "source": route_uuid,
                        "target": file_uuid,
                        "relation": "handled_by",
                        "file_path": rel_path,
                        "language": file_meta["language"],
                        "line_number": 0
                    })

        # Add Folder Hierarchy Edges
        for fld in all_folders:
            fld_path = Path(fld)
            fld_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"folder:{repo_name}:{fld}"))
            f_parent = str(fld_path.parent).replace("\\", "/")
            
            if f_parent != ".":
                parent_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"folder:{repo_name}:{f_parent}"))
                edge_uuid = str(uuid.uuid5(RKE_NAMESPACE, f"edge:{parent_uuid}:{fld_uuid}:contains:0"))
                edges.append({
                    "id": edge_uuid,
                    "source": parent_uuid,
                    "target": fld_uuid,
                    "relation": "contains",
                    "file_path": fld,
                    "language": "Folder",
                    "line_number": 0
                })

        # Deduplicate nodes by ID
        unique_nodes = {}
        for n in nodes:
            unique_nodes[n["id"]] = n
        nodes = list(unique_nodes.values())

        # Deduplicate edges by ID
        unique_edges = {}
        for e in edges:
            unique_edges[e["id"]] = e
        edges = list(unique_edges.values())

        # 9. Simple deterministic Importance Score calculation (out-degree/in-degree degree score)
        in_degree = {}
        out_degree = {}
        for edge in edges:
            src = edge["source"]
            tgt = edge["target"]
            out_degree[src] = out_degree.get(src, 0) + 1
            in_degree[tgt] = in_degree.get(tgt, 0) + 1

        for n in nodes:
            nid = n["id"]
            in_d = in_degree.get(nid, 0)
            out_d = out_degree.get(nid, 0)
            base_score = 1.0 + (in_d * 0.85) + (out_d * 0.15)
            
            # Apply architectural weights to prioritize components, classes, and routes
            weight = 1.0
            ntype = n.get("type", "")
            nname = n.get("name", "")
            
            # Identify generic UI primitives to de-prioritize
            generic_ui_primitives = {
                "Card", "CardHeader", "CardTitle", "CardContent", "CardFooter",
                "Button", "Input", "Badge", "Skeleton", "Avatar", "Separator", 
                "Tabs", "Dialog", "DropdownMenu", "Tooltip", "Label", "Popover",
                "Textarea", "Select", "Switch", "ScrollArea", "RadioGroup"
            }
            
            if nname in generic_ui_primitives:
                weight = 0.2
            elif ntype in ("Component", "Class", "Route"):
                weight = 2.5
                # Boost major architectural symbols
                if "Service" in nname or "Controller" in nname or "API" in nname or "Page" in nname or "Layout" in nname or "Context" in nname or "Provider" in nname or "Repository" in nname:
                    weight *= 3.0
            elif ntype in ("Hook", "Interface", "Type"):
                weight = 1.8
                if "Context" in nname or "use" in nname:
                    weight *= 1.5
            elif ntype == "File":
                weight = 1.2
                if nname.endswith("page.tsx") or nname.endswith("layout.tsx") or nname.endswith("route.ts") or nname in ("main.py", "server.js", "app.js"):
                    weight *= 2.0
                
            # Demote helper functions, private methods, and utility functions
            if nname.startswith("_") or nname in ("cn", "logger", "log", "format", "parse", "resolve", "utils", "helper", "get_index", "ts_parser"):
                weight *= 0.1

            # Check exports edge relation
            is_exported = False
            for edge in edges:
                if edge["target"] == nid and edge["relation"] == "exports":
                    is_exported = True
                    break
            if is_exported:
                weight *= 1.5
            else:
                if ntype in ("Function", "Constant"):
                    weight *= 0.6
            
            n["importance_score"] = round(base_score * weight, 3)

        # 10. Store adjacency map (Step 5 adj map cache check)
        adjacency_map = { n["id"]: [] for n in nodes }
        for edge in edges:
            src = edge["source"]
            tgt = edge["target"]
            if src in adjacency_map and tgt not in adjacency_map[src]:
                adjacency_map[src].append(tgt)

        index["graph"]["nodes"] = nodes
        index["graph"]["edges"] = edges
        index["graph"]["adjacency_map"] = adjacency_map
        index["languages"] = sorted(list(detected_langs))
        index["generated_at"] = str(Path(local_path).stat().st_mtime)

        # 11. Deterministic evidence-only repository brain summary
        detected_frameworks = []
        try:
            from app.services.tech_detector_service import TechDetectorService
            detected_tech = TechDetectorService().detect_technologies(local_path)
            detected_frameworks = [t["display_name"] for t in detected_tech if t["category"] in ("Frontend", "Backend")]
        except Exception:
            pass

        entry_points = []
        for filename in ("main.py", "server.js", "app/page.tsx", "index.js", "index.ts", "app.js"):
            if (Path(local_path) / filename).exists():
                entry_points.append(filename)

        largest_folder = "root"
        largest_size = 0
        for fld in all_folders:
            fld_size = sum(f_meta.get("size", 0) for r_p, f_meta in index["files"].items() if r_p.startswith(fld + "/"))
            if fld_size > largest_size:
                largest_size = fld_size
                largest_folder = fld

        import_counts = {}
        for edge in edges:
            if edge["relation"] == "imports":
                import_counts[edge["target"]] = import_counts.get(edge["target"], 0) + 1
        
        most_imported_module = "None"
        if import_counts:
            most_imported_uuid = max(import_counts, key=import_counts.get)
            for n in nodes:
                if n["id"] == most_imported_uuid:
                    most_imported_module = n["name"]
                    break

        symbols_nodes = [n for n in nodes if n["type"] in ("Class", "Function", "Component", "Hook", "Route")]
        symbols_nodes.sort(key=lambda x: x.get("importance_score", 1.0), reverse=True)
        top_symbols = [n["name"] for n in symbols_nodes[:5]]

        index["brain"] = {
            "languages": index["languages"],
            "frameworks": detected_frameworks,
            "entry_points": entry_points,
            "largest_folder": largest_folder,
            "top_symbols": top_symbols,
            "most_imported_module": most_imported_module
        }

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
            # Strip Next.js path aliases
            import_clean = import_path.replace("\\", "/")
            if import_clean.startswith("@/"):
                import_clean = import_clean[2:]
            elif import_clean.startswith("~/"):
                import_clean = import_clean[2:]
                
            prefixes = ["", "src/", "app/"]
            for pref in prefixes:
                path_candidate = f"{pref}{import_clean}".replace("//", "/")
                for ext in (".py", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js", "/index.py"):
                    test_path = f"{path_candidate}{ext}"
                    if test_path in files_index:
                        return test_path
                    # Scan keys in files_index to resolve target module path
                    for k in files_index.keys():
                        if k.endswith("/" + test_path) or k == test_path:
                            return k
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
        calls = []
        components = []
        routes = []

        # 1. TS/JS AST
        if language in ("TypeScript", "JavaScript") and use_ts_ast and ts_parser_path.exists():
            try:
                proc = subprocess.run(
                    ["node", str(ts_parser_path), str(file_path)],
                    capture_output=True,
                    text=True,
                    timeout=2
                )
                if proc.returncode == 0:
                    data = json.loads(proc.stdout.strip())
                    return {
                        "symbols": data.get("symbols", []),
                        "imports": data.get("imports", []),
                        "calls": data.get("calls", []),
                        "components": data.get("components", []),
                        "routes": data.get("routes", [])
                    }
            except Exception:
                pass

        # 2. Python AST
        if language == "Python":
            try:
                import ast
                code = file_path.read_text(encoding="utf-8", errors="ignore")
                tree = ast.parse(code, filename=str(file_path))
                
                class PythonIRVisitor(ast.NodeVisitor):
                    def __init__(self):
                        self.imports = []
                        self.symbols = []
                        self.calls = []
                        self.routes = []
                        self.current_caller_stack = []

                    def visit_Import(self, node):
                        for name in node.names:
                            self.imports.append(name.name)
                        self.generic_visit(node)

                    def visit_ImportFrom(self, node):
                        if node.module:
                            self.imports.append(node.module)
                        self.generic_visit(node)

                    def visit_ClassDef(self, node):
                        self.symbols.append({
                            "name": node.name,
                            "type": "Class",
                            "startLine": node.lineno,
                            "endLine": getattr(node, "end_lineno", node.lineno),
                            "exported": True
                        })
                        self.current_caller_stack.append(node.name)
                        self.generic_visit(node)
                        self.current_caller_stack.pop()

                    def visit_FunctionDef(self, node):
                        self.symbols.append({
                            "name": node.name,
                            "type": "Function",
                            "startLine": node.lineno,
                            "endLine": getattr(node, "end_lineno", node.lineno),
                            "exported": True
                        })
                        self.current_caller_stack.append(node.name)
                        
                        # FastAPI/Django route decorators
                        for dec in node.decorator_list:
                            if isinstance(dec, ast.Call):
                                dec_func = dec.func
                                method = None
                                if isinstance(dec_func, ast.Attribute) and isinstance(dec_func.value, ast.Name):
                                    if dec_func.value.id in ("app", "router"):
                                        method = dec_func.attr
                                if method in ("get", "post", "put", "delete", "patch", "use") and dec.args:
                                    first_arg = dec.args[0]
                                    path_str = None
                                    if isinstance(first_arg, ast.Constant):
                                        path_str = str(first_arg.value)
                                    elif isinstance(first_arg, ast.Str):
                                        path_str = first_arg.s
                                    
                                    if path_str:
                                        self.routes.append({
                                            "method": method,
                                            "path": path_str,
                                            "handlers": [node.name],
                                            "line": dec.lineno
                                        })
                        
                        self.generic_visit(node)
                        self.current_caller_stack.pop()

                    def visit_AsyncFunctionDef(self, node):
                        self.visit_FunctionDef(node)

                    def visit_Call(self, node):
                        callee = None
                        if isinstance(node.func, ast.Name):
                            callee = node.func.id
                        elif isinstance(node.func, ast.Attribute):
                            callee = node.func.attr
                        
                        if callee:
                            caller = self.current_caller_stack[-1] if self.current_caller_stack else "global"
                            self.calls.append({
                                "caller": caller,
                                "callee": callee,
                                "line": node.lineno
                            })
                        
                        # Django url mappings check: path('login/', views.login, name='login')
                        if isinstance(node.func, ast.Name) and node.func.id in ("path", "re_path", "url"):
                            if len(node.args) >= 2:
                                path_val = None
                                handler_val = None
                                if isinstance(node.args[0], ast.Constant):
                                    path_val = str(node.args[0].value)
                                elif isinstance(node.args[0], ast.Str):
                                    path_val = node.args[0].s
                                
                                if isinstance(node.args[1], ast.Name):
                                    handler_val = node.args[1].id
                                elif isinstance(node.args[1], ast.Attribute):
                                    handler_val = node.args[1].attr
                                
                                if path_val:
                                    self.routes.append({
                                        "method": "get",
                                        "path": path_val,
                                        "handlers": [handler_val] if handler_val else ["anonymous"],
                                        "line": node.lineno
                                    })
                        self.generic_visit(node)

                visitor = PythonIRVisitor()
                visitor.visit(tree)
                return {
                    "symbols": visitor.symbols,
                    "imports": visitor.imports,
                    "calls": visitor.calls,
                    "components": [],
                    "routes": visitor.routes
                }
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

        return {
            "symbols": symbols,
            "imports": imports,
            "calls": calls,
            "components": components,
            "routes": routes
        }

    def get_folder_summary(
        self,
        local_path: str,
        folder_rel: str,
        tech_stack: List[str],
        index: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Decoupled folder mapping. Resolves files and directory statistics directly
        from the index. Matches standard definitions using static templates.
        No intelligence layer is used in Phase 5.1.
        """
        if index is None:
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
