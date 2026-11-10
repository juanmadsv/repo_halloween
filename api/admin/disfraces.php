<?php
require_once __DIR__ . '/../../app/api.php';
$method = $_SERVER['REQUEST_METHOD'] ?? ''; require_method('GET', 'POST', 'PATCH', 'DELETE');
require_admin();
if ($method === 'GET') {
    $rows = db()->query("SELECT d.id, d.nombre, d.descripcion, d.foto, d.votos, d.eliminado
      FROM disfraces d ORDER BY d.id DESC")->fetchAll();
    foreach ($rows as &$r) {
        $r['id']=(int)$r['id']; $r['votos']=(int)$r['votos']; $r['eliminado']=(bool)$r['eliminado'];
        $r['foto_url']=$r['foto']!==''?'api/foto.php?id='.$r['id']:null; unset($r['foto']);
    }
    unset($r); json_response(['disfraces'=>$rows]);
}
if ($method === 'POST') {
    require_csrf(); $data = request_json();
    $nombre=clean_text($data['nombre']??null,50,'nombre'); $descripcion=clean_text($data['descripcion']??null,10000,'descripción');
    $stmt=db()->prepare("INSERT INTO disfraces (nombre, descripcion, foto_blob) VALUES (?, ?, '')"); $stmt->execute([$nombre,$descripcion]);
    json_response(['mensaje'=>'Disfraz creado.','id'=>(int)db()->lastInsertId()],201);
}
require_csrf(); $data=request_json();
if ($method === 'PATCH') {
    $id=filter_var($data['id']??null,FILTER_VALIDATE_INT); if(!$id||$id<1) json_response(['error'=>'Falta un ID válido.'],422);
    $nombre=clean_text($data['nombre']??null,50,'nombre'); $descripcion=clean_text($data['descripcion']??null,10000,'descripción');
    $stmt=db()->prepare('UPDATE disfraces SET nombre=?, descripcion=? WHERE id=? AND eliminado=0'); $stmt->execute([$nombre,$descripcion,$id]);
    if(!$stmt->rowCount()){ $q=db()->prepare('SELECT id FROM disfraces WHERE id=? AND eliminado=0'); $q->execute([$id]); if(!$q->fetch()) json_response(['error'=>'Disfraz no encontrado.'],404); }
    json_response(['mensaje'=>'Disfraz actualizado.']);
}
$id=filter_var($data['id']??null,FILTER_VALIDATE_INT); if(!$id||$id<1) json_response(['error'=>'Falta un ID válido.'],422);
$stmt=db()->prepare('UPDATE disfraces SET eliminado=1 WHERE id=? AND eliminado=0'); $stmt->execute([$id]);
if(!$stmt->rowCount()) json_response(['error'=>'Disfraz no encontrado o ya eliminado.'],404);
json_response(['mensaje'=>'Disfraz eliminado.']);
