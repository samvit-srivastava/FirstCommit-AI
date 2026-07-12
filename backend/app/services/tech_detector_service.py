import os
import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional

# Mappings for manifest files: dependency -> (id, display_name, category, confidence)
MANIFEST_REGISTRY = {
    "package.json": {
        "react": ("react", "React", "Frontend", 100),
        "next": ("nextjs", "Next.js", "Frontend", 100),
        "vue": ("vue", "Vue", "Frontend", 100),
        "nuxt": ("nuxt", "Nuxt", "Frontend", 100),
        "@angular/core": ("angular", "Angular", "Frontend", 100),
        "astro": ("astro", "Astro", "Frontend", 100),
        "svelte": ("svelte", "Svelte", "Frontend", 100),
        "tailwindcss": ("tailwindcss", "Tailwind CSS", "Frontend", 100),
        "express": ("express", "Express", "Backend", 100),
        "nestjs": ("nestjs", "NestJS", "Backend", 100),
        "typescript": ("typescript", "TypeScript", "Language", 100),
        "jest": ("jest", "Jest", "Testing", 100),
        "vitest": ("vitest", "Vitest", "Testing", 100),
        "cypress": ("cypress", "Cypress", "Testing", 100),
        "playwright": ("playwright", "Playwright", "Testing", 100),
        "@prisma/client": ("prisma", "Prisma", "ORM", 100),
        "drizzle-orm": ("drizzle", "Drizzle ORM", "ORM", 100),
        "pg": ("postgresql", "PostgreSQL", "Database", 80),
        "mysql": ("mysql", "MySQL", "Database", 80),
        "sqlite3": ("sqlite", "SQLite", "Database", 80),
        "mongodb": ("mongodb", "MongoDB", "Database", 80),
        "redis": ("redis", "Redis", "Database", 80)
    },
    "requirements.txt": {
        "fastapi": ("fastapi", "FastAPI", "Backend", 100),
        "django": ("django", "Django", "Backend", 100),
        "flask": ("flask", "Flask", "Backend", 100),
        "pytest": ("pytest", "Pytest", "Testing", 100),
        "psycopg2": ("postgresql", "PostgreSQL", "Database", 80),
        "psycopg2-binary": ("postgresql", "PostgreSQL", "Database", 80),
        "asyncpg": ("postgresql", "PostgreSQL", "Database", 80),
        "pymysql": ("mysql", "MySQL", "Database", 80),
        "mysqlclient": ("mysql", "MySQL", "Database", 80),
        "redis": ("redis", "Redis", "Database", 80),
        "pymongo": ("mongodb", "MongoDB", "Database", 80)
    },
    "pyproject.toml": {
        "fastapi": ("fastapi", "FastAPI", "Backend", 100),
        "django": ("django", "Django", "Backend", 100),
        "flask": ("flask", "Flask", "Backend", 100),
        "pytest": ("pytest", "Pytest", "Testing", 100)
    },
    "go.mod": {
        "github.com/gin-gonic/gin": ("gin", "Gin", "Backend", 100)
    },
    "composer.json": {
        "laravel/framework": ("laravel", "Laravel", "Backend", 100)
    },
    "Gemfile": {
        "rails": ("rails", "Ruby on Rails", "Backend", 100)
    },
    "pom.xml": {
        "spring-boot-starter-web": ("springboot", "Spring Boot", "Backend", 100)
    },
    "build.gradle": {
        "spring-boot-starter-web": ("springboot", "Spring Boot", "Backend", 100)
    }
}

# Mappings for config file existence: filename -> (id, display_name, category, confidence, default_version)
FILE_EXISTENCE_REGISTRY = {
    "tsconfig.json": ("typescript", "TypeScript", "Language", 100, None),
    "vite.config.ts": ("vite", "Vite", "Build Tool", 100, None),
    "vite.config.js": ("vite", "Vite", "Build Tool", 100, None),
    "next.config.js": ("nextjs", "Next.js", "Frontend", 100, None),
    "next.config.ts": ("nextjs", "Next.js", "Frontend", 100, None),
    "nuxt.config.js": ("nuxt", "Nuxt", "Frontend", 100, None),
    "nuxt.config.ts": ("nuxt", "Nuxt", "Frontend", 100, None),
    "angular.json": ("angular", "Angular", "Frontend", 100, None),
    "astro.config.mjs": ("astro", "Astro", "Frontend", 100, None),
    "astro.config.js": ("astro", "Astro", "Frontend", 100, None),
    "svelte.config.js": ("svelte", "Svelte", "Frontend", 100, None),
    "main.py": ("python", "Python", "Language", 100, None),
    "server.js": ("javascript", "JavaScript", "Language", 100, None),
    "go.mod": ("go", "Go", "Language", 100, None),
    "Cargo.toml": ("rust", "Rust", "Language", 100, None),
    "composer.json": ("php", "PHP", "Language", 100, None),
    "Gemfile": ("ruby", "Ruby", "Language", 100, None),
    "Dockerfile": ("docker", "Docker", "DevOps", 100, None),
    "docker-compose.yml": ("dockercompose", "Docker Compose", "DevOps", 100, None),
    "compose.yaml": ("dockercompose", "Docker Compose", "DevOps", 100, None),
    "vercel.json": ("vercel", "Vercel", "Cloud", 100, None),
    "netlify.toml": ("netlify", "Netlify", "Cloud", 100, None),
    "railway.json": ("railway", "Railway", "Cloud", 100, None),
    "render.yaml": ("render", "Render", "Cloud", 100, None),
    "prisma/schema.prisma": ("prisma", "Prisma", "ORM", 100, None),
    "drizzle.config.ts": ("drizzle", "Drizzle ORM", "ORM", 100, None),
    "drizzle.config.js": ("drizzle", "Drizzle ORM", "ORM", 100, None),
    "jest.config.js": ("jest", "Jest", "Testing", 100, None),
    "jest.config.ts": ("jest", "Jest", "Testing", 100, None),
    "vitest.config.ts": ("vitest", "Vitest", "Testing", 100, None),
    "vitest.config.js": ("vitest", "Vitest", "Testing", 100, None),
    "pytest.ini": ("pytest", "Pytest", "Testing", 100, None),
    "tox.ini": ("pytest", "Pytest", "Testing", 100, None),
    "playwright.config.ts": ("playwright", "Playwright", "Testing", 100, None),
    "playwright.config.js": ("playwright", "Playwright", "Testing", 100, None),
    "cypress.config.ts": ("cypress", "Cypress", "Testing", 100, None),
    "cypress.config.js": ("cypress", "Cypress", "Testing", 100, None),
    "package-lock.json": ("npm", "npm", "Package Manager", 100, None),
    "pnpm-lock.yaml": ("pnpm", "pnpm", "Package Manager", 100, None),
    "yarn.lock": ("yarn", "yarn", "Package Manager", 100, None),
    "bun.lockb": ("bun", "bun", "Package Manager", 100, None),
    "poetry.lock": ("poetry", "Poetry", "Package Manager", 100, None),
    "composer.lock": ("composer", "Composer", "Package Manager", 100, None),
    "Cargo.lock": ("cargo", "Cargo", "Package Manager", 100, None)
}

CATEGORY_SORT_ORDER = {
    "Language": 0,
    "Frontend": 1,
    "Backend": 2,
    "Database": 3,
    "ORM": 4,
    "Testing": 5,
    "Build Tool": 6,
    "DevOps": 7,
    "Cloud": 8,
    "Package Manager": 9
}

class TechDetectorService:
    def detect_technologies(self, local_path: str) -> List[Dict[str, Any]]:
        """
        Exposes the single public method to scan a repository path.
        Returns a sorted list of detected technologies, with deterministic coverage computed.
        """
        root = Path(local_path)
        if not root.exists() or not root.is_dir():
            raise ValueError(f"Invalid path: {local_path}")

        detected = {}

        # 1. Parse Whitelisted Manifest Files
        self._parse_manifest_files(root, detected)

        # 2. Check File Existence rules
        self._check_file_existence(root, detected)

        # 3. Fallback Code checks (from whitelisted files only)
        self._check_codebase_fallbacks(root, detected)

        # 4. Check Framework Repository self-detection (express, django, flask, fastapi, vite repos)
        self._detect_framework_repositories(root, detected)

        # 5. Check DevOps/Infra Directories
        self._check_devops_directories(root, detected)

        # 6. Gather File Metrics
        metrics = self._gather_file_metrics(root)

        # 7. Deterministic Language Detection
        self._detect_primary_languages(root, detected, metrics)

        # 8. Compute deterministic coverage percentage for each detected tech
        for tech_id, tech_info in detected.items():
            tech_info["coverage"] = self._calculate_coverage(tech_id, tech_info["category"], metrics)

        # Sort results: Category order -> Confidence descending -> display_name ascending
        sorted_list = sorted(
            detected.values(),
            key=lambda t: (
                CATEGORY_SORT_ORDER.get(t["category"], 10),
                -t["confidence"],
                t["display_name"].lower()
            )
        )
        return sorted_list

    def _read_file_safe(self, path: Path) -> str:
        try:
            return path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            return ""

    def _add_detection(self, detected: Dict[str, Any], tech_id: str, display_name: str, category: str, confidence: int, evidence: str, version: Optional[str] = None) -> None:
        """Helper to update detection map with the highest confidence details."""
        # Clean up wildcards or invalid version values
        clean_version = None
        if version:
            version_str = str(version).strip().strip('"').strip("'")
            if version_str and version_str != "*":
                clean_version = version_str

        if tech_id in detected:
            if confidence > detected[tech_id]["confidence"]:
                detected[tech_id] = {
                    "id": tech_id,
                    "display_name": display_name,
                    "name": display_name,
                    "category": category,
                    "confidence": confidence,
                    "evidence": evidence,
                    "version": clean_version or detected[tech_id]["version"]
                }
            elif clean_version and not detected[tech_id]["version"]:
                detected[tech_id]["version"] = clean_version
        else:
            detected[tech_id] = {
                "id": tech_id,
                "display_name": display_name,
                "name": display_name,
                "category": category,
                "confidence": confidence,
                "evidence": evidence,
                "version": clean_version
            }

    def _gather_file_metrics(self, root: Path) -> Dict[str, int]:
        metrics = {
            "total_files": 0,
            "py": 0,
            "ts": 0,
            "js": 0,
            "html": 0,
            "css": 0,
            "go": 0,
            "rust": 0,
            "java": 0,
            "php": 0,
            "ruby": 0,
            "tests": 0
        }
        
        # Walk directories recursively, excluding environment, version control, and build output directories
        exclude_dirs = {".git", "node_modules", "venv", ".venv", "__pycache__", "build", "dist", ".next"}
        
        for p in root.rglob("*"):
            try:
                rel_parts = p.relative_to(root).parts
            except ValueError:
                continue
            if any(part in exclude_dirs for part in rel_parts):
                continue
            if p.is_file():
                metrics["total_files"] += 1
                ext = p.suffix.lower()
                name_lower = p.name.lower()
                
                # Increment extension metrics
                if ext == ".py":
                    metrics["py"] += 1
                elif ext in (".ts", ".tsx"):
                    metrics["ts"] += 1
                elif ext in (".js", ".jsx", ".mjs", ".cjs"):
                    metrics["js"] += 1
                elif ext == ".html":
                    metrics["html"] += 1
                elif ext in (".css", ".scss", ".less"):
                    metrics["css"] += 1
                elif ext == ".go":
                    metrics["go"] += 1
                elif ext == ".rs":
                    metrics["rust"] += 1
                elif ext == ".java":
                    metrics["java"] += 1
                elif ext == ".php":
                    metrics["php"] += 1
                elif ext == ".rb":
                    metrics["ruby"] += 1
                    
                # Increment test file metrics
                if "test" in name_lower or "spec" in name_lower:
                    metrics["tests"] += 1
                    
        return metrics

    def _calculate_coverage(self, tech_id: str, category: str, metrics: Dict[str, int]) -> int:
        """
        Calculates deterministic codebase coverage percentage.
        Formula:
          coverage = (number of matching files / total relevant files) * 100
        """
        py_files = metrics["py"]
        js_files = metrics["js"]
        ts_files = metrics["ts"]
        html_files = metrics["html"]
        css_files = metrics["css"]
        go_files = metrics["go"]
        rust_files = metrics["rust"]
        java_files = metrics["java"]
        php_files = metrics["php"]
        ruby_files = metrics["ruby"]
        test_files = metrics["tests"]
        
        total_code_files = (
            py_files + js_files + ts_files + html_files + css_files + 
            go_files + rust_files + java_files + php_files + ruby_files
        )
        
        if total_code_files == 0:
            return 0
            
        # 1. Languages
        if category == "Language":
            if tech_id == "python":
                return int(round((py_files / total_code_files) * 100))
            elif tech_id == "typescript":
                return int(round((ts_files / total_code_files) * 100))
            elif tech_id == "javascript":
                return int(round((js_files / total_code_files) * 100))
            elif tech_id == "go":
                return int(round((go_files / total_code_files) * 100))
            elif tech_id == "rust":
                return int(round((rust_files / total_code_files) * 100))
            elif tech_id == "php":
                return int(round((php_files / total_code_files) * 100))
            elif tech_id == "ruby":
                return int(round((ruby_files / total_code_files) * 100))
            elif tech_id == "java":
                return int(round((java_files / total_code_files) * 100))
                
        # 2. Frontend Frameworks
        if category == "Frontend":
            # React / Next.js / Tailwind are used across all frontend files
            frontend_files = js_files + ts_files + html_files + css_files
            if tech_id in ("react", "nextjs", "vue", "nuxt", "angular", "astro", "svelte"):
                js_ts_files = js_files + ts_files
                return max(10, int(round((js_ts_files / total_code_files) * 100)))
            elif tech_id == "tailwindcss":
                return max(10, int(round((frontend_files / total_code_files) * 100)))
                
        # 3. Backend Frameworks
        if category == "Backend":
            if tech_id in ("fastapi", "django", "flask"):
                return max(10, int(round((py_files / total_code_files) * 100)))
            elif tech_id in ("express", "nestjs"):
                js_ts_files = js_files + ts_files
                return max(10, int(round((js_ts_files / total_code_files) * 100)))
            elif tech_id == "laravel":
                return max(10, int(round((php_files / total_code_files) * 100)))
            elif tech_id == "rails":
                return max(10, int(round((ruby_files / total_code_files) * 100)))
            elif tech_id == "springboot":
                return max(10, int(round((java_files / total_code_files) * 100)))
            elif tech_id == "gin":
                return max(10, int(round((go_files / total_code_files) * 100)))
                
        # 4. Testing
        if category == "Testing":
            return max(10, int(round((test_files / total_code_files) * 100)))
            
        # 5. ORM / Database
        if category == "ORM":
            return 15  # Standard baseline coverage for ORMs
        if category == "Database":
            return 10  # Standard baseline coverage for database clients
            
        # 6. Build Tool / DevOps / Cloud / Package Manager (Configuration based, low but non-zero)
        if category in ("Build Tool", "DevOps", "Cloud", "Package Manager"):
            if tech_id in ("docker", "dockercompose"):
                return 5
            elif tech_id == "githubactions":
                return 5
            return 10
            
        return 10

    def _parse_manifest_files(self, root: Path, detected: Dict[str, Any]) -> None:
        # A. package.json
        package_json_path = root / "package.json"
        if package_json_path.exists():
            content = self._read_file_safe(package_json_path)
            if content:
                try:
                    data = json.loads(content)
                    deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
                    registry = MANIFEST_REGISTRY["package.json"]
                    
                    for dep_name, version in deps.items():
                        dep_name_lower = dep_name.lower()
                        if dep_name_lower in registry:
                            tech_id, display_name, category, confidence = registry[dep_name_lower]
                            self._add_detection(
                                detected,
                                tech_id=tech_id,
                                display_name=display_name,
                                category=category,
                                confidence=confidence,
                                evidence=f"package.json -> dependencies.{dep_name}",
                                version=str(version)
                            )
                except Exception:
                    pass

        # B. requirements.txt
        requirements_path = root / "requirements.txt"
        if requirements_path.exists():
            content = self._read_file_safe(requirements_path)
            if content:
                registry = MANIFEST_REGISTRY["requirements.txt"]
                for line in content.splitlines():
                    line_clean = line.split('#')[0].strip()
                    if not line_clean:
                        continue
                    # Match name and optional version operator
                    match = re.match(r'^([a-zA-Z0-9_\-\[\]]+)(?:\s*(?:==|>=|<=|~=|>|<|===)\s*([a-zA-Z0-9_\-\.\*]+))?', line_clean)
                    if match:
                        dep_name, version = match.groups()
                        dep_name_lower = dep_name.lower()
                        if dep_name_lower in registry:
                            tech_id, display_name, category, confidence = registry[dep_name_lower]
                            self._add_detection(
                                detected,
                                tech_id=tech_id,
                                display_name=display_name,
                                category=category,
                                confidence=confidence,
                                evidence=f"requirements.txt -> {line_clean}",
                                version=version
                            )

        # C. pyproject.toml
        pyproject_path = root / "pyproject.toml"
        if pyproject_path.exists():
            content = self._read_file_safe(pyproject_path)
            if content:
                registry = MANIFEST_REGISTRY["pyproject.toml"]
                # Parse section-by-section
                in_deps = False
                for line in content.splitlines():
                    stripped = line.strip()
                    if not stripped:
                        continue
                    if stripped.startswith("["):
                        in_deps = "dependencies" in stripped.lower()
                        continue
                    if in_deps:
                        if stripped.startswith("#"):
                            continue
                        if "=" in stripped:
                            parts = stripped.split("=", 1)
                            dep_name = parts[0].strip().strip('"').strip("'").lower()
                            right_val = parts[1].strip()
                            version_match = re.match(r'^["\']([^"\']+)["\']', right_val)
                            version = None
                            if version_match:
                                version = version_match.group(1)
                            else:
                                inline_match = re.search(r'version\s*=\s*["\']([^"\']+)["\']', right_val)
                                if inline_match:
                                    version = inline_match.group(1)
                            if dep_name in registry:
                                tech_id, display_name, category, confidence = registry[dep_name]
                                self._add_detection(
                                    detected,
                                    tech_id=tech_id,
                                    display_name=display_name,
                                    category=category,
                                    confidence=confidence,
                                    evidence=f"pyproject.toml -> {stripped}",
                                    version=version
                                )

        # D. poetry.lock (Checks if poetry.lock exists to pull precise versions)
        poetry_lock_path = root / "poetry.lock"
        if poetry_lock_path.exists():
            content = self._read_file_safe(poetry_lock_path)
            if content:
                # Simple parser for poetry lock blocks
                packages = content.split("[[package]]")
                for pkg in packages[1:]:
                    name_match = re.search(r'name\s*=\s*["\']([^"\']+)["\']', pkg)
                    version_match = re.search(r'version\s*=\s*["\']([^"\']+)["\']', pkg)
                    if name_match and version_match:
                        pkg_name = name_match.group(1).lower()
                        # Check requirements and pyproject registers for matched tools
                        all_python_registry = {**MANIFEST_REGISTRY["requirements.txt"], **MANIFEST_REGISTRY["pyproject.toml"]}
                        if pkg_name in all_python_registry:
                            tech_id, display_name, category, confidence = all_python_registry[pkg_name]
                            self._add_detection(
                                detected,
                                tech_id=tech_id,
                                display_name=display_name,
                                category=category,
                                confidence=confidence,
                                evidence=f"poetry.lock -> package {pkg_name}",
                                version=version_match.group(1)
                            )

        # E. Pipfile
        pipfile_path = root / "Pipfile"
        if pipfile_path.exists():
            content = self._read_file_safe(pipfile_path)
            if content:
                in_packages = False
                all_python_registry = {**MANIFEST_REGISTRY["requirements.txt"], **MANIFEST_REGISTRY["pyproject.toml"]}
                for line in content.splitlines():
                    stripped = line.strip()
                    if not stripped:
                        continue
                    if stripped.startswith("["):
                        in_packages = "packages" in stripped.lower()
                        continue
                    if in_packages:
                        if stripped.startswith("#") or "=" not in stripped:
                            continue
                        parts = stripped.split("=", 1)
                        dep_name = parts[0].strip().strip('"').strip("'").lower()
                        right_val = parts[1].strip()
                        version = None
                        version_match = re.match(r'^["\']([^"\']+)["\']', right_val)
                        if version_match:
                            version = version_match.group(1)
                        else:
                            inline_match = re.search(r'version\s*=\s*["\']([^"\']+)["\']', right_val)
                            if inline_match:
                                version = inline_match.group(1)
                        if dep_name in all_python_registry:
                            tech_id, display_name, category, confidence = all_python_registry[dep_name]
                            self._add_detection(
                                detected,
                                tech_id=tech_id,
                                display_name=display_name,
                                category=category,
                                confidence=confidence,
                                evidence=f"Pipfile -> {stripped}",
                                version=version
                            )

        # F. go.mod
        go_mod_path = root / "go.mod"
        if go_mod_path.exists():
            content = self._read_file_safe(go_mod_path)
            if content:
                registry = MANIFEST_REGISTRY["go.mod"]
                pattern = re.compile(r'^\s*([a-zA-Z0-9_\-\.\/]+)\s+(v[0-9]+\.[0-9]+\.[0-9]+[a-zA-Z0-9_\-\.]*)')
                for line in content.splitlines():
                    match = pattern.match(line.strip())
                    if match:
                        dep_name, version = match.groups()
                        if dep_name in registry:
                            tech_id, display_name, category, confidence = registry[dep_name]
                            self._add_detection(
                                detected,
                                tech_id=tech_id,
                                display_name=display_name,
                                category=category,
                                confidence=confidence,
                                evidence=f"go.mod -> {line.strip()}",
                                version=version
                            )

        # G. composer.json
        composer_path = root / "composer.json"
        if composer_path.exists():
            content = self._read_file_safe(composer_path)
            if content:
                try:
                    data = json.loads(content)
                    reqs = {**data.get("require", {}), **data.get("require-dev", {})}
                    registry = MANIFEST_REGISTRY["composer.json"]
                    for dep_name, version in reqs.items():
                        dep_name_lower = dep_name.lower()
                        if dep_name_lower in registry:
                            tech_id, display_name, category, confidence = registry[dep_name_lower]
                            self._add_detection(
                                detected,
                                tech_id=tech_id,
                                display_name=display_name,
                                category=category,
                                confidence=confidence,
                                evidence=f"composer.json -> require.{dep_name}",
                                version=str(version)
                            )
                except Exception:
                    pass

        # H. Gemfile
        gemfile_path = root / "Gemfile"
        if gemfile_path.exists():
            content = self._read_file_safe(gemfile_path)
            if content:
                registry = MANIFEST_REGISTRY["Gemfile"]
                pattern = re.compile(r'^\s*gem\s+[\'"]([a-zA-Z0-9_\-]+)[\'"](?:\s*,\s*[\'"]([^\'"]+)[\'"])?')
                for line in content.splitlines():
                    match = pattern.match(line.strip())
                    if match:
                        dep_name = match.group(1)
                        version = match.group(2)
                        if dep_name in registry:
                            tech_id, display_name, category, confidence = registry[dep_name]
                            self._add_detection(
                                detected,
                                tech_id=tech_id,
                                display_name=display_name,
                                category=category,
                                confidence=confidence,
                                evidence=f"Gemfile -> gem {dep_name}",
                                version=version
                            )

        # I. pom.xml
        pom_path = root / "pom.xml"
        if pom_path.exists():
            content = self._read_file_safe(pom_path)
            if content:
                registry = MANIFEST_REGISTRY["pom.xml"]
                dep_pattern = re.compile(r'<dependency>[\s\S]*?<artifactId>(.*?)</artifactId>[\s\S]*?(?:<version>(.*?)</version>)?[\s\S]*?</dependency>')
                for match in dep_pattern.finditer(content):
                    artifact, version = match.groups()
                    artifact_clean = artifact.strip()
                    if artifact_clean in registry:
                        tech_id, display_name, category, confidence = registry[artifact_clean]
                        self._add_detection(
                            detected,
                            tech_id=tech_id,
                            display_name=display_name,
                            category=category,
                            confidence=confidence,
                            evidence=f"pom.xml -> dependency.{artifact_clean}",
                            version=version.strip() if version else None
                        )

        # J. build.gradle
        gradle_path = root / "build.gradle"
        if gradle_path.exists():
            content = self._read_file_safe(gradle_path)
            if content:
                registry = MANIFEST_REGISTRY["build.gradle"]
                pattern = re.compile(r'implementation\s+[\'"]([^\'"]+):([^\'"]+):([^\'"]+)[\'"]')
                for line in content.splitlines():
                    match = pattern.search(line.strip())
                    if match:
                        group, name, version = match.groups()
                        if name in registry:
                            tech_id, display_name, category, confidence = registry[name]
                            self._add_detection(
                                detected,
                                tech_id=tech_id,
                                display_name=display_name,
                                category=category,
                                confidence=confidence,
                                evidence=f"build.gradle -> implementation {name}",
                                version=version
                            )

    def _check_file_existence(self, root: Path, detected: Dict[str, Any]) -> None:
        for filename, (tech_id, display_name, category, confidence, default_version) in FILE_EXISTENCE_REGISTRY.items():
            file_path = root / filename
            if file_path.exists():
                self._add_detection(
                    detected,
                    tech_id=tech_id,
                    display_name=display_name,
                    category=category,
                    confidence=confidence,
                    evidence=f"Root-level {filename} configuration file",
                    version=default_version
                )

    def _check_codebase_fallbacks(self, root: Path, detected: Dict[str, Any]) -> None:
        # A. Express import detection in server.js (if package.json is missing or doesn't explicitly list express)
        server_js_path = root / "server.js"
        if server_js_path.exists():
            content = self._read_file_safe(server_js_path)
            if "express" in content.lower():
                self._add_detection(
                    detected,
                    tech_id="express",
                    display_name="Express",
                    category="Backend",
                    confidence=100,
                    evidence="server.js imports express package"
                )

        # B. FastAPI import fallback in main.py
        main_py_path = root / "main.py"
        if main_py_path.exists():
            content = self._read_file_safe(main_py_path)
            if "fastapi" in content.lower():
                self._add_detection(
                    detected,
                    tech_id="fastapi",
                    display_name="FastAPI",
                    category="Backend",
                    confidence=100,
                    evidence="main.py imports fastapi package"
                )

    def _detect_framework_repositories(self, root: Path, detected: Dict[str, Any]) -> None:
        # A. Express Self-Detection
        is_express_repo = False
        express_version = None
        express_evidence = ""
        
        if (root / "lib" / "express.js").exists() or (root / "lib" / "application.js").exists():
            is_express_repo = True
            express_evidence = "lib/express.js or lib/application.js presence"
            
        package_json_path = root / "package.json"
        if package_json_path.exists():
            content = self._read_file_safe(package_json_path)
            if content:
                try:
                    data = json.loads(content)
                    if data.get("name") == "express":
                        is_express_repo = True
                        express_evidence = "package.json -> name is express"
                        express_version = data.get("version")
                except Exception:
                    pass
                    
        if is_express_repo:
            self._add_detection(
                detected,
                tech_id="express",
                display_name="Express",
                category="Backend",
                confidence=100,
                evidence=express_evidence,
                version=express_version
            )
            self._add_detection(
                detected,
                tech_id="javascript",
                display_name="JavaScript",
                category="Language",
                confidence=100,
                evidence="Express framework repository detected"
            )

        # B. Flask Self-Detection
        is_flask_repo = False
        flask_version = None
        flask_evidence = ""
        
        if (root / "src" / "flask" / "__init__.py").exists() or (root / "flask" / "__init__.py").exists():
            is_flask_repo = True
            flask_evidence = "flask/__init__.py presence"
            
        pyproject_path = root / "pyproject.toml"
        if pyproject_path.exists():
            content = self._read_file_safe(pyproject_path)
            if content:
                name_match = re.search(r'^\s*name\s*=\s*["\']flask["\']', content, re.IGNORECASE | re.MULTILINE)
                if name_match:
                    is_flask_repo = True
                    flask_evidence = "pyproject.toml -> project name is flask"
                    version_match = re.search(r'^\s*version\s*=\s*["\']([^"\']+)["\']', content, re.MULTILINE)
                    if version_match:
                        flask_version = version_match.group(1)
                        
        if is_flask_repo:
            self._add_detection(
                detected,
                tech_id="flask",
                display_name="Flask",
                category="Backend",
                confidence=100,
                evidence=flask_evidence,
                version=flask_version
            )
            self._add_detection(
                detected,
                tech_id="python",
                display_name="Python",
                category="Language",
                confidence=100,
                evidence="Flask framework repository detected"
            )

        # C. Django Self-Detection
        is_django_repo = False
        django_version = None
        django_evidence = ""
        
        if (root / "django" / "__init__.py").exists():
            is_django_repo = True
            django_evidence = "django/__init__.py presence"
            
        if pyproject_path.exists():
            content = self._read_file_safe(pyproject_path)
            if content:
                name_match = re.search(r'^\s*name\s*=\s*["\']django["\']', content, re.IGNORECASE | re.MULTILINE)
                if name_match:
                    is_django_repo = True
                    django_evidence = "pyproject.toml -> project name is django"
                    version_match = re.search(r'^\s*version\s*=\s*["\']([^"\']+)["\']', content, re.MULTILINE)
                    if version_match:
                        django_version = version_match.group(1)
                        
        if is_django_repo:
            self._add_detection(
                detected,
                tech_id="django",
                display_name="Django",
                category="Backend",
                confidence=100,
                evidence=django_evidence,
                version=django_version
            )
            self._add_detection(
                detected,
                tech_id="python",
                display_name="Python",
                category="Language",
                confidence=100,
                evidence="Django framework repository detected"
            )

        # D. FastAPI Self-Detection
        is_fastapi_repo = False
        fastapi_version = None
        fastapi_evidence = ""
        
        if (root / "fastapi" / "__init__.py").exists():
            is_fastapi_repo = True
            fastapi_evidence = "fastapi/__init__.py presence"
            
        if pyproject_path.exists():
            content = self._read_file_safe(pyproject_path)
            if content:
                name_match = re.search(r'^\s*name\s*=\s*["\']fastapi["\']', content, re.IGNORECASE | re.MULTILINE)
                if name_match:
                    is_fastapi_repo = True
                    fastapi_evidence = "pyproject.toml -> project name is fastapi"
                    version_match = re.search(r'^\s*version\s*=\s*["\']([^"\']+)["\']', content, re.MULTILINE)
                    if version_match:
                        fastapi_version = version_match.group(1)
                        
        if is_fastapi_repo:
            self._add_detection(
                detected,
                tech_id="fastapi",
                display_name="FastAPI",
                category="Backend",
                confidence=100,
                evidence=fastapi_evidence,
                version=fastapi_version
            )
            self._add_detection(
                detected,
                tech_id="python",
                display_name="Python",
                category="Language",
                confidence=100,
                evidence="FastAPI framework repository detected"
            )

        # E. Vite Self-Detection
        is_vite_repo = False
        vite_version = None
        vite_evidence = ""
        
        if (root / "packages" / "vite" / "package.json").exists():
            is_vite_repo = True
            vite_evidence = "packages/vite/package.json presence"
            
        if package_json_path.exists():
            content = self._read_file_safe(package_json_path)
            if content:
                try:
                    data = json.loads(content)
                    if data.get("name") == "vite":
                        is_vite_repo = True
                        vite_evidence = "package.json -> name is vite"
                        vite_version = data.get("version")
                except Exception:
                    pass
                    
        if is_vite_repo:
            self._add_detection(
                detected,
                tech_id="vite",
                display_name="Vite",
                category="Build Tool",
                confidence=100,
                evidence=vite_evidence,
                version=vite_version
            )
            self._add_detection(
                detected,
                tech_id="typescript",
                display_name="TypeScript",
                category="Language",
                confidence=100,
                evidence="Vite workspace configuration detected"
            )

    def _check_devops_directories(self, root: Path, detected: Dict[str, Any]) -> None:
        workflows_dir = root / ".github" / "workflows"
        if workflows_dir.exists() and workflows_dir.is_dir():
            try:
                yaml_files = [f for f in os.listdir(workflows_dir) if f.endswith(".yml") or f.endswith(".yaml")]
                if yaml_files:
                    self._add_detection(
                        detected,
                        tech_id="githubactions",
                        display_name="GitHub Actions",
                        category="DevOps",
                        confidence=100,
                        evidence=f".github/workflows directory contains workflow files: {', '.join(yaml_files[:3])}"
                    )
            except Exception:
                pass

    def _detect_primary_languages(self, root: Path, detected: Dict[str, Any], metrics: Dict[str, int]) -> None:
        """Always identify the primary programming languages deterministically from repository manifests and configs."""
        # Python
        if (
            (root / "requirements.txt").exists() or
            (root / "pyproject.toml").exists() or
            (root / "Pipfile").exists() or
            (root / "poetry.lock").exists() or
            (root / "main.py").exists() or
            metrics["py"] > 0
        ):
            self._add_detection(
                detected,
                tech_id="python",
                display_name="Python",
                category="Language",
                confidence=100,
                evidence="Python environment configuration or files detected"
            )

        # TypeScript
        if (root / "tsconfig.json").exists() or metrics["ts"] > 0:
            self._add_detection(
                detected,
                tech_id="typescript",
                display_name="TypeScript",
                category="Language",
                confidence=100,
                evidence="TypeScript configuration or files detected"
            )

        # JavaScript
        if (root / "package.json").exists() or (root / "server.js").exists() or metrics["js"] > 0:
            self._add_detection(
                detected,
                tech_id="javascript",
                display_name="JavaScript",
                category="Language",
                confidence=100,
                evidence="JavaScript configuration or files detected"
            )

        # Go
        if (root / "go.mod").exists() or metrics["go"] > 0:
            self._add_detection(
                detected,
                tech_id="go",
                display_name="Go",
                category="Language",
                confidence=100,
                evidence="Go package configuration or files detected"
            )

        # Rust
        if (root / "Cargo.toml").exists() or metrics["rust"] > 0:
            self._add_detection(
                detected,
                tech_id="rust",
                display_name="Rust",
                category="Language",
                confidence=100,
                evidence="Rust configuration or files detected"
            )

        # PHP
        if (root / "composer.json").exists() or metrics["php"] > 0:
            self._add_detection(
                detected,
                tech_id="php",
                display_name="PHP",
                category="Language",
                confidence=100,
                evidence="PHP configuration or files detected"
            )

        # Ruby
        if (root / "Gemfile").exists() or metrics["ruby"] > 0:
            self._add_detection(
                detected,
                tech_id="ruby",
                display_name="Ruby",
                category="Language",
                confidence=100,
                evidence="Ruby configuration or files detected"
            )

        # Java
        if (root / "pom.xml").exists() or (root / "build.gradle").exists() or metrics["java"] > 0:
            self._add_detection(
                detected,
                tech_id="java",
                display_name="Java",
                category="Language",
                confidence=100,
                evidence="Java build configuration or files detected"
            )
