<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

set_exception_handler(static function (Throwable $error): void {
    error_log((string)$error);
    json_response(['error'=>'Ocurrió un error interno. Intentá de nuevo más tarde.'], 500);
});

function start_app_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    session_name('halloween_session');
    session_set_cookie_params(['lifetime'=>0, 'path'=>APP_BASE_URL ?: '/', 'secure'=>$secure, 'httponly'=>true, 'samesite'=>'Lax']);
    ini_set('session.use_strict_mode', '1');
    session_start();
    if (!isset($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

function json_response(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function request_json(): array
{
    $data = json_decode(file_get_contents('php://input') ?: '{}', true);
    if (!is_array($data)) json_response(['error'=>'El cuerpo JSON no es válido.'], 400);
    return $data;
}

function require_method(string ...$allowed): void
{
    if (!in_array($_SERVER['REQUEST_METHOD'] ?? '', $allowed, true)) {
        header('Allow: ' . implode(', ', $allowed));
        json_response(['error'=>'Método HTTP no permitido.'], 405);
    }
}

function require_csrf(): void
{
    start_app_session();
    $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($provided) || !hash_equals($_SESSION['csrf'] ?? '', $provided)) json_response(['error'=>'La sesión venció. Recargá la página e intentá de nuevo.'], 403);
}

function current_user(): ?array
{
    start_app_session();
    return isset($_SESSION['user']) && is_array($_SESSION['user']) ? $_SESSION['user'] : null;
}

function require_user(): array
{
    $user = current_user();
    if (!$user) json_response(['error'=>'Necesitás iniciar sesión para realizar esta acción.'], 401);
    return $user;
}

function require_admin(): array
{
    $user = require_user();
    if (($user['rol'] ?? '') !== 'admin') json_response(['error'=>'No tenés permisos para acceder a esta función.'], 403);
    return $user;
}

function clean_text(mixed $value, int $max, string $field): string
{
    if (!is_string($value)) json_response(['error'=>"El campo $field es obligatorio."], 422);
    $value = trim($value);
    if ($value === '' || mb_strlen($value) > $max) json_response(['error'=>"Revisá el campo $field."], 422);
    return $value;
}
