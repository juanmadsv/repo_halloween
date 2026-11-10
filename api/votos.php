<?php
require_once __DIR__ . '/../app/api.php';
require_method('POST'); require_csrf(); $user = require_user();
$data = request_json(); $id = filter_var($data['id_disfraz'] ?? null, FILTER_VALIDATE_INT);
if (!$id || $id < 1) json_response(['error'=>'El disfraz seleccionado no es válido.'], 422);
$pdo = db();
try {
    $pdo->beginTransaction();
    $exists = $pdo->prepare('SELECT id FROM disfraces WHERE id = ? AND eliminado = 0 FOR UPDATE'); $exists->execute([$id]);
    if (!$exists->fetch()) { $pdo->rollBack(); json_response(['error'=>'El disfraz ya no está disponible.'], 404); }
    $alreadyVoted = $pdo->prepare('SELECT id FROM votos WHERE id_usuario = ? LIMIT 1 FOR UPDATE');
    $alreadyVoted->execute([(int)$user['id']]);
    if ($alreadyVoted->fetch()) { $pdo->rollBack(); json_response(['error'=>'Ya emitiste tu único voto. No podés votar por otro disfraz.'], 409); }
    $stmt = $pdo->prepare('INSERT INTO votos (id_usuario, id_disfraz) VALUES (?, ?)');
    $stmt->execute([(int)$user['id'], $id]);
    $update = $pdo->prepare('UPDATE disfraces SET votos = votos + 1 WHERE id = ?'); $update->execute([$id]);
    $count = $pdo->prepare('SELECT votos FROM disfraces WHERE id = ?'); $count->execute([$id]);
    $total = (int)$count->fetchColumn();
    $pdo->commit();
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    if ($e->getCode() === '23000') json_response(['error'=>'Ya emitiste tu único voto. No podés votar por otro disfraz.'], 409);
    throw $e;
}
json_response(['mensaje'=>'Voto registrado.', 'id_disfraz'=>(int)$id, 'votos'=>$total], 201);