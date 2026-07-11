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

    def clone_repository(self, repo_url: str) -> dict:
        """
        Validates the GitHub URL, checks if the repo is already cloned, and clones if not.
        Returns a dict with: repository_name, default_branch, local_clone_path, clone_status
        """
        # 1. Validate & Parse URL
        try:
            owner, repo_name = self._validate_and_parse_url(repo_url)
        except ValueError as e:
            raise ValueError(f"URL Validation Error: {str(e)}")
            
        # 2. Determine target path in OS temp dir
        temp_dir = Path(tempfile.gettempdir()) / "firstcommit_ai"
        local_clone_path = temp_dir / f"{owner}_{repo_name}"
        
        # 3. Check if already exists and is a valid repository
        if local_clone_path.exists():
            try:
                # Test if it's a valid git repository
                repo = git.Repo(local_clone_path)
                try:
                    default_branch = repo.active_branch.name
                except TypeError:
                    # Detached HEAD fallback
                    default_branch = self._get_default_branch_from_remote_refs(repo)
                    
                return {
                    "repository_name": repo_name,
                    "default_branch": default_branch,
                    "local_clone_path": str(local_clone_path),
                    "clone_status": "reused"
                }
            except (git.exc.InvalidGitRepositoryError, git.exc.NoSuchPathError):
                # Directory exists but is not a valid git repo, clean it up and re-clone
                shutil.rmtree(local_clone_path, ignore_errors=True)
        
        # Ensure parent directory exists
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        # 4. Clone repository using GitPython (shallow clone, depth=1)
        try:
            repo = git.Repo.clone_from(repo_url, local_clone_path, depth=1)
            try:
                default_branch = repo.active_branch.name
            except TypeError:
                default_branch = self._get_default_branch_from_remote_refs(repo)
                
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
            else:
                raise ValueError(f"Git Clone Failed: {err_msg}")
                
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
