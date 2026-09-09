# vpc-website
Vantage Point Cleaning delivers professional, consistent, and quality-controlled residential cleaning, building trust through strong relationships, proven partners, social proof, and genuine word of mouth.

## Project structure

```
serve.sh                  runs the local dev server (see below)
site/                     the website (plain HTML/CSS/JS, no build step)
  index.html, about.html, contact.html, careers.html,
  service-areas.html, signature-home-care.html,
  estate-care.html                        the seven pages
  assets/css/style.css                    shared stylesheet (design tokens + components)
  assets/js/main.js                       nav dropdown, mobile menu, FAQ accordion, form handling
  assets/img/                             logo/emblem SVGs and favicons
  dev-server.js                           local dev server with live reload (see below)

Vantage Point Cleaning Design System/     design tokens, component reference and screenshots
                                          the site was built against, for comparison
docs/                     operating-system volumes and supporting business docs
brand/                    client-supplied brand guidelines and source logo files
```

## Running the site locally

The site is static HTML/CSS/JS — no build step and no dependencies to install.

```bash
./serve.sh          # serves on http://localhost:8123, with live reload
./serve.sh 3000      # or pass a port
```

Requires only [Node.js](https://nodejs.org/) (no `npm install` needed). `serve.sh` is a
thin wrapper around `site/dev-server.js`; edit any file under `site/` and open browser
tabs auto-refresh. See `site/dev-server.js` for how it works.
