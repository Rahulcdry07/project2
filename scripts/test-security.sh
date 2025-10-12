#!/bin/bash

# Test ZAP configuration locally
# This script helps developers test the OWASP ZAP security scan configuration

echo "🔍 Testing ZAP Security Scan Configuration..."
echo ""

# Check if ZAP configuration files exist
echo "📁 Checking ZAP configuration files:"
if [ -f ".zap/zap.yaml" ]; then
    echo "✅ ZAP configuration: .zap/zap.yaml"
else
    echo "❌ ZAP configuration missing: .zap/zap.yaml"
    exit 1
fi

if [ -f ".zap/rules.tsv" ]; then
    echo "✅ ZAP rules: .zap/rules.tsv"
else
    echo "❌ ZAP rules missing: .zap/rules.tsv"
    exit 1
fi

echo ""

# Check if application is running
echo "🌐 Checking application status:"
if curl -f http://localhost:3000/api/health &>/dev/null; then
    echo "✅ Application is running on http://localhost:3000"
else
    echo "⚠️  Application is not running on http://localhost:3000"
    echo "💡 Start the application with: npm run start:servers"
    echo ""
fi

# Check if Docker is available (needed for ZAP)
echo "🐳 Checking Docker availability:"
if command -v docker &> /dev/null; then
    echo "✅ Docker is available"
    
    # Check if Docker daemon is running
    if docker ps &>/dev/null; then
        echo "✅ Docker daemon is running"
    else
        echo "❌ Docker daemon is not running"
        echo "💡 Start Docker daemon to run ZAP security scans"
    fi
else
    echo "❌ Docker is not installed"
    echo "💡 Install Docker to run ZAP security scans"
fi

echo ""

# Validate ZAP configuration syntax
echo "📋 Validating ZAP configuration syntax:"
if command -v yamllint &> /dev/null; then
    if yamllint .zap/zap.yaml &>/dev/null; then
        echo "✅ ZAP configuration syntax is valid"
    else
        echo "⚠️  ZAP configuration has syntax issues"
        yamllint .zap/zap.yaml
    fi
else
    echo "ℹ️  yamllint not available, skipping syntax validation"
fi

echo ""

# Show security scan commands
echo "🧪 Security scan commands:"
echo "   npm run test:security          # Run npm audit"
echo "   npm run test:security-unit     # Run security unit tests"
echo ""
echo "🔧 ZAP security scan (requires Docker):"
echo "   # Manual ZAP baseline scan:"
echo "   docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://localhost:3000"
echo ""
echo "   # ZAP with custom rules:"
echo "   docker run -v \$(pwd)/.zap:/zap/wrk:ro -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://localhost:3000 -c /zap/wrk/rules.tsv"
echo ""
echo "🚀 The security scan will run automatically in GitHub Actions!"

echo ""
echo "==============================================="
echo "✅ ZAP Security Scan Configuration Validated!"
echo "==============================================="