import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content collections — η μοναδική πηγή αλήθειας για ό,τι είναι «περιεχόμενο»
 * και όχι σχεδιασμός: άρθρα, case studies, testimonials, νομικά κείμενα.
 *
 * Ο σχεδιασμός των σελίδων ζει στο `src/components/pages/`, οι διαδρομές στο
 * `src/pages/`. Έτσι το περιεχόμενο αλλάζει χωρίς να πειραχτεί κώδικας.
 */

// ---------------------------------------------------------------------------
// Blog — άρθρα σε MDX. Το `draft: true` τα κρύβει από λίστες, sitemap και feeds.
// ---------------------------------------------------------------------------
const blog = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
		/** Σύντομος title tag όταν ο τίτλος του άρθρου είναι πολύ μακρύς για τα SERPs. */
		metaTitle: z.string().optional(),
		description: z.string(),
		excerpt: z.string(),
		publishDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		featuredImage: z.string().optional(),
		canonicalURL: z.string().optional(),
		tags: z.array(z.string()).default([]),
		draft: z.boolean().default(false),
	}),
});

// ---------------------------------------------------------------------------
// Portfolio — ένα YAML ανά project. Πηγή: phpixel-case-study-questionnaire.xlsx.
// Κανόνας: μόνο επιβεβαιωμένα γεγονότα. `metrics` και `quote` μπαίνουν μόνο με
// πραγματικά μετρημένα νούμερα και ρητή άδεια δημοσίευσης.
// ---------------------------------------------------------------------------
const caseSection = z.object({
	/** H2 του section */
	title: z.string(),
	/** Παράγραφοι. Επιτρέπεται inline HTML μόνο για εσωτερικά links. */
	html: z.array(z.string()),
});

const portfolio = defineCollection({
	loader: glob({ pattern: '**/*.yaml', base: './src/content/portfolio' }),
	schema: z.object({
		/** Σειρά εμφάνισης στο /portfolio και στην αρχική. */
		order: z.number(),
		/** Σύντομο anchor id στη σελίδα /portfolio (για deep links). */
		anchor: z.string(),
		name: z.string(),
		/** Σύντομη μονόγραμμη περιγραφή με το αποτέλεσμα (κάρτα + meta). */
		tagline: z.string(),
		/** Παράγραφος για το section της αρχικής + schema description. */
		description: z.string(),
		industry: z.string(),
		category: z.enum(['E-shop', 'Website', 'Web App', 'Landing Page']),
		year: z.number(),
		url: z.string().optional(),
		tags: z.array(z.string()).default([]),
		stack: z.array(z.string()).default([]),
		/** Τι τρέχει σήμερα — εμφανίζεται στο snapshot bar. */
		ongoing: z.string().optional(),
		thumb: z.string(),
		/** Screenshot από designer (webp). Αν λείπει, γίνεται fallback στο thumb. */
		image: z.string().optional(),
		imageAlt: z.string().optional(),
		hero: z.string(),
		heroAlt: z.string(),
		gallery: z
			.array(z.object({ src: z.string(), alt: z.string(), caption: z.string().optional() }))
			.default([]),
		metrics: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
		quote: z
			.object({ text: z.string(), author: z.string(), role: z.string().optional() })
			.optional(),
		/** Color accent για το hero του project (CSS var ή hex). */
		accent: z.string(),
		caseStudy: z.object({
			/** Outcome-first H1 της σελίδας case study */
			heroTitle: z.string(),
			heroSub: z.string(),
			metaTitle: z.string(),
			metaDescription: z.string(),
			client: caseSection.optional(),
			challenge: caseSection.optional(),
			goal: caseSection.optional(),
			approach: caseSection.optional(),
			deliverables: z.array(z.string()).default([]),
			cta: z.object({
				heading: z.string(),
				text: z.string(),
				serviceHref: z.string(),
				serviceLabel: z.string(),
			}),
		}),
	}),
});

// ---------------------------------------------------------------------------
// Testimonials — ΔΕΝ εμφανίζονται μέχρι να υπάρξουν πραγματικές κριτικές
// (flag `SHOW_TESTIMONIALS` στο src/config/site.ts). Το `placeholder: true`
// σημαίνει «δεν είναι αληθινό».
// ---------------------------------------------------------------------------
const testimonials = defineCollection({
	loader: glob({ pattern: '**/*.yaml', base: './src/content/testimonials' }),
	schema: z.object({
		order: z.number(),
		quote: z.string(),
		name: z.string(),
		company: z.string(),
		rating: z.number().min(1).max(5),
		placeholder: z.boolean().default(true),
	}),
});

// ---------------------------------------------------------------------------
// Legal — πολιτική απορρήτου (και μελλοντικά όροι χρήσης). Body σε markdown.
// ---------------------------------------------------------------------------
const legal = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
	schema: z.object({
		doc: z.enum(['privacy', 'terms']),
		title: z.string(),
		updated: z.string(),
	}),
});

export const collections = { blog, portfolio, testimonials, legal };
