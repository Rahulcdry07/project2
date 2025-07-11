<?php

namespace App;

class TestableUserController extends UserController
{
    public $inputStream = 'php://input';

    protected function getInputStream()
    {
        return $this->inputStream;
    }
}
