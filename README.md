# phpixel.gr

Εταιρικό site της phpixel: κατασκευή e-shop, ιστοσελίδες, SEO & AEO, email marketing και custom εφαρμογές.

Χτισμένο με [Astro 5](https://astro.build) πάνω στο Odyssey theme. Πλήρως στατικό
build, φιλοξενείται στο Cloudflare Pages. Δες το [DEPLOY.md](./DEPLOY.md).

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Το deploy γίνεται αυτόματα από το Cloudflare Pages σε κάθε push στο `main`.

## Δομή

```
functions/api/contact.ts   Cloudflare Pages Function — το μόνο server-side κομμάτι
public/_redirects          301 από παλιά URLs
public/_headers            security headers + cache
src/
  config/site.ts           brand, nav, footer, SEO titles/descriptions, feature flags
  content.config.ts        schemas των content collections
  content/                 blog, portfolio, testimonials, legal
  layouts/Base.astro       <html>, <head>, skip link, main, scroll reveal
  layouts/Page.astro       Base + Header + Footer (ό,τι χρησιμοποιούν οι σελίδες)
  components/
    head/BaseHead.astro    meta, canonical, OG, JSON-LD, analytics
    core/                  Header, Footer, SkipLink, CookieConsent, Container
    pages/                 μία σελίδα = ένα component (όλο το markup + styles)
    sections/, cards/,     επαναχρησιμοποιήσιμα κομμάτια
    forms/, blog/
  pages/                   ΜΟΝΟ διαδρομές: seo + schema + <Layout><XPage /></Layout>
  utils/schema.ts          JSON-LD builders
  utils/content.ts         helpers για τα collections
  styles/                  reset → theme → typography → global → layout
```

Κανόνας: στο `src/pages/` δεν μπαίνει markup. Μια διαδρομή διαλέγει τα SEO/schema
της και δίνει ένα page component στο layout. Το περιεχόμενο ζει στα collections,
τα brand στοιχεία στο `src/config/site.ts`.
