import os
import re
import subprocess
import sys


def git_ls_files() -> list[str]:
    out = subprocess.check_output(["git", "ls-files"], text=True)
    return [line.strip() for line in out.splitlines() if line.strip()]


# Files that may legitimately contain pattern-like strings (e.g. this scanner itself)
_ALLOWLISTED_FILES = frozenset({
    "scripts/secret_scan.py",
    "README.md",  # Documentation contains example API keys
})


def main() -> int:
    forbidden_tracked: list[str] = []
    for p in git_ls_files():
        base = os.path.basename(p)
        if base == ".env":
            forbidden_tracked.append(p)
        if base.startswith(".env.") and base != ".env.example":
            forbidden_tracked.append(p)

    if forbidden_tracked:
        print("Found forbidden tracked env files:")
        for p in forbidden_tracked:
            print(f"  - {p}")
        return 1

    patterns: list[tuple[str, re.Pattern[str]]] = [
        # Google / GCP
        ("google_api_key", re.compile(r"AIza[0-9A-Za-z\-_]{20,}")),
        # OpenAI / Anthropic style
        ("openai_like_key", re.compile(r"\bsk-[0-9A-Za-z]{20,}\b")),
        ("openrouter_key", re.compile(r"\bsk-or-v1-[0-9a-f]{32,}\b", re.IGNORECASE)),
        ("github_pat", re.compile(r"\bgithub_pat_[0-9A-Za-z_]{20,}\b")),
        ("github_token", re.compile(r"\bghp_[0-9A-Za-z]{20,}\b")),
        # AWS
        ("aws_access_key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
        ("aws_secret_key", re.compile(r"(?i)aws_secret_access_key\s*[=:]\s*[A-Za-z0-9/+=]{30,}")),
        # Render
        ("render_api_key", re.compile(r"\brnd_[0-9A-Za-z]{20,}\b")),
        # JWT / Bearer tokens (long base64 blobs in assignment contexts)
        ("jwt_token", re.compile(r"\beyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{10,}\.")),
        # PEM private keys
        ("private_key_block", re.compile(
            r"-----BEGIN (?:RSA|EC|OPENSSH|DSA|PRIVATE) KEY-----|"
            "BEGIN PRIV" "ATE KEY"
        )),
        # Generic high-entropy assignment: VAR = "..." or VAR: "..."
        # Requires an underscore-delimited key name to reduce false positives.
        ("generic_secret_assignment", re.compile(
            r"(?i)(?:_secret|_password|_token|_api_key|_apikey)\s*[=:]\s*['\"][A-Za-z0-9/+=_\-]{24,}['\"]"
        )),
    ]

    flagged: list[tuple[str, str]] = []
    for p in git_ls_files():
        if p.startswith(".git/"):
            continue
        if p in _ALLOWLISTED_FILES:
            continue
        try:
            b = open(p, "rb").read()
        except Exception:
            continue
        if b"\x00" in b:
            continue
        if len(b) > 2_000_000:
            continue
        s = b.decode("utf-8", errors="ignore")
        for name, rx in patterns:
            if rx.search(s):
                flagged.append((p, name))

    if flagged:
        print("Potential secrets detected (pattern-based). Remove them from tracked files:")
        for p, name in flagged:
            print(f"  - {p}  [{name}]")
        return 1

    print("Secret scan OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

