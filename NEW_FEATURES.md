# New Dashboard Features

## Overview
Four new features have been added to enhance the dashboard functionality:

## 1. Settings Page (`/settings`)
- **General Tab**: Theme preferences (light/dark/auto), language selection, account information display
- **Security Tab**: Password change functionality with current password verification
- **Notifications Tab**: Email notification preferences (general notifications, security alerts, marketing emails)
- **Features**:
  - Real-time validation
  - Toast notifications for success/error
  - Activity logging on password changes
  - Email notification on security changes

## 2. Activity Log (`/activity`)
- View complete history of user actions
- **Tracked Activities**:
  - Login/Logout
  - Password changes
  - Profile updates
  - Settings updates
  - Email changes
- **Features**:
  - Paginated display (10 per page)
  - IP address tracking
  - Timestamp for each activity
  - Icon-based activity type indicators
  - Empty state handling

## 3. Notifications (`/notifications`)
- Centralized notification center
- **Notification Types**:
  - Info (blue)
  - Success (green)
  - Warning (yellow)
  - Error (red)
  - Security (primary)
- **Features**:
  - Unread count badge
  - Mark individual as read
  - Mark all as read
  - Delete notifications
  - Timestamp display
  - Type-based icons

## 4. Notes (`/notes`)
- Personal note-taking system
- **Features**:
  - Create/edit/delete notes
  - Pin important notes (appear first)
  - Color coding (5 colors: default, blue, green, yellow, red)
  - Title and content fields
  - Tag support (backend ready)
  - Responsive card layout
  - Dropdown menu for actions

## Backend API Endpoints

### Settings
- `GET /api/v1/settings` - Get user settings
- `PUT /api/v1/settings` - Update settings
- `PUT /api/v1/settings/password` - Change password
- `PUT /api/v1/settings/email` - Update email

### Activity
- `GET /api/v1/activity` - Get activity logs (paginated)

### Notifications
- `GET /api/v1/notifications` - Get notifications with unread count
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification

### Notes
- `GET /api/v1/notes` - Get all notes (pinned first)
- `GET /api/v1/notes/:id` - Get single note
- `POST /api/v1/notes` - Create note
- `PUT /api/v1/notes/:id` - Update note
- `DELETE /api/v1/notes/:id` - Delete note

## Database Models

### ActivityLog
- userId, action, description, ipAddress, userAgent, metadata, createdAt
- Indexed on: userId, action, createdAt

### Notification
- userId, type, title, message, isRead, readAt, link, metadata, createdAt
- Indexed on: userId, isRead

### Note
- userId, title, content, color, isPinned, tags, createdAt, updatedAt
- Indexed on: userId, isPinned

### UserSettings
- userId, theme, language, emailNotifications, securityAlerts, marketingEmails, twoFactorEnabled
- One-to-one relationship with User

## Navigation
All features are accessible from the main navigation bar:
- **Notes**: Main nav item with journal icon
- **Activity**: Main nav item with clock icon
- **Notifications**: Bell icon in right nav
- **Settings**: Gear icon in right nav

## Automatic Features
- **Login Tracking**: Every login creates an activity log entry
- **Welcome Notification**: New users receive a welcome notification on registration
- **Security Notifications**: Password changes send notification to user
- **Email Verification**: Email changes require re-verification

## Testing
To test all features:
1. Login with credentials: `admin@example.com` / `Password123!`
2. Navigate to Settings and change preferences
3. Check Activity Log to see login tracked
4. View Notifications for system messages
5. Create some notes with different colors and pin them

## Technology Stack
- **Backend**: Node.js, Express, Sequelize ORM, SQLite
- **Frontend**: React 19.1.1, React Router, Bootstrap 5.3.2
- **Authentication**: JWT with 30-minute expiry
- **Icons**: Bootstrap Icons

## Future Enhancements
- Real-time notification badges
- Note search functionality
- Tag-based note filtering
- Export activity logs
- Two-factor authentication (infrastructure ready)
- Dark mode implementation
- Notification push support
