<?php

declare(strict_types=1);

$currentUser = current_user();
$appName = (string) ($GLOBALS['app_config']['app_name'] ?? 'Global Impianti');
?>
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title><?= e($title ?? $appName) ?> - <?= e($appName) ?></title>
  <meta name="theme-color" content="#0e7490">
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="icon" href="assets/icon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="assets/app.css">
</head>
<body>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand">
        <span class="brand-dot"></span>
        <span><?= e($appName) ?></span>
      </div>

      <?php if ($currentUser): ?>
        <nav class="topnav">
          <?php if (($currentUser['role'] ?? '') === 'admin'): ?>
            <a href="index.php?page=admin/dashboard">Dashboard</a>
            <a href="index.php?page=admin/team">Team</a>
            <a href="index.php?page=admin/cantieri">Cantieri</a>
            <a href="index.php?page=admin/segnalazioni">Segnalazioni</a>
            <a href="index.php?page=admin/report-interventi">Report Interventi</a>
          <?php else: ?>
            <a href="index.php?page=dipendente/home">Home</a>
            <a href="index.php?page=dipendente/interventi">Interventi</a>
          <?php endif; ?>
          <a href="index.php?page=auth/logout">Logout</a>
        </nav>
      <?php endif; ?>
    </header>

    <main class="container">
      <?php if ($message = flash_get('success')): ?>
        <div class="alert success"><?= e($message) ?></div>
      <?php endif; ?>

      <?php if ($message = flash_get('error')): ?>
        <div class="alert error"><?= e($message) ?></div>
      <?php endif; ?>
