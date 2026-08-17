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
| `MAILER_URL` | Plain text | Το URL του PHP relay στον cPanel, π.χ. `https://mailer.phpixel.gr/send.php` |
| `MAILER_TOKEN` | Secret | Το κοινό μυστικό· ίδιο με το `MAILER_TOKEN` μέσα στο `send.php` |
| `NODE_VERSION` | Plain text | `20` |
| `PUBLIC_SITE_URL` | Plain text (προαιρετικό) | Παρακάμπτει το origin του build. Χρειάζεται μόνο αν το site σερβιριστεί από άλλο domain. |

Χωρίς τις δύο πρώτες, η φόρμα δεν σπάει τη σελίδα: κάνει redirect στο `/fail`
και γράφει το λάθος στα logs της function.

## Η φόρμα επικοινωνίας

Το mail δεν φεύγει από το Cloudflare. Το Workers runtime δεν είναι Node, η θύρα
25 είναι κλειστή και δεν υπάρχει αξιόπιστος SMTP client γι' αυτό — γι' αυτό
έφυγε και η παλιά υλοποίηση με `nodemailer` σε Vercel.

Η αλυσίδα είναι:

```
φόρμα → /api/contact (Pages Function) → https://mailer.phpixel.gr/send.php → info@phpixel.gr
```

Η function κάνει μόνο ένα `fetch` με JSON και το `X-Mailer-Token` header. Το
`send.php` ελέγχει το token, καθαρίζει τα πεδία και καλεί την `mail()`. Επειδή
το `info@phpixel.gr` φιλοξενείται στον ίδιο cPanel server, η παράδοση είναι
τοπική: το μήνυμα δεν βγαίνει ποτέ στο internet, οπότε δεν το αγγίζει SPF/DKIM
ή spam filtering τρίτου.

### Εγκατάσταση του relay

1. Στον cPanel, φτιάξε subdomain `mailer.phpixel.gr` (Domains → Create A New Domain).
2. Στο Cloudflare DNS: `A mailer → 93.174.123.195`, **DNS only**.
3. Άλλαξε το `MAILER_TOKEN` μέσα στο [`server/mailer/send.php`](server/mailer/send.php)
   σε μια μεγάλη τυχαία συμβολοσειρά και ανέβασε το αρχείο στο document root του
   subdomain. Το πραγματικό token δεν μπαίνει ποτέ στο git.
4. Βάλε το ίδιο token ως `MAILER_TOKEN` και το URL ως `MAILER_URL` στα
   environment variables του Pages, και κάνε redeploy.
5. cPanel → **MultiPHP Manager**: το `mailer.phpixel.gr` πρέπει να τρέχει
   **PHP 7.0 ή νεότερη**. Σε παλιότερη, το `send.php` δεν κάνει parse και ο
   server γυρίζει 500 με άδειο body — η φόρμα πάει πάντα στο `/fail`, χωρίς
   άλλη ένδειξη. Αυτό έγινε στο πρώτο στήσιμο· είναι ο πρώτος έλεγχος αν η
   φόρμα σταματήσει να δουλεύει «από μόνη της».

Το AutoSSL πρέπει επίσης να έχει βγάλει πιστοποιητικό για το `mailer.phpixel.gr`
(cPanel → SSL/TLS Status). Το `fetch` των Workers ελέγχει αυστηρά το
πιστοποιητικό: με self-signed, η κλήση πετάει exception και η φόρμα πάει στο
`/fail`. Μόνο το `mailer` χρειάζεται πιστοποιητικό από τον cPanel — τα
`phpixel.gr` και `*.phpixel.gr` δείχνουν στο Cloudflare και το AutoSSL δεν
μπορεί να τα επαληθεύσει.

Ο φάκελος `server/` δεν συμμετέχει στο build του Astro — υπάρχει στο repo μόνο
ως πηγή αλήθειας για ό,τι ζει στον cPanel.

### Έλεγχος

```bash
curl -i -X POST https://mailer.phpixel.gr/send.php \
  -H 'Content-Type: application/json' \
  -H 'X-Mailer-Token: TO_TOKEN_SOU' \
  -d '{"name":"Δοκιμή","email":"test@example.com","message":"δοκιμαστικό"}'
```

`200 {"ok":true}` σημαίνει ότι το relay δουλεύει. `401` = λάθος token, `502` =
η `mail()` απέτυχε (δες τα mail logs του cPanel).

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
