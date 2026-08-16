/**
 * Φόρμα επικοινωνίας — Cloudflare Pages Function στο /api/contact.
 *
 * Το υπόλοιπο site είναι εντελώς στατικό. Αυτό είναι το μοναδικό κομμάτι που
 * τρέχει server-side, γι' αυτό ζει εδώ και όχι ως Astro endpoint: έτσι το Astro
 * χτίζει χωρίς adapter και το Pages σερβίρει καθαρά static assets.
 *
 * Γιατί όχι nodemailer/SMTP όπως πριν: το Workers runtime δεν είναι Node, και
 * η αποστολή SMTP μέσω raw sockets δεν είναι αξιόπιστη εκεί. Στέλνουμε μέσω
 * HTTP API (Resend), που είναι απλό fetch.
 *
 * Απαιτούμενα environment variables στο Cloudflare Pages project:
 *   RESEND_API_KEY  — το API key (Secret, όχι plain text)
 *   CONTACT_TO      — πού φτάνει το μήνυμα, π.χ. info@phpixel.gr
 *   CONTACT_FROM    — ο αποστολέας, σε επιβεβαιωμένο domain, π.χ. "phpixel <site@phpixel.gr>"
 */

interface Env {
	RESEND_API_KEY: string;
	CONTACT_TO: string;
	CONTACT_FROM: string;
}

interface Context {
	request: Request;
	env: Env;
}

/** Ένα ώρας cookie, αναγνώσιμο από JS ώστε οι στατικές /success και /fail να το δουν. */
const cookie = (name: string, value: string) =>
	`${name}=${encodeURIComponent(value)}; Path=/; Max-Age=3600; SameSite=Lax; Secure`;

const escapeHtml = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function redirect(to: string, cookies: string[]): Response {
	const headers = new Headers({ Location: to });
	for (const c of cookies) headers.append('Set-Cookie', c);
	return new Response(null, { status: 303, headers });
}

export const onRequestPost = async ({ request, env }: Context): Promise<Response> => {
	const form = await request.formData();
	const get = (key: string) => String(form.get(key) ?? '').trim();

	const name = get('Name');
	const email = get('Email');
	const phone = get('Phone');
	const message = get('Message');

	if (!name || !email || !message) {
		return new Response(JSON.stringify({ message: 'Missing required fields' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const failCookies = [cookie('form_status', 'error'), cookie('form_name', name)];

	if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
		console.error('contact: λείπουν environment variables (RESEND_API_KEY / CONTACT_TO / CONTACT_FROM)');
		return redirect('/fail', failCookies);
	}

	try {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.RESEND_API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				from: env.CONTACT_FROM,
				to: [env.CONTACT_TO],
				reply_to: email,
				subject: `[Νέα επικοινωνία] Μήνυμα από ${name}`,
				html: `
					<h2>Νέο μήνυμα από το phpixel.gr</h2>
					<p><strong>Όνομα:</strong> ${escapeHtml(name)}</p>
					<p><strong>Email:</strong> ${escapeHtml(email)}</p>
					${phone ? `<p><strong>Τηλέφωνο:</strong> ${escapeHtml(phone)}</p>` : ''}
					<hr>
					<p><strong>Μήνυμα:</strong></p>
					<p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
				`,
			}),
		});

		if (!res.ok) {
			console.error('contact: το Resend απάντησε', res.status, await res.text());
			return redirect('/fail', failCookies);
		}

		return redirect('/success', [cookie('form_status', 'sent'), cookie('form_name', name)]);
	} catch (error) {
		console.error('contact: η αποστολή απέτυχε', error);
		return redirect('/fail', failCookies);
	}
};

/** GET στο /api/contact δεν έχει νόημα — γύρνα στη φόρμα. */
export const onRequestGet = (): Response =>
	new Response(null, { status: 302, headers: { Location: '/contact' } });
