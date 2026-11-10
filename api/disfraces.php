<?php
require_once __DIR__ . '/../app/api.php';
require_method('GET');
$user = current_user();
$rows = db()->query("SELECT d.id, d.nombre, d.descripcion, d.foto, d.votos
    FROM disfraces d WHERE d.eliminado = 0 ORDER BY d.votos DESC, d.id DESC")->fetchAll();
$hasVoted = false;
if ($user) {
    $q = db()->prepare('SELECT 1 FROM votos WHERE id_usuario = ? LIMIT 1');
    $q->execute([(int)$user['id']]);
    $hasVoted = (bool)$q->fetchColumn();
}
foreach ($rows as &$row) {
    $row['id'] = (int)$row['id']; $row['votos'] = (int)$row['votos'];
    $row['foto_url'] = $row['foto'] !== '' ? 'api/foto.php?id=' . $row['id'] : null;
    $row['ya_voto'] = $hasVoted;
    unset($row['foto']);
}
unset($row);
json_response(['disfraces'=>$rows, 'usuario'=>$user]);