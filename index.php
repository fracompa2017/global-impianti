<?php

declare(strict_types=1);

session_start();

$appConfig = require __DIR__ . '/config/config.php';
$GLOBALS['app_config'] = $appConfig;

date_default_timezone_set((string) ($appConfig['timezone'] ?? 'Europe/Rome'));

require __DIR__ . '/core/helpers.php';
require __DIR__ . '/core/db.php';
require __DIR__ . '/core/repository.php';
require __DIR__ . '/core/segnalazioni.php';
require __DIR__ . '/core/calendar.php';
require __DIR__ . '/core/ai.php';
require __DIR__ . '/core/auth.php';
require __DIR__ . '/core/view.php';

$page = (string) ($_GET['page'] ?? '');
$page = trim($page, '/');

if ($page === '') {
    $user = current_user();
    if (!$user) {
        redirect('auth/login');
    }

    if (($user['role'] ?? '') === 'admin') {
        redirect('admin/dashboard');
    }

    redirect('dipendente/home');
}

if ($page === 'auth/logout') {
    logout_user();
    session_start();
    flash_set('success', 'Logout eseguito.');
    redirect('auth/login');
}

$dbError = null;
try {
    db();
} catch (Throwable $e) {
    $dbError = $e->getMessage();
}

if ($dbError !== null) {
    $title = 'Configurazione database';
    render_page($title, 'system/db-error.php', [
        'title' => $title,
        'dbError' => $dbError,
    ]);
    exit;
}

$loginError = null;

if ($page === 'auth/login') {
    if (is_post()) {
        if (!csrf_check($_POST['_csrf'] ?? null)) {
            $loginError = 'Token CSRF non valido. Riprova.';
        } else {
            $email = trim((string) ($_POST['email'] ?? ''));
            $password = (string) ($_POST['password'] ?? '');

            if ($email === '' || $password === '') {
                $loginError = 'Inserisci email e password.';
            } elseif (attempt_login($email, $password)) {
                $user = current_user();
                if (($user['role'] ?? '') === 'admin') {
                    redirect('admin/dashboard');
                }

                redirect('dipendente/home');
            } else {
                $loginError = 'Credenziali non valide.';
            }
        }
    }

    render_page('Login', 'auth/login.php', [
        'title' => 'Login',
        'loginError' => $loginError,
    ]);
    exit;
}

switch ($page) {
    case 'calendar/ics': {
        $user = require_auth();
        $interventoId = (int) ($_GET['id'] ?? 0);

        if ($interventoId <= 0) {
            http_response_code(400);
            echo 'Intervento non valido';
            exit;
        }

        try {
            $intervento = get_intervento_by_id($interventoId);
            if (!$intervento) {
                http_response_code(404);
                echo 'Intervento non trovato';
                exit;
            }

            if (($user['role'] ?? '') !== 'admin' && !is_dipendente_assegnato_intervento($interventoId, (int) $user['id'])) {
                http_response_code(403);
                echo 'Non autorizzato';
                exit;
            }

            $ics = generate_ics_file($intervento);
            $filename = 'intervento-' . ($intervento['codice'] ?? $intervento['id']) . '.ics';

            header('Content-Type: text/calendar; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            echo $ics;
            exit;
        } catch (Throwable $e) {
            http_response_code(500);
            echo 'Errore generazione calendario';
            exit;
        }
    }

    case 'admin/dashboard': {
        $user = require_admin();
        $kpis = get_dashboard_kpis();
        $cantieriInCorso = get_cantieri_list('in_corso');
        $recentReports = get_recent_reports(8);
        $turni = get_turni_settimana();

        $segnalazioniKpi = get_segnalazioni_kpis();
        $interventiOggiKpi = get_interventi_oggi_kpi();
        $urgenti = get_urgent_segnalazioni_widget(5);
        $interventiScadenza = get_interventi_scadenza_widget();
        $trendSegnalazioni = get_segnalazioni_trend_monthly(6);

        render_page('Dashboard Admin', 'admin/dashboard.php', [
            'title' => 'Dashboard',
            'user' => $user,
            'kpis' => $kpis,
            'cantieriInCorso' => $cantieriInCorso,
            'recentReports' => $recentReports,
            'turni' => $turni,
            'segnalazioniKpi' => $segnalazioniKpi,
            'interventiOggiKpi' => $interventiOggiKpi,
            'urgenti' => $urgenti,
            'interventiScadenza' => $interventiScadenza,
            'trendSegnalazioni' => $trendSegnalazioni,
        ]);
        break;
    }

    case 'admin/team': {
        $user = require_admin();

        if (is_post()) {
            if (!csrf_check($_POST['_csrf'] ?? null)) {
                flash_set('error', 'Token CSRF non valido.');
                redirect('admin/team');
            }

            $action = (string) ($_POST['action'] ?? '');

            try {
                if ($action === 'create_employee') {
                    $fullName = trim((string) ($_POST['full_name'] ?? ''));
                    $email = trim((string) ($_POST['email'] ?? ''));
                    $phone = trim((string) ($_POST['phone'] ?? ''));

                    if ($fullName === '' || $email === '') {
                        throw new RuntimeException('Nome e email sono obbligatori.');
                    }

                    $result = create_employee([
                        'full_name' => $fullName,
                        'email' => $email,
                        'phone' => $phone,
                    ]);

                    flash_set('success', 'Dipendente creato. Password temporanea: ' . $result['password']);
                }

                if ($action === 'reset_password') {
                    $employeeId = (int) ($_POST['employee_id'] ?? 0);
                    if ($employeeId <= 0) {
                        throw new RuntimeException('Dipendente non valido.');
                    }

                    $newPassword = reset_employee_password($employeeId);
                    flash_set('success', 'Nuova password temporanea: ' . $newPassword);
                }
            } catch (Throwable $e) {
                flash_set('error', $e->getMessage());
            }

            redirect('admin/team');
        }

        $team = get_team_rows();

        render_page('Team', 'admin/team.php', [
            'title' => 'Team',
            'user' => $user,
            'team' => $team,
        ]);
        break;
    }

    case 'admin/cantieri': {
        $user = require_admin();

        if (is_post()) {
            if (!csrf_check($_POST['_csrf'] ?? null)) {
                flash_set('error', 'Token CSRF non valido.');
                redirect('admin/cantieri');
            }

            $action = (string) ($_POST['action'] ?? '');

            if ($action === 'create_cantiere') {
                try {
                    $nome = trim((string) ($_POST['nome'] ?? ''));
                    if ($nome === '') {
                        throw new RuntimeException('Il nome cantiere è obbligatorio.');
                    }

                    create_cantiere([
                        'nome' => $nome,
                        'cliente' => trim((string) ($_POST['cliente'] ?? '')),
                        'indirizzo' => trim((string) ($_POST['indirizzo'] ?? '')),
                        'descrizione' => trim((string) ($_POST['descrizione'] ?? '')),
                        'stato' => trim((string) ($_POST['stato'] ?? 'pianificato')),
                        'data_inizio' => trim((string) ($_POST['data_inizio'] ?? '')),
                        'data_fine_prevista' => trim((string) ($_POST['data_fine_prevista'] ?? '')),
                        'note' => trim((string) ($_POST['note'] ?? '')),
                    ], (int) $user['id']);

                    flash_set('success', 'Cantiere creato con successo.');
                } catch (Throwable $e) {
                    flash_set('error', $e->getMessage());
                }

                redirect('admin/cantieri');
            }
        }

        $stato = trim((string) ($_GET['stato'] ?? 'tutti'));
        $cantieri = get_cantieri_list($stato);

        render_page('Cantieri', 'admin/cantieri.php', [
            'title' => 'Cantieri',
            'user' => $user,
            'stato' => $stato,
            'cantieri' => $cantieri,
        ]);
        break;
    }

    case 'admin/cantiere': {
        $user = require_admin();
        $cantiereId = (int) ($_GET['id'] ?? 0);

        if ($cantiereId <= 0) {
            flash_set('error', 'Cantiere non valido.');
            redirect('admin/cantieri');
        }

        if (is_post()) {
            if (!csrf_check($_POST['_csrf'] ?? null)) {
                flash_set('error', 'Token CSRF non valido.');
                redirect('admin/cantiere', ['id' => $cantiereId]);
            }

            $action = (string) ($_POST['action'] ?? '');
            try {
                if ($action === 'add_assegnazione') {
                    add_assegnazione(
                        $cantiereId,
                        (int) ($_POST['dipendente_id'] ?? 0),
                        trim((string) ($_POST['ruolo_cantiere'] ?? ''))
                    );
                    flash_set('success', 'Dipendente assegnato al cantiere.');
                }

                if ($action === 'remove_assegnazione') {
                    remove_assegnazione((int) ($_POST['assegnazione_id'] ?? 0));
                    flash_set('success', 'Assegnazione rimossa.');
                }

                if ($action === 'add_milestone') {
                    $titolo = trim((string) ($_POST['titolo'] ?? ''));
                    if ($titolo === '') {
                        throw new RuntimeException('Titolo milestone obbligatorio.');
                    }
                    add_milestone($cantiereId, $titolo);
                    flash_set('success', 'Milestone aggiunta.');
                }

                if ($action === 'toggle_milestone') {
                    toggle_milestone((int) ($_POST['milestone_id'] ?? 0), (int) ($_POST['done'] ?? 0) === 1);
                    flash_set('success', 'Milestone aggiornata.');
                }

                if ($action === 'move_milestone') {
                    move_milestone(
                        $cantiereId,
                        (int) ($_POST['milestone_id'] ?? 0),
                        trim((string) ($_POST['direction'] ?? 'up'))
                    );
                    flash_set('success', 'Ordine milestone aggiornato.');
                }
            } catch (Throwable $e) {
                flash_set('error', $e->getMessage());
            }

            redirect('admin/cantiere', ['id' => $cantiereId]);
        }

        $cantiere = get_cantiere_by_id($cantiereId);
        if (!$cantiere) {
            flash_set('error', 'Cantiere non trovato.');
            redirect('admin/cantieri');
        }

        $assegnazioni = get_cantiere_assegnazioni($cantiereId);
        $milestones = get_milestones($cantiereId);
        $reports = get_cantiere_reports($cantiereId);
        $dipendenti = get_dipendenti_options();

        render_page('Dettaglio cantiere', 'admin/cantiere.php', [
            'title' => 'Cantiere - ' . $cantiere['nome'],
            'user' => $user,
            'cantiere' => $cantiere,
            'assegnazioni' => $assegnazioni,
            'milestones' => $milestones,
            'reports' => $reports,
            'dipendenti' => $dipendenti,
        ]);
        break;
    }

    case 'admin/segnalazioni': {
        $user = require_admin();

        $filters = [
            'stato' => trim((string) ($_GET['stato'] ?? '')),
            'priorita' => trim((string) ($_GET['priorita'] ?? '')),
            'impianto_tipo' => trim((string) ($_GET['impianto_tipo'] ?? '')),
            'dipendente_id' => trim((string) ($_GET['dipendente_id'] ?? '')),
            'from' => trim((string) ($_GET['from'] ?? '')),
            'to' => trim((string) ($_GET['to'] ?? '')),
            'q' => trim((string) ($_GET['q'] ?? '')),
        ];

        try {
            $rows = get_segnalazioni_list($filters);
            $kpi = get_segnalazioni_kpis();
            $dipendenti = get_dipendenti_options();
        } catch (Throwable $e) {
            flash_set('error', $e->getMessage());
            $rows = [];
            $kpi = get_segnalazioni_kpis();
            $dipendenti = [];
        }

        render_page('Segnalazioni', 'admin/segnalazioni.php', [
            'title' => 'Segnalazioni',
            'user' => $user,
            'rows' => $rows,
            'kpi' => $kpi,
            'filters' => $filters,
            'dipendenti' => $dipendenti,
        ]);
        break;
    }

    case 'admin/segnalazioni/nuova': {
        $user = require_admin();

        $cantieri = get_cantieri_list('tutti');
        $aiAnalysis = null;

        if (is_post()) {
            if (!csrf_check($_POST['_csrf'] ?? null)) {
                flash_set('error', 'Token CSRF non valido.');
                redirect('admin/segnalazioni/nuova');
            }

            $action = (string) ($_POST['action'] ?? 'create');

            if ($action === 'analyze_ai') {
                $descrizione = trim((string) ($_POST['descrizione'] ?? ''));
                $impianto = trim((string) ($_POST['impianto_tipo'] ?? 'altro'));
                $aiAnalysis = ai_analyze_segnalazione($descrizione, $impianto);
                flash_set('success', 'Analisi AI completata.');
            }

            if ($action === 'create') {
                try {
                    $titolo = trim((string) ($_POST['titolo'] ?? ''));
                    $descrizione = trim((string) ($_POST['descrizione'] ?? ''));
                    if ($titolo === '' || $descrizione === '') {
                        throw new RuntimeException('Titolo e descrizione sono obbligatori.');
                    }

                    $id = create_segnalazione([
                        'titolo' => $titolo,
                        'descrizione' => $descrizione,
                        'tipo' => trim((string) ($_POST['tipo'] ?? 'altro')),
                        'priorita' => trim((string) ($_POST['priorita'] ?? 'media')),
                        'cliente' => trim((string) ($_POST['cliente'] ?? '')),
                        'indirizzo' => trim((string) ($_POST['indirizzo'] ?? '')),
                        'cantiere_id' => trim((string) ($_POST['cantiere_id'] ?? '')),
                        'impianto_tipo' => trim((string) ($_POST['impianto_tipo'] ?? 'altro')),
                        'foto_urls' => $_POST['foto_url'] ?? [],
                        'foto_captions' => $_POST['foto_caption'] ?? [],
                    ], (int) $user['id']);

                    flash_set('success', 'Segnalazione creata con successo.');
                    redirect('admin/segnalazioni/view', ['id' => $id]);
                } catch (Throwable $e) {
                    flash_set('error', $e->getMessage());
                }
            }
        }

        render_page('Nuova Segnalazione', 'admin/segnalazioni_nuova.php', [
            'title' => 'Nuova Segnalazione',
            'user' => $user,
            'cantieri' => $cantieri,
            'aiAnalysis' => $aiAnalysis,
        ]);
        break;
    }

    case 'admin/segnalazioni/view': {
        $user = require_admin();
        $id = (int) ($_GET['id'] ?? 0);
        if ($id <= 0) {
            flash_set('error', 'Segnalazione non valida.');
            redirect('admin/segnalazioni');
        }

        if (is_post()) {
            if (!csrf_check($_POST['_csrf'] ?? null)) {
                flash_set('error', 'Token CSRF non valido.');
                redirect('admin/segnalazioni/view', ['id' => $id]);
            }

            $action = (string) ($_POST['action'] ?? '');

            try {
                if ($action === 'add_commento') {
                    add_segnalazione_commento($id, (int) $user['id'], (string) ($_POST['testo_commento'] ?? ''));
                    flash_set('success', 'Commento aggiunto.');
                }

                if ($action === 'change_stato') {
                    $stato = trim((string) ($_POST['stato_nuovo'] ?? ''));
                    $nota = trim((string) ($_POST['nota_stato'] ?? ''));
                    change_segnalazione_stato($id, $stato, $nota, (int) $user['id']);
                    flash_set('success', 'Stato aggiornato.');
                }

                if ($action === 'pianifica_intervento') {
                    $interventoId = create_intervento_with_assignments($id, [
                        'titolo' => trim((string) ($_POST['titolo_intervento'] ?? '')),
                        'data_intervento' => trim((string) ($_POST['data_intervento'] ?? '')),
                        'ora_inizio' => trim((string) ($_POST['ora_inizio'] ?? '')),
                        'ora_fine' => trim((string) ($_POST['ora_fine'] ?? '')),
                        'note_pianificazione' => trim((string) ($_POST['note_pianificazione'] ?? '')),
                        'dipendenti' => $_POST['dipendente_ids'] ?? [],
                    ], (int) $user['id']);
                    flash_set('success', 'Intervento pianificato e assegnato (ID ' . $interventoId . ').');
                }
            } catch (Throwable $e) {
                flash_set('error', $e->getMessage());
            }

            redirect('admin/segnalazioni/view', ['id' => $id]);
        }

        try {
            $segnalazione = get_segnalazione_by_id($id);
            if (!$segnalazione) {
                throw new RuntimeException('Segnalazione non trovata.');
            }
            $foto = get_segnalazione_foto($id);
            $history = get_segnalazione_history($id);
            $commenti = get_segnalazione_commenti($id);
            $interventi = get_interventi_by_segnalazione($id);
            $dipendenti = get_dipendenti_options();

            $rimessaAlert = null;
            foreach ($interventi as $intervento) {
                if ((int) ($intervento['rimesso_count'] ?? 0) > 0) {
                    $report = get_intervento_report((int) $intervento['id']);
                    if ($report && ($report['esito'] ?? '') === 'rimesso_in_guasto') {
                        $rimessaAlert = [
                            'motivazione' => $report['motivo_rimessa_guasto'] ?? 'N/D',
                            'intervento_id' => (int) $intervento['id'],
                        ];
                        break;
                    }
                }
            }
        } catch (Throwable $e) {
            flash_set('error', $e->getMessage());
            redirect('admin/segnalazioni');
        }

        render_page('Dettaglio Segnalazione', 'admin/segnalazione_view.php', [
            'title' => 'Segnalazione ' . ($segnalazione['codice'] ?? ''),
            'user' => $user,
            'segnalazione' => $segnalazione,
            'foto' => $foto,
            'history' => $history,
            'commenti' => $commenti,
            'interventi' => $interventi,
            'dipendenti' => $dipendenti,
            'rimessaAlert' => $rimessaAlert,
        ]);
        break;
    }

    case 'admin/segnalazioni/calendario': {
        $user = require_admin();

        $dipendenteId = trim((string) ($_GET['dipendente_id'] ?? ''));
        $vista = trim((string) ($_GET['vista'] ?? 'mese'));

        $from = trim((string) ($_GET['from'] ?? date('Y-m-01')));
        $to = trim((string) ($_GET['to'] ?? date('Y-m-t')));

        if ($vista === 'settimana') {
            $from = date('Y-m-d');
            $to = date('Y-m-d', strtotime('+7 days'));
        } elseif ($vista === 'giorno') {
            $from = date('Y-m-d');
            $to = date('Y-m-d');
        }

        try {
            $events = get_interventi_calendar([
                'dipendente_id' => $dipendenteId,
                'from' => $from,
                'to' => $to,
            ]);
            $dipendenti = get_dipendenti_options();
        } catch (Throwable $e) {
            flash_set('error', $e->getMessage());
            $events = [];
            $dipendenti = [];
        }

        render_page('Calendario Interventi', 'admin/segnalazioni_calendario.php', [
            'title' => 'Calendario Interventi',
            'user' => $user,
            'events' => $events,
            'dipendenti' => $dipendenti,
            'from' => $from,
            'to' => $to,
            'vista' => $vista,
            'dipendenteId' => $dipendenteId,
        ]);
        break;
    }

    case 'admin/report-interventi': {
        $user = require_admin();

        $filters = [
            'dipendente_id' => trim((string) ($_GET['dipendente_id'] ?? '')),
            'esito' => trim((string) ($_GET['esito'] ?? '')),
            'from' => trim((string) ($_GET['from'] ?? '')),
            'to' => trim((string) ($_GET['to'] ?? '')),
            'intervento_id' => trim((string) ($_GET['intervento_id'] ?? '')),
        ];

        try {
            $rows = get_report_interventi_list($filters);
            $stats = get_report_interventi_stats();
            $dipendenti = get_dipendenti_options();
        } catch (Throwable $e) {
            flash_set('error', $e->getMessage());
            $rows = [];
            $stats = ['pct_risolti_primo' => 0, 'tempo_medio_ore' => 0];
            $dipendenti = [];
        }

        render_page('Report Interventi', 'admin/report_interventi.php', [
            'title' => 'Report Interventi',
            'user' => $user,
            'rows' => $rows,
            'stats' => $stats,
            'dipendenti' => $dipendenti,
            'filters' => $filters,
        ]);
        break;
    }

    case 'admin/report-interventi/pdf': {
        $user = require_admin();
        $reportId = (int) ($_GET['id'] ?? 0);
        if ($reportId <= 0) {
            flash_set('error', 'Report non valido.');
            redirect('admin/report-interventi');
        }

        try {
            $report = get_report_by_id($reportId);
            if (!$report) {
                throw new RuntimeException('Report non trovato.');
            }

            $lines = [
                'Global Impianti - Report Intervento',
                'Report ID: ' . $report['id'],
                'Codice Segnalazione: ' . ($report['codice'] ?? '-'),
                'Titolo Segnalazione: ' . ($report['segnalazione_titolo'] ?? '-'),
                'Dipendente: ' . ($report['dipendente_nome'] ?? '-'),
                'Data Intervento: ' . ($report['data_intervento'] ?? '-'),
                'Esito: ' . ($report['esito'] ?? '-'),
                '',
                'Descrizione lavori:',
                (string) ($report['descrizione_lavori'] ?? ''),
                '',
                'Causa guasto:',
                (string) ($report['causa_guasto'] ?? ''),
                '',
                'Soluzione adottata:',
                (string) ($report['soluzione_adottata'] ?? ''),
                '',
                'Materiali utilizzati:',
                (string) ($report['materiali_utilizzati'] ?? ''),
            ];

            $pdf = build_simple_pdf($lines);
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="report-intervento-' . $reportId . '.pdf"');
            echo $pdf;
            exit;
        } catch (Throwable $e) {
            flash_set('error', $e->getMessage());
            redirect('admin/report-interventi');
        }
    }

    case 'dipendente/home': {
        $user = require_dipendente();

        if (is_post()) {
            if (!csrf_check($_POST['_csrf'] ?? null)) {
                flash_set('error', 'Token CSRF non valido.');
                redirect('dipendente/home');
            }

            $action = (string) ($_POST['action'] ?? '');

            try {
                if ($action === 'timbra_entrata') {
                    timbra_entrata((int) $user['id'], (int) ($_POST['cantiere_id'] ?? 0));
                    flash_set('success', 'Entrata registrata.');
                }

                if ($action === 'timbra_uscita') {
                    timbra_uscita((int) $user['id']);
                    flash_set('success', 'Uscita registrata.');
                }

                if ($action === 'invia_report') {
                    $cantiereId = (int) ($_POST['cantiere_id'] ?? 0);
                    if ($cantiereId <= 0) {
                        throw new RuntimeException('Seleziona un cantiere.');
                    }

                    crea_report([
                        'dipendente_id' => (int) $user['id'],
                        'cantiere_id' => $cantiereId,
                        'testo' => trim((string) ($_POST['testo'] ?? '')),
                        'meteo' => trim((string) ($_POST['meteo'] ?? '')),
                        'materiali' => trim((string) ($_POST['materiali'] ?? '')),
                        'problemi' => trim((string) ($_POST['problemi'] ?? '')),
                    ]);
                    flash_set('success', 'Report inviato con successo.');
                }
            } catch (Throwable $e) {
                flash_set('error', $e->getMessage());
            }

            redirect('dipendente/home');
        }

        $cantieri = get_dipendente_assigned_cantieri((int) $user['id']);
        $turni = get_dipendente_turni((int) $user['id']);
        $documenti = get_dipendente_documenti((int) $user['id']);
        $interventiOggi = module_segnalazioni_installed() ? get_interventi_today_for_dipendente((int) $user['id']) : [];

        $hasUrgente = false;
        foreach ($interventiOggi as $it) {
            if (in_array(($it['priorita'] ?? ''), ['critica', 'alta'], true)) {
                $hasUrgente = true;
                break;
            }
        }

        render_page('Home Dipendente', 'dipendente/home.php', [
            'title' => 'Home Dipendente',
            'user' => $user,
            'cantieri' => $cantieri,
            'turni' => $turni,
            'documenti' => $documenti,
            'interventiOggi' => $interventiOggi,
            'hasUrgente' => $hasUrgente,
        ]);
        break;
    }

    case 'dipendente/interventi': {
        $user = require_dipendente();

        try {
            $grouped = get_dipendente_interventi_grouped((int) $user['id']);
        } catch (Throwable $e) {
            flash_set('error', $e->getMessage());
            $grouped = ['oggi' => [], 'prossimi' => [], 'passati' => []];
        }

        render_page('Interventi', 'dipendente/interventi.php', [
            'title' => 'I miei interventi',
            'user' => $user,
            'grouped' => $grouped,
        ]);
        break;
    }

    case 'dipendente/interventi/view': {
        $user = require_dipendente();
        $interventoId = (int) ($_GET['id'] ?? 0);

        if ($interventoId <= 0) {
            flash_set('error', 'Intervento non valido.');
            redirect('dipendente/interventi');
        }

        try {
            $intervento = get_intervento_by_id($interventoId);
            if (!$intervento) {
                throw new RuntimeException('Intervento non trovato.');
            }

            if (!is_dipendente_assegnato_intervento($interventoId, (int) $user['id'])) {
                throw new RuntimeException('Intervento non assegnato al tuo utente.');
            }

            if ((string) $intervento['data_intervento'] > date('Y-m-d')) {
                throw new RuntimeException('Il report sarà disponibile dal giorno dell’intervento.');
            }

            $foto = get_segnalazione_foto((int) $intervento['segnalazione_id']);
            $myReport = get_intervento_report($interventoId, (int) $user['id']);
            $reportFoto = $myReport ? get_intervento_report_foto((int) $myReport['id']) : [];
        } catch (Throwable $e) {
            flash_set('error', $e->getMessage());
            redirect('dipendente/interventi');
        }

        render_page('Dettaglio Intervento', 'dipendente/intervento_view.php', [
            'title' => 'Intervento ' . ($intervento['codice'] ?? ''),
            'user' => $user,
            'intervento' => $intervento,
            'foto' => $foto,
            'myReport' => $myReport,
            'reportFoto' => $reportFoto,
        ]);
        break;
    }

    case 'dipendente/interventi/report': {
        $user = require_dipendente();
        $interventoId = (int) ($_GET['id'] ?? 0);

        if ($interventoId <= 0) {
            flash_set('error', 'Intervento non valido.');
            redirect('dipendente/interventi');
        }

        $aiPreview = null;

        try {
            $intervento = get_intervento_by_id($interventoId);
            if (!$intervento) {
                throw new RuntimeException('Intervento non trovato.');
            }

            if (!is_dipendente_assegnato_intervento($interventoId, (int) $user['id'])) {
                throw new RuntimeException('Intervento non assegnato al tuo utente.');
            }

            $existing = get_intervento_report($interventoId, (int) $user['id']);
            if ($existing) {
                flash_set('success', 'Report già compilato per questo intervento.');
                redirect('dipendente/interventi/view', ['id' => $interventoId]);
            }

            if (is_post()) {
                if (!csrf_check($_POST['_csrf'] ?? null)) {
                    throw new RuntimeException('Token CSRF non valido.');
                }

                $action = (string) ($_POST['action'] ?? 'save_report');

                if ($action === 'generate_ai') {
                    $aiPreview = ai_generate_report_intervento([
                        'descrizione_lavori' => trim((string) ($_POST['descrizione_lavori'] ?? '')),
                        'causa_guasto' => trim((string) ($_POST['causa_guasto'] ?? '')),
                        'soluzione_adottata' => trim((string) ($_POST['soluzione_adottata'] ?? '')),
                        'materiali_utilizzati' => trim((string) ($_POST['materiali_utilizzati'] ?? '')),
                        'tipo_impianto' => $intervento['impianto_tipo'] ?? '',
                        'esito' => trim((string) ($_POST['esito'] ?? '')),
                    ]);
                    flash_set('success', 'Preview AI generata.');
                }

                if ($action === 'save_report') {
                    $reportId = save_intervento_report($interventoId, (int) $user['id'], [
                        'descrizione_lavori' => trim((string) ($_POST['descrizione_lavori'] ?? '')),
                        'causa_guasto' => trim((string) ($_POST['causa_guasto'] ?? '')),
                        'soluzione_adottata' => trim((string) ($_POST['soluzione_adottata'] ?? '')),
                        'materiali_utilizzati' => trim((string) ($_POST['materiali_utilizzati'] ?? '')),
                        'esito' => trim((string) ($_POST['esito'] ?? '')),
                        'motivo_rimessa_guasto' => trim((string) ($_POST['motivo_rimessa_guasto'] ?? '')),
                        'ore_lavorate' => trim((string) ($_POST['ore_lavorate'] ?? '')),
                        'prossimo_intervento_necessario' => $_POST['prossimo_intervento_necessario'] ?? null,
                        'note_prossimo_intervento' => trim((string) ($_POST['note_prossimo_intervento'] ?? '')),
                        'firma_cliente' => trim((string) ($_POST['firma_cliente'] ?? '')),
                        'foto_urls' => $_POST['foto_url'] ?? [],
                        'foto_captions' => $_POST['foto_caption'] ?? [],
                        'foto_tipi' => $_POST['foto_tipo'] ?? [],
                    ]);

                    flash_set('success', 'Report inviato con successo (ID ' . $reportId . ').');
                    redirect('dipendente/interventi/view', ['id' => $interventoId]);
                }
            }
        } catch (Throwable $e) {
            flash_set('error', $e->getMessage());
            redirect('dipendente/interventi/view', ['id' => $interventoId]);
        }

        render_page('Compila Report', 'dipendente/intervento_report.php', [
            'title' => 'Compila Report Intervento',
            'user' => $user,
            'intervento' => $intervento,
            'aiPreview' => $aiPreview,
        ]);
        break;
    }

    default:
        http_response_code(404);
        render_page('404', 'system/not-found.php', [
            'title' => 'Pagina non trovata',
        ]);
        break;
}
