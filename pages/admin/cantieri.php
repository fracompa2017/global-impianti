<h1>Cantieri</h1>
<p class="muted">Gestione cantieri e avanzamento lavori</p>

<div class="filter-row">
  <?php foreach (['tutti', 'pianificato', 'in_corso', 'completato', 'sospeso'] as $item): ?>
    <a class="chip <?= $stato === $item ? 'ok' : '' ?>" href="index.php?page=admin/cantieri&stato=<?= e($item) ?>"><?= e(str_replace('_', ' ', $item)) ?></a>
  <?php endforeach; ?>
</div>

<section class="grid two-col">
  <div class="card">
    <h2>Nuovo Cantiere</h2>
    <form method="post" class="stack">
      <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">
      <input type="hidden" name="action" value="create_cantiere">

      <label>Nome</label>
      <input type="text" name="nome" required>

      <label>Cliente</label>
      <input type="text" name="cliente">

      <label>Indirizzo</label>
      <input type="text" name="indirizzo">

      <label>Stato</label>
      <select name="stato">
        <option value="pianificato">Pianificato</option>
        <option value="in_corso">In corso</option>
        <option value="completato">Completato</option>
        <option value="sospeso">Sospeso</option>
      </select>

      <label>Data inizio</label>
      <input type="date" name="data_inizio">

      <label>Data fine prevista</label>
      <input type="date" name="data_fine_prevista">

      <label>Descrizione</label>
      <textarea name="descrizione" rows="4"></textarea>

      <label>Note</label>
      <textarea name="note" rows="3"></textarea>

      <button type="submit" class="btn primary">Crea cantiere</button>
    </form>
  </div>

  <div class="card">
    <h2>Lista cantieri</h2>

    <?php foreach ($cantieri as $row): ?>
      <article class="list-item vertical bordered">
        <div class="row spread">
          <strong><?= e($row['nome'] ?? '') ?></strong>
          <span class="chip"><?= e((string) ($row['stato'] ?? '')) ?></span>
        </div>
        <p class="small muted">Cliente: <?= e($row['cliente'] ?? 'N/D') ?></p>
        <p class="small muted">Fine prevista: <?= e((string) ($row['data_fine_prevista'] ?? 'N/D')) ?></p>
        <p class="small muted">Dipendenti: <?= (int) ($row['dipendenti_count'] ?? 0) ?> · Avanzamento: <?= (int) ($row['avanzamento'] ?? 0) ?>%</p>
        <a class="btn" href="index.php?page=admin/cantiere&id=<?= (int) $row['id'] ?>">Apri dettaglio</a>
      </article>
    <?php endforeach; ?>

    <?php if (count($cantieri) === 0): ?>
      <p class="muted">Nessun cantiere trovato.</p>
    <?php endif; ?>
  </div>
</section>
