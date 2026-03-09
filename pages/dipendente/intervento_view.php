<h1><?= e($intervento['codice'] ?? '-') ?> — <?= e($intervento['segnalazione_titolo'] ?? '-') ?></h1>
<p class="muted">Dettaglio segnalazione assegnata.</p>

<div class="card">
  <p><strong>Data intervento:</strong> <?= e((string) ($intervento['data_intervento'] ?? '-')) ?> <?= e((string) ($intervento['ora_inizio'] ?? '--:--')) ?> - <?= e((string) ($intervento['ora_fine'] ?? '--:--')) ?></p>
  <p><strong>Priorità:</strong> <span class="badge-priority priority-<?= e((string) ($intervento['priorita'] ?? 'media')) ?>"><?= e($intervento['priorita'] ?? '-') ?></span></p>
  <p><strong>Stato segnalazione:</strong> <span class="badge-state state-<?= e((string) ($intervento['stato'] ?? 'aperta')) ?>"><?= e($intervento['stato'] ?? '-') ?></span></p>
  <p><strong>Cliente:</strong> <?= e($intervento['cliente'] ?? '-') ?></p>
  <p><strong>Indirizzo:</strong> <?= e($intervento['indirizzo'] ?: $intervento['cantiere_indirizzo'] ?: '-') ?></p>
  <p><strong>Descrizione problema:</strong><br><?= nl2br(e((string) ($intervento['segnalazione_descrizione'] ?? ''))) ?></p>
</div>

<div class="card">
  <h2>Foto iniziali</h2>
  <div class="grid foto-grid">
    <?php foreach ($foto as $img): ?>
      <figure class="photo-card">
        <a href="<?= e($img['url']) ?>" target="_blank" rel="noreferrer"><img src="<?= e($img['url']) ?>" alt="Foto"></a>
        <figcaption class="small muted"><?= e($img['caption'] ?? '') ?></figcaption>
      </figure>
    <?php endforeach; ?>
  </div>
  <?php if (count($foto) === 0): ?><p class="muted">Nessuna foto disponibile.</p><?php endif; ?>
</div>

<div class="card">
  <h2>Il mio report</h2>

  <?php if (!$myReport): ?>
    <p class="muted">Non hai ancora compilato il report per questo intervento.</p>
    <a class="btn primary" href="index.php?page=dipendente/interventi/report&id=<?= (int) $intervento['id'] ?>">Compila report</a>
  <?php else: ?>
    <p><strong>Esito:</strong> <?= e($myReport['esito'] ?? '-') ?></p>
    <p><strong>Descrizione lavori:</strong><br><?= nl2br(e((string) ($myReport['descrizione_lavori'] ?? ''))) ?></p>
    <p><strong>Causa guasto:</strong> <?= e($myReport['causa_guasto'] ?? '-') ?></p>
    <p><strong>Soluzione adottata:</strong> <?= e($myReport['soluzione_adottata'] ?? '-') ?></p>
    <p><strong>Materiali utilizzati:</strong> <?= e($myReport['materiali_utilizzati'] ?? '-') ?></p>

    <?php if (($myReport['esito'] ?? '') === 'rimesso_in_guasto'): ?>
      <div class="alert error">
        Rimesso in guasto: <?= e($myReport['motivo_rimessa_guasto'] ?? 'N/D') ?>
      </div>
    <?php endif; ?>

    <h3>Foto report</h3>
    <div class="grid foto-grid">
      <?php foreach ($reportFoto as $img): ?>
        <figure class="photo-card">
          <a href="<?= e($img['url']) ?>" target="_blank" rel="noreferrer"><img src="<?= e($img['url']) ?>" alt="Foto report"></a>
          <figcaption class="small muted">[<?= e($img['tipo'] ?? 'durante') ?>] <?= e($img['caption'] ?? '') ?></figcaption>
        </figure>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>
