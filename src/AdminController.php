<?php

namespace App;

use Psr\Log\LoggerInterface;

class AdminController extends BaseController
{
    private $db;
    private $logger;
    private $userModel;
    private $activityLogger;

    public function __construct(Database $db, LoggerInterface $logger, User $userModel, ActivityLogger $activityLogger)
    {
        $this->db = $db;
        $this->logger = $logger;
        $this->userModel = $userModel;
        $this->activityLogger = $activityLogger;
    }

    public function index()
    {
        $this->checkAdmin();
        include __DIR__ . '/../public/admin.php';
    }

    public function getUsers()
    {
        $this->checkAdmin();
        $users = $this->userModel->getAllUsers();
        $this->jsonResponse(['success' => true, 'users' => $users]);
    }

    public function userRole()
    {
        $this->checkAdmin();
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $userId = $_POST['user_id'] ?? null;
            $newRole = $_POST['new_role'] ?? null;

            if (empty($userId) || empty($newRole) || !in_array($newRole, ['user', 'admin'])) {
                $this->jsonResponse(['success' => false, 'message' => 'Invalid input.']);
                return;
            }

            if ($userId == $_SESSION['user_id']) {
                $this->jsonResponse(['success' => false, 'message' => 'Cannot change your own role.']);
                return;
            }

            if ($this->userModel->updateUserRole($userId, $newRole)) {
                $this->activityLogger->logActivity($userId, 'role_change', "User role changed to $newRole.", ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'));
                $this->jsonResponse(['success' => true, 'message' => 'User role updated successfully.']);
            } else {
                $this->jsonResponse(['success' => false, 'message' => 'Failed to update user role.']);
            }
        }
    }

    public function userDelete()
    {
        $this->checkAdmin();
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $userIdToDelete = $_POST['user_id'] ?? null;

            if (empty($userIdToDelete)) {
                $this->jsonResponse(['success' => false, 'message' => 'User ID is required.']);
                return;
            }

            if ($userIdToDelete == $_SESSION['user_id']) {
                $this->jsonResponse(['success' => false, 'message' => 'Cannot delete your own account from here.']);
                return;
            }

            $userToDelete = $this->userModel->getUserById($userIdToDelete);
            if (!$userToDelete) {
                $this->jsonResponse(['success' => false, 'message' => 'User not found.']);
                return;
            }

            $this->activityLogger->logActivity($userIdToDelete, 'user_deletion', 'User account deleted by admin.', ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'));

            if ($this->userModel->deleteUser($userIdToDelete)) {
                $this->jsonResponse(['success' => true, 'message' => 'User deleted successfully.']);
            } else {
                $this->jsonResponse(['success' => false, 'message' => 'Failed to delete user.']);
            }
        }
    }
}