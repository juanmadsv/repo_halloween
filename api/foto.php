<?php
require_once __DIR__ . '/../app/api.php';
require_method('GET');
$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$id) { http_response_code(404); exit; }
$stmt = db()->prepare('SELECT foto, foto_blob FROM disfraces WHERE id = ? AND eliminado = 0');
$stmt->execute([$id]); $row = $stmt->fetch();
if (!$row || !$row['foto_blob']) { http_response_code(404); exit; }
$types = ['jpg'=>'image/jpeg', 'jpeg'=>'image/jpeg', 'png'=>'image/png', 'webp'=>'image/webp'];
$ext = strtolower((string)$row['foto']);
header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
header('Cache-Control: public, max-age=3600');
echo $row['foto_blob'];
