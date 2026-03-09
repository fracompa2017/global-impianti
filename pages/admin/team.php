<h1>Team</h1>
<p class="muted">Gestione dipendenti e presenze</p>

<section class="grid two-col">
  <div class="card">
    <h2>Nuovo Dipendente</h2>
    <form method="post" class="stack">
      <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="create_employee">

      <label>Nome completo</label>
      <input type="text" name="full_name" required>

      <label>Email</label>
      <input type="email" name="email" required>

      <label>Telefono</label>
      <input type="text" name="phone">

      <button type="submit" class="btn primary">Crea dipendente</button>
    </form>

    <p class="small muted">
      La password temporanea viene mostrata a schermo: poi il dipendente deve cambiarla al primo accesso.
    </p>
  </div>

  <div class="card">
    <h2>Reset Password Dipendente</h2>
    <form method="post" class="stack">
      <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="reset_password">

      <label>Dipendente</label>
      <select name="employee_id" required>
        <option value="">Seleziona...</option>
        <?php foreach ($team as $row): ?>
          <option value="<?= (int) $row['id'] ?>"><?= e($row['full_name'] ?? 'N/D') ?> (<?= e($row['email'] ?? 'N/D') ?>)</option>
        <?php endforeach; ?>
      </select>

      <button type="submit" class="btn">Genera nuova password</button>
    </form>
  </div>
</section>

<div class="card">
  <h2>Dipendenti</h2>
  <table class="table">
    <thead>
      <tr>
        <th>Nome</th>
        <th>Email</th>
        <th>Ruolo cantiere</th>
        <th>Cantiere</th>
        <th>Stato</th>
        <th>Ore mese</th>
        <th>Documenti</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($team as $row): ?>
        <tr>
          <td><?= e($row['full_name'] ?? '') ?></td>
          <td><?= e($row['email'] ?? '') ?></td>
          <td><?= e($row['ruolo_cantiere'] ?? '-') ?></td>
          <td><?= e($row['cantiere_nome'] ?? '-') ?></td>
          <td><span class="chip <?= ($row['stato_oggi'] === 'presente') ? 'ok' : '' ?>"><?= e($row['stato_oggi'] ?? '-') ?></span></td>
          <td><?= e((string) $row['ore_mese']) ?></td>
          <td><?= (int) $row['documenti_count'] ?></td>
        </tr>
      <?php endforeach; ?>
      <?php if (count($team) === 0): ?>
        <tr><td colspan="7" class="muted">Nessun dipendente trovato.</td></tr>
      <?php endif; ?>
    </tbody>
  </table>
</div>
