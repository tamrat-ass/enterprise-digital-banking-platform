# PowerShell Setup Script for Meridian Platform

Write-Host "╔════════════════════════════════════════════════════════════╗"
Write-Host "║  Enterprise Digital Banking Governance Platform - Meridian║"
Write-Host "║                    Setup Script                           ║"
Write-Host "╚════════════════════════════════════════════════════════════╝"
Write-Host ""

# Step 1: Install dependencies
Write-Host "📦 Step 1: Installing dependencies..."
Write-Host "========================================="
Write-Host ""

if (-Not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  pnpm not found. Installing globally..."
    npm install -g pnpm
}

Write-Host "Running: pnpm install"
pnpm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies"
    exit 1
}

Write-Host "✅ Dependencies installed"
Write-Host ""

# Step 2: Create tables
Write-Host "🗄️  Step 2: Creating database tables..."
Write-Host "========================================="
Write-Host ""

Write-Host "Running: node create-tables.js"
node create-tables.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create tables"
    exit 1
}

Write-Host "✅ Tables created successfully"
Write-Host ""

# Step 2b: Seed database with sample data
Write-Host "🌱 Step 2b: Seeding database with sample data..."
Write-Host "========================================="
Write-Host ""

Write-Host "Running: node scripts/seed-database.js"
node scripts/seed-database.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: Database seeding encountered issues, but setup will continue"
}

Write-Host ""

# Step 3: Start development server
Write-Host "🚀 Step 3: Starting development server..."
Write-Host "========================================="
Write-Host ""

Write-Host "Running: pnpm dev"
Write-Host ""
Write-Host "The application will start on: http://localhost:3000"
Write-Host ""

pnpm dev
