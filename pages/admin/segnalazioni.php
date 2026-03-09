<h1>Segnalazioni e Guasti</h1>
<p class="muted">Gestione completa segnalazioni, priorità e interventi tecnici.</p>

<section class="grid kpi-grid kpi-segnalazioni">
  <article class="card kpi-card">
    <h3>Aperte</h3>
    <p><?= (int) ($kpi['aperte'] ?? 0) ?></p>
  </article>
  <article class="card kpi-card">
    <h3>Assegnate</h3>
    <p><?= (int) ($kpi['assegnate'] ?? 0) ?></p>
  </article>
  <article class="card kpi-card">
    <h3>In lavorazione</h3>
    <p><?= (int) ($kpi['in_lavorazione'] ?? 0) ?></p>
  </article>
  <article class="card kpi-card">
    <h3>Risolte oggi</h3>
    <p><?= (int) ($kpi['risolte_oggi'] ?? 0) ?></p>
  </article>
</section>

<div class="row spread wrap-gap">
  <a class="btn primary" href="index.php?page=admin/segnalazioni/nuova">Nuova Segnalazione</a>
  <a class="btn" href="index.php?page=admin/segnalazioni/calendario">Calendario Interventi</a>
</div>

<div class="card">
  <h2>Filtri</h2>
  <form method="get" class="grid filter-grid">
    <input type="hidden" name="page" value="admin/segnalazioni">

    <div>
      <label>Ricerca</label>
      <input type="text" name="q" value="<?= e($filters['q'] ?? '') ?>" placeholder="Codice, titolo, cliente">
    </div>

    <div>
      <label>Stato</label>
      <select name="stato">
        <option value="">Tutti</option>
        <?php foreach (['aperta', 'assegnata', 'in_lavorazione', 'risolta', 'chiusa', 'in_attesa'] as $st): ?>
          <option value="<?= e($st) ?>" <?= ($filters['stato'] ?? '') === $st ? 'selected' : '' ?>><?= e($st) ?></option>
        <?php endforeach; ?>
      </select>
    </div>

    <div>
      <label>Priorità</label>
      <select name="priorita">
        <option value="">Tutte</option>
        <?php foreach (['bassa', 'media', 'alta', 'critica'] as $pr): ?>
          <option value="<?= e($pr) ?>" <?= ($filters['priorita'] ?? '') === $pr ? 'selected' : '' ?>><?= e($pr) ?></option>
        <?php endforeach; ?>
      </select>
    </div>

    <div>
      <label>Tipo impianto</label>
      <select name="impianto_tipo">
        <option value="">Tutti</option>
        <?php foreach (['elettrico', 'idraulico', 'termico', 'fotovoltaico', 'antincendio', 'altro'] as $tp): ?>
          <option value="<?= e($tp) ?>" <?= ($filters['impianto_tipo'] ?? '') === $tp ? 'selected' : '' ?>><?= e($tp) ?></option>
        <?php endforeach; ?>
      </select>
    </div>

    <div>
      <label>Dipendente assegnato</label>
      <select name="dipendente_id">
        <option value="">Tutti</option>
        <?php foreach ($dipendenti as $d): ?>
          <option value="<?= (int) $d['id'] ?>" <?= (string) ($filters['dipendente_id'] ?? '') === (string) $d['id'] ? 'selected' : '' ?>>
            <?= e($d['full_name'] ?? $d['email'] ?? 'Dipendente') ?>
          </option>
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
      <button class="btn primary" type="submit">Applica</button>
      <a class="btn" href="index.php?page=admin/segnalazioni">Reset</a>
    </div>
  </form>
</div>

<div class="card">
  <h2>Elenco segnalazioni</h2>

  <table class="table">
    <thead>
      <tr>
        <th>Codice</th>
        <th>Titolo</th>
        <th>Cliente</th>
        <th>Impianto</th>
        <th>Priorità</th>
        <th>Stato</th>
        <th>Data</th>
        <th>Assegnati</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($rows as $row): ?>
        <tr>
          <td><?= e($row['codice'] ?? '-') ?></td>
          <td><?= e($row['titolo'] ?? '-') ?></td>
          <td><?= e($row['cliente'] ?? '-') ?></td>
          <td><?= e($row['impianto_tipo'] ?? '-') ?></td>
          <td>
            <span class="badge-priority priority-<?= e((string) ($row['priorita'] ?? 'media')) ?>">
              <?= e($row['priorita'] ?? '-') ?>
            </span>
          </td>
          <td>
            <span class="badge-state state-<?= e((string) ($row['stato'] ?? 'aperta')) ?>">
              <?= e($row['stato'] ?? '-') ?>
            </span>
          </td>
          <td><?= e((string) ($row['created_at'] ?? '-')) ?></td>
          <td><?= e($row['assegnati'] ?? '-') ?></td>
          <td>
            <a class="btn" href="index.php?page=admin/segnalazioni/view&id=<?= (int) $row['id'] ?>">Apri</a>
          </td>
        </tr>
      <?php endforeach; ?>
      <?php if (count($rows) === 0): ?>
        <tr><td colspan="9" class="muted">Nessuna segnalazione trovata.</td></tr>
      <?php endif; ?>
    </tbody>
  </table>
</div>
