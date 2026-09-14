# ExampleCorp public website

The production public site is a Nuxt 3 build-time static application. It is not deployed from the legacy Vite `index.html` entry.

## Rendering contract

- `nuxt generate` places the page title, description, canonical, H1, primary copy, internal links, and JSON-LD into individual HTML files before deployment.
- Nginx serves the generated files directly; public page requests do not execute Node or Vue SSR in production.
- JavaScript hydrates search, filters, forms, galleries, analytics, and other interactions. It is progressive enhancement, not the source of indexable page content.
- Product categories use crawlable directory URLs such as `/id/products/category/transformer`; the former `?category=` form permanently redirects.
- Product details use name-only URLs such as `/en/products/Low-Voltage-Withdrawable-Switchgear.html`; no database ID is exposed in the public path.
- Indonesian, English, and Simplified Chinese use `/id/`, `/en/`, and `/zh-cn/`, with self-canonical URLs and reciprocal hreflang links.

## Discovery endpoints

- `/robots.txt`
- `/llms.txt`
- `/sitemap.xml`
- `/sitemaps/{locale}/{type}.xml`

## Development

```bash
npm ci
npm run dev
```

The public Nuxt development server listens at `http://127.0.0.1:5173`; the separate management Vite app remains at `http://127.0.0.1:5174`. The local FastAPI service is expected at `http://127.0.0.1:8000`. Set `NUXT_API_INTERNAL_BASE` to use another internal origin.

## Verification

```bash
npm run typecheck
npm run generate
NUXT_PUBLIC_SITE_URL=http://127.0.0.1:5173 \
python3 -m http.server 4173 --directory .output/public
npm run verify:seo
```

`verify:seo` walks every sitemap URL and checks status codes, visible initial HTML, crawlable links, unique metadata, canonical URLs, hreflang, robots directives, JSON-LD, 404 behavior, and legacy redirects.

For a production container, the verifier can fetch through an internal origin while requiring every public URL, canonical, sitemap entry, and hreflang target to use the formal HTTPS origin:

```bash
SEO_BASE_URL=http://127.0.0.1:7200 \
SEO_EXPECTED_SITE_URL=https://example.com \
npm run verify:seo:production
```

The production gate rejects HTTP, localhost, IP-address, explicit-port, and placeholder canonical origins.

GEO content completeness is audited separately because technical crawlability cannot prove that business evidence exists:

```bash
npm run audit:geo
GEO_REQUIRE_COMPLETE=1 npm run audit:geo
```

Strict mode requires at least 95% coverage for professional summaries, standards, markets, limits, authors, and technical reviewers, plus 100% evidence-link coverage. It never invents or backfills business claims.

## Production

The Docker image runs Nginx and serves `.output/public`. Docker Compose supplies the FastAPI URL and canonical site URL at build time. A static rebuild is required after publishing products, translations, solutions, cases, or articles.

Do not deploy `frontend/index.html`, `src/main.ts`, or `src/router/` as the public website. They are legacy migration artifacts and are not production entry points. The obsolete standalone Vite configuration has been removed so local development also enters through Nuxt.
