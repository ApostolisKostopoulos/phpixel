/**
 * Φόρμα επικοινωνίας — Cloudflare Pages Function στο /api/contact.
 *
 * Το υπόλοιπο site είναι εντελώς στατικό. Αυτό είναι το μοναδικό κομμάτι που
 * τρέχει server-side, γι' αυτό ζει εδώ και όχι ως Astro endpoint: έτσι το Astro
 * χτίζει χωρίς adapter και το Pages σερβίρει καθαρά static assets.
 *
 * Γιατί δεν στέλνουμε mail από εδώ: το Workers runtime δεν είναι Node, η θύρα 25
 * είναι κλειστή και δεν υπάρχει αξιόπιστος SMTP client γι' αυτό. Οπότε η function
 * κάνει μόνο ένα HTTPS request σε ένα PHP script πάνω στον cPanel server
 * (`server/mailer/send.php`), και εκείνο στέλνει το mail. Επειδή ο παραλήπτης
 * ζει στον ίδιο server, η παράδοση είναι τοπική.
 *
 * Απαιτούμενα environment variables στο Cloudflare Pages project:
 *   MAILER_URL    — το πλήρες URL του relay, π.χ. https://mailer.phpixel.gr/send.php
 *   MAILER_TOKEN  — το κοινό μυστικό (Secret), ίδιο με το MAILER_TOKEN του send.php
 */

interface Env {
	MAILER_URL: string;
	MAILER_TOKEN: string;
}

interface Context {
	request: Request;
	env: Env;
}

/** Ένα ώρας cookie, αναγνώσιμο από JS ώστε οι στατικές /success και /fail να το δουν. */
const cookie = (name: string, value: string) =>
	`${name}=${encodeURIComponent(value)}; Path=/; Max-Age=3600; SameSite=Lax; Secure`;

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

	// Honeypot (βλ. ContactForm.astro): άνθρωπος δεν το βλέπει, άρα δεν το γεμίζει.
	// Απαντάμε σαν να πέτυχε — το bot δεν μαθαίνει ότι το πιάσαμε και δεν ξαναδοκιμάζει.
	if (get('Website')) {
		console.log('contact: honeypot, η υποβολή αγνοήθηκε');
		return redirect('/success', [cookie('form_status', 'sent'), cookie('form_name', name)]);
	}

	if (!name || !email || !phone) {
		return new Response(JSON.stringify({ message: 'Missing required fields' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const failCookies = [cookie('form_status', 'error'), cookie('form_name', name)];

	if (!env.MAILER_URL || !env.MAILER_TOKEN) {
		console.error('contact: λείπουν environment variables (MAILER_URL / MAILER_TOKEN)');
		return redirect('/fail', failCookies);
	}

	try {
		const res = await fetch(env.MAILER_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Mailer-Token': env.MAILER_TOKEN,
			},
			body: JSON.stringify({ name, email, phone, message }),
			// Ο cPanel server μπορεί να κολλήσει· μη κρατάμε τον χρήστη να περιμένει.
			signal: AbortSignal.timeout(10_000),
		});

		if (!res.ok) {
			console.error('contact: το relay απάντησε', res.status, await res.text());
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
