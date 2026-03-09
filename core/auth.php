<?php

declare(strict_types=1);

function current_user(): ?array
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }

    return find_profile_by_id((int) $_SESSION['user_id']);
}

function attempt_login(string $email, string $password): bool
{
    $user = find_profile_by_email($email);

    if (!$user) {
        return false;
    }

    if (!password_verify($password, (string) $user['password_hash'])) {
        return false;
    }

    $_SESSION['user_id'] = (int) $user['id'];
    session_regenerate_id(true);

    return true;
}

function logout_user(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}

function require_auth(): array
{
    $user = current_user();
    if (!$user) {
        redirect('auth/login');
    }

    return $user;
}

function require_admin(): array
{
    $user = require_auth();
    if (($user['role'] ?? '') !== 'admin') {
        redirect('dipendente/home');
    }

    return $user;
}

function require_dipendente(): array
{
    $user = require_auth();
    if (($user['role'] ?? '') !== 'dipendente') {
        redirect('admin/dashboard');
    }

    return $user;
}
