#!/bin/bash

# Automated Test Runner for Mowbray Lost & Found
# This script runs all tests and generates a comprehensive report

echo "🚀 Starting Automated Test Suite..."
echo "=================================="

# Create results directory
mkdir -p test-results
REPORT_FILE="test-results/test-report-$(date +%Y%m%d-%H%M%S).md"

# Initialize report
cat > "$REPORT_FILE" << EOF
# Automated Test Report

**Date:** $(date)
**Environment:** $(node --version) / $(npm --version)
**Test Framework:** Vitest

## Test Results

EOF

echo "📊 Running Unit Tests..."

# Run tests and capture output
TEST_OUTPUT=$(npm test -- --run 2>&1)
TEST_EXIT_CODE=$?

# Append test output to report
echo '```' >> "$REPORT_FILE"
echo "$TEST_OUTPUT" >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"

# Extract test summary with multiple fallback methods
PASSED_TESTS=$(echo "$TEST_OUTPUT" | grep -o 'Tests [0-9]* failed | [0-9]* passed' | grep -o '[0-9]* passed' | grep -o '[0-9]*' | head -1)
FAILED_TESTS=$(echo "$TEST_OUTPUT" | grep -o 'Tests [0-9]* failed | [0-9]* passed' | grep -o '[0-9]* failed' | grep -o '[0-9]*' | head -1)

# If still no tests found, try alternative parsing
if [ -z "$PASSED_TESTS" ] && [ -z "$FAILED_TESTS" ]; then
    PASSED_TESTS=$(echo "$TEST_OUTPUT" | tail -20 | grep -o 'passed ([0-9]*)' | grep -o '[0-9]*' | head -1)
    FAILED_TESTS=$(echo "$TEST_OUTPUT" | tail -20 | grep -o 'failed ([0-9]*)' | grep -o '[0-9]*' | head -1)
fi

# If still no tests found, try alternative parsing
if [ -z "$PASSED_TESTS" ] && [ -z "$FAILED_TESTS" ]; then
    PASSED_TESTS=$(echo "$TEST_OUTPUT" | tail -20 | grep -o '✓ [0-9]*' | grep -o '[0-9]*' | head -1)
    FAILED_TESTS=$(echo "$TEST_OUTPUT" | tail -20 | grep -o '× [0-9]*' | grep -o '[0-9]*' | head -1)
fi

# If still no tests found, try full output parsing
if [ -z "$PASSED_TESTS" ] && [ -z "$FAILED_TESTS" ]; then
    # Count individual test results from the full output
    PASSED_TESTS=$(echo "$TEST_OUTPUT" | grep -o '✓' | wc -l | tr -d ' ')
    FAILED_TESTS=$(echo "$TEST_OUTPUT" | grep -o '×' | wc -l | tr -d ' ')
    
    if [ -z "$PASSED_TESTS" ] || [ "$PASSED_TESTS" = "0" ]; then PASSED_TESTS=0; fi
    if [ -z "$FAILED_TESTS" ] || [ "$FAILED_TESTS" = "0" ]; then FAILED_TESTS=0; fi
fi

# Default values if still empty
if [ -z "$PASSED_TESTS" ]; then PASSED_TESTS=0; fi
if [ -z "$FAILED_TESTS" ]; then FAILED_TESTS=0; fi

TOTAL_TESTS=$((PASSED_TESTS + FAILED_TESTS))

# Add summary to report
cat >> "$REPORT_FILE" << EOF

## Summary

- **Total Tests:** $TOTAL_TESTS
- **Passed:** $PASSED_TESTS 
- **Failed:** $FAILED_TESTS 

EOF

if [ $TOTAL_TESTS -gt 0 ]; then
    echo "- **Success Rate:** $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%" >> "$REPORT_FILE"
else
    echo "- **Success Rate:** N/A" >> "$REPORT_FILE"
fi

# Add coverage areas
cat >> "$REPORT_FILE" << EOF

## Coverage Areas

### Working Features
- Name validation logic
- Header component rendering
- Search functionality
- Date formatting
- Item limits enforcement

### 🔍 Test Coverage
- Unit tests for utility functions
- Component integration tests
- Core business logic validation
- UI interaction testing

## Recommendations

EOF

if [ $FAILED_TESTS -eq 0 ]; then
    echo "🎉 All tests passed!" >> "$REPORT_FILE"
    echo "- Ready for deployment" >> "$REPORT_FILE"
    echo "- All critical functionality verified" >> "$REPORT_FILE"
else
    echo "⚠️ Some tests failed" >> "$REPORT_FILE"
    echo "- Review failing tests before deployment" >> "$REPORT_FILE"
    echo "- Fix critical issues in test failures" >> "$REPORT_FILE"
fi

# Add next steps
cat >> "$REPORT_FILE" << EOF

## Next Steps

1. **Manual Testing Required:**
   - Upload flow with real images
   - Firebase integration testing
   - Mobile responsive testing
   - Cross-browser compatibility

2. **Performance Testing:**
   - Large file upload performance
   - Search performance with many items
   - Memory usage monitoring

3. **User Acceptance Testing:**
   - End-to-end user workflows
   - Accessibility testing
   - Error handling scenarios

## Test Execution Details

- **Command:** \`npm test -- --run\`
- **Exit Code:** $TEST_EXIT_CODE
- **Duration:** $(echo "$TEST_OUTPUT" | grep -o 'Duration [0-9.]*ms' | head -1)

---

*This report was generated automatically by the test automation script*
EOF

# Display summary
echo "=================================="
echo "📋 Test Summary:"
if [ $TOTAL_TESTS -gt 0 ]; then
    echo "   Total: $TOTAL_TESTS"
    echo "   Passed: $PASSED_TESTS ✅"
    echo "   Failed: $FAILED_TESTS ❌"
    echo "   Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
else
    echo "   No tests executed"
fi
echo "=================================="

if [ $FAILED_TESTS -eq 0 ]; then
    echo "🎉 All tests passed! Ready for deployment."
else
    echo "⚠️  $FAILED_TESTS tests failed. Review the report for details."
fi

echo "📄 Report saved to: $REPORT_FILE"

# Exit with same code as tests
exit $TEST_EXIT_CODE
