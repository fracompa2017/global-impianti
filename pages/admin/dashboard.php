<h1>Dashboard Admin</h1>
<p class="muted">Panoramica operativa aggiornata</p>

<section class="grid kpi-grid">
  <article class="card kpi-card">
    <h3>Cantieri attivi</h3>
    <p><?= (int) $kpis['cantieri_attivi'] ?></p>
  </article>
  <article class="card kpi-card">
    <h3>Presenti oggi</h3>
    <p><?= (int) $kpis['dipendenti_presenti'] ?></p>
  </article>
  <article class="card kpi-card">
    <h3>Report oggi</h3>
    <p><?= (int) $kpis['report_oggi'] ?></p>
  </article>
  <article class="card kpi-card">
    <h3>Ore mese</h3>
    <p><?= e((string) $kpis['ore_mese']) ?></p>
  </article>
</section>

<section class="grid kpi-grid kpi-segnalazioni mt-12">
  <article class="card kpi-card">
    <h3>Segnalazioni aperte</h3>
    <p><?= (int) ($segnalazioniKpi['aperte'] ?? 0) ?></p>
    <p class="small muted">
      Critiche: <?= (int) ($segnalazioniKpi['critiche_aperte'] ?? 0) ?> · Alte: <?= (int) ($segnalazioniKpi['alte_aperte'] ?? 0) ?>
    </p>
  </article>
  <article class="card kpi-card">
    <h3>Interventi oggi</h3>
    <p><?= (int) ($interventiOggiKpi['interventi_oggi'] ?? 0) ?></p>
    <p class="small muted">Tecnici impegnati: <?= (int) ($interventiOggiKpi['dipendenti_impegnati'] ?? 0) ?></p>
  </article>
  <article class="card kpi-card">
    <h3>Segnalazioni assegnate</h3>
    <p><?= (int) ($segnalazioniKpi['assegnate'] ?? 0) ?></p>
  </article>
  <article class="card kpi-card">
    <h3>In lavorazione</h3>
    <p><?= (int) ($segnalazioniKpi['in_lavorazione'] ?? 0) ?></p>
  </article>
</section>

<section class="grid two-col mt-12">
  <div class="card">
    <h2>Cantieri in corso</h2>
    <div class="list">
      <?php foreach ($cantieriInCorso as $item): ?>
        <div class="list-item">
          <div>
            <a href="index.php?page=admin/cantiere&id=<?= (int) $item['id'] ?>"><strong><?= e($item['nome']) ?></strong></a>
            <p class="muted small">Cliente: <?= e($item['cliente'] ?? 'N/D') ?></p>
          </div>
          <span class="chip"><?= (int) $item['avanzamento'] ?>%</span>
        </div>
      <?php endforeach; ?>

      <?php if (count($cantieriInCorso) === 0): ?>
        <p class="muted">Nessun cantiere in corso.</p>
      <?php endif; ?>
    </div>
  </div>

  <div class="card">
    <h2>Ultimi report</h2>
    <div class="list">
      <?php foreach ($recentReports as $report): ?>
        <div class="list-item vertical">
          <strong><?= e($report['dipendente_nome'] ?? 'Dipendente') ?> - <?= e($report['cantiere_nome'] ?? 'Cantiere') ?></strong>
          <p class="small muted"><?= e((string) $report['data']) ?></p>
          <p><?= e(substr((string) ($report['testo'] ?? ''), 0, 120)) ?></p>
        </div>
      <?php endforeach; ?>

      <?php if (count($recentReports) === 0): ?>
        <p class="muted">Nessun report ricevuto.</p>
      <?php endif; ?>
    </div>
  </div>
</section>

<section class="grid two-col mt-12">
  <div class="card">
    <h2>Segnalazioni urgenti</h2>
    <div class="list">
      <?php foreach ($urgenti as $u): ?>
        <div class="list-item vertical bordered">
          <div class="row spread wrap-gap">
            <strong><?= e($u['codice'] ?? '-') ?> — <?= e($u['titolo'] ?? '-') ?></strong>
            <span class="badge-priority priority-<?= e((string) ($u['priorita'] ?? 'media')) ?>"><?= e($u['priorita'] ?? '-') ?></span>
          </div>
          <p class="small muted"><?= e($u['cliente'] ?? '-') ?> · <?= e($u['indirizzo'] ?? '-') ?></p>
          <a class="btn" href="index.php?page=admin/segnalazioni/view&id=<?= (int) $u['id'] ?>">Assegna rapido</a>
        </div>
      <?php endforeach; ?>
      <?php if (count($urgenti) === 0): ?><p class="muted">Nessuna urgenza aperta.</p><?php endif; ?>
    </div>
  </div>

  <div class="card">
    <h2>Interventi in scadenza (oggi/domani)</h2>
    <div class="list">
      <?php foreach ($interventiScadenza as $it): ?>
        <div class="list-item vertical bordered">
          <strong><?= e((string) $it['data_intervento']) ?> · <?= e((string) ($it['ora_inizio'] ?? '--:--')) ?></strong>
          <p><?= e($it['codice'] ?? '-') ?> — <?= e($it['segnalazione_titolo'] ?? '-') ?></p>
          <p class="small muted"><?= e($it['assegnati'] ?? '-') ?></p>
          <a class="btn" href="index.php?page=admin/segnalazioni/view&id=<?= (int) $it['segnalazione_id'] ?>">Apri segnalazione</a>
        </div>
      <?php endforeach; ?>
      <?php if (count($interventiScadenza) === 0): ?><p class="muted">Nessun intervento in scadenza.</p><?php endif; ?>
    </div>
  </div>
</section>

<div class="card mt-12">
  <h2>Andamento segnalazioni (ultimi mesi)</h2>
  <table class="table">
    <thead>
      <tr>
        <th>Mese</th>
        <th>Aperte</th>
        <th>Risolte</th>
        <th>Rimesse in guasto</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($trendSegnalazioni as $item): ?>
        <tr>
          <td><?= e($item['month']) ?></td>
          <td><?= (int) $item['aperte'] ?></td>
          <td><?= (int) $item['risolte'] ?></td>
          <td><?= (int) $item['rimesse'] ?></td>
        </tr>
      <?php endforeach; ?>
      <?php if (count($trendSegnalazioni) === 0): ?>
        <tr><td colspan="4" class="muted">Dati trend non disponibili.</td></tr>
      <?php endif; ?>
    </tbody>
  </table>
</div>

<div class="card mt-12">
  <h2>Turni prossimi 7 giorni</h2>
  <table class="table">
    <thead>
      <tr>
        <th>Data</th>
        <th>Dipendente</th>
        <th>Cantiere</th>
        <th>Orario</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($turni as $turno): ?>
        <tr>
          <td><?= e((string) $turno['data']) ?></td>
          <td><?= e($turno['dipendente_nome'] ?? '-') ?></td>
          <td><?= e($turno['cantiere_nome'] ?? '-') ?></td>
          <td><?= e((string) ($turno['ora_inizio'] ?? '--')) ?> - <?= e((string) ($turno['ora_fine'] ?? '--')) ?></td>
        </tr>
      <?php endforeach; ?>
      <?php if (count($turni) === 0): ?>
        <tr><td colspan="4" class="muted">Nessun turno pianificato.</td></tr>
      <?php endif; ?>
    </tbody>
  </table>
</div>
