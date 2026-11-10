<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../app/config.php';

$disfraces = [
    ['Vampiro elegante', 'Un clásico de Halloween con capa de terciopelo negro y rojo, chaleco bordado y colmillos. Ideal para una noche llena de misterio.', '01-vampiro.png'],
    ['Bruja del bosque', 'Sombrero de ala ancha, vestido violeta, escoba y pequeños detalles otoñales. Una bruja lista para preparar hechizos entre los árboles.', '02-bruja.png'],
    ['Momia ancestral', 'Vendajes envejecidos de pies a cabeza y una mirada inquietante. Un disfraz clásico que parece haber despertado de una tumba milenaria.', '03-momia.png'],
    ['Esqueleto de gala', 'Traje oscuro con huesos dibujados, moño y una flor naranja en la solapa. Elegante, divertido y preparado para bailar toda la noche.', '04-esqueleto.png'],
    ['Gata hechicera', 'Una hechicera felina con orejas, cola, capa violeta y un amuleto lunar. Su lámpara encantada ilumina el camino en la oscuridad.', '05-gata-magica.png'],
    ['Novia fantasma', 'Vestido de encaje, velo etéreo y un ramo otoñal. Una aparición romántica que vuelve cada Halloween para contar su historia.', '06-novia-fantasma.png'],
    ['Espantapájaros calabaza', 'Cabeza de calabaza iluminada, ropa remendada y hojas secas. El guardián de la cosecha se escapó del campo para sumarse a la fiesta.', '07-espantapajaros-calabaza.png'],
    ['Astronauta lunar', 'Traje espacial blanco con detalles naranjas y un casco preparado para explorar planetas embrujados. Un viajero de otra galaxia.', '08-astronauta.png'],
    ['Payaso gótico', 'Traje a rayas, cuello de volados y maquillaje de arlequín. Una combinación teatral, oscura y colorida para sorprender en Halloween.', '09-payaso-gotico.png'],
    ['Elfo del otoño', 'Vestido de hojas naranjas y verdes, corona de flores y una linterna mágica. El espíritu del bosque llega con los colores del otoño.', '10-elfo-del-bosque.png'],
];

$pdo = db();
$pdo->beginTransaction();
$buscar = $pdo->prepare('SELECT id FROM disfraces WHERE nombre = ? LIMIT 1');
$insertar = $pdo->prepare("INSERT INTO disfraces (nombre, descripcion, votos, foto, foto_blob, eliminado) VALUES (?, ?, 0, 'png', ?, 0)");
$actualizar = $pdo->prepare("UPDATE disfraces SET descripcion = ?, foto = 'png', foto_blob = ?, eliminado = 0 WHERE id = ?");
$insertados = 0;
$actualizados = 0;

try {
    foreach ($disfraces as [$nombre, $descripcion, $archivo]) {
        $ruta = __DIR__ . '/../assets/costumes/' . $archivo;
        if (!is_file($ruta)) {
            throw new RuntimeException("No se encuentra la imagen: $ruta");
        }
        $imagen = file_get_contents($ruta);
        if ($imagen === false) {
            throw new RuntimeException("No se pudo leer la imagen: $ruta");
        }

        $buscar->execute([$nombre]);
        $existente = $buscar->fetchColumn();
        if ($existente) {
            $actualizar->bindValue(1, $descripcion, PDO::PARAM_STR);
            $actualizar->bindValue(2, $imagen, PDO::PARAM_LOB);
            $actualizar->bindValue(3, (int)$existente, PDO::PARAM_INT);
            $actualizar->execute();
            $actualizados++;
        } else {
            $insertar->bindValue(1, $nombre, PDO::PARAM_STR);
            $insertar->bindValue(2, $descripcion, PDO::PARAM_STR);
            $insertar->bindValue(3, $imagen, PDO::PARAM_LOB);
            $insertar->execute();
            $insertados++;
        }
    }
    $pdo->commit();
    echo "Carga terminada: $insertados disfraces nuevos y $actualizados actualizados.\n";
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    fwrite(STDERR, "No se pudo completar la carga: {$error->getMessage()}\n");
    exit(1);
}
