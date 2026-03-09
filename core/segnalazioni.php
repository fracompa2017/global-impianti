<?php

declare(strict_types=1);

function module_segnalazioni_installed(): bool
{
    static $installed = null;

    if (is_bool($installed)) {
        return $installed;
    }

    try {
        $stmt = db()->prepare(
            'SELECT COUNT(*)
             FROM information_schema.tables
             WHERE table_schema = DATABASE()
               AND table_name = :table_name'
        );
        $stmt->execute(['table_name' => 'segnalazioni']);
        $installed = ((int) $stmt->fetchColumn()) > 0;
        return $installed;
    } catch (Throwable $e) {
        return false;
    }
}

function ensure_segnalazioni_module(): void
{
    if (!module_segnalazioni_installed()) {
        throw new RuntimeException('Modulo Segnalazioni non installato. Importa database/mysql_segnalazioni_module.sql');
    }
}

function db_set_actor(?int $userId, ?string $note = null): void
{
    $pdo = db();
    $pdo->exec('SET @app_user_id = ' . ($userId !== null ? (string) $userId : 'NULL'));
    if ($note !== null) {
        $pdo->exec('SET @stato_nota = ' . $pdo->quote($note));
    }
}

function get_segnalazioni_kpis(): array
{
    if (!module_segnalazioni_installed()) {
        return [
            'aperte' => 0,
            'assegnate' => 0,
            'in_lavorazione' => 0,
            'risolte_oggi' => 0,
            'critiche_aperte' => 0,
            'alte_aperte' => 0,
        ];
    }

    $sql = "
        SELECT
          SUM(CASE WHEN stato = 'aperta' THEN 1 ELSE 0 END) AS aperte,
          SUM(CASE WHEN stato = 'assegnata' THEN 1 ELSE 0 END) AS assegnate,
          SUM(CASE WHEN stato = 'in_lavorazione' THEN 1 ELSE 0 END) AS in_lavorazione,
          SUM(CASE WHEN stato = 'aperta' AND priorita = 'critica' THEN 1 ELSE 0 END) AS critiche_aperte,
          SUM(CASE WHEN stato = 'aperta' AND priorita = 'alta' THEN 1 ELSE 0 END) AS alte_aperte
        FROM segnalazioni
    ";

    $rows = db()->query($sql)->fetch();

    $stmt = db()->prepare(
        "SELECT COUNT(*)
         FROM segnalazione_history
         WHERE stato_nuovo = 'risolta'
           AND DATE(created_at) = CURDATE()"
    );
    $stmt->execute();

    return [
        'aperte' => (int) ($rows['aperte'] ?? 0),
        'assegnate' => (int) ($rows['assegnate'] ?? 0),
        'in_lavorazione' => (int) ($rows['in_lavorazione'] ?? 0),
        'risolte_oggi' => (int) $stmt->fetchColumn(),
        'critiche_aperte' => (int) ($rows['critiche_aperte'] ?? 0),
        'alte_aperte' => (int) ($rows['alte_aperte'] ?? 0),
    ];
}

function get_segnalazioni_list(array $filters = []): array
{
    ensure_segnalazioni_module();

    $sql = "
      SELECT
        s.*,
        c.nome AS cantiere_nome,
        (
          SELECT GROUP_CONCAT(DISTINCT p.full_name ORDER BY p.full_name SEPARATOR ', ')
          FROM interventi i
          INNER JOIN intervento_assegnazioni ia ON ia.intervento_id = i.id
          INNER JOIN profiles p ON p.id = ia.dipendente_id
          WHERE i.segnalazione_id = s.id
        ) AS assegnati
      FROM segnalazioni s
      LEFT JOIN cantieri c ON c.id = s.cantiere_id
      WHERE 1 = 1
    ";

    $params = [];

    if (!empty($filters['stato'])) {
        $sql .= ' AND s.stato = :stato';
        $params['stato'] = $filters['stato'];
    }

    if (!empty($filters['priorita'])) {
        $sql .= ' AND s.priorita = :priorita';
        $params['priorita'] = $filters['priorita'];
    }

    if (!empty($filters['impianto_tipo'])) {
        $sql .= ' AND s.impianto_tipo = :impianto_tipo';
        $params['impianto_tipo'] = $filters['impianto_tipo'];
    }

    if (!empty($filters['dipendente_id'])) {
        $sql .= ' AND EXISTS (
            SELECT 1
            FROM interventi i2
            INNER JOIN intervento_assegnazioni ia2 ON ia2.intervento_id = i2.id
            WHERE i2.segnalazione_id = s.id
              AND ia2.dipendente_id = :dipendente_id
        )';
        $params['dipendente_id'] = (int) $filters['dipendente_id'];
    }

    if (!empty($filters['from'])) {
        $sql .= ' AND DATE(s.created_at) >= :from';
        $params['from'] = $filters['from'];
    }

    if (!empty($filters['to'])) {
        $sql .= ' AND DATE(s.created_at) <= :to';
        $params['to'] = $filters['to'];
    }

    if (!empty($filters['q'])) {
        $sql .= ' AND (
            s.codice LIKE :q
            OR s.titolo LIKE :q
            OR s.cliente LIKE :q
        )';
        $params['q'] = '%' . $filters['q'] . '%';
    }

    $sql .= "
      ORDER BY
        FIELD(s.priorita, 'critica', 'alta', 'media', 'bassa'),
        s.created_at DESC
    ";

    $stmt = db()->prepare($sql);
    $stmt->execute($params);

    return $stmt->fetchAll();
}

function create_segnalazione(array $data, int $createdBy): int
{
    ensure_segnalazioni_module();

    $pdo = db();
    $pdo->beginTransaction();

    try {
        db_set_actor($createdBy, 'Creazione segnalazione');

        $stmt = $pdo->prepare(
            "INSERT INTO segnalazioni
              (titolo, descrizione, tipo, priorita, stato, cliente, indirizzo, cantiere_id, impianto_tipo, created_by, created_at, updated_at)
             VALUES
              (:titolo, :descrizione, :tipo, :priorita, 'aperta', :cliente, :indirizzo, :cantiere_id, :impianto_tipo, :created_by, NOW(), NOW())"
        );

        $stmt->execute([
            'titolo' => $data['titolo'],
            'descrizione' => $data['descrizione'],
            'tipo' => $data['tipo'] ?: 'altro',
            'priorita' => $data['priorita'] ?: 'media',
            'cliente' => $data['cliente'] ?: null,
            'indirizzo' => $data['indirizzo'] ?: null,
            'cantiere_id' => !empty($data['cantiere_id']) ? (int) $data['cantiere_id'] : null,
            'impianto_tipo' => $data['impianto_tipo'] ?: 'altro',
            'created_by' => $createdBy,
        ]);

        $id = (int) $pdo->lastInsertId();

        $code = sprintf('SEG-%s-%04d', date('Y'), $id);
        $upd = $pdo->prepare('UPDATE segnalazioni SET codice = :codice WHERE id = :id');
        $upd->execute([
            'codice' => $code,
            'id' => $id,
        ]);

        if (!empty($data['foto_urls']) && is_array($data['foto_urls'])) {
            $insPhoto = $pdo->prepare(
                'INSERT INTO segnalazione_foto (segnalazione_id, url, caption, created_at)
                 VALUES (:segnalazione_id, :url, :caption, NOW())'
            );

            foreach ($data['foto_urls'] as $idx => $url) {
                $url = trim((string) $url);
                if ($url === '') {
                    continue;
                }

                $caption = null;
                if (!empty($data['foto_captions'][$idx])) {
                    $caption = trim((string) $data['foto_captions'][$idx]);
                }

                $insPhoto->execute([
                    'segnalazione_id' => $id,
                    'url' => $url,
                    'caption' => $caption,
                ]);
            }
        }

        if (($data['priorita'] ?? '') === 'critica') {
            notify_admins(
                'segnalazione_critica',
                '🔴 Segnalazione CRITICA',
                sprintf('%s · %s · %s', $data['titolo'], $data['cliente'] ?: 'Cliente N/D', $data['indirizzo'] ?: 'Indirizzo N/D')
            );
        }

        $pdo->commit();
        return $id;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function get_segnalazione_by_id(int $id): ?array
{
    ensure_segnalazioni_module();

    $stmt = db()->prepare(
        "SELECT s.*, c.nome AS cantiere_nome
         FROM segnalazioni s
         LEFT JOIN cantieri c ON c.id = s.cantiere_id
         WHERE s.id = :id
         LIMIT 1"
    );
    $stmt->execute(['id' => $id]);

    $row = $stmt->fetch();
    return $row ?: null;
}

function get_segnalazione_foto(int $segnalazioneId): array
{
    ensure_segnalazioni_module();
    $stmt = db()->prepare('SELECT * FROM segnalazione_foto WHERE segnalazione_id = :id ORDER BY created_at ASC');
    $stmt->execute(['id' => $segnalazioneId]);
    return $stmt->fetchAll();
}

function get_segnalazione_history(int $segnalazioneId): array
{
    ensure_segnalazioni_module();

    $stmt = db()->prepare(
        'SELECT h.*, p.full_name AS changed_by_name
         FROM segnalazione_history h
         LEFT JOIN profiles p ON p.id = h.changed_by
         WHERE h.segnalazione_id = :id
         ORDER BY h.created_at DESC'
    );
    $stmt->execute(['id' => $segnalazioneId]);
    return $stmt->fetchAll();
}

function get_segnalazione_commenti(int $segnalazioneId): array
{
    ensure_segnalazioni_module();

    $stmt = db()->prepare(
        'SELECT c.*, p.full_name AS autore_nome
         FROM segnalazione_commenti c
         LEFT JOIN profiles p ON p.id = c.autore_id
         WHERE c.segnalazione_id = :id
         ORDER BY c.created_at DESC'
    );
    $stmt->execute(['id' => $segnalazioneId]);
    return $stmt->fetchAll();
}

function add_segnalazione_commento(int $segnalazioneId, int $autoreId, string $testo): void
{
    ensure_segnalazioni_module();

    $testo = trim($testo);
    if ($testo === '') {
        throw new RuntimeException('Il commento non può essere vuoto.');
    }

    $stmt = db()->prepare(
        'INSERT INTO segnalazione_commenti (segnalazione_id, autore_id, testo, created_at)
         VALUES (:segnalazione_id, :autore_id, :testo, NOW())'
    );

    $stmt->execute([
        'segnalazione_id' => $segnalazioneId,
        'autore_id' => $autoreId,
        'testo' => $testo,
    ]);
}

function change_segnalazione_stato(int $segnalazioneId, string $statoNuovo, ?string $nota, int $changedBy): void
{
    ensure_segnalazioni_module();

    $allowed = ['aperta', 'assegnata', 'in_lavorazione', 'risolta', 'chiusa', 'in_attesa'];
    if (!in_array($statoNuovo, $allowed, true)) {
        throw new RuntimeException('Stato non valido.');
    }

    db_set_actor($changedBy, $nota ?? 'Cambio stato');

    $stmt = db()->prepare('UPDATE segnalazioni SET stato = :stato WHERE id = :id');
    $stmt->execute([
        'stato' => $statoNuovo,
        'id' => $segnalazioneId,
    ]);

    if ($stmt->rowCount() < 1) {
        throw new RuntimeException('Segnalazione non trovata o stato invariato.');
    }
}

function get_interventi_by_segnalazione(int $segnalazioneId): array
{
    ensure_segnalazioni_module();

    $stmt = db()->prepare(
        "SELECT
            i.*,
            (
                SELECT GROUP_CONCAT(DISTINCT p.full_name ORDER BY p.full_name SEPARATOR ', ')
                FROM intervento_assegnazioni ia
                INNER JOIN profiles p ON p.id = ia.dipendente_id
                WHERE ia.intervento_id = i.id
            ) AS assegnati,
            (
                SELECT COUNT(*)
                FROM intervento_report ir
                WHERE ir.intervento_id = i.id
            ) AS report_count,
            (
                SELECT COUNT(*)
                FROM intervento_report ir
                WHERE ir.intervento_id = i.id AND ir.esito = 'rimesso_in_guasto'
            ) AS rimesso_count
         FROM interventi i
         WHERE i.segnalazione_id = :id
         ORDER BY i.data_intervento DESC, i.ora_inizio DESC"
    );
    $stmt->execute(['id' => $segnalazioneId]);
    return $stmt->fetchAll();
}

function create_intervento_with_assignments(int $segnalazioneId, array $payload, int $createdBy): int
{
    ensure_segnalazioni_module();

    if (empty($payload['data_intervento'])) {
        throw new RuntimeException('La data intervento è obbligatoria.');
    }

    if (empty($payload['dipendenti']) || !is_array($payload['dipendenti'])) {
        throw new RuntimeException('Seleziona almeno un dipendente.');
    }

    $pdo = db();
    $pdo->beginTransaction();

    try {
        $segnalazione = get_segnalazione_by_id($segnalazioneId);
        if (!$segnalazione) {
            throw new RuntimeException('Segnalazione non trovata.');
        }

        $title = trim((string) ($payload['titolo'] ?? ''));
        if ($title === '') {
            $title = 'Intervento - ' . ($segnalazione['codice'] ?? '');
        }

        $stmt = $pdo->prepare(
            'INSERT INTO interventi
              (segnalazione_id, titolo, data_intervento, ora_inizio, ora_fine, note_pianificazione, created_by, created_at)
             VALUES
              (:segnalazione_id, :titolo, :data_intervento, :ora_inizio, :ora_fine, :note_pianificazione, :created_by, NOW())'
        );

        $stmt->execute([
            'segnalazione_id' => $segnalazioneId,
            'titolo' => $title,
            'data_intervento' => $payload['data_intervento'],
            'ora_inizio' => $payload['ora_inizio'] ?: null,
            'ora_fine' => $payload['ora_fine'] ?: null,
            'note_pianificazione' => $payload['note_pianificazione'] ?: null,
            'created_by' => $createdBy,
        ]);

        $interventoId = (int) $pdo->lastInsertId();

        $assStmt = $pdo->prepare(
            'INSERT INTO intervento_assegnazioni
              (intervento_id, dipendente_id, notifica_inviata, notifica_inviata_at, calendar_aggiunto, created_at)
             VALUES
              (:intervento_id, :dipendente_id, 1, NOW(), 0, NOW())'
        );

        foreach ($payload['dipendenti'] as $dipendenteId) {
            $dipendenteId = (int) $dipendenteId;
            if ($dipendenteId <= 0) {
                continue;
            }

            $assStmt->execute([
                'intervento_id' => $interventoId,
                'dipendente_id' => $dipendenteId,
            ]);

            $msg = sprintf(
                '[%s] - %s · %s ore %s',
                $segnalazione['codice'] ?? 'SEG',
                $segnalazione['titolo'] ?? 'Intervento',
                $payload['data_intervento'],
                $payload['ora_inizio'] ?: '--:--'
            );
            create_notifica($dipendenteId, 'Nuovo intervento assegnato', $msg, 'intervento_assegnato');
        }

        change_segnalazione_stato($segnalazioneId, 'assegnata', 'Assegnazione intervento', $createdBy);

        $pdo->commit();
        return $interventoId;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function create_notifica(int $destinatarioId, string $titolo, string $messaggio, string $tipo): void
{
    $stmt = db()->prepare(
        'INSERT INTO notifiche (destinatario_id, titolo, messaggio, tipo, letta, created_at)
         VALUES (:destinatario_id, :titolo, :messaggio, :tipo, 0, NOW())'
    );

    $stmt->execute([
        'destinatario_id' => $destinatarioId,
        'titolo' => $titolo,
        'messaggio' => $messaggio,
        'tipo' => $tipo,
    ]);
}

function notify_admins(string $tipo, string $titolo, string $messaggio): void
{
    $admins = db()->query("SELECT id FROM profiles WHERE role = 'admin'")->fetchAll();
    foreach ($admins as $admin) {
        create_notifica((int) $admin['id'], $titolo, $messaggio, $tipo);
    }
}

function get_intervento_by_id(int $interventoId): ?array
{
    ensure_segnalazioni_module();

    $stmt = db()->prepare(
        "SELECT
            i.*,
            s.id AS segnalazione_id,
            s.codice,
            s.titolo AS segnalazione_titolo,
            s.descrizione AS segnalazione_descrizione,
            s.priorita,
            s.stato,
            s.indirizzo,
            s.cliente,
            s.impianto_tipo,
            c.nome AS cantiere_nome,
            c.indirizzo AS cantiere_indirizzo
         FROM interventi i
         INNER JOIN segnalazioni s ON s.id = i.segnalazione_id
         LEFT JOIN cantieri c ON c.id = s.cantiere_id
         WHERE i.id = :id
         LIMIT 1"
    );

    $stmt->execute(['id' => $interventoId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function get_intervento_assegnazioni(int $interventoId): array
{
    ensure_segnalazioni_module();

    $stmt = db()->prepare(
        'SELECT ia.*, p.full_name, p.email
         FROM intervento_assegnazioni ia
         INNER JOIN profiles p ON p.id = ia.dipendente_id
         WHERE ia.intervento_id = :id
         ORDER BY p.full_name ASC'
    );
    $stmt->execute(['id' => $interventoId]);
    return $stmt->fetchAll();
}

function is_dipendente_assegnato_intervento(int $interventoId, int $dipendenteId): bool
{
    ensure_segnalazioni_module();

    $stmt = db()->prepare(
        'SELECT COUNT(*)
         FROM intervento_assegnazioni
         WHERE intervento_id = :intervento_id
           AND dipendente_id = :dipendente_id'
    );
    $stmt->execute([
        'intervento_id' => $interventoId,
        'dipendente_id' => $dipendenteId,
    ]);

    return ((int) $stmt->fetchColumn()) > 0;
}

function get_intervento_report(int $interventoId, ?int $dipendenteId = null): ?array
{
    ensure_segnalazioni_module();

    $sql = 'SELECT ir.*, p.full_name AS dipendente_nome
            FROM intervento_report ir
            LEFT JOIN profiles p ON p.id = ir.dipendente_id
            WHERE ir.intervento_id = :intervento_id';
    $params = ['intervento_id' => $interventoId];

    if ($dipendenteId !== null) {
        $sql .= ' AND ir.dipendente_id = :dipendente_id';
        $params['dipendente_id'] = $dipendenteId;
    }

    $sql .= ' ORDER BY ir.created_at DESC LIMIT 1';

    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    $row = $stmt->fetch();
    return $row ?: null;
}

function get_intervento_report_foto(int $reportId): array
{
    ensure_segnalazioni_module();

    $stmt = db()->prepare('SELECT * FROM intervento_foto WHERE report_id = :report_id ORDER BY created_at ASC');
    $stmt->execute(['report_id' => $reportId]);
    return $stmt->fetchAll();
}

function save_intervento_report(int $interventoId, int $dipendenteId, array $payload): int
{
    ensure_segnalazioni_module();

    $intervento = get_intervento_by_id($interventoId);
    if (!$intervento) {
        throw new RuntimeException('Intervento non trovato.');
    }

    if (!is_dipendente_assegnato_intervento($interventoId, $dipendenteId)) {
        throw new RuntimeException('Non sei assegnato a questo intervento.');
    }

    $descrizione = trim((string) ($payload['descrizione_lavori'] ?? ''));
    if ($descrizione === '') {
        throw new RuntimeException('Descrizione lavori obbligatoria.');
    }

    $esito = (string) ($payload['esito'] ?? '');
    $allowedEsiti = ['risolto', 'parzialmente_risolto', 'non_risolto', 'rimesso_in_guasto'];
    if (!in_array($esito, $allowedEsiti, true)) {
        throw new RuntimeException('Esito non valido.');
    }

    if ($esito === 'rimesso_in_guasto' && trim((string) ($payload['motivo_rimessa_guasto'] ?? '')) === '') {
        throw new RuntimeException('Motivazione rimessa in guasto obbligatoria.');
    }

    $existing = get_intervento_report($interventoId, $dipendenteId);
    if ($existing) {
        throw new RuntimeException('Hai già compilato il report per questo intervento.');
    }

    $pdo = db();
    $pdo->beginTransaction();

    try {
        $stmt = $pdo->prepare(
            'INSERT INTO intervento_report
              (intervento_id, dipendente_id, descrizione_lavori, causa_guasto, soluzione_adottata, materiali_utilizzati,
               esito, rimesso_in_guasto, motivo_rimessa_guasto, ore_lavorate,
               prossimo_intervento_necessario, note_prossimo_intervento, firma_cliente, created_at)
             VALUES
              (:intervento_id, :dipendente_id, :descrizione_lavori, :causa_guasto, :soluzione_adottata, :materiali_utilizzati,
               :esito, :rimesso_in_guasto, :motivo_rimessa_guasto, :ore_lavorate,
               :prossimo_intervento_necessario, :note_prossimo_intervento, :firma_cliente, NOW())'
        );

        $stmt->execute([
            'intervento_id' => $interventoId,
            'dipendente_id' => $dipendenteId,
            'descrizione_lavori' => $descrizione,
            'causa_guasto' => trim((string) ($payload['causa_guasto'] ?? '')) ?: null,
            'soluzione_adottata' => trim((string) ($payload['soluzione_adottata'] ?? '')) ?: null,
            'materiali_utilizzati' => trim((string) ($payload['materiali_utilizzati'] ?? '')) ?: null,
            'esito' => $esito,
            'rimesso_in_guasto' => $esito === 'rimesso_in_guasto' ? 1 : 0,
            'motivo_rimessa_guasto' => trim((string) ($payload['motivo_rimessa_guasto'] ?? '')) ?: null,
            'ore_lavorate' => ($payload['ore_lavorate'] ?? '') !== '' ? (float) $payload['ore_lavorate'] : null,
            'prossimo_intervento_necessario' => !empty($payload['prossimo_intervento_necessario']) ? 1 : 0,
            'note_prossimo_intervento' => trim((string) ($payload['note_prossimo_intervento'] ?? '')) ?: null,
            'firma_cliente' => trim((string) ($payload['firma_cliente'] ?? '')) ?: null,
        ]);

        $reportId = (int) $pdo->lastInsertId();

        if (!empty($payload['foto_urls']) && is_array($payload['foto_urls'])) {
            $stmtFoto = $pdo->prepare(
                'INSERT INTO intervento_foto (intervento_id, report_id, url, caption, tipo, created_at)
                 VALUES (:intervento_id, :report_id, :url, :caption, :tipo, NOW())'
            );

            foreach ($payload['foto_urls'] as $idx => $url) {
                $url = trim((string) $url);
                if ($url === '') {
                    continue;
                }

                $tipo = trim((string) ($payload['foto_tipi'][$idx] ?? 'durante'));
                if (!in_array($tipo, ['prima', 'durante', 'dopo'], true)) {
                    $tipo = 'durante';
                }

                $stmtFoto->execute([
                    'intervento_id' => $interventoId,
                    'report_id' => $reportId,
                    'url' => $url,
                    'caption' => trim((string) ($payload['foto_captions'][$idx] ?? '')) ?: null,
                    'tipo' => $tipo,
                ]);
            }
        }

        $dipendente = find_profile_by_id($dipendenteId);
        notify_admins(
            'report_intervento_inviato',
            'Report ricevuto',
            sprintf(
                '%s ha completato %s · Esito: %s',
                $dipendente['full_name'] ?? 'Dipendente',
                $intervento['codice'] ?? 'SEG',
                $esito
            )
        );

        if ($esito === 'rimesso_in_guasto') {
            change_segnalazione_stato(
                (int) $intervento['segnalazione_id'],
                'in_attesa',
                trim((string) ($payload['motivo_rimessa_guasto'] ?? 'Rimessa in guasto')),
                $dipendenteId
            );

            notify_admins(
                'intervento_rimesso_in_guasto',
                '🔄 Rimessa in guasto',
                sprintf(
                    '%s %s — %s',
                    $intervento['codice'] ?? 'SEG',
                    $intervento['segnalazione_titolo'] ?? 'Segnalazione',
                    trim((string) ($payload['motivo_rimessa_guasto'] ?? ''))
                )
            );
        }

        $pdo->commit();
        return $reportId;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function get_dipendente_interventi_grouped(int $dipendenteId): array
{
    ensure_segnalazioni_module();

    $stmt = db()->prepare(
        "SELECT
            i.*,
            s.codice,
            s.titolo AS segnalazione_titolo,
            s.priorita,
            s.stato AS segnalazione_stato,
            s.indirizzo,
            s.cliente,
            c.nome AS cantiere_nome,
            c.indirizzo AS cantiere_indirizzo,
            (
                SELECT COUNT(*)
                FROM intervento_report ir
                WHERE ir.intervento_id = i.id AND ir.dipendente_id = :dipendente_id
            ) AS has_my_report
         FROM interventi i
         INNER JOIN intervento_assegnazioni ia ON ia.intervento_id = i.id
         INNER JOIN segnalazioni s ON s.id = i.segnalazione_id
         LEFT JOIN cantieri c ON c.id = s.cantiere_id
         WHERE ia.dipendente_id = :dipendente_id
         ORDER BY i.data_intervento ASC, i.ora_inizio ASC"
    );
    $stmt->execute(['dipendente_id' => $dipendenteId]);
    $rows = $stmt->fetchAll();

    $today = date('Y-m-d');
    $grouped = [
        'oggi' => [],
        'prossimi' => [],
        'passati' => [],
    ];

    foreach ($rows as $row) {
        $date = (string) $row['data_intervento'];
        if ($date === $today) {
            $grouped['oggi'][] = $row;
        } elseif ($date > $today) {
            $grouped['prossimi'][] = $row;
        } else {
            $grouped['passati'][] = $row;
        }
    }

    return $grouped;
}

function get_interventi_today_for_dipendente(int $dipendenteId): array
{
    ensure_segnalazioni_module();

    $stmt = db()->prepare(
        "SELECT
            i.id,
            i.data_intervento,
            i.ora_inizio,
            i.ora_fine,
            s.codice,
            s.titolo AS segnalazione_titolo,
            s.priorita,
            s.stato,
            COALESCE(s.indirizzo, c.indirizzo, '-') AS location_text
         FROM interventi i
         INNER JOIN intervento_assegnazioni ia ON ia.intervento_id = i.id
         INNER JOIN segnalazioni s ON s.id = i.segnalazione_id
         LEFT JOIN cantieri c ON c.id = s.cantiere_id
         WHERE ia.dipendente_id = :dipendente_id
           AND i.data_intervento = CURDATE()
         ORDER BY FIELD(s.priorita, 'critica', 'alta', 'media', 'bassa'), i.ora_inizio ASC"
    );
    $stmt->execute(['dipendente_id' => $dipendenteId]);
    return $stmt->fetchAll();
}

function get_urgent_segnalazioni_widget(int $limit = 5): array
{
    if (!module_segnalazioni_installed()) {
        return [];
    }

    $stmt = db()->prepare(
        "SELECT s.*
         FROM segnalazioni s
         WHERE s.stato = 'aperta'
           AND s.priorita IN ('critica', 'alta')
         ORDER BY FIELD(s.priorita, 'critica', 'alta'), s.created_at ASC
         LIMIT :lim"
    );
    $stmt->bindValue('lim', $limit, PDO::PARAM_INT);
    $stmt->execute();

    return $stmt->fetchAll();
}

function get_interventi_scadenza_widget(): array
{
    if (!module_segnalazioni_installed()) {
        return [];
    }

    $stmt = db()->query(
        "SELECT
            i.*,
            s.codice,
            s.titolo AS segnalazione_titolo,
            (
                SELECT GROUP_CONCAT(DISTINCT p.full_name ORDER BY p.full_name SEPARATOR ', ')
                FROM intervento_assegnazioni ia
                INNER JOIN profiles p ON p.id = ia.dipendente_id
                WHERE ia.intervento_id = i.id
            ) AS assegnati
         FROM interventi i
         INNER JOIN segnalazioni s ON s.id = i.segnalazione_id
         WHERE i.data_intervento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
         ORDER BY i.data_intervento ASC, i.ora_inizio ASC"
    );

    return $stmt->fetchAll();
}

function get_interventi_oggi_kpi(): array
{
    if (!module_segnalazioni_installed()) {
        return ['interventi_oggi' => 0, 'dipendenti_impegnati' => 0];
    }

    $stmt = db()->query(
        "SELECT
            COUNT(DISTINCT i.id) AS interventi_oggi,
            COUNT(DISTINCT ia.dipendente_id) AS dipendenti_impegnati
         FROM interventi i
         LEFT JOIN intervento_assegnazioni ia ON ia.intervento_id = i.id
         WHERE i.data_intervento = CURDATE()"
    );

    $row = $stmt->fetch() ?: [];

    return [
        'interventi_oggi' => (int) ($row['interventi_oggi'] ?? 0),
        'dipendenti_impegnati' => (int) ($row['dipendenti_impegnati'] ?? 0),
    ];
}

function get_segnalazioni_trend_monthly(int $months = 6): array
{
    if (!module_segnalazioni_installed()) {
        return [];
    }

    $months = max(1, min(24, $months));
    $result = [];

    for ($i = $months - 1; $i >= 0; $i--) {
        $start = date('Y-m-01', strtotime("-{$i} months"));
        $end = date('Y-m-t', strtotime($start));

        $openedStmt = db()->prepare(
            'SELECT COUNT(*) FROM segnalazioni WHERE DATE(created_at) BETWEEN :start AND :end'
        );
        $openedStmt->execute(['start' => $start, 'end' => $end]);

        $resolvedStmt = db()->prepare(
            "SELECT COUNT(*)
             FROM segnalazione_history
             WHERE stato_nuovo = 'risolta'
               AND DATE(created_at) BETWEEN :start AND :end"
        );
        $resolvedStmt->execute(['start' => $start, 'end' => $end]);

        $reopenedStmt = db()->prepare(
            "SELECT COUNT(*)
             FROM intervento_report
             WHERE esito = 'rimesso_in_guasto'
               AND DATE(created_at) BETWEEN :start AND :end"
        );
        $reopenedStmt->execute(['start' => $start, 'end' => $end]);

        $result[] = [
            'month' => date('m/Y', strtotime($start)),
            'aperte' => (int) $openedStmt->fetchColumn(),
            'risolte' => (int) $resolvedStmt->fetchColumn(),
            'rimesse' => (int) $reopenedStmt->fetchColumn(),
        ];
    }

    return $result;
}

function get_interventi_calendar(array $filters = []): array
{
    ensure_segnalazioni_module();

    $sql = "
      SELECT
        i.*,
        s.codice,
        s.titolo AS segnalazione_titolo,
        COALESCE(s.indirizzo, c.indirizzo, '-') AS location_text,
        (
          SELECT GROUP_CONCAT(DISTINCT p.full_name ORDER BY p.full_name SEPARATOR ', ')
          FROM intervento_assegnazioni ia
          INNER JOIN profiles p ON p.id = ia.dipendente_id
          WHERE ia.intervento_id = i.id
        ) AS assegnati
      FROM interventi i
      INNER JOIN segnalazioni s ON s.id = i.segnalazione_id
      LEFT JOIN cantieri c ON c.id = s.cantiere_id
      WHERE 1 = 1
    ";

    $params = [];

    if (!empty($filters['dipendente_id'])) {
        $sql .= ' AND EXISTS (
            SELECT 1 FROM intervento_assegnazioni ia2
            WHERE ia2.intervento_id = i.id
              AND ia2.dipendente_id = :dipendente_id
        )';
        $params['dipendente_id'] = (int) $filters['dipendente_id'];
    }

    if (!empty($filters['from'])) {
        $sql .= ' AND i.data_intervento >= :from';
        $params['from'] = $filters['from'];
    }

    if (!empty($filters['to'])) {
        $sql .= ' AND i.data_intervento <= :to';
        $params['to'] = $filters['to'];
    }

    $sql .= ' ORDER BY i.data_intervento ASC, i.ora_inizio ASC';

    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function get_report_interventi_list(array $filters = []): array
{
    ensure_segnalazioni_module();

    $sql = "
      SELECT
        ir.*,
        i.data_intervento,
        s.codice,
        s.titolo AS segnalazione_titolo,
        p.full_name AS dipendente_nome
      FROM intervento_report ir
      INNER JOIN interventi i ON i.id = ir.intervento_id
      INNER JOIN segnalazioni s ON s.id = i.segnalazione_id
      LEFT JOIN profiles p ON p.id = ir.dipendente_id
      WHERE 1=1
    ";

    $params = [];

    if (!empty($filters['dipendente_id'])) {
        $sql .= ' AND ir.dipendente_id = :dipendente_id';
        $params['dipendente_id'] = (int) $filters['dipendente_id'];
    }

    if (!empty($filters['intervento_id'])) {
        $sql .= ' AND ir.intervento_id = :intervento_id';
        $params['intervento_id'] = (int) $filters['intervento_id'];
    }

    if (!empty($filters['esito'])) {
        $sql .= ' AND ir.esito = :esito';
        $params['esito'] = $filters['esito'];
    }

    if (!empty($filters['from'])) {
        $sql .= ' AND DATE(ir.created_at) >= :from';
        $params['from'] = $filters['from'];
    }

    if (!empty($filters['to'])) {
        $sql .= ' AND DATE(ir.created_at) <= :to';
        $params['to'] = $filters['to'];
    }

    $sql .= ' ORDER BY ir.created_at DESC';

    $stmt = db()->prepare($sql);
    $stmt->execute($params);

    return $stmt->fetchAll();
}

function get_report_interventi_stats(): array
{
    if (!module_segnalazioni_installed()) {
        return [
            'pct_risolti_primo' => 0.0,
            'tempo_medio_ore' => 0.0,
        ];
    }

    $sqlFirst = "
      SELECT
        ROUND(
          100 * SUM(CASE WHEN first_esito = 'risolto' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
          1
        ) AS pct_risolti_primo
      FROM (
        SELECT
          s.id,
          (
            SELECT ir2.esito
            FROM interventi i2
            INNER JOIN intervento_report ir2 ON ir2.intervento_id = i2.id
            WHERE i2.segnalazione_id = s.id
            ORDER BY ir2.created_at ASC
            LIMIT 1
          ) AS first_esito
        FROM segnalazioni s
      ) q
      WHERE q.first_esito IS NOT NULL
    ";

    $pct = (float) (db()->query($sqlFirst)->fetchColumn() ?: 0);

    $sqlAvg = "
      SELECT ROUND(AVG(TIMESTAMPDIFF(HOUR, s.created_at, rr.created_at)), 1)
      FROM segnalazioni s
      INNER JOIN (
        SELECT i.segnalazione_id, MIN(ir.created_at) AS created_at
        FROM interventi i
        INNER JOIN intervento_report ir ON ir.intervento_id = i.id
        WHERE ir.esito = 'risolto'
        GROUP BY i.segnalazione_id
      ) rr ON rr.segnalazione_id = s.id
    ";

    $avg = (float) (db()->query($sqlAvg)->fetchColumn() ?: 0);

    return [
        'pct_risolti_primo' => $pct,
        'tempo_medio_ore' => $avg,
    ];
}

function get_report_by_id(int $reportId): ?array
{
    ensure_segnalazioni_module();

    $stmt = db()->prepare(
        "SELECT
            ir.*,
            i.id AS intervento_id,
            i.data_intervento,
            s.codice,
            s.titolo AS segnalazione_titolo,
            p.full_name AS dipendente_nome
         FROM intervento_report ir
         INNER JOIN interventi i ON i.id = ir.intervento_id
         INNER JOIN segnalazioni s ON s.id = i.segnalazione_id
         LEFT JOIN profiles p ON p.id = ir.dipendente_id
         WHERE ir.id = :id
         LIMIT 1"
    );
    $stmt->execute(['id' => $reportId]);
    $row = $stmt->fetch();
    return $row ?: null;
}
