<?php
declare(strict_types=1);
// XAMPP local defaults. Adjust if your MySQL credentials differ.
const DB_HOST = '127.0.0.1';
const DB_PORT = '3306';
const DB_NAME = 'halloween';
const DB_USER = 'root';
const DB_PASS = '';
const APP_BASE_URL = ''; // Example: /halloween-vote if installed in htdocs/halloween-vote
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}
