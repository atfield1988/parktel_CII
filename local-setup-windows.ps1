# Local Setup Script for Windows
# Run this in PowerShell from renew-parktel-schedule-system folder

Write-Host "🚀 Starting Local Setup for Parktel Schedule System" -ForegroundColor Green
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking Prerequisites..." -ForegroundColor Cyan

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python installed: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.11" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check PostgreSQL
try {
    $pgVersion = psql --version 2>&1
    Write-Host "✅ PostgreSQL installed: $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PostgreSQL not found. Please install PostgreSQL" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📁 Setting up Backend..." -ForegroundColor Cyan

# Backend setup
cd backend

# Create .env file
if (!(Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item "renew-.env.example" ".env"
    Write-Host "⚠️  Please edit .env file with your database credentials" -ForegroundColor Yellow
}

# Create virtual environment
if (!(Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install --upgrade pip
pip install -r requirements.txt

Write-Host "✅ Backend setup complete!" -ForegroundColor Green
Write-Host ""

# Frontend setup
Write-Host "📁 Setting up Frontend..." -ForegroundColor Cyan
cd ../frontend

# Check if package.json exists
if (!(Test-Path "package.json")) {
    Write-Host "⚠️  package.json not found. Please copy from old project:" -ForegroundColor Yellow
    Write-Host "   cp ../../parktel-schedule-system/frontend/package.json ." -ForegroundColor Yellow
} else {
    # Install dependencies
    Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Frontend setup complete!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit backend/.env with your database credentials"
Write-Host "2. Create PostgreSQL database: parkteldb_local"
Write-Host "3. Run: cd backend && alembic upgrade head"
Write-Host "4. Run: python -m app.init_db"
Write-Host "5. Start backend: uvicorn app.main:app --reload"
Write-Host "6. Start frontend: cd frontend && npm start"
Write-Host ""
Write-Host "📖 See LOCAL-TESTING-ROADMAP.md for detailed instructions" -ForegroundColor Cyan
