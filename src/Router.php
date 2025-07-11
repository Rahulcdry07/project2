<?php

namespace App;

class Router
{
    private $userController;
    private $adminController;
    private $apiController;

    public function __construct(UserController $userController, AdminController $adminController, ApiController $apiController)
    {
        $this->userController = $userController;
        $this->adminController = $adminController;
        $this->apiController = $apiController;
    }

    public function route($uri)
    {
        switch ($uri) {
            case '':
            case '/':
                (new \App\Controller())->index();
                break;
            
            // User routes
            case '/register':
                $this->userController->register();
                break;
            case '/login':
                $this->userController->login();
                break;
            case '/logout':
                $this->userController->logout();
                break;
            case '/forgot-password':
                $this->userController->forgotPassword();
                break;
            case '/reset-password':
                $this->userController->resetPassword();
                break;
            case '/verify-email':
                $this->userController->verifyEmail();
                break;

            // Admin routes
            case '/admin':
                $this->adminController->index();
                break;
            case '/api/admin/users':
                $this->adminController->getUsers();
                break;
            case '/api/admin/user_role':
                $this->adminController->userRole();
                break;
            case '/api/admin/user_delete':
                $this->adminController->userDelete();
                break;

            // API routes
            case '/api/profile':
                $this->userController->api_profile();
                break;
            case '/api/profile_update':
                $this->userController->apiProfileUpdate();
                break;
            case '/api/profile_change_password':
                $this->userController->changePassword();
                break;
            case '/api/profile_delete':
                $this->userController->deleteProfile();
                break;
            case '/api/recent-activities':
                $this->apiController->recent_activities();
                break;
            case '/api/dashboard-stats':
                $this->apiController->dashboard_stats();
                break;
            case '/api/plans':
                $this->apiController->plans();
                break;
            case '/api/subscribe':
                $this->apiController->subscribe();
                break;
            case '/api/user-plan':
                $this->apiController->user_plan();
                break;
            case '/csrf_token':
                $this->userController->csrfToken();
                break;

            default:
                header("HTTP/1.0 404 Not Found");
                echo '404 Not Found';
                break;
        }
    }
}
