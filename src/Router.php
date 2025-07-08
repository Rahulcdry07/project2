<?php

namespace App;

class Router
{
    private $controller;

    public function __construct(Controller $controller)
    {
        $this->controller = $controller;
    }

    public function route($routeName, $params)
    {
        switch ($routeName) {
            case 'home':
                return $this->controller->index();
            case 'register':
                return $this->controller->register();
            case 'api/users':
                return $this->controller->getUsers();
            case 'login':
                return $this->controller->login();
            case 'csrf_token':
                return $this->controller->csrfToken();
            case 'logout':
                return $this->controller->logout();
            case 'forgot_password':
                return $this->controller->forgotPassword();
            case 'reset-password':
                return $this->controller->resetPassword();
            case 'verify_email':
                return $this->controller->verifyEmail();
            case 'api_profile':
                return $this->controller->apiProfile();
            case 'api_profile_update':
                return $this->controller->apiProfileUpdate();
            case 'api_profile_change_password':
                return $this->controller->apiProfileChangePassword();
            case 'api_profile_delete':
                return $this->controller->apiProfileDelete();
            case 'admin':
                return $this->controller->admin();
            case 'api_admin_users':
                return $this->controller->apiAdminUsers();
            case 'api_admin_user_role':
                return $this->controller->apiAdminUserRole();
            case 'api_admin_user_delete':
        return $this->controller->apiAdminUserDelete();
      case 'api_recent_activities':
        return $this->controller->apiRecentActivities();
      case 'api_dashboard_stats':
        return $this->controller->apiDashboardStats();
            default:
                echo 'Route not found!';
        }
    }
}
