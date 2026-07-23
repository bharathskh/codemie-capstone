# deploy-local.ps1
# Deploys codemie-capstone from GitHub to local machine (Windows)
# Usage: .\scripts\deploy-local.ps1 [-Branch <branch>] [-UseDocker]

param(
    [string]$Branch = "main",
    [switch]$UseDocker
)

$REPO_URL   = "https://github.com/bharathskh/codemie-capstone.git"
$APP_DIR    = "codemie-capstone"
$PORT       = 3000

Write-Host "`n=== codemie-capstone Local Deployment ===" -ForegroundColor Cyan

# ── Step 1: Clone or update ───────────────────────────────────────────────────
if (Test-Path $APP_DIR) {
    Write-Host "`n[1/4] Pulling latest changes from GitHub ($Branch)..." -ForegroundColor Yellow
    Set-Location $APP_DIR
    git fetch origin
    git checkout $Branch
    git pull origin $Branch
} else {
    Write-Host "`n[1/4] Cloning repository ($Branch)..." -ForegroundColor Yellow
    git clone --branch $Branch $REPO_URL $APP_DIR
    Set-Location $APP_DIR
}

# ── Step 2: Check port availability ──────────────────────────────────────────
Write-Host "`n[2/4] Checking port $PORT..." -ForegroundColor Yellow
$portInUse = netstat -ano | Select-String ":$PORT " | Select-String "LISTENING"
if ($portInUse) {
    $pid = ($portInUse -split '\s+')[-1]
    Write-Host "  Port $PORT is in use by PID $pid. Stopping it..." -ForegroundColor Red
    taskkill /PID $pid /F | Out-Null
    Start-Sleep -Seconds 1
}

# ── Step 3: Install or build ──────────────────────────────────────────────────
if ($UseDocker) {
    Write-Host "`n[3/4] Building Docker image..." -ForegroundColor Yellow
    docker build -t codemie-capstone .
    if ($LASTEXITCODE -ne 0) { Write-Host "Docker build failed." -ForegroundColor Red; exit 1 }
} else {
    Write-Host "`n[3/4] Installing npm dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed." -ForegroundColor Red; exit 1 }
}

# ── Step 4: Start ─────────────────────────────────────────────────────────────
Write-Host "`n[4/4] Starting application..." -ForegroundColor Yellow
if ($UseDocker) {
    docker run --rm -p "${PORT}:${PORT}" --name codemie-capstone codemie-capstone
} else {
    Write-Host ""
    Write-Host "  App running at: http://localhost:$PORT" -ForegroundColor Green
    Write-Host "  Login:          demo / C0dem!e@Secure#24" -ForegroundColor Green
    Write-Host "  Stop:           Ctrl+C`n" -ForegroundColor Green
    npm start
}
