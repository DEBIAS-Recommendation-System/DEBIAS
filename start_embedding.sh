#!/bin/bash

# Quick Start Script for Product Embedding
# This script sets up and runs the product embedding process

set -e  # Exit on error

echo "=========================================="
echo "Product Embedding - Quick Start"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yaml" ]; then
    echo "❌ Error: docker-compose.yaml not found"
    echo "Please run this script from the DEBIAS project root"
    exit 1
fi

# Check if products.csv exists
if [ ! -f "data/products.csv" ]; then
    echo "❌ Error: data/products.csv not found"
    exit 1
fi

echo "✓ Found docker-compose.yaml"
echo "✓ Found data/products.csv"
echo ""

# Start Qdrant if not running
echo "🚀 Starting Qdrant vector database..."
docker compose up -d qdrant

# Wait for Qdrant to be healthy
echo "⏳ Waiting for Qdrant to be ready..."
sleep 5

# Check Qdrant health
if docker compose ps qdrant | grep -q "Up"; then
    echo "✓ Qdrant is running"
else
    echo "❌ Failed to start Qdrant"
    echo "Run: docker compose logs qdrant"
    exit 1
fi

# Test Qdrant connection
echo "🔍 Testing Qdrant connection..."
if curl -s http://localhost:6333/health > /dev/null 2>&1; then
    echo "✓ Qdrant is healthy and accessible"
else
    echo "⚠️  Warning: Qdrant health check failed, but continuing anyway..."
fi

echo ""
echo "=========================================="
echo "Ready to embed products!"
echo "=========================================="
echo ""

# Change to API directory
cd Ecommerce-API

# Run the embedding script
echo "Starting embedding process..."
echo ""
python scripts/run_embedding.py
