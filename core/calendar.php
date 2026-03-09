<?php

declare(strict_types=1);

function ics_escape(string $value): string
{
    $value = str_replace("\r\n", "\n", $value);
    $value = str_replace("\r", "\n", $value);
    $value = str_replace("\n", "\\n", $value);
    $value = str_replace(',', '\\,', $value);
    $value = str_replace(';', '\\;', $value);
    return $value;
}

function to_ics_datetime(string $date, ?string $time): string
{
    $time = $time ?: '00:00:00';
    $dt = DateTime::createFromFormat('Y-m-d H:i:s', $date . ' ' . $time, new DateTimeZone('Europe/Rome'));
    if (!$dt) {
        $dt = new DateTime('now', new DateTimeZone('Europe/Rome'));
    }

    $dt->setTimezone(new DateTimeZone('UTC'));
    return $dt->format('Ymd\THis\Z');
}

function normalize_intervento_times(string $date, ?string $oraInizio, ?string $oraFine): array
{
    $tz = new DateTimeZone('Europe/Rome');

    $startTime = $oraInizio ?: '08:00:00';
    $start = DateTime::createFromFormat('Y-m-d H:i:s', $date . ' ' . $startTime, $tz);
    if (!$start) {
        $start = new DateTime('now', $tz);
    }

    if (!empty($oraFine)) {
        $end = DateTime::createFromFormat('Y-m-d H:i:s', $date . ' ' . $oraFine, $tz);
        if (!$end) {
            $end = clone $start;
            $end->modify('+1 hour');
        }
    } else {
        $end = clone $start;
        $end->modify('+1 hour');
    }

    if ($end <= $start) {
        $end = clone $start;
        $end->modify('+1 hour');
    }

    $start->setTimezone(new DateTimeZone('UTC'));
    $end->setTimezone(new DateTimeZone('UTC'));

    return [
        'start' => $start->format('Ymd\THis\Z'),
        'end' => $end->format('Ymd\THis\Z'),
    ];
}

function build_intervento_calendar_meta(array $intervento): array
{
    $summary = sprintf(
        '[%s] %s',
        $intervento['codice'] ?? 'SEG',
        $intervento['segnalazione_titolo'] ?? ($intervento['titolo'] ?? 'Intervento')
    );

    $times = normalize_intervento_times(
        (string) $intervento['data_intervento'],
        $intervento['ora_inizio'] ?? null,
        $intervento['ora_fine'] ?? null
    );

    $location = (string) ($intervento['indirizzo'] ?? $intervento['cantiere_indirizzo'] ?? '');
    $description = trim((string) (
        ($intervento['segnalazione_descrizione'] ?? '') . "\n\n" .
        'Note pianificazione: ' . ($intervento['note_pianificazione'] ?? '-')
    ));

    $url = current_app_base_url() . 'index.php?page=dipendente/interventi/view&id=' . (int) $intervento['id'];

    return [
        'summary' => $summary,
        'start' => $times['start'],
        'end' => $times['end'],
        'location' => $location,
        'description' => $description,
        'url' => $url,
    ];
}

function generate_ics_file(array $intervento): string
{
    $meta = build_intervento_calendar_meta($intervento);

    $uid = 'intervento-' . (int) $intervento['id'] . '@global-impianti';
    $dtStamp = gmdate('Ymd\THis\Z');

    $lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Global Impianti//Interventi//IT',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        'UID:' . $uid,
        'DTSTAMP:' . $dtStamp,
        'SUMMARY:' . ics_escape($meta['summary']),
        'DTSTART:' . $meta['start'],
        'DTEND:' . $meta['end'],
        'LOCATION:' . ics_escape($meta['location']),
        'DESCRIPTION:' . ics_escape($meta['description']),
        'URL:' . ics_escape($meta['url']),
        'ORGANIZER;CN=Global Impianti:mailto:noreply@globalimpiantick.it',
        'BEGIN:VALARM',
        'TRIGGER:-PT1H',
        'ACTION:DISPLAY',
        'DESCRIPTION:Promemoria intervento tra 1 ora',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR',
    ];

    return implode("\r\n", $lines) . "\r\n";
}

function current_app_base_url(): string
{
    $configured = trim((string) ($GLOBALS['app_config']['base_url'] ?? ''));
    if ($configured !== '') {
        return rtrim($configured, '/') . '/';
    }

    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';

    return $scheme . '://' . $host . '/';
}

function build_google_calendar_url(array $intervento): string
{
    $meta = build_intervento_calendar_meta($intervento);

    $query = http_build_query([
        'action' => 'TEMPLATE',
        'text' => $meta['summary'],
        'dates' => $meta['start'] . '/' . $meta['end'],
        'details' => $meta['description'] . "\n" . $meta['url'],
        'location' => $meta['location'],
    ]);

    return 'https://calendar.google.com/calendar/render?' . $query;
}
