<?php

declare(strict_types=1);

function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    /** @var array<string, mixed> $config */
    $config = $GLOBALS['app_config'];
    $db = $config['db'];

    $required = ['host', 'name', 'user', 'charset'];
    foreach ($required as $key) {
        if (empty($db[$key])) {
            throw new RuntimeException("Configurazione database incompleta: {$key}");
        }
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $db['host'],
        (int) ($db['port'] ?? 3306),
        $db['name'],
        $db['charset']
    );

    $pdo = new PDO(
        $dsn,
        (string) $db['user'],
        (string) ($db['pass'] ?? ''),
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    return $pdo;
}
