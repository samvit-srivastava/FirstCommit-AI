from urllib.parse import urlparse
import shutil
import tempfile
from pathlib import Path
import git

class RepositoryService:
    @staticmethod
    def _validate_and_parse_url(repo_url: str):
        """
        Validates GitHub URLs (HTTPS/HTTP and SSH) and extracts owner and repository name.
        """
        if not repo_url or not isinstance(repo_url, str):
            raise ValueError("Repository URL must be a non-empty string.")
            
        url_str = repo_url.strip()
        
        # Check SSH format: git@github.com:owner/repo.git or git@github.com:owner/repo
        if url_str.startswith("git@"):
            if not url_str.startswith("git@github.com:"):
                raise ValueError("Only GitHub SSH URLs are supported (must start with git@github.com:).")
            path = url_str.split("git@github.com:", 1)[1]
        else:
            # Handle format without scheme: github.com/owner/repo
            if url_str.startswith("github.com") or url_str.startswith("www.github.com"):
                url_str = "https://" + url_str
                
            parsed = urlparse(url_str)
            if parsed.netloc not in ("github.com", "www.github.com"):
                raise ValueError("Only GitHub repositories are supported (domain must be github.com).")
            path = parsed.path
            
        path_parts = [p for p in path.strip("/").split("/") if p]
        if len(path_parts) < 2:
            raise ValueError("GitHub URL must contain both owner and repository name (e.g. github.com/owner/repo).")
            
        owner = path_parts[0]
        repo_name = path_parts[1]
        
        # Remove .git suffix if present
        if repo_name.endswith(".git"):
            repo_name = repo_name[:-4]
            
        return owner, repo_name

    @staticmethod
    def resolve_clone_path(repo_url: str) -> Path:
        """Returns the local clone directory for a validated GitHub URL."""
        import os
        import tempfile

        owner, repo_name = RepositoryService._validate_and_parse_url(repo_url)

        if os.name == "nt":
            for path_str in ["C:/tmp/fcai", "C:/fcai"]:
                try:
                    p = Path(path_str)
                    p.mkdir(parents=True, exist_ok=True)
                    return p / f"{owner}_{repo_name}"
                except Exception:
                    continue
            temp_dir = Path(tempfile.gettempdir()) / "fcai"
        else:
            temp_dir = Path(tempfile.gettempdir()) / "firstcommit_ai"

        return temp_dir / f"{owner}_{repo_name}"

    def _delete_dir_with_backoff(self, path: Path) -> None:
        """
        Deletes a directory recursively, clearing read-only attributes on Windows,
        and using exponential backoff to handle temporary locks.
        """
        if not path.exists():
            return

        import time
        import stat
        import os

        def remove_readonly(func, file_path, excinfo):
            try:
                os.chmod(file_path, stat.S_IWRITE)
                func(file_path)
            except Exception:
                pass

        backoffs = [0.1, 0.25, 0.5, 1.0, 2.0]
        for delay in backoffs:
            try:
                shutil.rmtree(path, onerror=remove_readonly)
            except Exception:
                pass
            if not path.exists():
                return
            time.sleep(delay)

        # Final try
        try:
            shutil.rmtree(path, onerror=remove_readonly)
        except Exception:
            pass

        if path.exists():
            raise ValueError(
                f"Failed to clear stale repository cache at {path} due to Windows file locks. "
                "Please close any open files or editors inside the temp folder and try again."
            )

    def clone_repository(self, repo_url: str) -> dict:
        """
        Validates the GitHub URL, checks if the repo is already cloned, and clones if not.
        Returns a dict with: repository_name, default_branch, local_clone_path, clone_status
        """
        import os
        import subprocess

        # 1. Validate & Parse URL
        try:
            owner, repo_name = self._validate_and_parse_url(repo_url)
        except ValueError as e:
            raise ValueError(f"URL Validation Error: {str(e)}")

        # Ensure core.longpaths is configured globally on Windows
        if os.name == 'nt':
            try:
                subprocess.run(["git", "config", "--global", "core.longpaths", "true"], capture_output=True)
            except Exception:
                pass

        # 2. Determine target path in a short directory on Windows
        local_clone_path = self.resolve_clone_path(repo_url)
        temp_dir = local_clone_path.parent
        
        # 3. Check if already exists and is a valid repository
        if local_clone_path.exists():
            try:
                # Test if it's a valid git repository
                repo = git.Repo(local_clone_path)
                # Compare remote HEAD commit SHA with cached clone to invalidate stale cache
                try:
                    ls_output = repo.git.ls_remote(repo_url, "HEAD")
                    if ls_output:
                        remote_sha = ls_output.split()[0]
                        local_sha = repo.head.commit.hexsha
                        if local_sha != remote_sha:
                            # Stale cache! Close repo first to release locks, then delete and force re-clone
                            repo.close()
                            self._delete_dir_with_backoff(local_clone_path)
                            raise git.exc.InvalidGitRepositoryError("Local commit SHA is stale")
                except git.exc.InvalidGitRepositoryError as e:
                    raise e
                except Exception:
                    # Offline / network issues: fallback to reuse the cached repository
                    pass
                
                # Recheck directory presence in case it was deleted above
                if local_clone_path.exists():
                    try:
                        default_branch = repo.active_branch.name
                    except TypeError:
                        # Detached HEAD fallback
                        default_branch = self._get_default_branch_from_remote_refs(repo)
                    
                    # Close repo handle to release file locks on Windows
                    repo.close()
                    
                    return {
                        "repository_name": repo_name,
                        "default_branch": default_branch,
                        "local_clone_path": str(local_clone_path),
                        "clone_status": "reused"
                    }
            except (git.exc.InvalidGitRepositoryError, git.exc.NoSuchPathError) as e:
                # Close repo if still open
                try:
                    repo.close()
                except Exception:
                    pass
                # Directory exists but is not a valid git repo or was deleted due to stale commit, clean it up and re-clone
                self._delete_dir_with_backoff(local_clone_path)
        
        # Ensure parent directory exists
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        # Defensive check: ensure the folder is completely gone before cloning
        if local_clone_path.exists():
            self._delete_dir_with_backoff(local_clone_path)
        assert not local_clone_path.exists(), "Clone directory still exists after deletion attempt!"
        
        # 4. Clone repository using GitPython (shallow clone, depth=1)
        try:
            repo = git.Repo.clone_from(
                repo_url, 
                local_clone_path, 
                depth=1, 
                multi_options=["-c core.longpaths=true"],
                allow_unsafe_options=True
            )
            try:
                default_branch = repo.active_branch.name
            except TypeError:
                default_branch = self._get_default_branch_from_remote_refs(repo)
                
            # Close repo handle to release file locks on Windows
            repo.close()
                
            return {
                "repository_name": repo_name,
                "default_branch": default_branch,
                "local_clone_path": str(local_clone_path),
                "clone_status": "cloned"
            }
        except git.exc.GitCommandError as e:
            err_msg = str(e)
            if "repository" in err_msg.lower() and ("not found" in err_msg.lower() or "does not exist" in err_msg.lower()):
                raise ValueError("Repository not found or is private. Please verify the URL and permissions.")
            elif "could not resolve host" in err_msg.lower() or "connection timed out" in err_msg.lower():
                raise ValueError("Network error: Could not reach GitHub. Please check your internet connection.")
            elif "terminal prompts disabled" in err_msg.lower() or "username" in err_msg.lower() or "password" in err_msg.lower():
                raise ValueError("Authentication error: This repository may be private or requires credentials.")
            elif "filename too long" in err_msg.lower() or "path too long" in err_msg.lower() or "too long" in err_msg.lower():
                raise ValueError(
                    "Windows File Path Limit Error: Some file paths in this repository exceed Windows path length limits (260 characters). "
                    "Please ensure 'git config --global core.longpaths true' is set, and 'LongPathsEnabled' is set to 1 in your "
                    "Windows Registry (under Computer\\HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\FileSystem)."
                )
            else:
                raise ValueError(f"Git Clone Failed: {err_msg}")
        except Exception as e:
            err_msg = str(e)
            if "filename too long" in err_msg.lower() or "path too long" in err_msg.lower() or "too long" in err_msg.lower():
                raise ValueError(
                    "Windows File Path Limit Error: Some file paths in this repository exceed Windows path length limits (260 characters). "
                    "Please ensure 'git config --global core.longpaths true' is set, and 'LongPathsEnabled' is set to 1 in your "
                    "Windows Registry."
                )
            raise ValueError(f"Failed to clone repository: {err_msg}")
                
    def _get_default_branch_from_remote_refs(self, repo: git.Repo) -> str:
        """
        Helper to find default branch if active_branch is detached or unavailable.
        """
        try:
            for ref in repo.remotes.origin.refs:
                if ref.name == "origin/HEAD":
                    return ref.ref.name.split("/")[-1]
            for branch in ["main", "master", "develop"]:
                if branch in repo.heads:
                    return branch
        except Exception:
            pass
        return "main"

    def get_github_metadata(self, repo_url: str) -> dict:
        """
        Fetches live GitHub metadata using the public API.
        """
        try:
            owner, repo_name = self._validate_and_parse_url(repo_url)
            import urllib.request
            import json
            
            api_url = f"https://api.github.com/repos/{owner}/{repo_name}"
            req = urllib.request.Request(
                api_url, 
                headers={"User-Agent": "FirstCommit-AI-Agent"}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode())
                return {
                    "stars": data.get("stargazers_count", 0),
                    "forks": data.get("forks_count", 0),
                    "watchers": data.get("watchers_count", 0),
                    "language": data.get("language", "TypeScript"),
                    "default_branch": data.get("default_branch", "main"),
                    "description": data.get("description", ""),
                    "updated_at": data.get("updated_at", "")
                }
        except Exception:
            return {
                "stars": 0,
                "forks": 0,
                "watchers": 0,
                "language": "",
                "default_branch": "main",
                "description": "",
                "updated_at": ""
            }
