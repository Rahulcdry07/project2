<?php

namespace App;

use Psr\Log\LoggerInterface;

class ApiController extends BaseController
{
    private $db;
    private $logger;
    private $userModel;
    private $activityLogger;
    private $planModel;
    private $subscriptionModel;

    public function __construct(Database $db, LoggerInterface $logger, User $userModel, ActivityLogger $activityLogger, Plan $planModel, Subscription $subscriptionModel)
    {
        $this->db = $db;
        $this->logger = $logger;
        $this->userModel = $userModel;
        $this->activityLogger = $activityLogger;
        $this->planModel = $planModel;
        $this->subscriptionModel = $subscriptionModel;
    }

    public function recent_activities()
    {
        $this->checkAuth();
        $userId = null;
        if (isset($_SESSION['user_id'])) {
            $loggedInUser = $this->userModel->getUserById($_SESSION['user_id']);
            if ($loggedInUser && $loggedInUser['role'] !== 'admin') {
                $userId = $_SESSION['user_id'];
            }
        }

        if ($userId) {
            $activities = $this->activityLogger->getRecentActivitiesForUser($userId);
        } else {
            $activities = $this->activityLogger->getRecentActivities();
        }

        $this->jsonResponse(['success' => true, 'activities' => $activities]);
    }

    public function dashboard_stats()
    {
        $this->checkAuth();
        $totalUsers = $this->userModel->getTotalUsers();
        $newRegistrationsToday = $this->userModel->getNewRegistrationsToday();

        $this->jsonResponse([
            'success' => true,
            'stats' => [
                'total_users' => $totalUsers,
                'new_registrations_today' => $newRegistrationsToday,
                'online_users' => 'N/A'
            ]
        ]);
    }

    public function plans()
    {
        $plans = $this->planModel->getAllPlans();
        $this->jsonResponse(['success' => true, 'plans' => $plans]);
    }

    public function subscribe($input = null)
    {
        $this->checkAuth();
        $data = $input ?: json_decode(file_get_contents('php://input'), true);
        $planId = $data['plan_id'] ?? null;
        $userId = $_SESSION['user_id'];

        if (empty($planId)) {
            $this->jsonResponse(['success' => false, 'message' => 'Plan ID is required.']);
            return;
        }

        if ($this->userModel->assignPlan($userId, $planId)) {
            $endDate = date('Y-m-d H:i:s', strtotime('+30 days'));
            if ($this->subscriptionModel->createSubscription($userId, $planId, $endDate)) {
                $this->jsonResponse(['success' => true, 'message' => 'Subscription successful!']);
            } else {
                // Optionally, roll back the plan assignment if subscription fails
                $this->userModel->assignPlan($userId, null); // Revert plan
                $this->jsonResponse(['success' => false, 'message' => 'Failed to create subscription record.']);
            }
        } else {
            $this->jsonResponse(['success' => false, 'message' => 'Failed to assign plan to user.']);
        }
    }

    public function user_plan()
    {
        $this->checkAuth();
        $userId = $_SESSION['user_id'];
        $userPlan = $this->userModel->getUserPlan($userId);

        if ($userPlan) {
            $this->logger->debug("User Plan Data: " . print_r($userPlan, true));
            $this->jsonResponse(['success' => true, 'plan' => $userPlan]);
        } else {
            $this->logger->debug("User Plan Data: No active plan found.");
            $this->jsonResponse(['success' => false, 'message' => 'No active plan found.']);
        }
    }
}