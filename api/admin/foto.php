<?php
require_once __DIR__ . '/../../app/api.php';
require_method('POST'); require_csrf(); require_admin();
$id=filter_input(INPUT_GET,'id',FILTER_VALIDATE_INT);
if(!$id||!isset($_FILES['foto'])) json_response(['error'=>'Seleccioná una imagen válida.'],422);
$file=$_FILES['foto'];
if($file['error']!==UPLOAD_ERR_OK||$file['size']>MAX_IMAGE_BYTES) json_response(['error'=>'La imagen supera 5 MB o no se pudo subir.'],422);
$finfo=new finfo(FILEINFO_MIME_TYPE); $mime=$finfo->file($file['tmp_name']);
$extensions=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
if(!isset($extensions[$mime])) json_response(['error'=>'Formato no permitido. Usá JPG, PNG o WebP.'],422);
$bytes=file_get_contents($file['tmp_name']);
$stmt=db()->prepare('UPDATE disfraces SET foto=?, foto_blob=? WHERE id=? AND eliminado=0');
$stmt->bindValue(1,$extensions[$mime]); $stmt->bindValue(2,$bytes,PDO::PARAM_LOB); $stmt->bindValue(3,$id,PDO::PARAM_INT); $stmt->execute();
if(!$stmt->rowCount()){ $q=db()->prepare('SELECT id FROM disfraces WHERE id=? AND eliminado=0'); $q->execute([$id]); if(!$q->fetch()) json_response(['error'=>'Disfraz no encontrado.'],404); }
json_response(['mensaje'=>'Imagen actualizada.']);
