#!/bin/bash

echo "Testing Enhanced Authentication System..."
echo "======================================="

BASE_URL="http://localhost:3002/api"

# Test 1: Login to get tokens
echo -e "\n1. Testing Login (Enhanced with Refresh Tokens):"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser1@example.com","password":"password1"}')

echo "$LOGIN_RESPONSE" | python3 -m json.tool

# Extract tokens for further testing
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['data']['accessToken']) if data['success'] else ''" 2>/dev/null)
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['data']['refreshToken']) if data['success'] else ''" 2>/dev/null)

if [ -n "$ACCESS_TOKEN" ]; then
    echo -e "\n✅ Login successful! Access token obtained."
    
    # Test 2: Get user profile
    echo -e "\n2. Testing Profile Access with Access Token:"
    PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/profile" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    echo "$PROFILE_RESPONSE" | python3 -m json.tool
    
    # Test 3: Test refresh token
    echo -e "\n3. Testing Refresh Token:"
    REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
      -H "Content-Type: application/json" \
      -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
    echo "$REFRESH_RESPONSE" | python3 -m json.tool
    
    # Test 4: Test logout (revoke tokens)
    echo -e "\n4. Testing Logout (Token Revocation):"
    LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/logout" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    echo "$LOGOUT_RESPONSE" | python3 -m json.tool
    
    # Test 5: Try to access profile after logout (should fail)
    echo -e "\n5. Testing Profile Access After Logout (Should Fail):"
    PROFILE_AFTER_LOGOUT=$(curl -s -X GET "$BASE_URL/profile" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    echo "$PROFILE_AFTER_LOGOUT" | python3 -m json.tool
      
else
    echo "❌ Login failed - cannot proceed with further tests"
fi

echo -e "\n======================================="
echo "Authentication testing complete!"