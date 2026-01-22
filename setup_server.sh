#!/bin/bash

# setup_server.sh
# Script to set up a Ubuntu/Debian server for MDBugTracker (Next.js + Postgres)

set -e

echo ">>> Updating system..."
sudo apt update && sudo apt upgrade -y

echo ">>> Installing dependencies (curl, git, build-essential)..."
sudo apt install -y curl git build-essential

echo ">>> Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

echo ">>> Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create DB User and Database (optional interactive step or hardcoded for demo)
# sudo -u postgres psql -c "CREATE USER bugzero WITH PASSWORD 'securepassword';"
# sudo -u postgres psql -c "CREATE DATABASE mdbugtracker OWNER bugzero;"

echo ">>> Installing PM2 (Process Manager)..."
sudo npm install -g pm2

echo ">>> Installing Nginx..."
sudo apt install -y nginx

echo ">>> Configuring Firewall (UFW)..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
# sudo ufw enable  # Uncomment to enable immediately

echo ">>> Setup Complete!"
echo "Next steps:"
echo "1. Clone your repo: git clone <repo_url>"
echo "2. Install deps: npm install"
echo "3. Update .env with DATABASE_URL"
echo "4. Build: npm run build"
echo "5. Start: pm2 start npm --name 'mdbugtracker' -- start"
echo "6. Configure Nginx proxy to port 3000"
