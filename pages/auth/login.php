<section class="auth-wrap">
  <div class="card login-card">
    <h1>Accesso</h1>
    <p class="muted">Portale Admin e Dipendente</p>

    <?php if (!empty($loginError)): ?>
      <div class="alert error"><?= e($loginError) ?></div>
    <?php endif; ?>

    <form method="post" class="stack">
      <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">

      <label>Email</label>
      <input type="email" name="email" required>

      <label>Password</label>
      <input type="password" name="password" required>

      <button type="submit" class="btn primary">Accedi</button>
    </form>
  </div>
</section>
