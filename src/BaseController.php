<?php

namespace App;

class BaseController
{
    protected function jsonResponse($data)
    {
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    protected function checkAuth()
    {
        if (!isset($_SESSION['user_id'])) {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized.']);
            return;
        }
    }

    protected function checkAdmin()
    {
        $this->checkAuth();
        if ($_SESSION['user_role'] !== 'admin') {
            $this->jsonResponse(['success' => false, 'message' => 'Unauthorized.']);
            return;
        }
    }
}