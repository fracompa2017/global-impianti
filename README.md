# Global Impianti (IONOS Compatible)

Versione riscritta per hosting condiviso IONOS con **PHP + MySQL/MariaDB**.

## Stack usato in questa versione
- PHP 8.x
- MySQL/MariaDB
- PWA base (manifest + service worker)
- Nessuna dipendenza Composer/Node richiesta sul server

## Struttura principale
- `index.php`: router principale
- `config/config.php`: configurazione DB
- `core/`: auth, db, repository, helper
- `pages/`: pagine Admin/Dipendente/Auth
- `templates/`: layout comune
- `database/mysql_schema.sql`: schema completo DB
- `.htaccess`: routing base + directory index

## Deploy su IONOS
1. Carica i file via SFTP nella directory collegata al dominio.
2. In phpMyAdmin importa `database/mysql_schema.sql`.
3. Modifica `config/config.php` inserendo credenziali MySQL/MariaDB.
4. Crea un admin iniziale nella tabella `profiles` con password hashata.
5. Apri il dominio e accedi.

## Creazione admin iniziale
Esempio SQL (sostituisci hash):

```sql
INSERT INTO profiles (full_name, email, role, password_hash)
VALUES ('Admin Global Impianti', 'admin@globalimpiantick.it', 'admin', '$2y$10$...');
```

Per generare hash password in locale:

```bash
php -r "echo password_hash('Password123!', PASSWORD_DEFAULT), PHP_EOL;"
```

## Funzioni incluse
- Login unico Admin/Dipendente
- Redirect per ruolo
- Dashboard Admin con KPI
- Gestione dipendenti (creazione + reset password)
- Gestione cantieri + dettaglio cantiere
- Assegnazioni, milestone, report
- Timbrature e report lato dipendente
- Lista turni/documenti dipendente

## Nota
La versione precedente Next.js/Supabase resta in repository, ma il runtime attivo su IONOS usa ora `index.php`.
