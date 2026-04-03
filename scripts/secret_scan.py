import os
import re
import subprocess
import sys


def git_ls_files() -> list[str]:
    out = subprocess.check_output(["git", "ls-files"], text=True)
    return [line.strip() for line in out.splitlines() if line.strip()]


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
        ("google_api_key", re.compile(r"AIza[0-9A-Za-z\-_]{20,}")),
        ("openai_like_key", re.compile(r"\bsk-[0-9A-Za-z]{20,}\b")),
        ("github_pat", re.compile(r"\bgithub_pat_[0-9A-Za-z_]{20,}\b")),
        ("github_token", re.compile(r"\bghp_[0-9A-Za-z]{20,}\b")),
        ("private_key_block", re.compile(r"-----BEGIN (?:RSA|EC|OPENSSH|PRIVATE) KEY-----|BEGIN PRIVATE KEY")),
    ]

    flagged: list[tuple[str, str]] = []
    for p in git_ls_files():
        if p.startswith(".git/"):
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

