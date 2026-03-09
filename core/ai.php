<?php

declare(strict_types=1);

function anthropic_api_key(): string
{
    $key = (string) ($GLOBALS['app_config']['anthropic_api_key'] ?? '');
    return trim($key);
}

function anthropic_call(string $system, string $prompt, int $maxTokens = 1400): ?string
{
    $apiKey = anthropic_api_key();
    if ($apiKey === '') {
        return null;
    }

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    if ($ch === false) {
        return null;
    }

    $payload = [
        'model' => 'claude-sonnet-4-20250514',
        'max_tokens' => $maxTokens,
        'temperature' => 0.2,
        'system' => $system,
        'messages' => [
            ['role' => 'user', 'content' => $prompt],
        ],
    ];

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'x-api-key: ' . $apiKey,
            'anthropic-version: 2023-06-01',
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 30,
    ]);

    $raw = curl_exec($ch);
    if ($raw === false) {
        curl_close($ch);
        return null;
    }

    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($status < 200 || $status >= 300) {
        return null;
    }

    $json = json_decode($raw, true);
    if (!is_array($json) || empty($json['content'][0]['text'])) {
        return null;
    }

    return (string) $json['content'][0]['text'];
}

function ai_generate_report_intervento(array $input): string
{
    $prompt = "Genera un report professionale di intervento tecnico con queste informazioni:\n" .
        'Descrizione lavori: ' . ($input['descrizione_lavori'] ?? '') . "\n" .
        'Causa guasto: ' . ($input['causa_guasto'] ?? '') . "\n" .
        'Soluzione adottata: ' . ($input['soluzione_adottata'] ?? '') . "\n" .
        'Materiali utilizzati: ' . ($input['materiali_utilizzati'] ?? '') . "\n" .
        'Tipo impianto: ' . ($input['impianto_tipo'] ?? '') . "\n" .
        'Esito: ' . ($input['esito'] ?? '');

    $system = 'Sei un tecnico senior. Restituisci italiano professionale con sezioni: Descrizione intervento; Diagnosi e causa; Soluzione tecnica adottata; Materiali impiegati; Esito e raccomandazioni.';

    $aiText = anthropic_call($system, $prompt, 1400);
    if ($aiText !== null && trim($aiText) !== '') {
        return trim($aiText);
    }

    // fallback locale
    return implode("\n\n", [
        'Descrizione intervento',
        trim((string) ($input['descrizione_lavori'] ?? 'N/D')),
        'Diagnosi e causa',
        trim((string) ($input['causa_guasto'] ?? 'N/D')),
        'Soluzione tecnica adottata',
        trim((string) ($input['soluzione_adottata'] ?? 'N/D')),
        'Materiali impiegati',
        trim((string) ($input['materiali_utilizzati'] ?? 'N/D')),
        'Esito e raccomandazioni',
        'Esito: ' . trim((string) ($input['esito'] ?? 'N/D')) . '. Verificare monitoraggio e manutenzione preventiva.',
    ]);
}

function ai_analyze_segnalazione(string $descrizione, string $tipoImpianto): array
{
    $prompt = "Analizza questa segnalazione tecnica e restituisci solo JSON valido con i campi: priorita_suggerita, tipo_guasto_probabile, possibili_cause[], materiali_probabilmente_necessari[], tempo_intervento_stimato, note_tecniche.\n" .
        'Tipo impianto: ' . $tipoImpianto . "\n" .
        'Descrizione: ' . $descrizione;

    $system = 'Sei un supervisore tecnico impianti. Output JSON senza testo extra.';

    $aiText = anthropic_call($system, $prompt, 900);
    if ($aiText !== null) {
        $decoded = json_decode($aiText, true);
        if (is_array($decoded)) {
            return $decoded;
        }
    }

    // fallback euristico
    $lower = mb_strtolower($descrizione);
    $priorita = 'media';
    if (str_contains($lower, 'fumo') || str_contains($lower, 'allag') || str_contains($lower, 'corto') || str_contains($lower, 'scintill')) {
        $priorita = 'critica';
    } elseif (str_contains($lower, 'blocc') || str_contains($lower, 'non funziona')) {
        $priorita = 'alta';
    }

    return [
        'priorita_suggerita' => $priorita,
        'tipo_guasto_probabile' => 'Verifica tecnica in loco necessaria',
        'possibili_cause' => ['Usura componenti', 'Connessioni difettose', 'Mancata manutenzione'],
        'materiali_probabilmente_necessari' => ['Ricambi standard impianto', 'Attrezzatura diagnostica'],
        'tempo_intervento_stimato' => '2-4 ore',
        'note_tecniche' => 'Eseguire diagnosi completa e test funzionale finale.',
    ];
}
