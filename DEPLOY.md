# Deploy — Cloudflare Pages

Το site είναι πλήρως στατικό. Το Astro χτίζει στο `dist/` και το Cloudflare
Pages το σερβίρει απευθείας. Το μόνο κομμάτι που τρέχει server-side είναι η
φόρμα επικοινωνίας, ως Pages Function.

## Ρυθμίσεις του Pages project

| Πεδίο | Τιμή |
| --- | --- |
| Framework preset | Astro (ή None) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node version | 20 ή νεότερο (`NODE_VERSION=20`) |

Το `functions/` στη ρίζα ανιχνεύεται αυτόματα: το `functions/api/contact.ts`
γίνεται το endpoint `/api/contact`.

## Environment variables

Στο **Settings → Environment variables** του Pages project:

| Μεταβλητή | Τύπος | Τι είναι |
| --- | --- | --- |
| `RESEND_API_KEY` | Secret | API key του [Resend](https://resend.com), για την αποστολή της φόρμας |
| `CONTACT_TO` | Plain text | Πού φτάνει το μήνυμα, π.χ. `info@phpixel.gr` |
| `CONTACT_FROM` | Plain text | Ο αποστολέας, σε domain επιβεβαιωμένο στο Resend, π.χ. `phpixel <site@phpixel.gr>` |
| `NODE_VERSION` | Plain text | `20` |
| `PUBLIC_SITE_URL` | Plain text (προαιρετικό) | Παρακάμπτει το origin του build. Χρειάζεται μόνο αν το site σερβιριστεί από άλλο domain. |

Χωρίς τις τρεις πρώτες, η φόρμα δεν σπάει τη σελίδα: κάνει redirect στο `/fail`
και γράφει το λάθος στα logs της function.

### Γιατί Resend και όχι SMTP

Η παλιά υλοποίηση έστελνε με `nodemailer` πάνω από SMTP, σε Vercel serverless
function (Node runtime). Το Cloudflare Workers runtime δεν είναι Node και η
αποστολή SMTP μέσω raw sockets δεν είναι αξιόπιστη εκεί, οπότε η αποστολή
γίνεται πλέον με ένα απλό `fetch` σε HTTP API.

Αν προτιμηθεί άλλος πάροχος (Brevo, Postmark, Mailgun), αλλάζει μόνο το
`fetch` μέσα στο `functions/api/contact.ts`.

## Custom domain

1. **Custom domains → Set up a domain** → `phpixel.gr` και `www.phpixel.gr`.
2. Το DNS του domain πρέπει να είναι στο Cloudflare.
3. Μετά την ενεργοποίηση, να αφαιρεθεί το παλιό Vercel deployment ώστε να μη
   σερβίρεται το ίδιο περιεχόμενο από δύο hosts.

Το `astro.config.mjs` έχει το production origin (`https://phpixel.gr`) hardcoded
ως fallback. Αν αλλάξει το domain, αλλάζει εκεί ή με `PUBLIC_SITE_URL`.

## Redirects & headers

- `public/_redirects` — τα 301 από τα παλιά URLs. Γράφονται εδώ και όχι στο
  `redirects` του Astro, γιατί σε στατικό build ο Astro βγάζει μόνο
  `<meta refresh>` stubs, που δεν περνούν link equity.
- `public/_headers` — security headers και cache για τα hashed assets.

## Preview deployments

Κάθε branch παίρνει δικό του preview URL. Τα preview builds:

- βγάζουν `<meta name="robots" content="noindex, nofollow">` (βλ. `BaseHead.astro`),
- χρησιμοποιούν το δικό τους `CF_PAGES_URL` ως origin, ώστε να μη δηλώνουν
  canonical URLs του production.

Ο έλεγχος γίνεται με `CF_PAGES_BRANCH !== 'main'`. Αν ο production branch
μετονομαστεί, πρέπει να αλλάξει και στα δύο σημεία (`astro.config.mjs`,
`BaseHead.astro`).

## Τοπικά

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run preview  # σερβίρει το dist/
```

Το `npm run preview` του Astro **δεν** τρέχει τις Pages Functions, οπότε η φόρμα
επικοινωνίας δεν δουλεύει εκεί. Για να δοκιμαστεί τοπικά ολόκληρο το setup:

```bash
npx wrangler pages dev dist
```
