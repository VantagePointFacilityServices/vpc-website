# vpc-website
Vantage Point Cleaning delivers professional, consistent, and quality-controlled residential cleaning, building trust through strong relationships, proven partners, social proof, and genuine word of mouth.

## Project structure

```
site/                     the website (plain HTML/CSS/JS, no build step)
  index.html, about.html, contact.html, careers.html,
  service-areas.html, signature-home-care.html,
  reserve-home-care.html, estate-care.html   the eight pages
  privacy.html, terms.html                   the legal pages (10 pages in all)
  assets/css/style.css                       shared stylesheet (design tokens + components)
  assets/js/main.js                          nav dropdown, mobile menu, FAQ accordion, form handling
  assets/img/                                logo/emblem SVGs and favicons
  dev-server.js                              local dev server with live reload (see below)
  test/                                      Node tests (`npm test`)

docs/                     deployment and operating notes (DEPLOYMENT.md, KNOWLEDGE.md);
                          the business docs live in vpos (see docs/KNOWLEDGE.md)
brand/                    client-supplied brand guidelines and source logo files
```

## Running the site locally

The site is static HTML/CSS/JS — no build step and no dependencies to install.

```bash
node site/dev-server.js        # serves on http://localhost:8080, with live reload
node site/dev-server.js 3000   # or pass a port (or set PORT)
npm test                       # runs the Node tests; no npm install needed
```

Requires only [Node.js](https://nodejs.org/). Edit any file under `site/` and open browser
tabs auto-refresh. See `site/dev-server.js` for how it works.
