import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import icon from 'astro-icon';

// phpixel.gr — built on the Odyssey theme (Treefarm Studio) as a starter.
// https://astro.build/config

// Single source of truth for the absolute origin. It drives canonical URLs,
// OG tags, the sitemap, robots.txt, llms.txt and every JSON-LD `@id` — so it
// MUST match the host the site is actually served from, or search engines are
// told every live URL is a duplicate of somewhere else and will not index it.
//
// Served from Cloudflare Pages. On a preview deployment CF_PAGES_URL is the
// deploy's own hostname, so previews describe themselves instead of claiming to
// be production. Production keeps the custom domain.
const SITE_URL =
	process.env.PUBLIC_SITE_URL ||
	(process.env.CF_PAGES_BRANCH && process.env.CF_PAGES_BRANCH !== 'main'
		? process.env.CF_PAGES_URL
		: null) ||
	'https://phpixel.gr';

export default defineConfig({
	site: SITE_URL,
	// Πλήρως στατικό build στο dist/, το οποίο σερβίρει απευθείας το Cloudflare
	// Pages. Χωρίς adapter, χωρίς serverless functions από το Astro: το μόνο
	// δυναμικό κομμάτι είναι η φόρμα επικοινωνίας, που τρέχει ως Cloudflare
	// Pages Function στο functions/api/contact.ts.
	output: 'static',
	// URLs χωρίς trailing slash — ό,τι είναι ήδη στο index της Google.
	//
	// Το Cloudflare Pages καθορίζει το canonical σχήμα από τη δομή των αρχείων:
	// `about/index.html` σημαίνει ότι το /about κάνει 308 στο /about/, ενώ
	// `about.html` σημαίνει ότι το /about σερβίρεται κατευθείαν. Άρα το
	// `format: 'file'` είναι αυτό που κρατάει τα υπάρχοντα URLs ζωντανά, χωρίς
	// redirect σε κάθε εσωτερικό link του site.
	trailingSlash: 'never',
	// Honour PORT so several dev servers can run side by side.
	server: { port: Number(process.env.PORT) || 4321 },
	// NOTE: τα redirects ζουν στο `public/_redirects` ώστε το Cloudflare Pages να
	// σερβίρει πραγματικά 301. (Ο built-in `redirects` χάρτης του Astro, σε
	// στατικό build χωρίς adapter, βγάζει μόνο <meta refresh> stubs.)
	integrations: [
		sitemap({
			// Οι σελίδες κατάστασης της φόρμας δεν είναι προορισμοί αναζήτησης:
			// βγάζουν νόημα μόνο αμέσως μετά από υποβολή.
			filter: (page) => !/\/(success|fail)$/.test(page.replace(/\/$/, '')),
		}),
		mdx(),
		icon(),
	],
	build: {
		format: 'file',
		inlineStylesheets: 'always',
	},
});
