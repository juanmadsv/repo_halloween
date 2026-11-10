<?php
require_once __DIR__ . '/../../app/api.php';
start_app_session();
json_response(['usuario'=>current_user(), 'csrf'=>$_SESSION['csrf']]);
