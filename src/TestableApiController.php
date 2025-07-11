<?php

namespace App;

class TestableApiController extends ApiController
{
    public $inputStream = 'php://input';

    protected function getInputStream()
    {
        return $this->inputStream;
    }
}
