<?php

use PHPUnit\Framework\TestCase;
use App\TestableApiController;
use App\Database;
use App\User;
use App\ActivityLogger;
use App\Plan;
use App\Subscription;
use Psr\Log\LoggerInterface;

class ApiControllerTest extends TestCase
{
    private $dbMock;
    private $loggerMock;
    private $userModelMock;
    private $activityLoggerMock;
    private $planModelMock;
    private $subscriptionModelMock;
    private $apiController;

    protected function setUp(): void
    {
        $this->dbMock = $this->createMock(Database::class);
        $this->loggerMock = $this->createMock(LoggerInterface::class);
        $this->userModelMock = $this->createMock(User::class);
        $this->activityLoggerMock = $this->createMock(ActivityLogger::class);
        $this->planModelMock = $this->createMock(Plan::class);
        $this->subscriptionModelMock = $this->createMock(Subscription::class);

        $this->apiController = new TestableApiController(
            $this->dbMock,
            $this->loggerMock,
            $this->userModelMock,
            $this->activityLoggerMock,
            $this->planModelMock,
            $this->subscriptionModelMock
        );
    }

    public function testRecentActivitiesAsAdmin()
    {
        $_SESSION['user_id'] = 1;
        $_SESSION['user_role'] = 'admin';
        $activities = [['id' => 1, 'activity' => 'test']];

        $this->userModelMock->method('getUserById')->willReturn(['role' => 'admin']);
        $this->activityLoggerMock->method('getRecentActivities')->willReturn($activities);

        ob_start();
        $this->apiController->recent_activities();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'activities' => $activities]),
            $output
        );
    }

    public function testRecentActivitiesAsUser()
    {
        $_SESSION['user_id'] = 1;
        $_SESSION['user_role'] = 'user';
        $activities = [['id' => 1, 'activity' => 'test']];

        $this->userModelMock->method('getUserById')->willReturn(['role' => 'user']);
        $this->activityLoggerMock->method('getRecentActivitiesForUser')->willReturn($activities);

        ob_start();
        $this->apiController->recent_activities();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'activities' => $activities]),
            $output
        );
    }

    public function testDashboardStats()
    {
        $this->userModelMock->method('getTotalUsers')->willReturn(10);
        $this->userModelMock->method('getNewRegistrationsToday')->willReturn(2);

        ob_start();
        $this->apiController->dashboard_stats();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode([
                'success' => true,
                'stats' => [
                    'total_users' => 10,
                    'new_registrations_today' => 2,
                    'online_users' => 'N/A'
                ]
            ]),
            $output
        );
    }

    public function testPlans()
    {
        $plans = [['id' => 1, 'name' => 'Test Plan', 'price' => 10]];
        $this->planModelMock->method('getAllPlans')->willReturn($plans);

        ob_start();
        $this->apiController->plans();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'plans' => $plans]),
            $output
        );
    }

    public function testSubscribe()
    {
        $_SESSION['user_id'] = 1;
        $planId = 1;

        $this->userModelMock->method('assignPlan')->willReturn(true);
        $this->subscriptionModelMock->method('createSubscription')->willReturn(1);

        ob_start();
        $this->apiController->subscribe(['plan_id' => $planId]);
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'message' => 'Subscription successful!']),
            $output
        );
    }

    public function testUserPlan()
    {
        $_SESSION['user_id'] = 1;
        $plan = ['name' => 'Test Plan', 'price' => 10];

        $this->userModelMock->method('getUserPlan')->willReturn($plan);

        ob_start();
        $this->apiController->user_plan();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'plan' => $plan]),
            $output
        );
    }

    public function testSubscribeUnauthorized()
    {
        unset($_SESSION['user_id']);

        ob_start();
        $this->apiController->subscribe(['plan_id' => 1]);
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Unauthorized.']),
            $output
        );
    }

    public function testSubscribeMissingPlanId()
    {
        $_SESSION['user_id'] = 1;

        ob_start();
        $this->apiController->subscribe(['plan_id' => null]);
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Plan ID is required.']),
            $output
        );
    }

    public function testSubscribeFailedAssignPlan()
    {
        $_SESSION['user_id'] = 1;
        $planId = 1;

        $this->userModelMock->method('assignPlan')->willReturn(false);

        ob_start();
        $this->apiController->subscribe(['plan_id' => $planId]);
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Failed to assign plan to user.']),
            $output
        );
    }

    public function testSubscribeFailedCreateSubscription()
    {
        $_SESSION['user_id'] = 1;
        $planId = 1;

        $this->userModelMock->method('assignPlan')->willReturn(true);
        $this->subscriptionModelMock->method('createSubscription')->willReturn(false);
        $this->userModelMock->expects($this->once())->method('assignPlan')->with($_SESSION['user_id'], null); // Expect rollback

        ob_start();
        $this->apiController->subscribe(['plan_id' => $planId]);
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Failed to create subscription record.']),
            $output
        );
    }

    public function testUserPlanNoActivePlan()
    {
        $_SESSION['user_id'] = 1;

        $this->userModelMock->method('getUserPlan')->willReturn(null);
        $this->loggerMock->expects($this->once())->method('debug');

        ob_start();
        $this->apiController->user_plan();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'No active plan found.']),
            $output
        );
    }
}
