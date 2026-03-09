<h1>Configurazione Database Mancante</h1>
<p class="muted">L'app è pronta ma il collegamento MySQL/MariaDB non è configurato.</p>

<div class="card">
  <h2>Errore tecnico</h2>
  <pre class="pre"><?= e($dbError) ?></pre>

  <h2>Passi da fare</h2>
  <ol>
    <li>Apri <code>config/config.php</code> e inserisci host, database, utente e password MySQL/MariaDB IONOS.</li>
    <li>Importa <code>database/mysql_schema.sql</code> in phpMyAdmin.</li>
    <li>Ricarica la pagina.</li>
  </ol>
</div>
