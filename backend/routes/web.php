<?php

use Illuminate\Support\Facades\Route;

Route::get('/storage/{path}', function (string $path) {
    $root = realpath(storage_path('app/public'));
    $full = realpath(storage_path('app/public/'.$path));
    abort_unless($root && $full && str_starts_with($full, $root) && is_file($full), 404);

    return response()->file($full);
})->where('path', '.*');

Route::get('/{any?}', function () {
    $spa = public_path('index.html');
    abort_unless(is_file($spa), 404);

    return response()->file($spa);
})->where('any', '^(?!api).*$');
