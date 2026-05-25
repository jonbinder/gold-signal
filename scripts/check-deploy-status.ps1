# Gold Signal - post-push deploy diagnostic (PowerShell)
# Run from repo root: .\scripts\check-deploy-status.ps1

$ErrorActionPreference = "Continue"

function Write-Ok($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

if (-not (Test-Path ".git")) {
    Write-Fail "Not inside a git repository. cd to gold-signal first."
    exit 1
}

Write-Host ""
Write-Host "=== Gold Signal deploy status ===" -ForegroundColor Cyan
Write-Host ""

$branch = git branch --show-current
Write-Host "Branch: $branch"
if ($branch -eq "main") {
    Write-Ok "On production branch (main)"
} else {
    Write-Warn "Not on main - Vercel Production usually deploys from main only"
}
Write-Host ""

$porcelain = git status --porcelain
if ([string]::IsNullOrWhiteSpace($porcelain)) {
    Write-Ok "Working tree clean (no uncommitted changes)"
} else {
    Write-Warn "Uncommitted changes present:"
    git status --short
}
Write-Host ""

$origin = git remote get-url origin 2>$null
if (-not $origin) {
    Write-Fail "No remote named 'origin'"
    exit 1
}
Write-Host "Remote origin: $origin"
if ($origin -match "jonbinder/gold-signal") {
    Write-Ok "Origin points to jonbinder/gold-signal"
} else {
    Write-Warn "Origin may not be the expected GitHub repo"
}
Write-Host ""

Write-Host "Fetching origin..."
git fetch origin --quiet 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Warn "git fetch failed (offline or auth?)"
}
Write-Host ""

$localHead = git rev-parse HEAD
$localShort = git rev-parse --short HEAD
$remoteRef = "origin/$branch"

$remoteHead = $null
$remoteShort = "(no remote branch)"
if (git rev-parse $remoteRef 2>$null) {
    $remoteHead = git rev-parse $remoteRef
    $remoteShort = git rev-parse --short $remoteRef
}

Write-Host "HEAD (local):  $localShort  $localHead"
Write-Host "HEAD (remote): $remoteShort  $remoteHead"
Write-Host ""

if ($remoteHead) {
    $ahead = (git rev-list --count "${remoteRef}..HEAD" 2>$null)
    $behind = (git rev-list --count "HEAD..${remoteRef}" 2>$null)
    if ($ahead -eq "0" -and $behind -eq "0") {
        Write-Ok "Local and remote are in sync"
    } elseif ($ahead -ne "0") {
        Write-Warn "You have $ahead unpushed commit(s). Run: git push origin $branch"
    } elseif ($behind -ne "0") {
        Write-Warn "Remote is $behind commit(s) ahead. Run: git pull origin $branch"
    }
} else {
    Write-Warn "Could not compare local vs remote"
}
Write-Host ""

Write-Host "--- Last 3 local commits ---"
git log -3 --oneline
Write-Host ""

Write-Host "--- Last 3 remote commits (origin/$branch) ---"
if ($remoteHead) {
    git log $remoteRef -3 --oneline
} else {
    Write-Warn "Remote branch origin/$branch not found"
}
Write-Host ""

Write-Host "--- Compare to Vercel ---"
Write-Host "Copy this hash into Vercel Deployments / Production / commit:"
Write-Host "  $localShort  ($localHead)"
Write-Host ""
Write-Host "GitHub: https://github.com/jonbinder/gold-signal/commit/$localHead"
Write-Host "Vercel: https://vercel.com/jonbinders-projects/gold-signal"
Write-Host ""
Write-Host "Live fingerprint (after deploy):"
Write-Host "  curl https://goldsignal.ai/api/health"
Write-Host "  (commit field should match HEAD above)"
Write-Host ""

$pushOut = git push --dry-run origin $branch 2>&1 | Out-String
if ($pushOut -match "everything up-to-date") {
    Write-Ok "git push --dry-run: everything up-to-date"
} elseif ($pushOut -match "would be pushed|new branch|fast-forward") {
    Write-Warn "git push --dry-run: push still needed"
    Write-Host $pushOut
} else {
    Write-Host "git push --dry-run:"
    Write-Host $pushOut
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
