<?php
/**
 * CORS Proxy für basketball-bund.net
 * Deployment: api.benchboss.de
 *
 * Leitet /rest/* Anfragen transparent an basketball-bund.net weiter
 * und fügt CORS-Header hinzu, damit benchboss.de darauf zugreifen darf.
 */

// Nur Anfragen von benchboss.de erlauben
$allowedOrigins = [
    'https://benchboss.de',
    'https://www.benchboss.de',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: https://benchboss.de');
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Max-Age: 86400');

// Preflight-Request sofort beantworten
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Pfad aus der Request-URI lesen (.htaccess rewrite setzt REQUEST_URI)
$requestUri = $_SERVER['REQUEST_URI'] ?? '';

// Sicherheitscheck: Nur /rest/* Pfade erlaubt
if (!preg_match('#^/rest/#', $requestUri)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Only /rest/* paths are allowed']);
    exit;
}

$targetUrl = 'https://www.basketball-bund.net' . $requestUri;

// cURL Request aufbauen
$ch = curl_init($targetUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_USERAGENT      => 'BenchBoss-Proxy/1.0',
]);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json',
    ]);
} else {
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
    ]);
}

$response    = curl_exec($ch);
$httpCode    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$curlError   = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Upstream request failed', 'detail' => $curlError]);
    exit;
}

http_response_code($httpCode);
header('Content-Type: ' . ($contentType ?: 'application/json'));
echo $response;
