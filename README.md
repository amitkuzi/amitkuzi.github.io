# amitkuzi.github.io

The GitHub Pages hub for **[Amit Kuzi](https://amitkuzi.com)** — Software Architect & Engineering
Consultant, Holon, Israel.

Live at <https://amitkuzi.github.io/>.

## What this repo is

A single static page — no build step, no dependencies, no runtime fetches. It exists to close the
404 on the root of a hostname that carries the exact brand name, and to point every asset back at
one entity anchor: `https://amitkuzi.com/#amit-kuzi`.

Three sections: **Tools** (the live apps), **Source** (own repositories, no forks), **Printed**
(published 3D models).

## Files

| File | Purpose |
|------|---------|
| `index.html` | The whole page. Styles inline, toolpath thumbnails drawn in ~40 lines of JS. |
| `projects.json` | Source of truth for the Source section. `status`: `live` / `hold` / `hidden`. |
| `models.json` | Source of truth for the Printed section. One entry per design, `links` is an array. |
| `robots.txt` | **Host-root** robots — governs `/OneWall/` and `/localViewer/` too. |
| `sitemap.xml` | All four indexable URLs on this host. |
| `llms.txt` | Plain-language summary for language models. |

## Rules that keep this page honest

- The markup is written out statically. The JSON files are the source of truth for humans editing
  the page; nothing is fetched at run time, so the page is fully crawlable without JavaScript.
- **Ember (`#e4632d`) appears once per screen.** Launch buttons and section numbers. Nothing else.
- **No engagement counts** on models — a hardcoded download count is wrong the day after it is written.
- **No hotlinked platform thumbnails.** Thumbnails are drawn as toolpath contours.
- **No repo without a real description.** Fix the description on GitHub first, then flip `status`
  to `live` in `projects.json`.
- The job-title string is `Software Architect & Engineering Consultant`, in exactly three places:
  `<title>`, `.role`, and the `Person` JSON-LD. If it ever changes, change all three.

## Deploy

Settings → Pages → Source: `main`, folder `/ (root)`. Then add the property to Search Console
(HTML-file verification, committed here).
"# amitkuzi.github.io" 
