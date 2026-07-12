#!/bin/bash

# Exit on any error
set -e

echo "========================================="
echo "🚀 Starting TransitOps Platform"
echo "========================================="

echo "How would you like to run the project?"
echo "1) Locally (npm run dev for both client and server)"
echo "2) Docker (docker compose up --build)"
read -p "Select option (1 or 2): " option

if [ "$option" = "2" ]; then
    echo ""
    echo "🐳 Starting with Docker Compose..."
    docker compose up --build
else
    echo ""
    echo "💻 Starting locally..."
    
    echo "📦 Installing server dependencies..."
    (cd server && npm install)
    
    echo "📦 Installing client dependencies..."
    (cd client && npm install)
    
    echo "🚀 Starting Server (Port 4000) and Client (Port 3000) concurrently..."
    # We use concurrently to run both processes in the same terminal view
    npx concurrently -k \
      "cd server && npm run dev" \
      "cd client && npm run dev" \
      --names "SERVER,CLIENT" \
      --prefix-colors "blue,green"
fi
