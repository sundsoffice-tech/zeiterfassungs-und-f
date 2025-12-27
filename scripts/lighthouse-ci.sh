#!/bin/bash

set -e

echo "🚦 Lighthouse CI Test Script"
echo "============================"
echo ""

if ! command -v lhci &> /dev/null; then
    echo "❌ Lighthouse CI not found. Installing..."
    npm install -g @lhci/cli@0.14.x
    echo "✅ Lighthouse CI installed"
    echo ""
fi

echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Cannot run Lighthouse CI."
    exit 1
fi

echo "✅ Build complete"
echo ""

echo "🔍 Running Lighthouse CI..."
echo ""

lhci autorun --config=lighthouserc.json

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Lighthouse CI passed!"
    echo ""
    echo "📊 Results saved to .lighthouseci/"
    echo "📝 Open .lighthouseci/*.report.html to view detailed reports"
else
    echo ""
    echo "❌ Lighthouse CI failed"
    echo "Please review the assertions and fix any issues"
    exit 1
fi
