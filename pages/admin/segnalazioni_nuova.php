<h1>Nuova Segnalazione</h1>
<p class="muted">Inserisci i dettagli del guasto/intervento richiesto.</p>

<div class="card">
  <form method="post" class="stack">
    <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">

    <label>Titolo</label>
    <input type="text" name="titolo" value="<?= e((string) ($_POST['titolo'] ?? '')) ?>" required>

    <label>Descrizione</label>
    <textarea name="descrizione" rows="5" required><?= e((string) ($_POST['descrizione'] ?? '')) ?></textarea>

    <div class="grid two-col">
      <div>
        <label>Tipo</label>
        <select name="tipo">
          <?php foreach (['guasto', 'malfunzionamento', 'manutenzione', 'emergenza', 'richiesta_intervento', 'altro'] as $tipo): ?>
            <option value="<?= e($tipo) ?>" <?= ((string) ($_POST['tipo'] ?? 'guasto')) === $tipo ? 'selected' : '' ?>><?= e($tipo) ?></option>
          <?php endforeach; ?>
        </select>
      </div>

      <div>
        <label>Tipo impianto</label>
        <select name="impianto_tipo">
          <?php foreach (['elettrico', 'idraulico', 'termico', 'fotovoltaico', 'antincendio', 'altro'] as $tipo): ?>
            <option value="<?= e($tipo) ?>" <?= ((string) ($_POST['impianto_tipo'] ?? 'elettrico')) === $tipo ? 'selected' : '' ?>><?= e($tipo) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
    </div>

    <label>Priorità</label>
    <select name="priorita">
      <option value="bassa" <?= ((string) ($_POST['priorita'] ?? 'media')) === 'bassa' ? 'selected' : '' ?>>Bassa - non blocca operatività</option>
      <option value="media" <?= ((string) ($_POST['priorita'] ?? 'media')) === 'media' ? 'selected' : '' ?>>Media - impatto moderato</option>
      <option value="alta" <?= ((string) ($_POST['priorita'] ?? 'media')) === 'alta' ? 'selected' : '' ?>>Alta - impatto significativo</option>
      <option value="critica" <?= ((string) ($_POST['priorita'] ?? 'media')) === 'critica' ? 'selected' : '' ?>>Critica - emergenza immediata</option>
    </select>

    <div class="grid two-col">
      <div>
        <label>Cliente</label>
        <input type="text" name="cliente" value="<?= e((string) ($_POST['cliente'] ?? '')) ?>">
      </div>
      <div>
        <label>Indirizzo</label>
        <input type="text" name="indirizzo" value="<?= e((string) ($_POST['indirizzo'] ?? '')) ?>">
      </div>
    </div>

    <label>Collega a cantiere esistente (opzionale)</label>
    <select name="cantiere_id">
      <option value="">Nessun cantiere</option>
      <?php foreach ($cantieri as $c): ?>
        <option value="<?= (int) $c['id'] ?>" <?= ((string) ($_POST['cantiere_id'] ?? '')) === (string) $c['id'] ? 'selected' : '' ?>>
          <?= e($c['nome'] ?? '-') ?>
        </option>
      <?php endforeach; ?>
    </select>

    <h3>Foto iniziali (URL o percorso file caricato)</h3>
    <?php for ($i = 0; $i < 3; $i++): ?>
      <div class="grid two-col">
        <input type="text" name="foto_url[]" placeholder="URL foto <?= $i + 1 ?>" value="<?= e((string) ($_POST['foto_url'][$i] ?? '')) ?>">
        <input type="text" name="foto_caption[]" placeholder="Caption foto <?= $i + 1 ?>" value="<?= e((string) ($_POST['foto_caption'][$i] ?? '')) ?>">
      </div>
    <?php endfor; ?>

    <div class="row gap wrap-gap">
      <button class="btn" type="submit" name="action" value="analyze_ai">Analizza con AI</button>
      <button class="btn primary" type="submit" name="action" value="create">Salva Segnalazione</button>
    </div>
  </form>
</div>

<?php if (!empty($aiAnalysis) && is_array($aiAnalysis)): ?>
  <div class="card">
    <h2>Suggerimento AI</h2>
    <p><strong>Priorità suggerita:</strong> <?= e((string) ($aiAnalysis['priorita_suggerita'] ?? '-')) ?></p>
    <p><strong>Tipo guasto probabile:</strong> <?= e((string) ($aiAnalysis['tipo_guasto_probabile'] ?? '-')) ?></p>
    <p><strong>Tempo stimato:</strong> <?= e((string) ($aiAnalysis['tempo_intervento_stimato'] ?? '-')) ?></p>

    <p><strong>Possibili cause</strong></p>
    <ul>
      <?php foreach ((array) ($aiAnalysis['possibili_cause'] ?? []) as $c): ?>
        <li><?= e((string) $c) ?></li>
      <?php endforeach; ?>
    </ul>

    <p><strong>Materiali probabili</strong></p>
    <ul>
      <?php foreach ((array) ($aiAnalysis['materiali_probabilmente_necessari'] ?? []) as $m): ?>
        <li><?= e((string) $m) ?></li>
      <?php endforeach; ?>
    </ul>

    <p><strong>Note tecniche:</strong> <?= e((string) ($aiAnalysis['note_tecniche'] ?? '-')) ?></p>
  </div>
<?php endif; ?>
