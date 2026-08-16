import type { APIRoute } from 'astro';

/**
 * robots.txt, παραγόμενο από το `site` στο astro.config.mjs.
 *
 * Ήταν στατικό αρχείο στο public/ με hardcoded host και λάθος sitemap path
 * (`/sitemap.xml` αντί για `/sitemap-index.xml`, που είναι αυτό που βγάζει το
 * @astrojs/sitemap). Παραγόμενο, δεν μπορεί να ξαναχάσει τον συγχρονισμό.
 */
export const GET: APIRoute = ({ site }) => {
	const sitemapURL = new URL('sitemap-index.xml', site);

	return new Response(
		`User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
`,
		{ headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
	);
};
