<?php

use PHPUnit\Framework\TestCase;
use App\Controller;

class ControllerTest extends TestCase
{
    private $controller;

    protected function setUp(): void
    {
        $this->controller = new Controller();
    }

    public function testIndex()
    {
        ob_start();
        $this->controller->index();
        $output = ob_get_clean();

        $this->assertStringContainsString('Welcome to the Home Page', $output);
    }

    public function testCsrfToken()
    {
        ob_start();
        $this->controller->csrfToken();
        $output = ob_get_clean();

        $this->assertStringContainsString('CSRF Token', $output);
    }

    public function testPricing()
    {
        ob_start();
        $this->controller->pricing();
        $output = ob_get_clean();

        $this->assertStringContainsString('Choose Your Plan', $output);
    }
}
