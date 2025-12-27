#!/bin/bash

set -e

echo "🚀 Running Performance Regression Tests..."
echo "==========================================="
echo ""

export CI=true
export NODE_ENV=test

OUTPUT_DIR="./performance-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="${OUTPUT_DIR}/performance-report-${TIMESTAMP}.json"

mkdir -p "${OUTPUT_DIR}"

echo "📊 Running tests and generating performance report..."
npm run test:performance 2>&1 | tee "${OUTPUT_DIR}/test-output-${TIMESTAMP}.log"

TEST_EXIT_CODE=${PIPESTATUS[0]}

if [ $TEST_EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ Performance tests failed with exit code ${TEST_EXIT_CODE}"
  echo ""
  echo "📋 Performance violations detected:"
  echo "   Check ${OUTPUT_DIR}/test-output-${TIMESTAMP}.log for details"
  echo ""
  echo "💡 To fix performance regressions:"
  echo "   1. Review the violation report above"
  echo "   2. Optimize the flagged components"
  echo "   3. Run 'npm run test:performance' locally to verify fixes"
  echo "   4. Consider adjusting budgets if the violations are acceptable"
  echo ""
  exit 1
fi

echo ""
echo "✅ All performance tests passed!"
echo "   No performance budget violations detected"
echo ""

exit 0
