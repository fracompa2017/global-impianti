<h1>Report Interventi</h1>
<p class="muted">Lista report compilati dai tecnici sul campo.</p>

<section class="grid two-col">
  <article class="card kpi-card">
    <h3>% risolti al primo intervento</h3>
    <p><?= e((string) ($stats['pct_risolti_primo'] ?? 0)) ?>%</p>
  </article>
  <article class="card kpi-card">
    <h3>Tempo medio risoluzione</h3>
    <p><?= e((string) ($stats['tempo_medio_ore'] ?? 0)) ?> ore</p>
  </article>
</section>

<div class="card">
  <form method="get" class="grid filter-grid">
    <input type="hidden" name="page" value="admin/report-interventi">

    <?php if (!empty($_GET['intervento_id'])): ?>
      <input type="hidden" name="intervento_id" value="<?= e((string) $_GET['intervento_id']) ?>">
    <?php endif; ?>

    <div>
      <label>Dipendente</label>
      <select name="dipendente_id">
        <option value="">Tutti</option>
        <?php foreach ($dipendenti as $d): ?>
          <option value="<?= (int) $d['id'] ?>" <?= (string) ($filters['dipendente_id'] ?? '') === (string) $d['id'] ? 'selected' : '' ?>>
            <?= e($d['full_name'] ?? $d['email']) ?>
          </option>
        <?php endforeach; ?>
      </select>
    </div>

    <div>
      <label>Esito</label>
      <select name="esito">
        <option value="">Tutti</option>
        <?php foreach (['risolto', 'parzialmente_risolto', 'non_risolto', 'rimesso_in_guasto'] as $es): ?>
          <option value="<?= e($es) ?>" <?= ($filters['esito'] ?? '') === $es ? 'selected' : '' ?>><?= e($es) ?></option>
        <?php endforeach; ?>
      </select>
    </div>

    <div>
      <label>Da</label>
      <input type="date" name="from" value="<?= e($filters['from'] ?? '') ?>">
    </div>

    <div>
      <label>A</label>
      <input type="date" name="to" value="<?= e($filters['to'] ?? '') ?>">
    </div>

    <div class="row gap align-end">
      <button type="submit" class="btn primary">Filtra</button>
      <a class="btn" href="index.php?page=admin/report-interventi">Reset</a>
    </div>
  </form>
</div>

<div class="card">
  <table class="table">
    <thead>
      <tr>
        <th>Data</th>
        <th>Codice</th>
        <th>Titolo</th>
        <th>Dipendente</th>
        <th>Esito</th>
        <th>Ore</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($rows as $r): ?>
        <tr class="<?= ($r['esito'] ?? '') === 'rimesso_in_guasto' ? 'row-alert' : '' ?>">
          <td><?= e((string) ($r['created_at'] ?? '-')) ?></td>
          <td><?= e($r['codice'] ?? '-') ?></td>
          <td><?= e($r['segnalazione_titolo'] ?? '-') ?></td>
          <td><?= e($r['dipendente_nome'] ?? '-') ?></td>
          <td><?= e($r['esito'] ?? '-') ?></td>
          <td><?= e((string) ($r['ore_lavorate'] ?? '-')) ?></td>
          <td>
            <a class="btn" href="index.php?page=admin/report-interventi/pdf&id=<?= (int) $r['id'] ?>">Export PDF</a>
          </td>
        </tr>
      <?php endforeach; ?>
      <?php if (count($rows) === 0): ?>
        <tr><td colspan="7" class="muted">Nessun report disponibile.</td></tr>
      <?php endif; ?>
    </tbody>
  </table>
</div>
