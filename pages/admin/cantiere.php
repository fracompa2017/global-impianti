<h1><?= e($cantiere['nome'] ?? 'Cantiere') ?></h1>
<p class="muted">Cliente: <?= e($cantiere['cliente'] ?? 'N/D') ?> · Stato: <?= e($cantiere['stato'] ?? '-') ?></p>

<section class="grid two-col">
  <div class="card">
    <h2>Dipendenti assegnati</h2>

    <form method="post" class="stack inline-form">
      <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="add_assegnazione">

      <select name="dipendente_id" required>
        <option value="">Seleziona dipendente</option>
        <?php foreach ($dipendenti as $dip): ?>
          <option value="<?= (int) $dip['id'] ?>"><?= e($dip['full_name'] ?? $dip['email']) ?></option>
        <?php endforeach; ?>
      </select>
      <input type="text" name="ruolo_cantiere" placeholder="Ruolo cantiere">
      <button type="submit" class="btn primary">Aggiungi</button>
    </form>

    <?php foreach ($assegnazioni as $a): ?>
      <div class="list-item bordered">
        <div>
          <strong><?= e($a['full_name'] ?? $a['email'] ?? 'Dipendente') ?></strong>
          <p class="small muted">Ruolo: <?= e($a['ruolo_cantiere'] ?? 'N/D') ?></p>
        </div>
        <form method="post">
          <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
          <input type="hidden" name="action" value="remove_assegnazione">
          <input type="hidden" name="assegnazione_id" value="<?= (int) $a['id'] ?>">
          <button type="submit" class="btn danger">Rimuovi</button>
        </form>
      </div>
    <?php endforeach; ?>

    <?php if (count($assegnazioni) === 0): ?>
      <p class="muted">Nessun dipendente assegnato.</p>
    <?php endif; ?>
  </div>

  <div class="card">
    <h2>Timeline / Milestone</h2>

    <form method="post" class="stack inline-form">
      <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="add_milestone">
      <input type="text" name="titolo" placeholder="Titolo milestone" required>
      <button type="submit" class="btn primary">Aggiungi</button>
    </form>

    <?php
      $done = 0;
      foreach ($milestones as $m) {
          if ((int) $m['completata'] === 1) {
              $done++;
          }
      }
      $progress = count($milestones) > 0 ? (int) round(($done / count($milestones)) * 100) : 0;
    ?>

    <div class="progress-wrap">
      <div class="progress-bar"><span style="width: <?= $progress ?>%"></span></div>
      <p class="small muted">Avanzamento: <?= $progress ?>%</p>
    </div>

    <?php foreach ($milestones as $m): ?>
      <div class="list-item vertical bordered">
        <strong><?= e($m['titolo'] ?? '') ?></strong>
        <p class="small muted">Data prevista: <?= e((string) ($m['data_prevista'] ?? 'N/D')) ?></p>

        <div class="row gap">
          <form method="post">
            <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
            <input type="hidden" name="action" value="move_milestone">
            <input type="hidden" name="milestone_id" value="<?= (int) $m['id'] ?>">
            <input type="hidden" name="direction" value="up">
            <button type="submit" class="btn">↑</button>
          </form>

          <form method="post">
            <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
            <input type="hidden" name="action" value="move_milestone">
            <input type="hidden" name="milestone_id" value="<?= (int) $m['id'] ?>">
            <input type="hidden" name="direction" value="down">
            <button type="submit" class="btn">↓</button>
          </form>

          <form method="post">
            <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
            <input type="hidden" name="action" value="toggle_milestone">
            <input type="hidden" name="milestone_id" value="<?= (int) $m['id'] ?>">
            <input type="hidden" name="done" value="<?= (int) $m['completata'] === 1 ? '0' : '1' ?>">
            <button type="submit" class="btn <?= (int) $m['completata'] === 1 ? '' : 'primary' ?>">
              <?= (int) $m['completata'] === 1 ? 'Segna aperta' : 'Completata' ?>
            </button>
          </form>
        </div>
      </div>
    <?php endforeach; ?>

    <?php if (count($milestones) === 0): ?>
      <p class="muted">Nessuna milestone inserita.</p>
    <?php endif; ?>
  </div>
</section>

<div class="card">
  <h2>Report giornalieri</h2>
  <table class="table">
    <thead>
      <tr>
        <th>Data</th>
        <th>Dipendente</th>
        <th>Attivita</th>
        <th>Meteo</th>
        <th>Materiali</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($reports as $r): ?>
        <tr>
          <td><?= e((string) $r['data']) ?></td>
          <td><?= e($r['dipendente_nome'] ?? '-') ?></td>
          <td><?= e(substr((string) ($r['testo'] ?? ''), 0, 120)) ?></td>
          <td><?= e($r['meteo'] ?? '-') ?></td>
          <td><?= e($r['materiali_utilizzati'] ?? '-') ?></td>
        </tr>
      <?php endforeach; ?>
      <?php if (count($reports) === 0): ?>
        <tr><td colspan="5" class="muted">Nessun report ricevuto.</td></tr>
      <?php endif; ?>
    </tbody>
  </table>
</div>
