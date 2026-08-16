import type { APIRoute } from 'astro';
import { site, nav } from '../config/site';
import { getProjects, getPosts } from '../utils/content';

/**
 * llms.txt — περίληψη του site σε απλό κείμενο, για AI crawlers και βοηθούς.
 * Spec: https://llmstxt.org/
 *
 * Ήταν στατικό αρχείο στο public/ με hardcoded URLs και χειρόγραφη λίστα
 * projects. Τώρα παράγεται από το `site` (astro.config.mjs) και από τα ίδια τα
 * content collections, ώστε να μη χρειάζεται να θυμάται κανείς να το ενημερώσει.
 *
 * Κανόνας ιδιοκτήτη: email ναι, τηλέφωνο όχι (εμφανίζεται μόνο στο /contact).
 */
export const GET: APIRoute = async ({ site: origin }) => {
	// Χωρίς trailing slash, όπως ακριβώς τα canonical URLs του build.
	const url = (path: string) => new URL(path, origin).href;

	const services = nav[0].children ?? [];
	const projects = await getProjects();
	const posts = await getPosts();

	const serviceBlurbs: Record<string, string> = {
		'/kataskevi-eshop':
			'B2C & B2B σε WooCommerce, custom ή CS-Cart, με συνδέσεις σε ERP, courier και Skroutz.',
		'/kataskevi-istoselidon':
			'γρήγορες, custom σελίδες με SEO από την πρώτη γραμμή κώδικα.',
		'/seo':
			'on-page, technical και περιεχόμενο, μαζί με βελτιστοποίηση για τις AI αναζητήσεις (AEO/GEO).',
		'/email-marketing':
			'αυτοματισμοί για εγκαταλελειμμένα καλάθια, welcome series και newsletters.',
		'/diafimisi': 'Google Search & Shopping, Meta ads και μηνιαίο reporting.',
		'/software-development': 'αυτοματισμοί, dashboards και συνδέσεις συστημάτων.',
	};

	const body = `# ${site.name}

> Ψηφιακή ομάδα στην Ελλάδα: κατασκευή e-shop και ιστοσελίδων, SEO & AEO, email marketing, Google & Meta ads και custom web εφαρμογές. Δουλεύουμε πανελλαδικά. Μιλάς με αυτόν που γράφει τον κώδικα.

## Υπηρεσίες

${services
	.map((s) => `- [${s.title}](${url(s.slug)})${serviceBlurbs[s.slug] ? `: ${serviceBlurbs[s.slug]}` : ''}`)
	.join('\n')}
- [Όλες οι υπηρεσίες](${url('/services')})

## Portfolio

- [Case studies](${url('/portfolio')})
${projects.map((p) => `- [${p.data.name}](${url(`/portfolio/${p.id}`)}): ${p.data.tagline}`).join('\n')}

## Blog

- [Blog](${url('/blog')}): άρθρα για e-commerce, SEO, UX/UI και CRO.
${posts.map((p) => `- [${p.data.title}](${url(`/blog/${p.id}`)}): ${p.data.excerpt}`).join('\n')}

## Εταιρεία

- [Σχετικά](${url('/about')})
- [Πώς δουλεύουμε](${url('/how-we-work')})
- [Επικοινωνία](${url('/contact')})
- [Πολιτική Απορρήτου](${url('/legal')})

## Επικοινωνία

- Email: ${site.contact.email}
- Website: ${url('/')}
`;

	return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
