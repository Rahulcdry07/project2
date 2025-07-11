<?php

namespace App;

require_once __DIR__ . '/../config/config.php';

use App\Database;

class Model
{
    protected $db;

    public function __construct()
    {
        $this->db = new Database();
    }

  // Methods for interacting with the database go here...
}
