<?php

declare(strict_types=1);

function render_page(string $title, string $viewFile, array $vars = []): void
{
    $fullPath = __DIR__ . '/../pages/' . $viewFile;

    if (!file_exists($fullPath)) {
        http_response_code(404);
        echo 'Pagina non trovata';
        return;
    }

    extract($vars, EXTR_OVERWRITE);

    include __DIR__ . '/../templates/header.php';
    include $fullPath;
    include __DIR__ . '/../templates/footer.php';
}
