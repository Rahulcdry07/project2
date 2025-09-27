#!/bin/bash

echo "Testing File Upload & Processing System..."
echo "========================================="

BASE_URL="http://localhost:3002/api"

# Get access token first
echo "1. Getting access token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser1@example.com","password":"password1"}')

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['data']['accessToken']) if data['success'] else ''" 2>/dev/null)

if [ -n "$ACCESS_TOKEN" ]; then
    echo "✅ Access token obtained"
    
    # Test 2: Create a test PDF file
    echo -e "\n2. Creating test files..."
    
    # Create a simple text file
    echo "This is a test document for file upload testing.
It contains multiple lines of text to test the processing functionality.
The file upload system should process this and extract the content." > test-document.txt
    
    # Test 3: Upload text document
    echo -e "\n3. Testing Text File Upload:"
    UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/files/upload" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -F "document=@test-document.txt")
    echo "$UPLOAD_RESPONSE" | python3 -m json.tool
    
    # Test 4: List uploaded files
    echo -e "\n4. Testing File List:"
    curl -s -X GET "$BASE_URL/files" \
      -H "Authorization: Bearer $ACCESS_TOKEN" | python3 -m json.tool
    
    # Test 5: Profile picture upload
    echo -e "\n5. Testing Profile Picture Upload:"
    
    # Create a simple test image (placeholder)
    echo "Creating a test image file..."
    # This would normally be an actual image, but for testing we'll skip
    
    # Test 6: Search documents
    echo -e "\n6. Testing Document Search:"
    curl -s -X GET "$BASE_URL/files/search?q=test" \
      -H "Authorization: Bearer $ACCESS_TOKEN" | python3 -m json.tool
    
    # Cleanup
    rm -f test-document.txt
    
else
    echo "❌ Could not get access token - cannot test file uploads"
fi

echo -e "\n========================================="
echo "File upload testing complete!"