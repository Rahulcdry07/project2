<?php

use PHPUnit\Framework\TestCase;
use App\AdminController;
use App\Database;
use App\User;
use App\ActivityLogger;
use Psr\Log\LoggerInterface;

class AdminControllerTest extends TestCase
{
    private $dbMock;
    private $loggerMock;
    private $userModelMock;
    private $activityLoggerMock;
    private $adminController;

    protected function setUp(): void
    {
        $this->dbMock = $this->createMock(Database::class);
        $this->loggerMock = $this->createMock(LoggerInterface::class);
        $this->userModelMock = $this->createMock(User::class);
        $this->activityLoggerMock = $this->createMock(ActivityLogger::class);

        $this->adminController = new AdminController(
            $this->dbMock,
            $this->loggerMock,
            $this->userModelMock,
            $this->activityLoggerMock
        );
    }

    public function testIndex()
    {
        ob_start();
        $this->adminController->index();
        $output = ob_get_clean();

        $this->assertStringContainsString('Admin Panel', $output);
    }

    public function testGetUsers()
    {
        $_SESSION['user_id'] = 1;
        $_SESSION['user_role'] = 'admin';
        $users = [['id' => 1, 'name' => 'Test User', 'email' => 'test@example.com']];

        $this->userModelMock->method('getAllUsers')->willReturn($users);

        ob_start();
        $this->adminController->getUsers();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'users' => $users]),
            $output
        );
    }

    public function testUserRole()
    {
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_SESSION['user_id'] = 1;
        $_SESSION['user_role'] = 'admin';
        $_POST['user_id'] = 2;
        $_POST['new_role'] = 'admin';

        $this->userModelMock->method('updateUserRole')->willReturn(true);
        $this->activityLoggerMock->expects($this->once())->method('logActivity');

        ob_start();
        $this->adminController->userRole();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'message' => 'User role updated successfully.']),
            $output
        );
    }

    public function testUserDelete()
    {
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_SESSION['user_id'] = 1;
        $_SESSION['user_role'] = 'admin';
        $_POST['user_id'] = 2;

        $this->userModelMock->method('getUserById')->willReturn(['id' => 2]);
        $this->userModelMock->method('deleteUser')->willReturn(true);
        $this->activityLoggerMock->expects($this->once())->method('logActivity');

        ob_start();
        $this->adminController->userDelete();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'message' => 'User deleted successfully.']),
            $output
        );
    }

    public function testGetUsersUnauthorized()
    {
        unset($_SESSION['user_id']);
        unset($_SESSION['user_role']);

        ob_start();
        $this->adminController->getUsers();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Unauthorized access.']),
            $output
        );
    }

    public function testUserRoleUnauthorized()
    {
        unset($_SESSION['user_id']);
        unset($_SESSION['user_role']);

        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['user_id'] = 2;
        $_POST['new_role'] = 'admin';

        ob_start();
        $this->adminController->userRole();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Unauthorized access.']),
            $output
        );
    }

    public function testUserRoleInvalidInput()
    {
        $_SESSION['user_id'] = 1;
        $_SESSION['user_role'] = 'admin';
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['user_id'] = null;
        $_POST['new_role'] = 'invalid_role';

        ob_start();
        $this->adminController->userRole();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Invalid input.']),
            $output
        );
    }

    public function testUserRoleCannotChangeOwnRole()
    {
        $_SESSION['user_id'] = 1;
        $_SESSION['user_role'] = 'admin';
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['user_id'] = 1;
        $_POST['new_role'] = 'user';

        ob_start();
        $this->adminController->userRole();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Cannot change your own role.']),
            $output
        );
    }

    public function testUserRoleFailedUpdate()
    {
        $_SESSION['user_id'] = 1;
        $_SESSION['user_role'] = 'admin';
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['user_id'] = 2;
        $_POST['new_role'] = 'user';

        $this->userModelMock->method('updateUserRole')->willReturn(false);

        ob_start();
        $this->adminController->userRole();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Failed to update user role.']),
            $output
        );
    }

    public function testUserDeleteUnauthorized()
    {
        unset($_SESSION['user_id']);
        unset($_SESSION['user_role']);

        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['user_id'] = 2;

        ob_start();
        $this->adminController->userDelete();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Unauthorized access.']),
            $output
        );
    }

    public function testUserDeleteMissingUserId()
    {
        $_SESSION['user_id'] = 1;
        $_SESSION['user_role'] = 'admin';
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['user_id'] = null;

        ob_start();
        $this->adminController->userDelete();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'User ID is required.']),
            $output
        );
    }

    public function testUserDeleteCannotDeleteOwnAccount()
    {
        $_SESSION['user_id'] = 1;
        $_SESSION['user_role'] = 'admin';
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['user_id'] = 1;

        ob_start();
        $this->adminController->userDelete();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Cannot delete your own account from here.']),
            $output
        );
    }

    public function testUserDeleteUserNotFound()
    {
        $_SESSION['user_id'] = 1;
        $_SESSION['user_role'] = 'admin';
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['user_id'] = 999; // Non-existent user

        $this->userModelMock->method('getUserById')->willReturn(null);

        ob_start();
        $this->adminController->userDelete();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'User not found.']),
            $output
        );
    }

    public function testUserDeleteFailedDelete()
    {
        $_SESSION['user_id'] = 1;
        $_SESSION['user_role'] = 'admin';
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['user_id'] = 2;

        $this->userModelMock->method('getUserById')->willReturn(['id' => 2]);
        $this->userModelMock->method('deleteUser')->willReturn(false);

        ob_start();
        $this->adminController->userDelete();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Failed to delete user.']),
            $output
        );
    }
}
