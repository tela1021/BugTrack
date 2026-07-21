#!/bin/bash

# install.sh
# First-time installation script for BugTrack project

set -euo pipefail

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
        echo "⚠️  Fill in PostgreSQL and authentication values in .env, then run this script again."
        exit 1
    else
        echo "❌ Missing .env.example. Cannot create a secure database configuration."
        exit 1
    fi
else
    echo "✅ .env file found."
fi

# 4. Database Setup
echo ""
echo ">>> 3. Setting up Database..."
echo "   Generating Prisma Client..."
npx prisma generate

echo "   Applying tracked database migrations..."
npx prisma migrate deploy

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
