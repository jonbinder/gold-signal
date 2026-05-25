#!/usr/bin/env bash
# Gold Signal — post-push deploy diagnostic
# Run from repo root:
#   bash scripts/check-deploy-status.sh     (Git Bash / macOS / Linux)
#   npm run deploy:status                   (runs this script)
# Windows PowerShell: .\scripts\check-deploy-status.ps1

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; }

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  fail "Not inside a git repository. cd to gold-signal first."
  exit 1
fi

echo ""
echo "=== Gold Signal deploy status ==="
echo ""

# Current branch
BRANCH=$(git branch --show-current)
echo "Branch: ${BRANCH}"
if [[ "${BRANCH}" == "main" ]]; then
  ok "On production branch (main)"
else
  warn "Not on main — Vercel Production usually deploys from main only"
fi
echo ""

# Uncommitted changes
if [[ -z "$(git status --porcelain)" ]]; then
  ok "Working tree clean (no uncommitted changes)"
else
  warn "Uncommitted changes present:"
  git status --short
fi
echo ""

# Remote
if ! git remote get-url origin >/dev/null 2>&1; then
  fail "No remote named 'origin'"
  exit 1
fi
ORIGIN=$(git remote get-url origin)
echo "Remote origin: ${ORIGIN}"
if [[ "${ORIGIN}" == *"jonbinder/gold-signal"* ]]; then
  ok "Origin points to jonbinder/gold-signal"
else
  warn "Origin may not be the expected GitHub repo"
fi
echo ""

# Fetch remote (quiet) so ls-remote / log are current
echo "Fetching origin..."
git fetch origin --quiet 2>/dev/null || warn "git fetch failed (offline or auth?)"
echo ""

LOCAL_HEAD=$(git rev-parse HEAD)
LOCAL_SHORT=$(git rev-parse --short HEAD)
REMOTE_REF="origin/${BRANCH}"

if git rev-parse "${REMOTE_REF}" >/dev/null 2>&1; then
  REMOTE_HEAD=$(git rev-parse "${REMOTE_REF}")
  REMOTE_SHORT=$(git rev-parse --short "${REMOTE_REF}")
else
  REMOTE_HEAD=""
  REMOTE_SHORT="(no remote branch)"
fi

echo "HEAD (local):  ${LOCAL_SHORT}  ${LOCAL_HEAD}"
echo "HEAD (remote): ${REMOTE_SHORT}  ${REMOTE_HEAD:-n/a}"
echo ""

AHEAD=$(git rev-list --count "${REMOTE_REF}..HEAD" 2>/dev/null || echo "0")
BEHIND=$(git rev-list --count "HEAD..${REMOTE_REF}" 2>/dev/null || echo "0")

if [[ "${AHEAD}" == "0" && "${BEHIND}" == "0" && -n "${REMOTE_HEAD}" ]]; then
  ok "Local and remote are in sync"
elif [[ "${AHEAD}" != "0" ]]; then
  warn "You have ${AHEAD} unpushed commit(s). Run: git push origin ${BRANCH}"
elif [[ "${BEHIND}" != "0" ]]; then
  warn "Remote is ${BEHIND} commit(s) ahead. Run: git pull origin ${BRANCH}"
else
  warn "Could not compare local vs remote"
fi
echo ""

echo "--- Last 3 local commits ---"
git log -3 --oneline
echo ""

echo "--- Last 3 remote commits (origin/${BRANCH}) ---"
if git rev-parse "${REMOTE_REF}" >/dev/null 2>&1; then
  git log "${REMOTE_REF}" -3 --oneline
else
  warn "Remote branch origin/${BRANCH} not found"
fi
echo ""

echo "--- Compare to Vercel ---"
echo "Copy this hash into Vercel → Deployments → Production → commit:"
echo "  ${LOCAL_SHORT}  (${LOCAL_HEAD})"
echo ""
echo "GitHub: https://github.com/jonbinder/gold-signal/commit/${LOCAL_HEAD}"
echo "Vercel: https://vercel.com/jonbinders-projects/gold-signal"
echo ""
echo "Live fingerprint (after deploy):"
echo "  curl https://goldsignal.ai/api/health"
echo "  (commit field should match HEAD above)"
echo ""

# Dry-run push
PUSH_OUT=$(git push --dry-run origin "${BRANCH}" 2>&1) || true
if echo "${PUSH_OUT}" | grep -qi "everything up-to-date"; then
  ok "git push --dry-run: everything up-to-date"
elif echo "${PUSH_OUT}" | grep -qiE "would be pushed|new branch|fast-forward"; then
  warn "git push --dry-run: push still needed"
  echo "${PUSH_OUT}"
else
  echo "git push --dry-run:"
  echo "${PUSH_OUT}"
fi

echo ""
echo "=== Done ==="
