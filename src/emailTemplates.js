const path = require('path');

// Email template helper functions
const getBaseTemplate = (content, title) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
            .alert { padding: 15px; margin: 10px 0; border-radius: 5px; }
            .alert-success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
            .alert-warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
            .alert-danger { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
            .profile-stats { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${title}</h1>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p>This email was sent from your account management system.</p>
                <p>If you didn't expect this email, please contact support.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Email templates
const templates = {
  // Welcome email after registration
  welcome: (username, verificationLink) => {
    const content = `
      <h2>Welcome to Our Platform, ${username}! 🎉</h2>
      <p>Thank you for joining our community! We're excited to have you on board.</p>
      
      <div class="alert alert-success">
        <strong>Next Steps:</strong>
        <ul>
          <li>Verify your email address to activate your account</li>
          <li>Complete your profile to get the most out of our platform</li>
          <li>Explore our features and connect with other users</li>
        </ul>
      </div>
      
      <p><strong>Please verify your email address:</strong></p>
      <p style="text-align: center;">
        <a href="${verificationLink}" class="button">Verify Email Address</a>
      </p>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${verificationLink}</p>
      
      <p>Once verified, you'll have full access to all our features!</p>
    `;
    return getBaseTemplate(content, 'Welcome to Our Platform!');
  },

  // Email verification success
  verificationSuccess: (username) => {
    const content = `
      <h2>Email Verified Successfully! ✅</h2>
      <p>Congratulations, ${username}! Your email address has been verified.</p>
      
      <div class="alert alert-success">
        <strong>Your account is now active!</strong>
        <p>You can now log in and access all features of our platform.</p>
      </div>
      
      <p><strong>What's next?</strong></p>
      <ul>
        <li>Log in to your account</li>
        <li>Complete your profile</li>
        <li>Explore our features</li>
        <li>Connect with other users</li>
      </ul>
      
      <p style="text-align: center;">
        <a href="http://localhost:3000/login" class="button">Log In Now</a>
      </p>
    `;
    return getBaseTemplate(content, 'Email Verification Successful');
  },

  // Password reset email
  passwordReset: (username, resetLink) => {
    const content = `
      <h2>Password Reset Request 🔐</h2>
      <p>Hello ${username},</p>
      <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
      
      <div class="alert alert-warning">
        <strong>Security Notice:</strong>
        <p>This link will expire in 1 hour for your security.</p>
      </div>
      
      <p><strong>Reset your password:</strong></p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </p>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetLink}</p>
      
      <p><strong>Security Tips:</strong></p>
      <ul>
        <li>Use a strong, unique password</li>
        <li>Never share your password with anyone</li>
        <li>Enable two-factor authentication if available</li>
      </ul>
    `;
    return getBaseTemplate(content, 'Password Reset Request');
  },

  // Password changed notification
  passwordChanged: (username, timestamp, ipAddress) => {
    const content = `
      <h2>Password Changed Successfully 🔒</h2>
      <p>Hello ${username},</p>
      <p>Your password was successfully changed on <strong>${timestamp}</strong>.</p>
      
      <div class="alert alert-success">
        <strong>Change Details:</strong>
        <ul>
          <li>Time: ${timestamp}</li>
          <li>IP Address: ${ipAddress}</li>
        </ul>
      </div>
      
      <p>If you didn't make this change, please contact our support team immediately.</p>
      
      <p><strong>Security Recommendations:</strong></p>
      <ul>
        <li>Make sure you're using a strong password</li>
        <li>Consider enabling two-factor authentication</li>
        <li>Review your recent account activity</li>
      </ul>
    `;
    return getBaseTemplate(content, 'Password Changed');
  },

  // Profile update notification
  profileUpdated: (username, changes) => {
    const content = `
      <h2>Profile Updated Successfully 👤</h2>
      <p>Hello ${username},</p>
      <p>Your profile has been successfully updated!</p>
      
      <div class="profile-stats">
        <h3>Updated Information:</h3>
        <ul>
          ${Object.entries(changes).map(([field, value]) => 
            `<li><strong>${field}:</strong> ${value || 'Not specified'}</li>`
          ).join('')}
        </ul>
      </div>
      
      <p>Your profile completion is now at <strong>${changes.profile_completion || 0}%</strong>.</p>
      
      <p style="text-align: center;">
        <a href="http://localhost:3000/profile" class="button">View Your Profile</a>
      </p>
    `;
    return getBaseTemplate(content, 'Profile Updated');
  },

  // Profile picture updated
  profilePictureUpdated: (username) => {
    const content = `
      <h2>Profile Picture Updated 📸</h2>
      <p>Hello ${username},</p>
      <p>Your profile picture has been successfully updated!</p>
      
      <div class="alert alert-success">
        <p>Your new profile picture is now visible to other users (based on your privacy settings).</p>
      </div>
      
      <p style="text-align: center;">
        <a href="http://localhost:3000/profile" class="button">View Your Profile</a>
      </p>
    `;
    return getBaseTemplate(content, 'Profile Picture Updated');
  },

  // Login from new device
  newDeviceLogin: (username, deviceInfo, timestamp) => {
    const content = `
      <h2>New Device Login Alert ⚠️</h2>
      <p>Hello ${username},</p>
      <p>We detected a login to your account from a new device.</p>
      
      <div class="alert alert-warning">
        <strong>Login Details:</strong>
        <ul>
          <li>Time: ${timestamp}</li>
          <li>IP Address: ${deviceInfo.ip}</li>
          <li>User Agent: ${deviceInfo.userAgent}</li>
        </ul>
      </div>
      
      <p>If this was you, no action is needed. If you don't recognize this login:</p>
      <ul>
        <li>Change your password immediately</li>
        <li>Enable two-factor authentication</li>
        <li>Contact our support team</li>
      </ul>
      
      <p style="text-align: center;">
        <a href="http://localhost:3000/profile" class="button">Review Account Security</a>
      </p>
    `;
    return getBaseTemplate(content, 'New Device Login Alert');
  },

  // Account security alert
  securityAlert: (username, alertType, details) => {
    const content = `
      <h2>Security Alert 🚨</h2>
      <p>Hello ${username},</p>
      <p>We detected a security-related activity on your account.</p>
      
      <div class="alert alert-danger">
        <strong>Alert Type:</strong> ${alertType}<br>
        <strong>Details:</strong> ${details}<br>
        <strong>Time:</strong> ${new Date().toLocaleString()}
      </div>
      
      <p><strong>Recommended Actions:</strong></p>
      <ul>
        <li>Review your recent account activity</li>
        <li>Change your password if necessary</li>
        <li>Enable two-factor authentication</li>
        <li>Contact support if you need assistance</li>
      </ul>
      
      <p style="text-align: center;">
        <a href="http://localhost:3000/profile" class="button">Review Account</a>
      </p>
    `;
    return getBaseTemplate(content, 'Security Alert');
  },

  // Weekly activity summary
  weeklySummary: (username, stats) => {
    const content = `
      <h2>Your Weekly Activity Summary 📊</h2>
      <p>Hello ${username},</p>
      <p>Here's a summary of your activity this week:</p>
      
      <div class="profile-stats">
        <h3>Activity Statistics:</h3>
        <ul>
          <li><strong>Logins:</strong> ${stats.logins} times</li>
          <li><strong>Profile Views:</strong> ${stats.profileViews || 0}</li>
          <li><strong>Profile Completion:</strong> ${stats.profileCompletion}%</li>
          <li><strong>Last Login:</strong> ${stats.lastLogin}</li>
        </ul>
      </div>
      
      <p><strong>Quick Actions:</strong></p>
      <ul>
        <li>Complete your profile to increase visibility</li>
        <li>Update your profile picture</li>
        <li>Connect with other users</li>
      </ul>
      
      <p style="text-align: center;">
        <a href="http://localhost:3000/dashboard" class="button">View Dashboard</a>
      </p>
    `;
    return getBaseTemplate(content, 'Weekly Activity Summary');
  },

  // Admin notification for new user
  adminNewUser: (adminUsername, newUser) => {
    const content = `
      <h2>New User Registration 👤</h2>
      <p>Hello ${adminUsername},</p>
      <p>A new user has registered on the platform.</p>
      
      <div class="profile-stats">
        <h3>New User Details:</h3>
        <ul>
          <li><strong>Username:</strong> ${newUser.username}</li>
          <li><strong>Email:</strong> ${newUser.email}</li>
          <li><strong>Registration Date:</strong> ${new Date(newUser.createdAt).toLocaleString()}</li>
          <li><strong>Email Verified:</strong> ${newUser.is_verified ? 'Yes' : 'No'}</li>
        </ul>
      </div>
      
      <p style="text-align: center;">
        <a href="http://localhost:3000/admin" class="button">View Admin Panel</a>
      </p>
    `;
    return getBaseTemplate(content, 'New User Registration');
  }
};

module.exports = templates; 