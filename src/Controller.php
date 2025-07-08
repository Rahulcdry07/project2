<?php

namespace App;

require_once __DIR__ . '/config/config.php';

class Controller
{
    public function index()
    {
      // Render the home page
        include __DIR__ . '/views/home.php';
    }

    public function register()
    {
        require_once __DIR__ . '/controllers/register.php';
    }

    public function getUsers()
    {
        header('Content-Type: application/json');
        $db = new \App\Database();
        $users = $db->select('SELECT id, name, email, created_at FROM users');
        echo json_encode($users);
    }

    public function login()
    {
        require_once __DIR__ . '/controllers/login.php';
    }

    public function csrfToken()
    {
        require_once __DIR__ . '/controllers/csrf_token.php';
    }

    public function logout()
    {
        require_once __DIR__ . '/controllers/logout.php';
    }

    public function forgotPassword()
    {
        require_once __DIR__ . '/controllers/forgot_password.php';
    }

    public function resetPassword()
    {
        require_once __DIR__ . '/controllers/reset_password.php';
    }

    public function verifyEmail()
    {
        require_once __DIR__ . '/controllers/verify_email.php';
    }

    public function apiProfile()
    {
        require_once __DIR__ . '/controllers/api/profile.php';
    }

    public function apiProfileUpdate()
    {
        require_once __DIR__ . '/controllers/api/profile_update.php';
    }

    public function apiProfileChangePassword()
    {
        require_once __DIR__ . '/controllers/api/change_password.php';
    }

    public function apiProfileDelete()
    {
        require_once __DIR__ . '/controllers/api/profile_delete.php';
    }

    public function admin()
    {
      // Render the admin page
        include __DIR__ . '/../public/admin.html';
    }

    public function apiAdminUsers()
    {
        require_once __DIR__ . '/controllers/api/admin/users.php';
    }

    public function apiAdminUserRole()
    {
        require_once __DIR__ . '/controllers/api/admin/user_role.php';
    }

    public function apiAdminUserDelete() {
    require_once __DIR__ . '/controllers/api/admin/user_delete.php';
  }

  public function apiRecentActivities() {
    require_once __DIR__ . '/controllers/api/recent_activities.php';
  }

  public function apiDashboardStats() {
    require_once __DIR__ . '/controllers/api/dashboard_stats.php';
  }
}
