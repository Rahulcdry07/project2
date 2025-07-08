<?php

use Monolog\Logger;
use Monolog\Handler\StreamHandler;

// Create a log channel
$log = new Logger('registration_app');
$log->pushHandler(new StreamHandler(__DIR__ . '/../logs/app.log', Logger::WARNING));

// Set PHP error logging to Monolog
set_error_handler(function ($severity, $message, $file, $line) use ($log) {
    if (!(error_reporting() & $severity)) {
        // This error code is not included in error_reporting
        return false;
    }
    $log->error($message, ['file' => $file, 'line' => $line, 'severity' => $severity]);
    return true;
});

// Catch fatal errors that are not caught by set_error_handler
register_shutdown_function(function () use ($log) {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_CORE_WARNING, E_COMPILE_ERROR, E_COMPILE_WARNING])) {
        $log->critical($error['message'], ['file' => $error['file'], 'line' => $error['line'], 'type' => $error['type']]);
    }
});

return $log;
