<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../app/config.php';
if ($argc < 3) { fwrite(STDERR, "Uso: php scripts/create_admin.php <usuario> <contrasena>\nLa contraseña debe tener al menos 12 caracteres.\n"); exit(1); }
$nombre = trim($argv[1]); $clave = $argv[2];
if ($nombre === '' || mb_strlen($nombre) > 50 || strlen($clave) < 12) { fwrite(STDERR, "Usuario inválido o contraseña menor a 12 caracteres.\n"); exit(1); }
$stmt = db()->prepare("INSERT INTO usuarios (nombre, clave, rol) VALUES (?, ?, 'admin') ON DUPLICATE KEY UPDATE clave=VALUES(clave), rol='admin'");
$stmt->execute([$nombre, password_hash($clave, PASSWORD_DEFAULT)]);
fwrite(STDOUT, "Administrador creado o actualizado: $nombre\n");
