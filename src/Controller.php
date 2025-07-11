<?php

namespace App;

use Psr\Log\LoggerInterface;

class Controller
{
    private $db;
    private $logger;
    private $userModel;
    private $activityLogger;
    private $planModel;
    private $subscriptionModel;
    private $userController;
    private $adminController;
    private $apiController;

    public function __construct(Database $db, LoggerInterface $logger, User $userModel, ActivityLogger $activityLogger, Plan $planModel, Subscription $subscriptionModel)
    {
        $this->db = $db;
        $this->logger = $logger;
        $this->userModel = $userModel;
        $this->activityLogger = $activityLogger;
        $this->planModel = $planModel;
        $this->subscriptionModel = $subscriptionModel;
        $this->userController = new UserController($db, $logger, $userModel, $activityLogger);
        $this->adminController = new AdminController($db, $logger, $userModel, $activityLogger);
        $this->apiController = new ApiController($db, $logger, $userModel, $activityLogger, $planModel, $subscriptionModel);
    }

    public function __call($name, $arguments)
    {
        if (method_exists($this->userController, $name)) {
            return call_user_func_array([$this->userController, $name], $arguments);
        } elseif (method_exists($this->adminController, $name)) {
            return call_user_func_array([$this->adminController, $name], $arguments);
        } elseif (method_exists($this->apiController, $name)) {
            return call_user_func_array([$this->apiController, $name], $arguments);
        } else {
            $this->notFound();
        }
    }

    private function notFound()
    {
        header("HTTP/1.0 404 Not Found");
        echo '404 Not Found';
        exit;
    }
}
