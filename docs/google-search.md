# Get uthini.com on Google

The site already allows indexing (`robots.txt`, sitemap, canonical URLs). Google still needs to **discover** and **index** the site — especially after a new domain or migration.

## 1. Google Search Console (required)

1. Open [Google Search Console](https://search.google.com/search-console)
2. **Add property** → **URL prefix** → `https://uthini.com`
3. **Verify ownership** (pick one):
   - **DNS TXT** record in Cloudflare (recommended): copy the record from Google → DNS → Add TXT
   - **HTML tag**: paste the meta tag Google gives you into `index.html` `<head>`, deploy, then verify
4. After verified: **Sitemaps** → submit `https://uthini.com/sitemap.xml`
5. **URL inspection** → enter `https://uthini.com/` → **Request indexing**

Repeat URL inspection for important pages (`/about.html`, `/services.html`, etc.) if you want them crawled sooner.

## 2. Cloudflare checks

- **SSL/TLS** → Full (strict), site loads on `https://uthini.com`
- **Scrape Shield** → do not block known bots
- **Bot Fight Mode** → if enabled and Google stops crawling, allow verified bots or test with Search Console’s live URL test
- **Under Attack mode** → off unless you need it (can block crawlers)

## 3. What we deploy for SEO

| File | Purpose |
|------|---------|
| `robots.txt` | Allows all crawlers, points to sitemap |
| `sitemap.xml` | Lists public pages |
| Each page | `canonical`, `meta description`, `robots: index, follow` |
| `_redirects` | `www` → apex, `/index.html` → `/` |

## 4. Timeline

New or migrated sites often take **a few days to several weeks** to appear in search. Search Console “Pages” shows indexed vs not indexed.

## 5. Optional

- [Bing Webmaster Tools](https://www.bing.com/webmasters) — submit the same sitemap
- Keep business name and address consistent (footer matches schema on homepage)
