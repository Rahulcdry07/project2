# API Documentation

## Overview
This is a comprehensive API documentation for the Dynamic Web Application. The API provides authentication, file upload/processing, user profile management, and admin functionality.

## Base URL
- Development: `http://localhost:3002/api`
- Production: `https://yourdomain.com/api`

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

## Rate Limiting
- Authentication endpoints: 5 requests per 15 minutes
- File upload endpoints: 10 requests per hour
- General endpoints: 100 requests per 15 minutes

## Response Format
All API responses follow this format:
```json
{
  "success": true|false,
  "message": "Human readable message",
  "data": {}, // Only present on success
  "errors": {}, // Only present on validation errors
  "code": "ERROR_CODE" // Optional error code
}
```

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string (3-50 chars, required)",
  "email": "string (valid email, required)",
  "password": "string (min 6 chars, required)",
  "firstName": "string (required)",
  "lastName": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully! Please check your email for verification.",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "role": "user",
      "is_verified": false
    }
  }
}
```

**Error Responses:**
- `400`: Validation errors (username/email already exists)
- `500`: Server error

### POST /auth/login
Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful!",
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 1800,
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "role": "user"
    },
    "redirect": "/dashboard.html"
  }
}
```

**Error Responses:**
- `401`: Invalid credentials
- `403`: Email not verified
- `429`: Too many login attempts

### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-jwt-access-token",
    "expiresIn": 1800
  }
}
```

### POST /auth/logout
Logout user and revoke tokens.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "refreshToken": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /auth/verify-email/:token
Verify user email with verification token.

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully! You can now log in.",
  "data": {
    "redirect": "/login"
  }
}
```

### POST /auth/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

### POST /auth/reset-password
Reset password with reset token.

**Request Body:**
```json
{
  "token": "string (required)",
  "password": "string (min 6 chars, required)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### PUT /auth/change-password
Change user password (authenticated).

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (min 6 chars, required)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## File Management Endpoints

### POST /files/upload
Upload and process a document.

**Headers:**
```
Authorization: Bearer <access-token>
Content-Type: multipart/form-data
```

**Request Body:**
```
document: File (PDF, max 10MB)
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "file": {
      "id": 1,
      "filename": "generated-filename.pdf",
      "original_name": "document.pdf",
      "file_size": 1024000,
      "mime_type": "application/pdf",
      "processing_status": "pending",
      "createdAt": "2025-09-27T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400`: No file uploaded, invalid file type, file too large
- `401`: Authentication required
- `429`: Upload rate limit exceeded

### GET /files
Get user's uploaded documents.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)
- `status`: Filter by processing status (pending, processing, completed, failed)

**Response:**
```json
{
  "success": true,
  "message": "Documents retrieved successfully",
  "data": {
    "documents": [
      {
        "id": 1,
        "filename": "generated-filename.pdf",
        "original_name": "document.pdf",
        "file_size": 1024000,
        "mime_type": "application/pdf",
        "page_count": 5,
        "processing_status": "completed",
        "processed_at": "2025-09-27T10:05:00.000Z",
        "createdAt": "2025-09-27T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "totalItems": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### GET /files/:id
Get specific document details.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Document retrieved successfully",
  "data": {
    "document": {
      "id": 1,
      "filename": "generated-filename.pdf",
      "original_name": "document.pdf",
      "file_size": 1024000,
      "mime_type": "application/pdf",
      "content_text": "Extracted text content...",
      "page_count": 5,
      "processing_status": "completed",
      "processed_at": "2025-09-27T10:05:00.000Z",
      "user": {
        "id": 1,
        "username": "testuser",
        "email": "test@example.com"
      }
    }
  }
}
```

### GET /files/:id/download
Download document file.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
Binary file data with appropriate headers.

### DELETE /files/:id
Delete a document.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

### GET /files/search
Search documents by content.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `query`: Search query (required)
- `limit`: Max results (default: 10)

**Response:**
```json
{
  "success": true,
  "message": "Search completed successfully",
  "data": {
    "documents": [
      {
        "id": 1,
        "filename": "document.pdf",
        "original_name": "document.pdf",
        "file_size": 1024000,
        "mime_type": "application/pdf",
        "page_count": 5,
        "processed_at": "2025-09-27T10:05:00.000Z"
      }
    ],
    "query": "search term",
    "totalResults": 1
  }
}
```

## Profile Management Endpoints

### GET /profile
Get user profile information.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "profile": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "bio": "User bio text",
      "location": "City, Country",
      "website": "https://example.com",
      "github_url": "https://github.com/username",
      "linkedin_url": "https://linkedin.com/in/username",
      "twitter_url": "https://twitter.com/username",
      "profile_picture": "path/to/profile.jpg",
      "createdAt": "2025-09-27T10:00:00.000Z"
    }
  }
}
```

### PUT /profile
Update user profile.

**Headers:**
```
Authorization: Bearer <access-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "bio": "string (max 500 chars, optional)",
  "location": "string (max 100 chars, optional)",
  "website": "string (valid URL, optional)",
  "github_url": "string (valid URL, optional)",
  "linkedin_url": "string (valid URL, optional)",
  "twitter_url": "string (valid URL, optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "profile": {
      // Updated profile data
    }
  }
}
```

### POST /profile/profile-picture
Upload profile picture.

**Headers:**
```
Authorization: Bearer <access-token>
Content-Type: multipart/form-data
```

**Request Body:**
```
profileImage: File (JPEG/PNG, max 5MB)
```

**Response:**
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "profile_picture": "path/to/new/profile.jpg"
  }
}
```

### DELETE /profile/picture
Delete profile picture.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Profile picture deleted successfully"
}
```

## Admin Endpoints

### GET /admin/users
Get all users (admin only).

**Headers:**
```
Authorization: Bearer <admin-access-token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": 1,
        "username": "testuser",
        "email": "test@example.com",
        "role": "user",
        "is_verified": true,
        "createdAt": "2025-09-27T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "totalItems": 1
    }
  }
}
```

## Health Check Endpoints

### GET /health
System health check.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-27T10:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "memory": {
    "used": "50MB",
    "total": "100MB"
  }
}
```

### GET /metrics
System metrics (admin only).

**Headers:**
```
Authorization: Bearer <admin-access-token>
```

**Response:**
```json
{
  "requests": {
    "total": 1000,
    "successful": 950,
    "errors": 50
  },
  "responseTime": {
    "average": 250,
    "p95": 500,
    "p99": 1000
  },
  "database": {
    "queries": 500,
    "averageTime": 50
  }
}
```

## Error Codes

### Authentication Errors
- `AUTH_TOKEN_MISSING`: No authentication token provided
- `AUTH_TOKEN_INVALID`: Invalid or expired token
- `AUTH_TOKEN_EXPIRED`: Access token has expired
- `AUTH_REFRESH_TOKEN_INVALID`: Invalid refresh token
- `AUTH_RATE_LIMIT_EXCEEDED`: Too many authentication attempts
- `AUTH_EMAIL_NOT_VERIFIED`: Email verification required

### Validation Errors
- `VALIDATION_ERROR`: Request validation failed
- `USER_EXISTS`: Username or email already exists
- `USER_NOT_FOUND`: User not found
- `INVALID_CREDENTIALS`: Invalid login credentials

### File Errors
- `FILE_NOT_FOUND`: Requested file not found
- `FILE_TOO_LARGE`: File exceeds size limit
- `FILE_TYPE_NOT_ALLOWED`: File type not supported
- `FILE_UPLOAD_FAILED`: File upload failed
- `FILE_PROCESSING_FAILED`: File processing failed

### Server Errors
- `DATABASE_ERROR`: Database operation failed
- `INTERNAL_SERVER_ERROR`: Unexpected server error
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

## SDKs and Examples

### JavaScript/Node.js Example
```javascript
const API_BASE = 'http://localhost:3002/api';

class APIClient {
  constructor(token = null) {
    this.token = token;
  }

  async request(method, endpoint, data = null) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config = {
      method,
      headers,
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    return response.json();
  }

  async login(email, password) {
    const result = await this.request('POST', '/auth/login', { email, password });
    if (result.success) {
      this.token = result.data.accessToken;
    }
    return result;
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('document', file);

    const response = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    return response.json();
  }
}

// Usage
const client = new APIClient();
await client.login('user@example.com', 'password');
const files = await client.request('GET', '/files');
```

### cURL Examples

#### Login
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Upload File
```bash
curl -X POST http://localhost:3002/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@/path/to/file.pdf"
```

#### Get Files
```bash
curl -X GET "http://localhost:3002/api/files?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing

### Unit Tests
```bash
npm test
```

### API Tests
```bash
npm run test:api
```

### Load Testing
```bash
npm run test:load
```

## Changelog

### Version 1.0.0 (2025-09-27)
- Initial API release
- Authentication system with JWT
- File upload and processing
- User profile management
- Admin functionality
- Rate limiting and security features
- Performance optimizations