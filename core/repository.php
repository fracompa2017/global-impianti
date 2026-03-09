<?php

declare(strict_types=1);

function find_profile_by_email(string $email): ?array
{
    $stmt = db()->prepare('SELECT * FROM profiles WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => $email]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function find_profile_by_id(int $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM profiles WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function get_dashboard_kpis(): array
{
    $pdo = db();

    $cantieriAttivi = (int) $pdo->query("SELECT COUNT(*) FROM cantieri WHERE stato = 'in_corso'")->fetchColumn();

    $stmt = $pdo->prepare("SELECT COUNT(DISTINCT dipendente_id) FROM timbrature WHERE data = CURDATE() AND ora_entrata IS NOT NULL");
    $stmt->execute();
    $presenti = (int) $stmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM report_giornalieri WHERE data = CURDATE()");
    $stmt->execute();
    $reportOggi = (int) $stmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT COALESCE(SUM(ore_totali), 0) FROM timbrature WHERE YEAR(data) = YEAR(CURDATE()) AND MONTH(data) = MONTH(CURDATE())");
    $stmt->execute();
    $oreMese = (float) $stmt->fetchColumn();

    return [
        'cantieri_attivi' => $cantieriAttivi,
        'dipendenti_presenti' => $presenti,
        'report_oggi' => $reportOggi,
        'ore_mese' => round($oreMese, 1),
    ];
}

function get_cantieri_list(?string $stato = null): array
{
    $pdo = db();
    $sql = "
        SELECT
            c.*,
            COUNT(DISTINCT ca.id) AS dipendenti_count,
            COALESCE(ROUND(SUM(CASE WHEN m.completata = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(m.id), 0) * 100), 0) AS avanzamento
        FROM cantieri c
        LEFT JOIN cantiere_assegnazioni ca ON ca.cantiere_id = c.id
        LEFT JOIN milestones m ON m.cantiere_id = c.id
    ";

    $params = [];
    if ($stato && $stato !== 'tutti') {
        $sql .= ' WHERE c.stato = :stato ';
        $params['stato'] = $stato;
    }

    $sql .= ' GROUP BY c.id ORDER BY c.created_at DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function get_recent_reports(int $limit = 10): array
{
    $stmt = db()->prepare(
        'SELECT r.*, p.full_name AS dipendente_nome, c.nome AS cantiere_nome
         FROM report_giornalieri r
         LEFT JOIN profiles p ON p.id = r.dipendente_id
         LEFT JOIN cantieri c ON c.id = r.cantiere_id
         ORDER BY r.created_at DESC
         LIMIT :limit'
    );
    $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
}

function get_turni_settimana(): array
{
    $stmt = db()->query(
        'SELECT t.*, p.full_name AS dipendente_nome, c.nome AS cantiere_nome
         FROM turni t
         LEFT JOIN profiles p ON p.id = t.dipendente_id
         LEFT JOIN cantieri c ON c.id = t.cantiere_id
         WHERE t.data BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
         ORDER BY t.data ASC, t.ora_inizio ASC'
    );

    return $stmt->fetchAll();
}

function get_team_rows(): array
{
    $sql = "
        SELECT
            p.id,
            p.full_name,
            p.email,
            p.phone,
            COALESCE(ca.ruolo_cantiere, 'Non assegnato') AS ruolo_cantiere,
            COALESCE(c.nome, '-') AS cantiere_nome,
            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM timbrature t
                    WHERE t.dipendente_id = p.id
                      AND t.data = CURDATE()
                      AND t.ora_entrata IS NOT NULL
                ) THEN 'presente'
                ELSE 'assente'
            END AS stato_oggi,
            COALESCE((
                SELECT ROUND(SUM(t2.ore_totali), 1)
                FROM timbrature t2
                WHERE t2.dipendente_id = p.id
                  AND YEAR(t2.data) = YEAR(CURDATE())
                  AND MONTH(t2.data) = MONTH(CURDATE())
            ), 0) AS ore_mese,
            (
                SELECT COUNT(*)
                FROM documenti d
                WHERE d.dipendente_id = p.id
            ) AS documenti_count
        FROM profiles p
        LEFT JOIN cantiere_assegnazioni ca ON ca.dipendente_id = p.id
        LEFT JOIN cantieri c ON c.id = ca.cantiere_id
        WHERE p.role = 'dipendente'
        ORDER BY p.full_name ASC
    ";

    return db()->query($sql)->fetchAll();
}

function get_dipendenti_options(): array
{
    $stmt = db()->query("SELECT id, full_name, email FROM profiles WHERE role = 'dipendente' ORDER BY full_name ASC");
    return $stmt->fetchAll();
}

function create_employee(array $data): array
{
    $password = random_password(10);
    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = db()->prepare(
        'INSERT INTO profiles (full_name, email, phone, role, password_hash, created_at)
         VALUES (:full_name, :email, :phone, :role, :password_hash, NOW())'
    );

    $stmt->execute([
        'full_name' => $data['full_name'],
        'email' => $data['email'],
        'phone' => $data['phone'] ?: null,
        'role' => 'dipendente',
        'password_hash' => $hash,
    ]);

    return ['password' => $password, 'id' => (int) db()->lastInsertId()];
}

function reset_employee_password(int $employeeId): string
{
    $password = random_password(10);
    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = db()->prepare('UPDATE profiles SET password_hash = :hash WHERE id = :id AND role = :role');
    $stmt->execute([
        'hash' => $hash,
        'id' => $employeeId,
        'role' => 'dipendente',
    ]);

    if ($stmt->rowCount() < 1) {
        throw new RuntimeException('Dipendente non trovato');
    }

    return $password;
}

function create_cantiere(array $data, int $adminId): void
{
    $stmt = db()->prepare(
        'INSERT INTO cantieri (nome, cliente, indirizzo, descrizione, stato, data_inizio, data_fine_prevista, note, created_by, created_at)
         VALUES (:nome, :cliente, :indirizzo, :descrizione, :stato, :data_inizio, :data_fine_prevista, :note, :created_by, NOW())'
    );

    $stmt->execute([
        'nome' => $data['nome'],
        'cliente' => $data['cliente'] ?: null,
        'indirizzo' => $data['indirizzo'] ?: null,
        'descrizione' => $data['descrizione'] ?: null,
        'stato' => $data['stato'] ?: 'pianificato',
        'data_inizio' => $data['data_inizio'] ?: null,
        'data_fine_prevista' => $data['data_fine_prevista'] ?: null,
        'note' => $data['note'] ?: null,
        'created_by' => $adminId,
    ]);
}

function get_cantiere_by_id(int $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM cantieri WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function get_cantiere_assegnazioni(int $cantiereId): array
{
    $stmt = db()->prepare(
        'SELECT ca.*, p.full_name, p.email
         FROM cantiere_assegnazioni ca
         INNER JOIN profiles p ON p.id = ca.dipendente_id
         WHERE ca.cantiere_id = :cantiere_id
         ORDER BY ca.created_at DESC'
    );
    $stmt->execute(['cantiere_id' => $cantiereId]);
    return $stmt->fetchAll();
}

function add_assegnazione(int $cantiereId, int $dipendenteId, string $ruolo): void
{
    $stmt = db()->prepare(
        'INSERT IGNORE INTO cantiere_assegnazioni (cantiere_id, dipendente_id, data_inizio, ruolo_cantiere, created_at)
         VALUES (:cantiere_id, :dipendente_id, CURDATE(), :ruolo, NOW())'
    );
    $stmt->execute([
        'cantiere_id' => $cantiereId,
        'dipendente_id' => $dipendenteId,
        'ruolo' => $ruolo ?: null,
    ]);
}

function remove_assegnazione(int $id): void
{
    $stmt = db()->prepare('DELETE FROM cantiere_assegnazioni WHERE id = :id');
    $stmt->execute(['id' => $id]);
}

function get_milestones(int $cantiereId): array
{
    $stmt = db()->prepare('SELECT * FROM milestones WHERE cantiere_id = :id ORDER BY ordine ASC, created_at ASC');
    $stmt->execute(['id' => $cantiereId]);
    return $stmt->fetchAll();
}

function add_milestone(int $cantiereId, string $titolo): void
{
    $stmt = db()->prepare('SELECT COALESCE(MAX(ordine), 0) + 1 AS next_ordine FROM milestones WHERE cantiere_id = :id');
    $stmt->execute(['id' => $cantiereId]);
    $next = (int) ($stmt->fetchColumn() ?: 1);

    $ins = db()->prepare(
        'INSERT INTO milestones (cantiere_id, titolo, completata, percentuale_avanzamento, ordine, created_at)
         VALUES (:cantiere_id, :titolo, 0, 0, :ordine, NOW())'
    );
    $ins->execute([
        'cantiere_id' => $cantiereId,
        'titolo' => $titolo,
        'ordine' => $next,
    ]);
}

function toggle_milestone(int $id, bool $done): void
{
    $stmt = db()->prepare(
        'UPDATE milestones
         SET completata = :done,
             percentuale_avanzamento = :progress,
             data_completamento = :completed_at
         WHERE id = :id'
    );

    $stmt->execute([
        'done' => $done ? 1 : 0,
        'progress' => $done ? 100 : 0,
        'completed_at' => $done ? date('Y-m-d') : null,
        'id' => $id,
    ]);
}

function move_milestone(int $cantiereId, int $milestoneId, string $direction): void
{
    $items = get_milestones($cantiereId);
    $currentIndex = null;

    foreach ($items as $index => $item) {
        if ((int) $item['id'] === $milestoneId) {
            $currentIndex = $index;
            break;
        }
    }

    if ($currentIndex === null) {
        return;
    }

    $targetIndex = $direction === 'up' ? $currentIndex - 1 : $currentIndex + 1;
    if ($targetIndex < 0 || $targetIndex >= count($items)) {
        return;
    }

    $tmp = $items[$currentIndex];
    $items[$currentIndex] = $items[$targetIndex];
    $items[$targetIndex] = $tmp;

    $pdo = db();
    $pdo->beginTransaction();
    try {
        foreach ($items as $idx => $item) {
            $stmt = $pdo->prepare('UPDATE milestones SET ordine = :ordine WHERE id = :id');
            $stmt->execute([
                'ordine' => $idx + 1,
                'id' => $item['id'],
            ]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function get_cantiere_reports(int $cantiereId): array
{
    $stmt = db()->prepare(
        'SELECT r.*, p.full_name AS dipendente_nome
         FROM report_giornalieri r
         LEFT JOIN profiles p ON p.id = r.dipendente_id
         WHERE r.cantiere_id = :id
         ORDER BY r.data DESC, r.created_at DESC'
    );
    $stmt->execute(['id' => $cantiereId]);
    return $stmt->fetchAll();
}

function get_dipendente_assigned_cantieri(int $dipendenteId): array
{
    $stmt = db()->prepare(
        'SELECT c.id, c.nome
         FROM cantiere_assegnazioni ca
         INNER JOIN cantieri c ON c.id = ca.cantiere_id
         WHERE ca.dipendente_id = :id
         ORDER BY c.nome ASC'
    );
    $stmt->execute(['id' => $dipendenteId]);
    return $stmt->fetchAll();
}

function timbra_entrata(int $dipendenteId, int $cantiereId): void
{
    $check = db()->prepare(
        'SELECT id
         FROM timbrature
         WHERE dipendente_id = :dipendente_id
           AND data = CURDATE()
           AND ora_uscita IS NULL
         LIMIT 1'
    );
    $check->execute(['dipendente_id' => $dipendenteId]);
    if ($check->fetch()) {
        return;
    }

    $stmt = db()->prepare(
        'INSERT INTO timbrature (dipendente_id, cantiere_id, data, ora_entrata, created_at)
         VALUES (:dipendente_id, :cantiere_id, CURDATE(), NOW(), NOW())'
    );
    $stmt->execute([
        'dipendente_id' => $dipendenteId,
        'cantiere_id' => $cantiereId,
    ]);
}

function timbra_uscita(int $dipendenteId): void
{
    $stmt = db()->prepare(
        'UPDATE timbrature
         SET ora_uscita = NOW()
         WHERE dipendente_id = :dipendente_id
           AND data = CURDATE()
           AND ora_uscita IS NULL
         ORDER BY created_at DESC
         LIMIT 1'
    );
    $stmt->execute(['dipendente_id' => $dipendenteId]);
}

function crea_report(array $data): void
{
    $stmt = db()->prepare(
        'INSERT INTO report_giornalieri
            (dipendente_id, cantiere_id, data, testo, meteo, materiali_utilizzati, problemi_riscontrati, created_at)
         VALUES
            (:dipendente_id, :cantiere_id, CURDATE(), :testo, :meteo, :materiali, :problemi, NOW())'
    );

    $stmt->execute([
        'dipendente_id' => $data['dipendente_id'],
        'cantiere_id' => $data['cantiere_id'],
        'testo' => $data['testo'],
        'meteo' => $data['meteo'] ?: null,
        'materiali' => $data['materiali'] ?: null,
        'problemi' => $data['problemi'] ?: null,
    ]);
}

function get_dipendente_turni(int $dipendenteId): array
{
    $stmt = db()->prepare(
        'SELECT t.*, c.nome AS cantiere_nome
         FROM turni t
         LEFT JOIN cantieri c ON c.id = t.cantiere_id
         WHERE t.dipendente_id = :id
         ORDER BY t.data ASC, t.ora_inizio ASC
         LIMIT 20'
    );
    $stmt->execute(['id' => $dipendenteId]);
    return $stmt->fetchAll();
}

function get_dipendente_documenti(int $dipendenteId): array
{
    $stmt = db()->prepare(
        'SELECT * FROM documenti
         WHERE dipendente_id = :id
         ORDER BY created_at DESC
         LIMIT 20'
    );
    $stmt->execute(['id' => $dipendenteId]);
    return $stmt->fetchAll();
}
