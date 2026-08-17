<?php
/**
 * phpixel — mail relay για τη φόρμα επικοινωνίας.
 *
 * Ανεβαίνει στον cPanel server, ΟΧΙ στο Cloudflare Pages. Το site είναι στατικό
 * στο edge και δεν μπορεί να μιλήσει SMTP· η Pages Function `/api/contact`
 * κάνει ένα HTTPS request εδώ και αυτό το αρχείο στέλνει το mail.
 *
 * Επειδή το info@phpixel.gr ζει στον ίδιο server, η παράδοση είναι τοπική:
 * το μήνυμα δεν βγαίνει ποτέ στο internet, οπότε δεν το αγγίζει SPF/DKIM/spam
 * filtering κανενός τρίτου.
 *
 * Εγκατάσταση:
 *   1. Άλλαξε το MAILER_TOKEN σε μια μεγάλη τυχαία συμβολοσειρά.
 *   2. Ανέβασέ το στον cPanel, π.χ. στο document root του mailer.phpixel.gr.
 *   3. Βάλε το ίδιο token ως MAILER_TOKEN στα environment variables του Pages,
 *      και το πλήρες URL ως MAILER_URL.
 *
 * Το token εδώ ΔΕΝ γράφεται ποτέ στο git — το αρχείο του repo κρατάει μόνο το
 * placeholder.
 */

declare(strict_types=1);

const MAILER_TOKEN = '__REPLACE_WITH_A_LONG_RANDOM_STRING__';
const MAIL_TO      = 'info@phpixel.gr';
const MAIL_FROM    = 'site@phpixel.gr';
const MAIL_FROM_NAME = 'phpixel';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

/** Απάντηση σε JSON και τέλος. */
function reply(int $status, array $body): void
{
	http_response_code($status);
	echo json_encode($body, JSON_UNESCAPED_UNICODE);
	exit;
}

/** Κόβει CR/LF ώστε να μη γίνεται header injection μέσα από τα πεδία. */
function singleLine(string $value): string
{
	return trim(str_replace(["\r", "\n"], ' ', $value));
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
	reply(405, ['error' => 'method not allowed']);
}

if (MAILER_TOKEN === '__REPLACE_WITH_A_LONG_RANDOM_STRING__') {
	error_log('phpixel mailer: το MAILER_TOKEN δεν έχει οριστεί');
	reply(500, ['error' => 'not configured']);
}

$token = $_SERVER['HTTP_X_MAILER_TOKEN'] ?? '';
if (!is_string($token) || !hash_equals(MAILER_TOKEN, $token)) {
	reply(401, ['error' => 'unauthorized']);
}

$payload = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($payload)) {
	reply(400, ['error' => 'invalid json']);
}

$name    = singleLine((string) ($payload['name'] ?? ''));
$email   = singleLine((string) ($payload['email'] ?? ''));
$phone   = singleLine((string) ($payload['phone'] ?? ''));
$message = trim((string) ($payload['message'] ?? ''));

if ($name === '' || $email === '' || $message === '') {
	reply(400, ['error' => 'missing required fields']);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
	reply(400, ['error' => 'invalid email']);
}

$e = static fn (string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');

$html = '<h2>Νέο μήνυμα από το phpixel.gr</h2>'
	. '<p><strong>Όνομα:</strong> ' . $e($name) . '</p>'
	. '<p><strong>Email:</strong> ' . $e($email) . '</p>'
	. ($phone !== '' ? '<p><strong>Τηλέφωνο:</strong> ' . $e($phone) . '</p>' : '')
	. '<hr>'
	. '<p><strong>Μήνυμα:</strong></p>'
	. '<p>' . nl2br($e($message)) . '</p>';

// Τα ελληνικά στο subject θέλουν MIME encoding, αλλιώς φτάνουν σπασμένα.
$subject = '=?UTF-8?B?' . base64_encode('[Νέα επικοινωνία] Μήνυμα από ' . $name) . '?=';

$headers = implode("\r\n", [
	'MIME-Version: 1.0',
	'Content-Type: text/html; charset=UTF-8',
	'From: =?UTF-8?B?' . base64_encode(MAIL_FROM_NAME) . '?= <' . MAIL_FROM . '>',
	'Reply-To: ' . $email,
	'X-Mailer: phpixel-relay',
]);

// Το -f ορίζει τον envelope sender· χωρίς αυτό το Exim βάζει τον χρήστη του cPanel.
if (!mail(MAIL_TO, $subject, $html, $headers, '-f' . MAIL_FROM)) {
	error_log('phpixel mailer: η mail() απέτυχε για ' . $email);
	reply(502, ['error' => 'send failed']);
}

reply(200, ['ok' => true]);
