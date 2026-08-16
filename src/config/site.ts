/**
 * Central brand configuration — the single source of truth for everything
 * about the business that is not page copy.
 *
 * NOTE: the absolute origin is NOT defined here. It lives in astro.config.mjs
 * (`SITE_URL`) and is read at build time via `Astro.site`, so canonical URLs,
 * OG tags, the sitemap, robots.txt and llms.txt can never drift apart.
 */

export const site = {
	name: 'phpixel',
	tagline: 'From idea to pixel and code',
	description:
		'Κατασκευή e-shop με WooCommerce ή custom, ιστοσελίδες, SEO και email marketing. Δουλεύουμε με επιχειρήσεις σε όλη την Ελλάδα. Μιλάς με αυτόν που γράφει τον κώδικα.',
	lang: 'el',
	locale: 'el_GR',
	// ===== Contact =====
	// Κανόνας ιδιοκτήτη: το τηλέφωνο εμφανίζεται ΜΟΝΟ στο /contact.
	// Δεν μπαίνει σε footer, schema, llms.txt ή σελίδες κατάστασης.
	contact: {
		phone: '6977383488',
		phoneDisplay: '697 738 3488',
		email: 'info@phpixel.gr',
	},
	// Συγγραφέας των blog posts — εμφανίζεται στο author block και στο Article schema.
	blogAuthor: {
		type: 'Person',
		name: 'Αποστόλης Κωστόπουλος',
		oneLiner: 'Σχεδιάζω και φτιάχνω e-shop και ιστοσελίδες που πουλάνε.',
	},
	socials: {
		facebook: 'https://facebook.com/phpixel',
		instagram: 'https://instagram.com/phpixel',
		linkedin: 'https://linkedin.com/company/phpixel',
	},
	analytics: {
		// Google Analytics 4 — τρέχει υπό Consent Mode v2 (βλ. CookieConsent.astro).
		gaId: 'G-H58TJPTQM4',
	},
} as const;

/** Feature flags για sections που περιμένουν πραγματικό περιεχόμενο. */
export const SHOW_TESTIMONIALS = false;
export const SHOW_TEAM = false;

export const footerSocials = [
	{ name: 'Facebook', url: site.socials.facebook, icon: 'mdi:facebook' },
	{ name: 'Instagram', url: site.socials.instagram, icon: 'mdi:instagram' },
	{ name: 'LinkedIn', url: site.socials.linkedin, icon: 'mdi:linkedin' },
];

/** Σειρά εμφάνισης στο κύριο μενού. `children` = dropdown. */
export const nav = [
	{
		title: 'Υπηρεσίες',
		slug: '/services',
		children: [
			{ title: 'Κατασκευή E-shop', slug: '/kataskevi-eshop' },
			{ title: 'Ιστοσελίδες & Landing Pages', slug: '/kataskevi-istoselidon' },
			{ title: 'SEO & AEO', slug: '/seo' },
			{ title: 'Email Marketing', slug: '/email-marketing' },
			{ title: 'Google Ads & Social', slug: '/diafimisi' },
			{ title: 'Custom Εφαρμογές', slug: '/software-development' },
		],
	},
	{ title: 'Portfolio', slug: '/portfolio' },
	{ title: 'Πώς Δουλεύουμε', slug: '/how-we-work' },
	{ title: 'Blog', slug: '/blog' },
	{ title: 'Σχετικά', slug: '/about' },
];

export const footerLists = [
	{
		title: 'Υπηρεσίες',
		items: nav[0].children!,
	},
	{
		title: 'Εταιρεία',
		items: [
			{ title: 'Σχετικά', slug: '/about' },
			{ title: 'Portfolio', slug: '/portfolio' },
			{ title: 'Blog', slug: '/blog' },
			{ title: 'Πώς Δουλεύουμε', slug: '/how-we-work' },
			{ title: 'Επικοινωνία', slug: '/contact' },
		],
	},
	{
		title: 'Νομικά',
		items: [{ title: 'Πολιτική Απορρήτου', slug: '/legal' }],
	},
];

/**
 * Ετικέτες breadcrumb ανά path segment. Ό,τι δεν υπάρχει εδώ πέφτει πίσω
 * στον τίτλο της σελίδας (τελευταίο crumb) ή στο ίδιο το segment.
 */
export const crumbLabels: Record<string, string> = {
	services: 'Υπηρεσίες',
	'kataskevi-eshop': 'Κατασκευή E-shop',
	'kataskevi-istoselidon': 'Ιστοσελίδες & Landing Pages',
	seo: 'SEO & AEO',
	'email-marketing': 'Email Marketing',
	diafimisi: 'Google Ads & Social',
	'software-development': 'Custom Εφαρμογές',
	portfolio: 'Portfolio',
	'how-we-work': 'Πώς Δουλεύουμε',
	blog: 'Blog',
	about: 'Σχετικά',
	contact: 'Επικοινωνία',
	legal: 'Πολιτική Απορρήτου',
};

export interface PageSeo {
	title: string;
	description: string;
	/** true μόνο για την αρχική, όπου ο τίτλος δεν παίρνει το « | phpixel» suffix από εδώ. */
	image?: string;
}

/**
 * Titles & meta descriptions ανά σελίδα, keyed by page id.
 * Οι τίτλοι γράφονται ολόκληροι (μαζί με το « | phpixel») ώστε να φαίνεται
 * ακριβώς τι θα δει ο χρήστης στα αποτελέσματα αναζήτησης.
 */
export const seo: Record<string, PageSeo> = {
	home: {
		title: 'Κατασκευή E-shop & Ιστοσελίδων που Πουλάνε | phpixel',
		description: site.description,
	},
	about: {
		title: 'Ποιος Είμαι | phpixel',
		description:
			'Πίσω από την phpixel υπάρχει ένας άνθρωπος: ο Αποστόλης Κωστόπουλος, με 10+ χρόνια στο e-commerce. Δες πώς δουλεύω, τι αναλαμβάνω και τι όχι.',
	},
	services: {
		title: 'Υπηρεσίες: Κατασκευή E-shop, Ιστοσελίδων, SEO & Marketing | phpixel',
		description:
			'Όλες οι υπηρεσίες της phpixel: κατασκευή e-shop και ιστοσελίδων, SEO & AEO, email marketing, Google Ads και custom εφαρμογές, με φροντίδα μετά το launch.',
	},
	eshop: {
		title: 'Κατασκευή E-shop με WooCommerce ή Custom Λύση | phpixel',
		description:
			'Κατασκευή e-shop για B2C & B2B: WooCommerce, custom ή CS-Cart. Σύνδεση με ERP, courier και Skroutz. Στημένο για πωλήσεις, όχι απλώς για να υπάρχει.',
	},
	websites: {
		title: 'Κατασκευή Ιστοσελίδων & Landing Pages | phpixel',
		description:
			'Γρήγορες, καθαρές ιστοσελίδες και landing pages που εξηγούν τι κάνεις και φέρνουν πελάτες. Custom σχεδιασμός και SEO από την πρώτη γραμμή κώδικα.',
	},
	seo: {
		title: 'SEO & Προώθηση Ιστοσελίδων: Google + AI Αναζήτηση (AEO) | phpixel',
		description:
			'SEO και προώθηση ιστοσελίδων για e-shop και εταιρικά sites: on-page, technical και περιεχόμενο. Μαζί με AEO/GEO, βελτιστοποίηση για τα AI εργαλεία που πλέον προτείνουν επιχειρήσεις.',
	},
	emailMarketing: {
		title: 'Email Marketing για E-shop: Flows, Καλάθια, Newsletters | phpixel',
		description:
			'Αυτοματισμοί email που φέρνουν πελάτες πίσω: εγκαταλελειμμένα καλάθια, welcome series, newsletters. Στήσιμο, κείμενα και μετρήσιμα αποτελέσματα.',
	},
	ads: {
		title: 'Διαχείριση Google Ads & Social Media Διαφήμιση | phpixel',
		description:
			'Διαχείριση Google Ads (Search & Shopping), Meta ads και οργανικού περιεχομένου. Μετρήσιμο αποτέλεσμα: ξέρεις πάντα τι ξοδεύεις και τι σου φέρνει πίσω.',
	},
	software: {
		title: 'Custom Web Εφαρμογές & Αυτοματισμοί | phpixel',
		description:
			'Custom εφαρμογές, dashboards και αυτοματισμοί για επιχειρήσεις: συνδέουμε ERP, e-shop και συστήματα που δεν μιλάνε μεταξύ τους, και κόβουμε τη χειροκίνητη δουλειά.',
	},
	portfolio: {
		title: 'Portfolio: Έργα Ιστοσελίδων & E-shop | phpixel',
		description:
			'Δες ένα δείγμα από τα projects μας: e-shops, ιστοσελίδες και custom εφαρμογές για ελληνικές επιχειρήσεις. Όλα live. Μπες και δες τα μόνος σου.',
	},
	howWeWork: {
		title: 'Πώς Δουλεύουμε: Η Διαδικασία μας | phpixel',
		description:
			'Από την πρώτη κουβέντα μέχρι το launch και μετά: πώς δουλεύουμε βήμα βήμα, με preview links, καθαρό χρονοδιάγραμμα και χωρίς εκπλήξεις.',
	},
	blog: {
		title: 'Blog: Άρθρα για E-commerce, SEO & Ιστοσελίδες | phpixel',
		description:
			'Πρακτικά άρθρα για e-commerce, SEO, UX/UI, CRO και digital marketing, γραμμένα απλά για ιδιοκτήτες επιχειρήσεων και e-shop, όχι για developers.',
	},
	contact: {
		title: 'Επικοινωνία | phpixel',
		description:
			'Πες μας για το project σου: ιδέα, πρόβλημα ή site που δεν αποδίδει. Απαντάμε μέσα σε μία εργάσιμη, χωρίς δεσμεύσεις.',
	},
	legal: {
		title: 'Πολιτική Απορρήτου | phpixel',
		description:
			'Η πολιτική απορρήτου της phpixel: πώς συλλέγουμε, χρησιμοποιούμε και προστατεύουμε τα προσωπικά σου δεδομένα, με βάση τον GDPR και τη χρήση cookies.',
	},
	success: {
		title: 'Το Μήνυμα Στάλθηκε | phpixel',
		description: 'Το μήνυμά σου στάλθηκε με επιτυχία.',
	},
	fail: {
		title: 'Αποτυχία Αποστολής | phpixel',
		description: 'Κάτι πήγε στραβά. Δοκίμασε ξανά ή στείλε μας email.',
	},
	notFound: {
		title: '404: Η Σελίδα Δεν Βρέθηκε | phpixel',
		description: 'Η σελίδα που ψάχνεις δεν υπάρχει ή έχει μετακινηθεί.',
	},
};
