# Registration Website - Security Enhanced

A comprehensive user registration and authentication system built with Node.js, Express, React, and SQLite. This project has been enhanced with multiple security improvements and best practices.

## 🚀 Features

### Core Features
- **User Registration** with email verification
- **Login/Logout** with JWT authentication
- **Password Reset** functionality
- **User Profile** management
- **Admin Panel** for user management
- **Role-based Access Control** (user/admin)
- **Email Verification** system
- **Responsive UI** with Bootstrap

### Security Enhancements
- **Enhanced Password Requirements**: 8+ characters with uppercase, lowercase, numbers, and special characters
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive server-side validation with express-validator
- **Security Headers**: Helmet.js for security headers
- **Proper Logging**: Winston for structured logging
- **Environment Variables**: Secure configuration management
- **CSRF Protection**: Content Security Policy headers
- **Input Sanitization**: Protection against XSS attacks

## 🛡️ Security Features

### 1. Enhanced Password Policy
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (@$!%*?&)

### 2. Session Management with Refresh Tokens
- **Access tokens**: Short-lived (15 minutes) for API requests
- **Refresh tokens**: Long-lived (7 days) for token renewal
- **Automatic token refresh**: Seamless user experience
- **Token invalidation**: Proper logout with token cleanup

### 3. Rate Limiting
- **Authentication routes**: 5 attempts per 15 minutes
- **General API routes**: 100 requests per 15 minutes
- **IP-based tracking**: Protection against distributed attacks

### 3. Input Validation & Sanitization
- **Server-side validation**: Express-validator for all inputs
- **Email normalization**: Consistent email format
- **Username validation**: Alphanumeric characters and underscores only
- **SQL Injection Protection**: Sequelize ORM with parameterized queries

### 4. Security Headers
- **Content Security Policy**: Prevents XSS attacks
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **Strict-Transport-Security**: Enforces HTTPS

### 5. Logging & Monitoring
- **Winston Logger**: Structured logging with different levels
- **Security Events**: Failed login attempts, rate limiting triggers
- **Error Tracking**: Comprehensive error logging with stack traces
- **Audit Trail**: User actions and authentication events

## 🏗️ Architecture

### Backend (Node.js/Express)
```
src/
├── server.js          # Main server file with routes
├── database.js        # Database models and configuration
└── database.sqlite    # SQLite database file

logs/
├── combined.log       # All logs
└── error.log         # Error logs only
```

### Frontend (React)
```
public/dashboard-app/src/
├── components/
│   ├── Register.js    # User registration
│   ├── Login.js       # User login
│   ├── Dashboard.js   # User dashboard
│   ├── Profile.js     # User profile management
│   ├── Admin.js       # Admin panel
│   ├── VerifyEmail.js # Email verification
│   ├── ForgotPassword.js # Password reset request
│   └── ResetPassword.js  # Password reset form
├── App.js            # Main app component
└── index.js         # Entry point
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ (recommended: 20+)
- npm or yarn
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd project2-main
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd public/dashboard-app
npm install
cd ../..
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configurations
```

### 4. Build Frontend
```bash
cd public/dashboard-app
npm run build
cd ../..
```

### 5. Start the Application
```bash
# Development mode
npm start

# Production mode
npm run start:ci
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-at-least-256-bits-long
JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key-at-least-256-bits-long

# Email Configuration
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password

# Database Configuration
DB_PATH=./src/database.sqlite

# Logging Configuration
LOG_LEVEL=info

# Security Configuration
BCRYPT_ROUNDS=10
```

### Email Setup
1. Sign up for [Mailtrap](https://mailtrap.io/) (for development)
2. Get your SMTP credentials
3. Update `.env` file with your credentials

For production, use a real email service like SendGrid, AWS SES, or similar.

## 🧪 Testing

### Run All Tests
```bash
npm run cy:run
```

### Run Specific Test Suites
```bash
# Registration tests
npm run cy:run --spec "cypress/e2e/register.cy.js"

# Login tests  
npm run cy:run --spec "cypress/e2e/login.cy.js"

# Admin tests
npm run cy:run --spec "cypress/e2e/admin.cy.js"
```

### Backend Tests
```bash
npm run test:backend
```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/register` - User registration
- `POST /api/login` - User login (returns access token + refresh token)
- `POST /api/refresh-token` - Refresh access token
- `POST /api/logout` - User logout (invalidates refresh token)
- `POST /api/verify-email` - Email verification
- `POST /api/forgot-password` - Password reset request
- `POST /api/reset-password` - Password reset

### User Endpoints
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Admin Endpoints
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role
- `DELETE /api/admin/users/:id` - Delete user

## 🔐 Security Best Practices Implemented

### 1. Authentication & Authorization
- JWT access tokens with short expiration (15 minutes)
- JWT refresh tokens with long expiration (7 days)
- Automatic token refresh for seamless user experience
- Role-based access control
- Email verification requirement
- Secure password reset flow

### 2. Input Validation
- Server-side validation for all inputs
- Email format validation
- Password strength requirements
- Username format restrictions

### 3. Rate Limiting
- Authentication endpoint protection
- IP-based rate limiting
- Configurable limits and windows

### 4. Data Protection
- Password hashing with bcrypt
- SQL injection prevention
- XSS protection
- CSRF protection

### 5. Logging & Monitoring
- Comprehensive audit logging
- Security event tracking
- Error monitoring
- Performance logging

## 🚀 Deployment

### Production Checklist
- [ ] Set strong JWT secret
- [ ] Configure production email service
- [ ] Set up HTTPS
- [ ] Configure database backups
- [ ] Set up log rotation
- [ ] Configure monitoring
- [ ] Set up error tracking

### Environment Variables for Production
```env
NODE_ENV=production
JWT_SECRET=your-production-secret-256-bits-minimum
JWT_REFRESH_SECRET=your-production-refresh-secret-256-bits-minimum
SMTP_HOST=your-production-smtp-host
SMTP_USER=your-production-smtp-user
SMTP_PASS=your-production-smtp-password
```

## 📈 Performance Optimizations

### Backend
- Database indexing on frequently queried fields
- Connection pooling
- Caching strategies
- Compression middleware

### Frontend
- Code splitting
- Lazy loading
- Optimized bundle size
- CDN for static assets

## 🐛 Troubleshooting

### Common Issues

#### 1. libstdc++ Version Error
```bash
# Solution: Use system library
export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
```

#### 2. Email Not Sending
- Check SMTP credentials
- Verify email service configuration
- Check firewall settings

#### 3. Database Connection Issues
- Verify database file permissions
- Check SQLite installation
- Validate database schema

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Install dependencies
4. Run tests
5. Submit a pull request

### Code Style
- ESLint configuration included
- Prettier for code formatting
- Follow security best practices

## 📝 Changelog

### v2.0.0 - Security Enhanced
- ✅ Enhanced password requirements
- ✅ Rate limiting implementation
- ✅ Input validation with express-validator
- ✅ Security headers with helmet
- ✅ Winston logging system
- ✅ Environment variable configuration
- ✅ Fixed ESLint warnings
- ✅ Improved error handling
- ✅ Password requirements UI feedback

### v1.0.0 - Initial Release
- ✅ Basic registration system
- ✅ JWT authentication
- ✅ Email verification
- ✅ Password reset
- ✅ Admin panel
- ✅ React frontend

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- Express.js community
- React community
- Security community for best practices
- All contributors and testers
