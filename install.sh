#!/bin/bash

# install.sh
# Comprehensive installation script for BugTrack project

set -e

echo "==========================================="
echo "   BugTrack Installation Script"
echo "==========================================="

# 1. Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v18+) first."
    exit 1
fi

echo "✅ Node.js detected: $(node -v)"

# 2. Install Dependencies
echo ""
echo ">>> 1. Installing dependencies..."
if [ -d "node_modules" ]; then
    echo "   node_modules exists. Skipping full install (clean install with --clean)."
    npm install
else
    npm install
fi

# 3. Environment Setup
echo ""
echo ">>> 2. Checking configuration..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "   Creating .env from .env.example..."
        cp .env.example .env
        echo "⚠️  Please update .env with your specific configuration if needed."
    else
        echo "⚠️  No .env or .env.example found. Creating default local .env..."
        echo 'DATABASE_URL="file:./dev.db"' > .env
        echo 'NEXTAUTH_SECRET="secret"' >> .env
        echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env
    fi
else
    echo "✅ .env file found."
fi

# 4. Database Setup
echo ""
echo ">>> 3. Setting up Database..."
echo "   Generating Prisma Client..."
npx prisma generate

echo "   Pushing schema to database..."
# Use push for dev/local setup (creates/updates sqlite db file directly)
npx prisma db push

echo "   Seeding database..."
npm run seed || echo "⚠️  Seeding failed or already populated. Continuing..."

# 5. Build
echo ""
echo ">>> 4. Building application..."
npm run build

echo ""
echo "==========================================="
echo "✅ Installation Complete!"
echo "==========================================="
echo ""
echo "To start the application run:"
echo "  npm start"
echo "  OR"
echo "  npm run dev"
echo ""
