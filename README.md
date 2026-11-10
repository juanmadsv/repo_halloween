# Halloween Vote

Aplicación web en PHP + MySQL para publicar disfraces, registrar usuarios y votar. La interfaz toma como referencia visual las pantallas exportadas desde Stitch y usa JavaScript para consumir la API REST.

## Requisitos

- XAMPP con Apache, MySQL/MariaDB y PHP 8.1 o posterior.
- Extensiones PHP `pdo_mysql`, `fileinfo` y `mbstring` habilitadas.

## Instalación en XAMPP

1. Colocá el contenido del repositorio dentro de `C:\xampp\htdocs\halloween-vote\`. `index.html` y las carpetas `api`, `app`, `assets`, `database` y `scripts` deben quedar directamente dentro de esa carpeta.
2. Iniciá Apache y MySQL desde el panel de XAMPP.
3. Abrí `http://localhost/phpmyadmin`, importá `database/schema.sql` y ejecutalo.
4. Revisá `app/config.php`. La configuración inicial usa `root`, contraseña vacía y puerto `3306`, que son los valores usuales de XAMPP.
5. Para cargar los diez disfraces de ejemplo con sus imágenes y descripciones, abrí una terminal en la carpeta del proyecto y ejecutá:

   ```bash
   C:\xampp\php\php.exe database\seed_disfraces.php
   ```

   El script se puede ejecutar más de una vez: actualiza esos diez disfraces sin duplicarlos ni reiniciar sus votos.
6. Creá la cuenta administradora desde una terminal abierta en la carpeta del proyecto:

   ```bash
   php scripts/create_admin.php admin "UnaClaveLargaDeAlMenos12"
   ```

   En Windows también podés ejecutar el PHP de XAMPP con `C:\xampp\php\php.exe scripts\create_admin.php admin "UnaClaveLargaDeAlMenos12"`.

7. Abrí `http://localhost/halloween-vote/`.

El resto de las personas puede crear su cuenta desde “Registrarse”. Las cuentas nuevas siempre tienen rol `usuario`; el rol administrador se asigna desde el script de consola.

## API disponible

| Método | Ruta | Acceso | Acción |
|---|---|---|---|
| GET | `/api/disfraces.php` | Público | Lista disfraces activos, votos y estado de voto del usuario |
| GET | `/api/foto.php?id=ID` | Público | Devuelve la imagen del disfraz |
| POST | `/api/votos.php` | Usuario autenticado | Registra un voto único por usuario y disfraz |
| POST | `/api/auth/registro.php` | Público | Registra una cuenta de usuario |
| POST | `/api/auth/login.php` | Público | Inicia sesión |
| POST | `/api/auth/logout.php` | Usuario autenticado | Cierra sesión |
| GET | `/api/auth/me.php` | Público | Devuelve el usuario actual y token CSRF |
| GET | `/api/admin/disfraces.php` | Admin | Lista todos los disfraces, incluso los eliminados |
| POST | `/api/admin/disfraces.php` | Admin | Crea un disfraz |
| PATCH | `/api/admin/disfraces.php` | Admin | Edita nombre y descripción |
| DELETE | `/api/admin/disfraces.php` | Admin | Marca el disfraz como eliminado |
| POST | `/api/admin/foto.php?id=ID` | Admin | Carga/reemplaza una foto (JPG, PNG o WebP, máximo 5 MB) |

Las solicitudes que modifican datos requieren la cookie de sesión y el encabezado `X-CSRF-Token` que entrega `/api/auth/me.php`. El frontend ya lo agrega automáticamente.

## Notas

- La columna `disfraces.votos` se incrementa dentro de la misma transacción que registra el voto.
- Al tocar cualquier zona de la tarjeta desde el listado se abre la ficha con la imagen completa del disfraz. Cada acción de votar pregunta si se confirma el voto por el nombre del disfraz antes de enviarlo.
- La tabla impide duplicados con una restricción única sobre usuario y disfraz.
- `eliminado` es una baja lógica, por lo que el registro queda en la base para conservar el historial de votos.
- Las fotos se guardan como BLOB en MySQL, en línea con el esquema solicitado. Para un despliegue de producción conviene guardar archivos en almacenamiento de objetos o disco y conservar en MySQL solo la referencia.
- En un servidor publicado, cambiá credenciales, usá HTTPS y restringí el acceso a los archivos de configuración y scripts.

### Actualizar una base ya importada

Si ya habías importado una versión anterior del esquema, ejecutá una sola vez en phpMyAdmin, seleccionando la base `halloween`:

```sql
ALTER TABLE disfraces ADD COLUMN votos INT UNSIGNED NOT NULL DEFAULT 0;
UPDATE disfraces d SET votos = (SELECT COUNT(*) FROM votos v WHERE v.id_disfraz = d.id);
UPDATE disfraces SET foto_blob = '' WHERE foto_blob IS NULL;
ALTER TABLE disfraces MODIFY foto_blob MEDIUMBLOB NOT NULL;
```
