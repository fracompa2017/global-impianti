<h1>Compila Report Intervento</h1>
<p class="muted"><?= e($intervento['codice'] ?? '-') ?> — <?= e($intervento['segnalazione_titolo'] ?? '-') ?></p>

<div class="card">
  <form method="post" class="stack">
    <input type="hidden" name="_csrf" value="<?= e(csrf_token()) ?>">

    <label>Descrizione lavori svolti</label>
    <textarea name="descrizione_lavori" rows="4" required><?= e((string) ($_POST['descrizione_lavori'] ?? '')) ?></textarea>

    <label>Causa del guasto identificata</label>
    <textarea name="causa_guasto" rows="3"><?= e((string) ($_POST['causa_guasto'] ?? '')) ?></textarea>

    <label>Soluzione adottata</label>
    <textarea name="soluzione_adottata" rows="3"><?= e((string) ($_POST['soluzione_adottata'] ?? '')) ?></textarea>

    <label>Materiali utilizzati</label>
    <textarea name="materiali_utilizzati" rows="3"><?= e((string) ($_POST['materiali_utilizzati'] ?? '')) ?></textarea>

    <h3>Foto intervento</h3>
    <?php for ($i = 0; $i < 3; $i++): ?>
      <div class="grid photo-input-grid">
        <input type="text" name="foto_url[]" placeholder="URL foto" value="<?= e((string) ($_POST['foto_url'][$i] ?? '')) ?>">
        <select name="foto_tipo[]">
          <?php foreach (['prima', 'durante', 'dopo'] as $tipo): ?>
            <option value="<?= e($tipo) ?>" <?= ((string) ($_POST['foto_tipo'][$i] ?? 'durante')) === $tipo ? 'selected' : '' ?>><?= e($tipo) ?></option>
          <?php endforeach; ?>
        </select>
        <input type="text" name="foto_caption[]" placeholder="Caption" value="<?= e((string) ($_POST['foto_caption'][$i] ?? '')) ?>">
      </div>
    <?php endfor; ?>

    <label>Ore lavorate</label>
    <input type="number" step="0.25" min="0" name="ore_lavorate" value="<?= e((string) ($_POST['ore_lavorate'] ?? '')) ?>">

    <label>Esito intervento</label>
    <select name="esito" required>
      <option value="risolto" <?= ((string) ($_POST['esito'] ?? 'risolto')) === 'risolto' ? 'selected' : '' ?>>✅ Risolto</option>
      <option value="parzialmente_risolto" <?= ((string) ($_POST['esito'] ?? 'risolto')) === 'parzialmente_risolto' ? 'selected' : '' ?>>⚠️ Parzialmente risolto</option>
      <option value="non_risolto" <?= ((string) ($_POST['esito'] ?? 'risolto')) === 'non_risolto' ? 'selected' : '' ?>>❌ Non risolto</option>
      <option value="rimesso_in_guasto" <?= ((string) ($_POST['esito'] ?? 'risolto')) === 'rimesso_in_guasto' ? 'selected' : '' ?>>🔄 Rimesso in guasto</option>
    </select>

    <label>Motivazione rimessa in guasto (obbligatoria se esito rimesso)</label>
    <textarea name="motivo_rimessa_guasto" rows="3"><?= e((string) ($_POST['motivo_rimessa_guasto'] ?? '')) ?></textarea>

    <label class="checkbox-row">
      <input type="checkbox" name="prossimo_intervento_necessario" value="1" <?= !empty($_POST['prossimo_intervento_necessario']) ? 'checked' : '' ?>>
      <span>Prossimo intervento necessario</span>
    </label>

    <label>Note prossimo intervento</label>
    <textarea name="note_prossimo_intervento" rows="3"><?= e((string) ($_POST['note_prossimo_intervento'] ?? '')) ?></textarea>

    <label>Firma cliente (testo)</label>
    <input type="text" name="firma_cliente" value="<?= e((string) ($_POST['firma_cliente'] ?? '')) ?>">

    <div class="row gap wrap-gap">
      <button class="btn" type="submit" name="action" value="generate_ai">Genera con AI</button>
      <button class="btn primary" type="submit" name="action" value="save_report">Invia Report</button>
    </div>
  </form>
</div>

<?php if (!empty($aiPreview)): ?>
  <div class="card">
    <h2>Preview report AI</h2>
    <pre class="pre"><?= e((string) $aiPreview) ?></pre>
  </div>
<?php endif; ?>
