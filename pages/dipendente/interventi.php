<h1>I miei interventi</h1>
<p class="muted">Interventi assegnati, con integrazione calendario e compilazione report.</p>

<?php
  $sections = [
    'oggi' => 'Oggi',
    'prossimi' => 'Prossimi',
    'passati' => 'Passati',
  ];
  $today = date('Y-m-d');
?>

<?php foreach ($sections as $key => $label): ?>
  <div class="card mb-12">
    <h2><?= e($label) ?></h2>

    <div class="list">
      <?php foreach (($grouped[$key] ?? []) as $it): ?>
        <?php $googleUrl = build_google_calendar_url($it); ?>
        <article class="list-item vertical bordered">
          <div class="row spread wrap-gap">
            <strong><?= e($it['codice'] ?? '-') ?> — <?= e($it['segnalazione_titolo'] ?? '-') ?></strong>
            <span class="badge-priority priority-<?= e((string) ($it['priorita'] ?? 'media')) ?>"><?= e($it['priorita'] ?? '-') ?></span>
          </div>

          <p class="small muted">
            <?= e((string) ($it['data_intervento'] ?? '-')) ?> · <?= e((string) ($it['ora_inizio'] ?? '--:--')) ?> - <?= e((string) ($it['ora_fine'] ?? '--:--')) ?>
          </p>
          <p class="small muted"><?= e($it['indirizzo'] ?: $it['cantiere_indirizzo'] ?: 'Indirizzo N/D') ?></p>
          <span class="badge-state state-<?= e((string) ($it['segnalazione_stato'] ?? 'aperta')) ?>"><?= e($it['segnalazione_stato'] ?? '-') ?></span>

          <div class="row gap wrap-gap">
            <a class="btn" href="index.php?page=calendar/ics&id=<?= (int) $it['id'] ?>">📅 Apple Calendar / iCal</a>
            <a class="btn" href="<?= e($googleUrl) ?>" target="_blank" rel="noreferrer">📅 Google Calendar</a>
            <a class="btn" href="index.php?page=calendar/ics&id=<?= (int) $it['id'] ?>">📅 Outlook</a>
            <a class="btn" href="index.php?page=dipendente/interventi/view&id=<?= (int) $it['id'] ?>">Dettaglio</a>
            <?php if ((string) $it['data_intervento'] <= $today): ?>
              <a class="btn primary" href="index.php?page=dipendente/interventi/report&id=<?= (int) $it['id'] ?>">
                <?= (int) ($it['has_my_report'] ?? 0) > 0 ? 'Report già compilato' : 'Compila Report' ?>
              </a>
            <?php endif; ?>
          </div>
        </article>
      <?php endforeach; ?>

      <?php if (count($grouped[$key] ?? []) === 0): ?>
        <p class="muted">Nessun intervento in questa sezione.</p>
      <?php endif; ?>
    </div>
  </div>
<?php endforeach; ?>
