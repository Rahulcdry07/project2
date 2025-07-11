<?php

use PHPUnit\Framework\TestCase;
use App\Router;
use App\Controller;

class RouterTest extends TestCase
{
    private $controllerMock;
    private $router;

    protected function setUp(): void
    {
        // Create a mock of the Controller class
        $this->controllerMock = $this->createMock(Controller::class);
        $this->router = new Router($this->controllerMock);
    }

    public function testHomeRoute()
    {
        $this->controllerMock->expects($this->once())->method('index');
        $this->router->route('home', []);
    }

    public function testRegisterRoute()
    {
        $this->controllerMock->expects($this->once())->method('register');
        $this->router->route('register', []);
    }

    public function testApiUsersRoute()
    {
        $this->controllerMock->expects($this->once())->method('getUsers');
        $this->router->route('api/users', []);
    }

    public function testLoginRoute()
    {
        $this->controllerMock->expects($this->once())->method('login');
        $this->router->route('login', []);
    }

    public function testCsrfTokenRoute()
    {
        $this->controllerMock->expects($this->once())->method('csrfToken');
        $this->router->route('csrf_token', []);
    }

    public function testLogoutRoute()
    {
        $this->controllerMock->expects($this->once())->method('logout');
        $this->router->route('logout', []);
    }

    public function testForgotPasswordRoute()
    {
        $this->controllerMock->expects($this->once())->method('forgotPassword');
        $this->router->route('forgot_password', []);
    }

    public function testResetPasswordRoute()
    {
        $this->controllerMock->expects($this->once())->method('resetPassword');
        $this->router->route('reset-password', []);
    }

    public function testVerifyEmailRoute()
    {
        $this->controllerMock->expects($this->once())->method('verifyEmail');
        $this->router->route('verify_email', []);
    }

    public function testApiProfileRoute()
    {
        $this->controllerMock->expects($this->once())->method('apiProfile');
        $this->router->route('api_profile', []);
    }

    public function testApiProfileUpdateRoute()
    {
        $this->controllerMock->expects($this->once())->method('apiProfileUpdate');
        $this->router->route('api_profile_update', []);
    }

    public function testApiProfileChangePasswordRoute()
    {
        $this->controllerMock->expects($this->once())->method('apiProfileChangePassword');
        $this->router->route('api_profile_change_password', []);
    }

    public function testApiProfileDeleteRoute()
    {
        $this->controllerMock->expects($this->once())->method('apiProfileDelete');
        $this->router->route('api_profile_delete', []);
    }

    public function testAdminRoute()
    {
        $this->controllerMock->expects($this->once())->method('admin');
        $this->router->route('admin', []);
    }

    public function testApiAdminUsersRoute()
    {
        $this->controllerMock->expects($this->once())->method('apiAdminUsers');
        $this->router->route('api_admin_users', []);
    }

    public function testApiAdminUserRoleRoute()
    {
        $this->controllerMock->expects($this->once())->method('apiAdminUserRole');
        $this->router->route('api_admin_user_role', []);
    }

    public function testApiAdminUserDeleteRoute()
    {
        $this->controllerMock->expects($this->once())->method('apiAdminUserDelete');
        $this->router->route('api_admin_user_delete', []);
    }

    public function testApiRecentActivitiesRoute()
    {
        $this->controllerMock->expects($this->once())->method('apiRecentActivities');
        $this->router->route('api_recent_activities', []);
    }

    public function testApiDashboardStatsRoute()
    {
        $this->controllerMock->expects($this->once())->method('apiDashboardStats');
        $this->router->route('api_dashboard_stats', []);
    }

    public function testPricingRoute()
    {
        $this->controllerMock->expects($this->once())->method('pricing');
        $this->router->route('pricing', []);
    }

    public function testApiPlansRoute()
    {
        $this->controllerMock->expects($this->once())->method('apiPlans');
        $this->router->route('api_plans', []);
    }

    public function testApiSubscribeRoute()
    {
        $this->controllerMock->expects($this->once())->method('apiSubscribe');
        $this->router->route('api_subscribe', []);
    }

    public function testApiUserPlanRoute()
    {
        $this->controllerMock->expects($this->once())->method('apiUserPlan');
        $this->router->route('api_user_plan', []);
    }

    public function testNotFoundRoute()
    {
        // For the not_found case, we can't easily test the header and echo output without more complex setup.
        // Instead, we'll just ensure that no specific controller method is called for an unknown route.
        $this->controllerMock->expects($this->never())->method($this->anything());

        // To test the output, we can use output buffering
        ob_start();
        $this->router->route('a_route_that_does_not_exist', []);
        $output = ob_get_clean();

        $this->assertEquals('404 Not Found', $output);
    }
}
