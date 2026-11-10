<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../app/config.php';
$pdo = db();
$duplicates = $pdo->query(
    'SELECT id_usuario, COUNT(*) AS cantidad, GROUP_CONCAT(id_disfraz ORDER BY id) AS disfraces '
    . 'FROM votos GROUP BY id_usuario HAVING COUNT(*) > 1'
)->fetchAll();

if ($duplicates) {
    fwrite(STDERR, "Hay usuarios con más de un voto. No se modificó la base para conservar esos registros.\n");
    foreach ($duplicates as $row) {
        fwrite(STDERR, "Usuario {$row['id_usuario']}: {$row['cantidad']} votos (disfraces: {$row['disfraces']})\n");
    }
    fwrite(STDERR, "Elegí qué voto conservar y luego volvé a ejecutar este script.\n");
    exit(1);
}

$indexes = $pdo->query('SHOW INDEX FROM votos')->fetchAll();
$byName = [];
foreach ($indexes as $index) {
    if ((int)$index['Non_unique'] === 0 && $index['Key_name'] !== 'PRIMARY') {
        $byName[$index['Key_name']][(int)$index['Seq_in_index']] = $index['Column_name'];
    }
}
foreach ($byName as &$columns) ksort($columns);
unset($columns);

foreach ($byName as $name => $columns) {
    if (array_values($columns) === ['id_usuario']) {
        echo "La base ya permite un solo voto por usuario.\n";
        exit(0);
    }
}

$clauses = [];
foreach ($byName as $name => $columns) {
    if (array_values($columns) === ['id_usuario', 'id_disfraz']) {
        $safeName = str_replace('`', '``', $name);
        $clauses[] = "DROP INDEX `$safeName`";
    }
}
$clauses[] = 'ADD UNIQUE KEY uq_voto_usuario (id_usuario)';
$pdo->exec('ALTER TABLE votos ' . implode(', ', $clauses));
echo "Migración aplicada: cada usuario puede registrar un solo voto total.\n";