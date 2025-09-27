#!/bin/bash

echo "🧪 Comprehensive Test Status Check"
echo "=================================="
echo ""

total_passing=0
total_failing=0

test_files=(
    "test/models.test.js"
    "test/controllers.test.js" 
    "test/fileController.test.js"
    "test/backend.test.js"
    "test/middleware.test.js"
    "test/middlewareEnhanced.test.js"
    "test/profileEnhanced.test.js"
    "test/modelsEnhanced.test.js"
    "test/security.test.js"
    "test/utils.test.js"
    "test/apiIntegration.test.js"
)

for test_file in "${test_files[@]}"; do
    echo "🔍 Testing $test_file..."
    
    if [ -f "$test_file" ]; then
        result=$(NODE_ENV=test timeout 15s npx mocha "$test_file" --timeout 8000 2>&1 | grep -E "passing|failing" | tail -2)
        
        if [ -n "$result" ]; then
            echo "$result"
            
            # Extract numbers
            passing=$(echo "$result" | grep -o '[0-9]\+ passing' | grep -o '[0-9]\+' || echo "0")
            failing=$(echo "$result" | grep -o '[0-9]\+ failing' | grep -o '[0-9]\+' || echo "0")
            
            total_passing=$((total_passing + passing))
            total_failing=$((total_failing + failing))
        else
            echo "❌ Test timed out or failed to run"
        fi
    else
        echo "❌ File not found"
    fi
    
    echo "---"
done

echo ""
echo "📊 FINAL SUMMARY:"
echo "Total Passing: $total_passing"
echo "Total Failing: $total_failing"
echo "Success Rate: $(echo "scale=1; $total_passing * 100 / ($total_passing + $total_failing)" | bc)%"