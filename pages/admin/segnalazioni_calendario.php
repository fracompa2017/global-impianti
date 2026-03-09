<h1>Calendario Interventi</h1>
<p class="muted">Vista <?= e($vista) ?> degli interventi pianificati.</p>

<div class="card">
  <form method="get" class="grid filter-grid">
    <input type="hidden" name="page" value="admin/segnalazioni/calendario">

    <div>
      <label>Vista</label>
      <select name="vista">
        <option value="mese" <?= $vista === 'mese' ? 'selected' : '' ?>>Mese</option>
        <option value="settimana" <?= $vista === 'settimana' ? 'selected' : '' ?>>Settimana</option>
        <option value="giorno" <?= $vista === 'giorno' ? 'selected' : '' ?>>Giorno</option>
      </select>
    </div>

    <div>
      <label>Dipendente</label>
      <select name="dipendente_id">
        <option value="">Tutti</option>
        <?php foreach ($dipendenti as $d): ?>
          <option value="<?= (int) $d['id'] ?>" <?= (string) $dipendenteId === (string) $d['id'] ? 'selected' : '' ?>>
            <?= e($d['full_name'] ?? $d['email']) ?>
          </option>
        <?php endforeach; ?>
      </select>
    </div>

    <div>
      <label>Da</label>
      <input type="date" name="from" value="<?= e($from) ?>">
    </div>

    <div>
      <label>A</label>
      <input type="date" name="to" value="<?= e($to) ?>">
    </div>

    <div class="row gap align-end">
      <button type="submit" class="btn primary">Aggiorna</button>
      <a class="btn" href="index.php?page=admin/segnalazioni/calendario">Reset</a>
    </div>
  </form>
</div>

<div class="card">
  <h2>Eventi</h2>

  <?php
    $grouped = [];
    foreach ($events as $ev) {
        $key = (string) $ev['data_intervento'];
        if (!isset($grouped[$key])) {
            $grouped[$key] = [];
        }
        $grouped[$key][] = $ev;
    }
  ?>

  <?php foreach ($grouped as $day => $items): ?>
    <h3 class="calendar-day"><?= e($day) ?></h3>
    <div class="list mb-12">
      <?php foreach ($items as $it): ?>
        <div class="list-item vertical bordered">
          <div class="row spread wrap-gap">
            <strong><?= e($it['codice'] ?? '-') ?> — <?= e($it['segnalazione_titolo'] ?? '-') ?></strong>
            <span class="chip"><?= e((string) ($it['ora_inizio'] ?? '--:--')) ?> - <?= e((string) ($it['ora_fine'] ?? '--:--')) ?></span>
          </div>
          <p class="small muted"><?= e($it['location_text'] ?? '-') ?></p>
          <p class="small muted">Assegnati: <?= e($it['assegnati'] ?? '-') ?></p>
          <a class="btn" href="index.php?page=admin/segnalazioni/view&id=<?= (int) $it['segnalazione_id'] ?>">Apri segnalazione</a>
        </div>
      <?php endforeach; ?>
    </div>
  <?php endforeach; ?>

  <?php if (count($events) === 0): ?>
    <p class="muted">Nessun evento nel range selezionato.</p>
  <?php endif; ?>
</div>
