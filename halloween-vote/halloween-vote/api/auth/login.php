<?php
require_once __DIR__ . '/../../app/api.php';
require_method('POST'); require_csrf();
$data = request_json();
$nombre = clean_text($data['nombre'] ?? null, 50, 'nombre de usuario');
$clave = $data['clave'] ?? '';
$stmt = db()->prepare('SELECT id, nombre, clave, rol FROM usuarios WHERE nombre = ? LIMIT 1');
$stmt->execute([$nombre]); $row = $stmt->fetch();
if (!$row || !is_string($clave) || !password_verify($clave, $row['clave'])) json_response(['error'=>'Usuario o contraseña incorrectos.'], 401);
session_regenerate_id(true);
$_SESSION['user'] = ['id'=>(int)$row['id'], 'nombre'=>$row['nombre'], 'rol'=>$row['rol']];
$_SESSION['csrf'] = bin2hex(random_bytes(32));
json_response(['mensaje'=>'Sesión iniciada.', 'usuario'=>$_SESSION['user'], 'csrf'=>$_SESSION['csrf']]);
