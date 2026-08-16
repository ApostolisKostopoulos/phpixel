/**
 * JSON-LD structured data builders.
 *
 * Κάθε builder παίρνει το absolute origin (`Astro.site`), ώστε τα `@id` και τα
 * URLs να δείχνουν πάντα στο host από το οποίο σερβίρεται πραγματικά το site.
 *
 * Κανόνας: δεν εκπέμπουμε ποτέ property που δεν στηρίζεται σε πραγματικό
 * στοιχείο. Ειδικά το τηλέφωνο ΔΕΝ μπαίνει πουθενά στο schema (απόφαση
 * ιδιοκτήτη: εμφανίζεται μόνο στο /contact).
 */

import { site } from '../config/site';

type Json = Record<string, unknown>;

// Το build βγάζει URLs χωρίς trailing slash (astro.config.mjs: trailingSlash
// 'never' + build.format 'file'), οπότε κάθε URL που εκπέμπουμε στο JSON-LD
// γράφεται έτσι ακριβώς και ταιριάζει με το canonical.
const abs = (origin: URL | undefined, path: string) => new URL(path, origin).href;

/** `@id` anchors ώστε τα nodes να αναφέρονται μεταξύ τους από σελίδα σε σελίδα. */
export const orgId = (origin?: URL) => `${abs(origin, '/')}#organization`;
export const businessId = (origin?: URL) => `${abs(origin, '/')}#business`;
export const siteId = (origin?: URL) => `${abs(origin, '/')}#website`;

const sameAs = [site.socials.facebook, site.socials.instagram, site.socials.linkedin];

/** Ο εκδότης του site. */
export function organizationSchema(origin?: URL): Json {
	return {
		'@type': 'Organization',
		'@id': orgId(origin),
		name: site.name,
		url: abs(origin, '/'),
		logo: abs(origin, '/favicon.png'),
		email: site.contact.email,
		areaServed: 'GR',
		sameAs,
	};
}

/**
 * Η ίδια η επιχείρηση. Το `ProfessionalService` είναι subtype του
 * `LocalBusiness` και ενισχύει το local SEO (areaServed, address).
 */
export function professionalServiceSchema(origin?: URL): Json {
	return {
		'@type': 'ProfessionalService',
		'@id': businessId(origin),
		name: site.name,
		url: abs(origin, '/'),
		image: abs(origin, '/og/phpixel-social.png'),
		email: site.contact.email,
		areaServed: 'GR',
		address: { '@type': 'PostalAddress', addressCountry: 'GR' },
		sameAs,
	};
}

/** Το site ως σύνολο, συνδεδεμένο με τον εκδότη του. */
export function websiteSchema(origin?: URL): Json {
	return {
		'@type': 'WebSite',
		'@id': siteId(origin),
		url: abs(origin, '/'),
		name: site.name,
		inLanguage: site.lang,
		publisher: { '@id': orgId(origin) },
	};
}

/**
 * Breadcrumbs παραγόμενα από το path. Το `labels` χαρτογραφεί ένα segment στο
 * εμφανιζόμενο όνομά του. Ό,τι δεν βρεθεί πέφτει πίσω στον τίτλο της σελίδας
 * (τελευταίο crumb) ή σε title-cased segment.
 */
export function breadcrumbSchema(
	origin: URL | undefined,
	pathname: string,
	labels: Record<string, string>,
	pageTitle: string
): Json | null {
	const segments = pathname.split('/').filter(Boolean);
	if (segments.length === 0) return null; // χωρίς breadcrumbs στην αρχική

	const items: Json[] = [
		{ '@type': 'ListItem', position: 1, name: 'Αρχική', item: abs(origin, '/') },
	];

	let acc = '';
	segments.forEach((segment, i) => {
		acc += `/${segment}`;
		const isLast = i === segments.length - 1;
		const name =
			labels[segment] ??
			(isLast ? pageTitle : segment.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()));
		items.push({ '@type': 'ListItem', position: i + 2, name, item: abs(origin, acc) });
	});

	return { '@type': 'BreadcrumbList', itemListElement: items };
}

/**
 * Breadcrumbs με ρητά items, όταν η λογική ιεραρχία δεν ταυτίζεται με το URL.
 * Π.χ. το /kataskevi-eshop είναι flat URL αλλά ανήκει κάτω από τις «Υπηρεσίες».
 * Η «Αρχική» μπαίνει αυτόματα πρώτη· το τελευταίο item μπορεί να μην έχει path.
 */
export function breadcrumbItems(
	origin: URL | undefined,
	items: { name: string; path?: string }[]
): Json {
	return {
		'@type': 'BreadcrumbList',
		itemListElement: [{ name: 'Αρχική', path: '/' }, ...items].map((item, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: item.name,
			...(item.path ? { item: abs(origin, item.path) } : {}),
		})),
	};
}

/** Service node για τις σελίδες υπηρεσιών. */
export function serviceSchema(
	origin: URL | undefined,
	opts: { serviceType: string; name?: string; description?: string }
): Json {
	return {
		'@type': 'Service',
		serviceType: opts.serviceType,
		name: opts.name ?? opts.serviceType,
		...(opts.description ? { description: opts.description } : {}),
		areaServed: 'GR',
		provider: { '@id': orgId(origin) },
	};
}

/** Article node για τα blog posts. */
export function articleSchema(
	origin: URL | undefined,
	post: {
		headline: string;
		description?: string;
		datePublished: string | Date;
		dateModified?: string | Date;
		image?: string;
		path: string;
	}
): Json {
	const toISO = (d: string | Date) => {
		const parsed = d instanceof Date ? d : new Date(d);
		return isNaN(parsed.getTime()) ? String(d) : parsed.toISOString().split('T')[0];
	};

	return {
		'@type': 'Article',
		headline: post.headline,
		...(post.description ? { description: post.description } : {}),
		datePublished: toISO(post.datePublished),
		dateModified: toISO(post.dateModified ?? post.datePublished),
		...(post.image ? { image: abs(origin, post.image) } : {}),
		mainEntityOfPage: abs(origin, post.path),
		inLanguage: site.lang,
		author: {
			'@type': site.blogAuthor.type,
			name: site.blogAuthor.name,
			url: abs(origin, '/'),
		},
		publisher: { '@id': orgId(origin) },
	};
}

/** FAQ rich results. Το `a` πρέπει να είναι απλό κείμενο, όχι HTML. */
export function faqSchema(items: { q: string; a: string }[]): Json | null {
	if (items.length === 0) return null;
	return {
		'@type': 'FAQPage',
		inLanguage: site.lang,
		mainEntity: items.map((i) => ({
			'@type': 'Question',
			name: i.q,
			acceptedAnswer: { '@type': 'Answer', text: i.a },
		})),
	};
}

/** CreativeWork node για τα case studies του portfolio. */
export function caseStudySchema(
	origin: URL | undefined,
	project: { name: string; description: string; path: string; image?: string; year: number }
): Json {
	return {
		'@type': 'CreativeWork',
		name: project.name,
		description: project.description,
		url: abs(origin, project.path),
		...(project.image ? { image: abs(origin, project.image) } : {}),
		dateCreated: String(project.year),
		inLanguage: site.lang,
		creator: { '@id': orgId(origin) },
	};
}

/** Τυλίγει τα nodes μιας σελίδας σε ένα ενιαίο `@graph`. */
export function graph(nodes: (Json | null | undefined)[]): string {
	return JSON.stringify({
		'@context': 'https://schema.org',
		'@graph': nodes.filter(Boolean),
	});
}
