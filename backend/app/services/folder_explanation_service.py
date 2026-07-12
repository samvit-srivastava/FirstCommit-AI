import os
import json
import urllib.request
import re
from pathlib import Path
from typing import List, Dict, Any, Optional

# Extended Predefined Template Library
FOLDER_TEMPLATES = {
    # Infrastructure
    ".devcontainer": {
        "category": "Infrastructure",
        "description": "Contains configuration files for VS Code Dev Containers. Defines Docker images, editor settings, and extensions used to create a reproducible development environment.",
        "contains": ["devcontainer.json", "Dockerfile"],
        "importance": "Medium"
    },
    ".vscode": {
        "category": "Infrastructure",
        "description": "Stores workspace-specific settings, tasks, and debugger launch configurations for Visual Studio Code.",
        "contains": ["settings.json", "launch.json", "extensions.json"],
        "importance": "Low"
    },
    ".idea": {
        "category": "Infrastructure",
        "description": "Contains IDE-specific settings and workspace files for JetBrains editors like WebStorm or PyCharm.",
        "contains": ["workspace.xml", "modules.xml"],
        "importance": "Low"
    },
    "config": {
        "category": "Infrastructure",
        "description": "Houses central configuration settings, environment parameters, and option profiles.",
        "contains": ["default.json", "config.yaml", "settings.py"],
        "importance": "High"
    },
    "configs": {
        "category": "Infrastructure",
        "description": "Houses central configuration settings, environment parameters, and option profiles.",
        "contains": ["default.json", "config.yaml", "settings.py"],
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
        "description": "Executables, CLI scripts, and binary scripts run directly in the command line.",
        "contains": ["start-server", "cli.js"],
        "importance": "Medium"
    },
    "packages": {
        "category": "Infrastructure",
        "description": "Sub-packages within a monorepo workspace containing separate modules and libraries.",
        "contains": ["core", "ui", "api"],
        "importance": "High"
    },
    "plugins": {
        "category": "Infrastructure",
        "description": "Contains built-in or bundled extensions that extend the core application's functionality.",
        "contains": ["plugin-core", "extension-auth"],
        "importance": "Medium"
    },
    "extensions": {
        "category": "Infrastructure",
        "description": "Contains built-in or bundled extensions that extend the core application's functionality.",
        "contains": ["plugin-core", "extension-auth"],
        "importance": "Medium"
    },
    "shared": {
        "category": "Infrastructure",
        "description": "Shared modules, constants, and utilities accessed by both frontend and backend teams.",
        "contains": ["utils.ts", "constants.ts", "types.ts"],
        "importance": "High"
    },
    "common": {
        "category": "Infrastructure",
        "description": "Shared modules, constants, and utilities accessed by both frontend and backend teams.",
        "contains": ["utils.ts", "constants.ts", "types.ts"],
        "importance": "High"
    },
    "docker": {
        "category": "Infrastructure",
        "description": "Docker config files, Dockerfiles, and compose configurations containerizing application environments.",
        "contains": ["Dockerfile", "docker-compose.yml"],
        "importance": "Medium"
    },
    "k8s": {
        "category": "Infrastructure",
        "description": "Kubernetes manifest layouts defining containerized cloud deployments.",
        "contains": ["deployment.yaml", "service.yaml"],
        "importance": "Medium"
    },
    "helm": {
        "category": "Infrastructure",
        "description": "Helm chart templates packaging Kubernetes application releases.",
        "contains": ["Chart.yaml", "values.yaml"],
        "importance": "Medium"
    },
    "infra": {
        "category": "Infrastructure",
        "description": "Infrastructure as Code definitions configuring cloud platforms, servers, and pipelines.",
        "contains": ["main.tf", "variables.tf"],
        "importance": "High"
    },
    "terraform": {
        "category": "Infrastructure",
        "description": "Infrastructure as Code definitions configuring cloud platforms, servers, and pipelines.",
        "contains": ["main.tf", "variables.tf"],
        "importance": "High"
    },
    "vendor": {
        "category": "Infrastructure",
        "description": "Third-party dependency source codes or binary files managed locally within the project workspace.",
        "contains": ["go", "composer"],
        "importance": "Low"
    },
    "cache": {
        "category": "Infrastructure",
        "description": "Temporary application workspace storing metadata caches to speed up compile tasks.",
        "contains": ["webpack", "babel"],
        "importance": "Low"
    },

    # Documentation / Tests
    "docs": {
        "category": "Documentation",
        "description": "Markdown or HTML documentation detailing API design, setup, architecture, and developer guidelines.",
        "contains": ["architecture.md", "setup.md", "api.md"],
        "importance": "Low"
    },
    "examples": {
        "category": "Documentation",
        "description": "Code samples showing how to consume the project API, run integrations, or configure components.",
        "contains": ["basic-example", "advanced-example"],
        "importance": "Low"
    },
    "tests": {
        "category": "Testing",
        "description": "Unit, integration, and E2E test files verifying application correctness and contract fulfillment.",
        "contains": ["unit", "integration", "e2e"],
        "importance": "Medium"
    },
    "fixtures": {
        "category": "Testing",
        "description": "Mock data, seed records, or static files loaded to establish consistent test environments.",
        "contains": ["mock-users.json", "test-db.sql"],
        "importance": "Low"
    },

    # Assets
    "assets": {
        "category": "Assets",
        "description": "Static resources such as icons, templates, images, localization files, or bundled assets.",
        "contains": ["images", "fonts", "icons"],
        "importance": "Low"
    },
    "static": {
        "category": "Assets",
        "description": "Static assets served directly by the server, like CSS, JS, and image assets.",
        "contains": ["images", "scripts"],
        "importance": "Low"
    },
    "storage": {
        "category": "Assets",
        "description": "Static storage directory housing persistent files, upload targets, or user assets.",
        "contains": ["uploads", "backups"],
        "importance": "Low"
    },
    "uploads": {
        "category": "Assets",
        "description": "Static storage directory housing persistent files, upload targets, or user assets.",
        "contains": ["uploads", "backups"],
        "importance": "Low"
    },

    # Frontend
    "client": {
        "category": "Frontend",
        "description": "Frontend client-side code containing user interfaces, views, layouts, and styles.",
        "contains": ["src", "public", "index.html"],
        "importance": "High"
    },
    "src": {
        "category": "Frontend",
        "description": "Contains the main source code of the application, including components, assets, and utility functions.",
        "contains": ["components", "utils", "index.tsx"],
        "importance": "High"
    },
    "app": {
        "category": "Frontend",
        "description": "The core application directory, housing Next.js App Router files or global layout definitions.",
        "contains": ["layout.tsx", "page.tsx", "global.css"],
        "importance": "High"
    },
    "pages": {
        "category": "Frontend",
        "description": "Houses the page components that map to route paths in a file-system based router.",
        "contains": ["_app.tsx", "index.tsx", "about.tsx"],
        "importance": "High"
    },
    "components": {
        "category": "Frontend",
        "description": "Reusable UI building blocks shared across the application.",
        "contains": ["Button.tsx", "Card.tsx", "Navbar.tsx"],
        "importance": "High"
    },
    "layouts": {
        "category": "Frontend",
        "description": "Layout components wrapping pages to provide consistent wrappers like headers and sidebars.",
        "contains": ["MainLayout.tsx", "Sidebar.tsx"],
        "importance": "Medium"
    },
    "hooks": {
        "category": "Frontend",
        "description": "Custom stateful functions encapsulating reusable react/frontend hook logic.",
        "contains": ["useAuth.ts", "useFetch.ts"],
        "importance": "Medium"
    },
    "contexts": {
        "category": "Frontend",
        "description": "React Context files managing shared data structures across component trees.",
        "contains": ["ThemeContext.tsx", "AuthContext.tsx"],
        "importance": "Medium"
    },
    "providers": {
        "category": "Frontend",
        "description": "Wrapper components supplying context or global configurations to child components.",
        "contains": ["ThemeProvider.tsx", "AuthProvider.tsx"],
        "importance": "Medium"
    },
    "services": {
        "category": "Frontend",
        "description": "Modules managing external API calls, HTTP clients, and business logic.",
        "contains": ["api.ts", "authService.ts"],
        "importance": "Medium"
    },
    "styles": {
        "category": "Assets",
        "description": "Global stylesheets and theme config files defining the application theme.",
        "contains": ["globals.css", "variables.scss"],
        "importance": "Medium"
    },
    "store": {
        "category": "Frontend",
        "description": "Redux, Zustand, or Pinia state stores managing global application state.",
        "contains": ["index.ts", "actions.ts", "reducers.ts"],
        "importance": "High"
    },
    "redux": {
        "category": "Frontend",
        "description": "Redux-specific state management slices, stores, and configuration files.",
        "contains": ["store.ts", "slices"],
        "importance": "High"
    },
    "apps": {
        "category": "Infrastructure",
        "description": "Applications in a monorepo workspace structured alongside shared packages.",
        "contains": ["web", "docs", "api"],
        "importance": "High"
    },

    # Backend
    "server": {
        "category": "Backend",
        "description": "Backend server-side code containing routes, controllers, database connections, and APIs.",
        "contains": ["index.js", "routes", "server.py"],
        "importance": "High"
    },
    "core": {
        "category": "Backend",
        "description": "The main architectural heart of the application, implementing primary domain logic, services, and business rules.",
        "contains": ["engine.ts", "main.go", "core.py"],
        "importance": "High"
    },
    "api": {
        "category": "Backend",
        "description": "Exposes backend API endpoints, controllers, or serverless route handlers.",
        "contains": ["routes", "controllers", "index.ts"],
        "importance": "High"
    },
    "routes": {
        "category": "Backend",
        "description": "Defines the HTTP route patterns mapping URLs to controller actions.",
        "contains": ["auth.ts", "users.ts"],
        "importance": "High"
    },
    "controllers": {
        "category": "Backend",
        "description": "Contains controller actions executing client requests and sending back responses.",
        "contains": ["authController.ts", "userController.ts"],
        "importance": "High"
    },
    "models": {
        "category": "Backend",
        "description": "Defines the database schema, query interfaces, and data models.",
        "contains": ["User.ts", "Post.ts"],
        "importance": "High"
    },
    "schemas": {
        "category": "Backend",
        "description": "Validation schemas validating incoming request payloads or API types.",
        "contains": ["userSchema.ts", "validation.ts"],
        "importance": "Medium"
    },
    "middleware": {
        "category": "Backend",
        "description": "Request interceptors executing operations before reaching route controllers.",
        "contains": ["authMiddleware.ts", "logger.ts"],
        "importance": "Medium"
    },
    "middlewares": {
        "category": "Backend",
        "description": "Request interceptors executing operations before reaching route controllers.",
        "contains": ["authMiddleware.ts", "logger.ts"],
        "importance": "Medium"
    },
    "repositories": {
        "category": "Backend",
        "description": "Data access layer isolating database queries from controllers.",
        "contains": ["userRepository.ts"],
        "importance": "Medium"
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
    "migrations": {
        "category": "Backend",
        "description": "SQL scripts or ORM migration files modifying database schema layout over time.",
        "contains": ["20230101_init.sql"],
        "importance": "High"
    },
    "prisma": {
        "category": "Backend",
        "description": "Prisma ORM schema definitions, config files, and DB migration scripts.",
        "contains": ["schema.prisma", "migrations"],
        "importance": "High"
    },
    "entities": {
        "category": "Backend",
        "description": "TypeORM or Sequelize class definitions mapping directly to DB tables.",
        "contains": ["User.entity.ts"],
        "importance": "High"
    },
    "dto": {
        "category": "Backend",
        "description": "Data Transfer Objects defining the structure of incoming request payloads.",
        "contains": ["createUser.dto.ts"],
        "importance": "Medium"
    },
    "validators": {
        "category": "Backend",
        "description": "Validation logic verifying that inputs match required data structures.",
        "contains": ["inputValidator.ts"],
        "importance": "Medium"
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

    # General / Platforms
    "desktop": {
        "category": "Frontend",
        "description": "Desktop platform-specific codebase (Electron, Tauri) or desktop UI layouts.",
        "contains": ["main.js", "tauri.conf.json"],
        "importance": "High"
    },
    "mobile": {
        "category": "Mobile",
        "description": "Cross-platform mobile application code (React Native, Flutter) for iOS and Android.",
        "contains": ["src", "ios", "android"],
        "importance": "High"
    },
    "ios": {
        "category": "Mobile",
        "description": "iOS native application project workspace, configuration files, and assets.",
        "contains": ["Podfile", "AppDelegate.swift"],
        "importance": "High"
    },
    "android": {
        "category": "Mobile",
        "description": "Android native application project workspace, configuration files, and assets.",
        "contains": ["AndroidManifest.xml", "build.gradle"],
        "importance": "High"
    },
    "seed": {
        "category": "Backend",
        "description": "Database seeding scripts populating initial, default, or mock records into tables.",
        "contains": ["seedUsers.js", "defaultSettings.json"],
        "importance": "Medium"
    },
    "logs": {
        "category": "Documentation",
        "description": "System execution logs capturing execution data and error traces.",
        "contains": ["error.log", "access.log"],
        "importance": "Low"
    },
    ".github": {
        "category": "Infrastructure",
        "description": "GitHub configuration files, including CI/CD workflow YAML definitions.",
        "contains": ["workflows"],
        "importance": "Medium"
    }
}

IGNORE_FOLDERS = {
    ".git", ".github-cache", ".next", "dist", "build", "coverage", 
    ".cache", ".idea", ".vscode", "venv", ".venv", "node_modules", "__pycache__"
}

class FolderExplanationService:
    def __init__(self):
        # Cache file located in the scratch directory
        from pathlib import Path

        self.cache_dir = (
            Path.home()
            / ".gemini"
            / "antigravity"
            / "brain"
            / "54442039-6681-46f8-aef3-919486f33e98"
        )
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.cache_path = self.cache_dir / "folder_explanations_cache.json"
        self.cache = self._load_cache()

    def _load_cache(self) -> Dict[str, Any]:
        if self.cache_path.exists():
            try:
                return json.loads(self.cache_path.read_text(encoding="utf-8"))
            except Exception:
                pass
        return {}

    def _save_cache(self) -> None:
        try:
            self.cache_path.write_text(json.dumps(self.cache, indent=2), encoding="utf-8")
        except Exception:
            pass

    def _normalize_name(self, name: str) -> str:
        cleaned = name.strip()
        if cleaned.startswith("./") or cleaned.startswith(".\\"):
            cleaned = cleaned[2:]
        cleaned = cleaned.rstrip("/\\")
        return cleaned.lower()

    def _get_directory_metrics(self, path: Path) -> tuple[int, int]:
        files_count = 0
        size_bytes = 0
        try:
            for root, dirs, files in os.walk(path):
                # Filter out ignored folders in children traversal to avoid huge node_modules sweeps
                dirs[:] = [d for d in dirs if d.lower() not in IGNORE_FOLDERS]
                for f in files:
                    fp = os.path.join(root, f)
                    try:
                        size_bytes += os.path.getsize(fp)
                        files_count += 1
                    except OSError:
                        pass
        except Exception:
            pass
        return files_count, size_bytes

    def explain_folders(self, local_path: str, tech_stack: List[str]) -> List[Dict[str, Any]]:
        """
        Scans ONLY top-level folders, calculates actual file metrics recursively,
        performs O(1) template lookup, and batches unknown folders into one LLM request.
        """
        root = Path(local_path)
        if not root.exists() or not root.is_dir():
            raise ValueError(f"Invalid path: {local_path}")

        # List only top-level directories
        top_level_folders = []
        try:
            for p in root.iterdir():
                if p.is_dir():
                    norm_name = self._normalize_name(p.name)
                    if norm_name not in IGNORE_FOLDERS:
                        top_level_folders.append(p)
        except Exception:
            pass

        # Determine the active model/provider name to use as part of cache key
        is_local = self._is_lm_studio_available()
        if is_local:
            provider = "LM Studio"
            model_name = self._get_lm_studio_model()
        else:
            api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
            if api_key:
                provider = "Gemini"
                model_name = "Gemini 2.5 Flash"
            else:
                provider = None
                model_name = "fallback"

        results = []
        unknown_folders = []
        
        # Sort tech stack for stable cache key matching
        sorted_tech = sorted(tech_stack)
        tech_key_part = ", ".join(sorted_tech)
        
        # Sibling folders help the model infer context
        all_folder_names = [p.name for p in top_level_folders]

        for p in top_level_folders:
            name = p.name
            norm_name = self._normalize_name(name)
            files_count, size_bytes = self._get_directory_metrics(p)
            
            # 1. Check template lookup O(1)
            if norm_name in FOLDER_TEMPLATES:
                tmpl = FOLDER_TEMPLATES[norm_name]
                results.append({
                    "name": name,
                    "category": tmpl["category"],
                    "description": tmpl["description"],
                    "contains": tmpl["contains"],
                    "importance": tmpl["importance"],
                    "confidence": 100,
                    "source": "template",
                    "provider": None,
                    "model": None,
                    "files_count": files_count,
                    "size_bytes": size_bytes
                })
            else:
                # 2. Check Cache (folder name + tech stack + model)
                cache_key = f"{norm_name} | {tech_key_part} | {model_name}"
                if cache_key in self.cache:
                    cached_val = self.cache[cache_key]
                    results.append({
                        "name": name,
                        "category": cached_val.get("category", "Unknown"),
                        "description": cached_val.get("description", ""),
                        "contains": cached_val.get("contains", []),
                        "importance": cached_val.get("importance", "Medium"),
                        "confidence": 100,
                        "source": cached_val.get("source", "llm"),
                        "provider": cached_val.get("provider", provider),
                        "model": cached_val.get("model", model_name),
                        "files_count": files_count,
                        "size_bytes": size_bytes
                    })
                else:
                    # Collect unknown folders to batch query
                    unknown_folders.append(name)

        if unknown_folders:
            # 3. Batch query LLM (Gemini or LM Studio)
            llm_results = self._batch_query_llm(unknown_folders, tech_stack, all_folder_names, provider, model_name)
            
            for p in top_level_folders:
                name = p.name
                if name in unknown_folders:
                    norm_name = self._normalize_name(name)
                    details = llm_results.get(name, {
                        "category": "Unknown",
                        "description": "This folder is likely used for project-specific configurations or custom code modules.",
                        "contains": [],
                        "importance": "Medium",
                        "confidence": 50,
                        "source": "fallback",
                        "provider": None,
                        "model": None
                    })
                    
                    files_count, size_bytes = self._get_directory_metrics(p)
                    
                    # Store in cache
                    cache_key = f"{norm_name} | {tech_key_part} | {model_name}"
                    self.cache[cache_key] = details
                    
                    results.append({
                        "name": name,
                        "category": details["category"],
                        "description": details["description"],
                        "contains": details["contains"],
                        "importance": details["importance"],
                        "confidence": details.get("confidence", 100),
                        "source": details.get("source", "llm"),
                        "provider": details.get("provider", provider),
                        "model": details.get("model", model_name),
                        "files_count": files_count,
                        "size_bytes": size_bytes
                    })
            self._save_cache()

        return results

    def _clean_json_response(self, text: str) -> str:
        # Strip reasoning thinking blocks if present (from local models like DeepSeek-R1)
        text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
        text = text.strip()
        if text.startswith("```"):
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1:
                text = text[start:end+1]
        return text

    def _is_lm_studio_available(self) -> bool:
        import socket
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.5)
                return s.connect_ex(('127.0.0.1', 1234)) == 0
        except Exception:
            return False

    def _get_lm_studio_model(self) -> str:
        try:
            req = urllib.request.Request("http://127.0.0.1:1234/v1/models", timeout=1.5)
            with urllib.request.urlopen(req) as response:
                models_data = json.loads(response.read().decode("utf-8"))
                for m in models_data.get("data", []):
                    model_id = m.get("id", "")
                    if "embed" not in model_id:
                        # Clean model path or return display name
                        return model_id.split("/")[-1].replace(".gguf", "")
        except Exception:
            pass
        return "local-model"

    def _batch_query_llm(self, folders: List[str], tech_stack: List[str], all_folders: List[str], provider: Optional[str], model_name: Optional[str]) -> Dict[str, Dict[str, Any]]:
        """
        Sends ONLY folder names, tech stack, and siblings to the LLM (LM Studio or Gemini).
        Returns a mapping of folder_name -> details.
        """
        # Construction of the onboarding-friendly inference prompt
        prompt = f"""You are a senior full-stack engineer explaining folder structures in a software repository to a beginner.
Using ONLY the folder name, detected technologies, sibling folders, and standard conventions, explain the purpose of the target folders.
Do NOT say "cannot determine" or refuse. Generate a constructive onboarding explanation under 70 words.
Each explanation should describe the concise purpose, why it exists, and what developers usually place inside.
Use friendly onboarding phrases like "This folder is likely used for..." or "In projects like this, this folder usually contains...".

Repository Ecosystem / Technologies:
{", ".join(tech_stack) if tech_stack else "Unknown"}

All Top-Level Folders in Repository:
{", ".join(all_folders)}

Target Folders to Explain:
{", ".join(folders)}

Output your response strictly as a JSON object with the following structure:
{{
  "folders": [
    {{
      "name": "folder_name",
      "category": "Frontend | Backend | Infrastructure | Documentation | Testing | Assets | Unknown",
      "description": "Constructive explanation under 70 words.",
      "contains": ["typical_file_or_subfolder_1", "typical_file_or_subfolder_2"],
      "importance": "High | Medium | Low"
    }}
  ]
}}
Do not include any other text, thinking blocks, comments, or markdown code block wrappers. Output only raw JSON.
"""

        # 1. Call local LM Studio if available
        if provider == "LM Studio":
            url = "http://127.0.0.1:1234/v1/chat/completions"
            headers = {"Content-Type": "application/json"}
            payload = {
                "model": model_name,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.2
            }
            req = urllib.request.Request(
                url, 
                data=json.dumps(payload).encode("utf-8"), 
                headers=headers, 
                method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=30) as response:
                    res_raw = response.read().decode("utf-8")
                    res_data = json.loads(res_raw)
                    text = res_data["choices"][0]["message"]["content"]
                    cleaned_text = self._clean_json_response(text)
                    parsed = json.loads(cleaned_text)
                    
                    output = {}
                    for f in parsed.get("folders", []):
                        name = f.get("name")
                        if name:
                            output[name] = {
                                "category": f.get("category", "Unknown"),
                                "description": f.get("description", ""),
                                "contains": f.get("contains", []),
                                "importance": f.get("importance", "Medium"),
                                "confidence": 100,
                                "source": "llm",
                                "provider": provider,
                                "model": model_name
                            }
                    
                    # Fill any missing folders
                    for name in folders:
                        if name not in output:
                            output[name] = {
                                "category": "Unknown",
                                "description": f"This folder is likely used in this {', '.join(tech_stack) if tech_stack else 'project'} to organize custom scripts or module resources.",
                                "contains": [],
                                "importance": "Medium",
                                "confidence": 100,
                                "source": "llm",
                                "provider": provider,
                                "model": model_name
                            }
                    return output
            except Exception:
                pass # Fall through to Gemini API if LM Studio fails

        # 2. Call cloud Gemini API if available
        if provider == "Gemini":
            api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }]
            }
            req = urllib.request.Request(
                url, 
                data=json.dumps(payload).encode("utf-8"), 
                headers=headers, 
                method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=15) as response:
                    res_raw = response.read().decode("utf-8")
                    res_data = json.loads(res_raw)
                    text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                    cleaned_text = self._clean_json_response(text)
                    parsed = json.loads(cleaned_text)
                    
                    output = {}
                    for f in parsed.get("folders", []):
                        name = f.get("name")
                        if name:
                            output[name] = {
                                "category": f.get("category", "Unknown"),
                                "description": f.get("description", ""),
                                "contains": f.get("contains", []),
                                "importance": f.get("importance", "Medium"),
                                "confidence": 100,
                                "source": "llm",
                                "provider": provider,
                                "model": model_name
                            }
                    
                    # Fill any missing folders
                    for name in folders:
                        if name not in output:
                            output[name] = {
                                "category": "Unknown",
                                "description": f"This folder is likely used in this {', '.join(tech_stack) if tech_stack else 'project'} to organize custom scripts or module resources.",
                                "contains": [],
                                "importance": "Medium",
                                "confidence": 100,
                                "source": "llm",
                                "provider": provider,
                                "model": model_name
                            }
                    return output
            except Exception:
                pass

        # 3. Fallback
        return {
            name: {
                "category": "Unknown",
                "description": f"This folder is likely used in this {', '.join(tech_stack) if tech_stack else 'project'} to organize custom scripts or module resources.",
                "contains": [],
                "importance": "Medium",
                "confidence": 50,
                "source": "fallback",
                "provider": None,
                "model": None
            }
            for name in folders
        }
