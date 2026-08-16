/**
 * Helpers γύρω από τα content collections, ώστε η ταξινόμηση και το φιλτράρισμα
 * να ορίζονται μία φορά και όχι σε κάθε σελίδα.
 */
import { getCollection, type CollectionEntry } from 'astro:content';

export type ProjectEntry = CollectionEntry<'portfolio'>;
export type PostEntry = CollectionEntry<'blog'>;

/** Όλα τα projects, με τη σειρά που όρισε το `order` του καθενός. */
export async function getProjects(): Promise<ProjectEntry[]> {
	const entries = await getCollection('portfolio');
	return entries.sort((a, b) => a.data.order - b.data.order);
}

/** Δημοσιευμένα άρθρα, νεότερο πρώτο. */
export async function getPosts(): Promise<PostEntry[]> {
	const entries = await getCollection('blog', ({ data }) => !data.draft);
	return entries.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());
}

/** Testimonials με τη σειρά τους. Η προβολή τους ελέγχεται από το SHOW_TESTIMONIALS. */
export async function getTestimonials() {
	const entries = await getCollection('testimonials');
	return entries.sort((a, b) => a.data.order - b.data.order);
}

/** Ένα νομικό κείμενο (privacy / terms). */
export async function getLegalDoc(doc: 'privacy' | 'terms') {
	const entries = await getCollection('legal', (e) => e.data.doc === doc);
	return entries[0];
}
