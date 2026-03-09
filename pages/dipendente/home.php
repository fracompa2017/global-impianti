<h1>Home Dipendente</h1>
<p class="muted">Ciao <?= e($user['full_name'] ?? 'Dipendente') ?>, gestisci timbrature e report.</p>

<?php if (!empty($hasUrgente)): ?>
  <div class="alert error">
    🔴 Hai almeno un intervento urgente/critico oggi.
  </div>
<?php endif; ?>

<div class="card mb-12">
  <h2>Interventi di oggi</h2>
  <div class="list">
    <?php foreach ($interventiOggi as $it): ?>
      <article class="list-item vertical bordered">
        <div class="row spread wrap-gap">
          <strong><?= e($it['codice'] ?? '-') ?> — <?= e($it['segnalazione_titolo'] ?? '-') ?></strong>
          <span class="badge-priority priority-<?= e((string) ($it['priorita'] ?? 'media')) ?>"><?= e($it['priorita'] ?? '-') ?></span>
        </div>
        <p class="small muted"><?= e((string) ($it['ora_inizio'] ?? '--:--')) ?> - <?= e((string) ($it['ora_fine'] ?? '--:--')) ?> · <?= e($it['location_text'] ?? '-') ?></p>
        <div class="row gap wrap-gap">
          <a class="btn" href="index.php?page=dipendente/interventi/view&id=<?= (int) $it['id'] ?>">Dettaglio</a>
          <a class="btn primary" href="index.php?page=dipendente/interventi/report&id=<?= (int) $it['id'] ?>">Compila report</a>
        </div>
      </article>
    <?php endforeach; ?>

    <?php if (count($interventiOggi) === 0): ?>
      <p class="muted">Nessun intervento assegnato per oggi.</p>
    <?php endif; ?>
  </div>
</div>

<section class="grid two-col">
  <div class="card">
    <h2>Timbratura</h2>

    <form method="post" class="stack">
      <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">

      <label>Cantiere</label>
      <select name="cantiere_id" required>
        <option value="">Seleziona...</option>
        <?php foreach ($cantieri as $c): ?>
          <option value="<?= (int) $c['id'] ?>"><?= e($c['nome'] ?? '') ?></option>
        <?php endforeach; ?>
      </select>

      <div class="row gap">
        <button type="submit" name="action" value="timbra_entrata" class="btn primary">Entrata</button>
        <button type="submit" name="action" value="timbra_uscita" class="btn">Uscita</button>
      </div>
    </form>

    <?php if (count($cantieri) === 0): ?>
      <p class="small muted">Nessun cantiere assegnato. Contatta l'amministratore.</p>
    <?php endif; ?>
  </div>

  <div class="card">
    <h2>Report giornaliero</h2>

    <form method="post" class="stack">
      <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="invia_report">

      <label>Cantiere</label>
      <select name="cantiere_id" required>
        <option value="">Seleziona...</option>
        <?php foreach ($cantieri as $c): ?>
          <option value="<?= (int) $c['id'] ?>"><?= e($c['nome'] ?? '') ?></option>
        <?php endforeach; ?>
      </select>

      <label>Attivita svolte</label>
      <textarea name="testo" rows="4"></textarea>

      <label>Meteo</label>
      <input type="text" name="meteo">

      <label>Materiali utilizzati</label>
      <input type="text" name="materiali">

      <label>Problemi riscontrati</label>
      <textarea name="problemi" rows="3"></textarea>

      <button type="submit" class="btn primary">Invia report</button>
    </form>
  </div>
</section>

<section class="grid two-col">
  <div class="card">
    <h2>Prossimi turni</h2>
    <table class="table">
      <thead>
        <tr>
          <th>Data</th>
          <th>Cantiere</th>
          <th>Orario</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($turni as $turno): ?>
          <tr>
            <td><?= e((string) $turno['data']) ?></td>
            <td><?= e($turno['cantiere_nome'] ?? '-') ?></td>
            <td><?= e((string) ($turno['ora_inizio'] ?? '--')) ?> - <?= e((string) ($turno['ora_fine'] ?? '--')) ?></td>
          </tr>
        <?php endforeach; ?>
        <?php if (count($turni) === 0): ?>
          <tr><td colspan="3" class="muted">Nessun turno disponibile.</td></tr>
        <?php endif; ?>
      </tbody>
    </table>
  </div>

  <div class="card">
    <h2>Documenti</h2>
    <div class="list">
      <?php foreach ($documenti as $doc): ?>
        <div class="list-item vertical bordered">
          <strong><?= e($doc['nome'] ?? '') ?></strong>
          <p class="small muted">Tipo: <?= e($doc['tipo'] ?? '-') ?> · <?= e((string) ($doc['mese'] ?? '')) ?>/<?= e((string) ($doc['anno'] ?? '')) ?></p>
          <?php if (!empty($doc['url'])): ?>
            <a class="btn" href="<?= e($doc['url']) ?>" target="_blank" rel="noreferrer">Apri documento</a>
          <?php endif; ?>
        </div>
      <?php endforeach; ?>
      <?php if (count($documenti) === 0): ?>
        <p class="muted">Nessun documento disponibile.</p>
      <?php endif; ?>
    </div>
  </div>
</section>
