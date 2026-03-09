<h1><?= e($segnalazione['codice'] ?? 'SEG') ?> — <?= e($segnalazione['titolo'] ?? '') ?></h1>

<div class="row gap wrap-gap mb-12">
  <span class="badge-priority priority-<?= e((string) ($segnalazione['priorita'] ?? 'media')) ?>"><?= e($segnalazione['priorita'] ?? '-') ?></span>
  <span class="badge-state state-<?= e((string) ($segnalazione['stato'] ?? 'aperta')) ?>"><?= e($segnalazione['stato'] ?? '-') ?></span>
  <span class="chip">Impianto: <?= e($segnalazione['impianto_tipo'] ?? '-') ?></span>
  <a class="btn" href="index.php?page=admin/segnalazioni">Torna all'elenco</a>
</div>

<section class="grid split-main">
  <div class="stack">
    <div class="card" id="pianifica">
      <h2>Informazioni segnalazione</h2>
      <p><?= nl2br(e((string) ($segnalazione['descrizione'] ?? ''))) ?></p>
      <p class="small muted">Cliente: <?= e($segnalazione['cliente'] ?? 'N/D') ?></p>
      <p class="small muted">Indirizzo: <?= e($segnalazione['indirizzo'] ?? $segnalazione['cantiere_indirizzo'] ?? 'N/D') ?></p>
      <p class="small muted">Cantiere: <?= e($segnalazione['cantiere_nome'] ?? '-') ?></p>
    </div>

    <div class="card">
      <h2>Galleria foto iniziali</h2>
      <div class="grid foto-grid">
        <?php foreach ($foto as $img): ?>
          <figure class="photo-card">
            <a href="<?= e($img['url']) ?>" target="_blank" rel="noreferrer">
              <img src="<?= e($img['url']) ?>" alt="Foto segnalazione">
            </a>
            <figcaption class="small muted"><?= e($img['caption'] ?? '') ?></figcaption>
          </figure>
        <?php endforeach; ?>
      </div>
      <?php if (count($foto) === 0): ?><p class="muted">Nessuna foto allegata.</p><?php endif; ?>
    </div>

    <div class="card">
      <h2>Storico stati</h2>
      <div class="timeline">
        <?php foreach ($history as $h): ?>
          <div class="timeline-item">
            <p>
              <strong><?= e($h['stato_precedente'] ?? '-') ?></strong>
              →
              <strong><?= e($h['stato_nuovo'] ?? '-') ?></strong>
            </p>
            <p class="small muted"><?= e((string) ($h['created_at'] ?? '')) ?> · <?= e($h['changed_by_name'] ?? 'Sistema') ?></p>
            <?php if (!empty($h['nota'])): ?><p class="small"><?= e($h['nota']) ?></p><?php endif; ?>
          </div>
        <?php endforeach; ?>
      </div>
      <?php if (count($history) === 0): ?><p class="muted">Nessun cambio stato registrato.</p><?php endif; ?>
    </div>

    <div class="card">
      <h2>Commenti interni</h2>
      <form method="post" class="stack">
        <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
        <input type="hidden" name="action" value="add_commento">
        <textarea name="testo_commento" rows="3" placeholder="Aggiungi nota interna..." required></textarea>
        <button class="btn" type="submit">Aggiungi commento</button>
      </form>

      <div class="list mt-8">
        <?php foreach ($commenti as $c): ?>
          <div class="list-item vertical bordered">
            <p><?= nl2br(e((string) $c['testo'])) ?></p>
            <p class="small muted"><?= e($c['autore_nome'] ?? 'Utente') ?> · <?= e((string) ($c['created_at'] ?? '')) ?></p>
          </div>
        <?php endforeach; ?>
        <?php if (count($commenti) === 0): ?><p class="muted">Nessun commento.</p><?php endif; ?>
      </div>
    </div>
  </div>

  <div class="stack">
    <div class="card">
      <h2>Pianifica intervento</h2>
      <form method="post" class="stack">
        <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
        <input type="hidden" name="action" value="pianifica_intervento">

        <label>Titolo intervento</label>
        <input type="text" name="titolo_intervento" value="<?= e('Intervento ' . ($segnalazione['codice'] ?? '')) ?>">

        <div class="grid two-col">
          <div>
            <label>Data intervento</label>
            <input type="date" name="data_intervento" required>
          </div>
          <div>
            <label>Ora inizio</label>
            <input type="time" name="ora_inizio">
          </div>
        </div>

        <label>Ora fine</label>
        <input type="time" name="ora_fine">

        <label>Note pianificazione</label>
        <textarea name="note_pianificazione" rows="3"></textarea>

        <label>Seleziona dipendenti</label>
        <div class="assign-grid">
          <?php foreach ($dipendenti as $d): ?>
            <label class="checkbox-row">
              <input type="checkbox" name="dipendente_ids[]" value="<?= (int) $d['id'] ?>">
              <span><?= e($d['full_name'] ?? $d['email'] ?? 'Dipendente') ?></span>
            </label>
          <?php endforeach; ?>
        </div>

        <button type="submit" class="btn primary">Assegna e Notifica</button>
      </form>
    </div>

    <div class="card">
      <h2>Interventi pianificati / eseguiti</h2>
      <div class="list">
        <?php foreach ($interventi as $it): ?>
          <div class="list-item vertical bordered">
            <div class="row spread wrap-gap">
              <strong><?= e((string) ($it['data_intervento'] ?? '')) ?> <?= e((string) ($it['ora_inizio'] ?? '')) ?> - <?= e((string) ($it['ora_fine'] ?? '')) ?></strong>
              <span class="chip"><?= (int) ($it['report_count'] ?? 0) > 0 ? 'completato' : 'pianificato' ?></span>
            </div>
            <p class="small muted"><?= e($it['assegnati'] ?? 'Nessun assegnato') ?></p>

            <div class="row gap wrap-gap">
              <?php if ((int) ($it['report_count'] ?? 0) > 0): ?>
                <a class="btn" href="index.php?page=admin/report-interventi&intervento_id=<?= (int) $it['id'] ?>">Vedi Report</a>
              <?php endif; ?>
              <a class="btn" href="index.php?page=calendar/ics&id=<?= (int) $it['id'] ?>">ICS</a>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
      <?php if (count($interventi) === 0): ?><p class="muted">Nessun intervento pianificato.</p><?php endif; ?>
    </div>

    <div class="card">
      <h2>Cambia stato</h2>
      <form method="post" class="stack">
        <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
        <input type="hidden" name="action" value="change_stato">

        <select name="stato_nuovo" required>
          <?php foreach (['aperta', 'assegnata', 'in_lavorazione', 'risolta', 'chiusa', 'in_attesa'] as $st): ?>
            <option value="<?= e($st) ?>" <?= ($segnalazione['stato'] ?? '') === $st ? 'selected' : '' ?>><?= e($st) ?></option>
          <?php endforeach; ?>
        </select>

        <textarea name="nota_stato" rows="3" placeholder="Nota opzionale"></textarea>
        <button class="btn" type="submit">Aggiorna stato</button>
      </form>
    </div>

    <?php if (!empty($rimessaAlert)): ?>
      <div class="card rimessa-alert">
        <h2>🔄 Rimessa in Guasto</h2>
        <p class="small">Motivazione: <?= e((string) $rimessaAlert['motivazione']) ?></p>
        <a class="btn primary" href="#pianifica">Pianifica Nuovo Intervento</a>
      </div>
    <?php endif; ?>
  </div>
</section>
