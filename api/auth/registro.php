<?php
require_once __DIR__ . '/../../app/api.php';
require_method('POST'); require_csrf();
$data = request_json();
$nombre = clean_text($data['nombre'] ?? null, 50, 'nombre de usuario');
$clave = $data['clave'] ?? null;
if (!is_string($clave) || strlen($clave) < 8 || strlen($clave) > 200) json_response(['error'=>'La contraseña debe tener entre 8 y 200 caracteres.'], 422);
try {
    $stmt = db()->prepare('INSERT INTO usuarios (nombre, clave) VALUES (?, ?)');
    $stmt->execute([$nombre, password_hash($clave, PASSWORD_DEFAULT)]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') json_response(['error'=>'Ese nombre de usuario ya está registrado.'], 409);
    throw $e;
}
start_app_session(); session_regenerate_id(true);
$user = ['id'=>(int)db()->lastInsertId(), 'nombre'=>$nombre, 'rol'=>'usuario'];
$_SESSION['user'] = $user; $_SESSION['csrf'] = bin2hex(random_bytes(32));
json_response(['mensaje'=>'Cuenta creada.', 'usuario'=>$user, 'csrf'=>$_SESSION['csrf']], 201);
