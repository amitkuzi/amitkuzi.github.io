# amitkuzi.github.io

The GitHub Pages hub for **[Amit Kuzi](https://amitkuzi.com)** — Software Architect & Engineering
Consultant, Holon, Israel.

Live at <https://amitkuzi.github.io/>.

## What this repo is

A single static page — no build step, no dependencies, no runtime fetches. It exists to close the
404 on the root of a hostname that carries the exact brand name, and to point every asset back at
one entity anchor: `https://amitkuzi.com/#amit-kuzi`.

Four sections: **Tools** (the live apps), **Source** (own repositories, no forks), **Printed**
(published 3D models), **Skills** (Agent Skills for Claude and compatible platforms).

## Files

| File | Purpose |
|------|---------|
| `index.html` | The whole page. Styles inline, toolpath thumbnails drawn in ~40 lines of JS. |
| `projects.json` | Source of truth for the Source section. `status`: `live` / `hold` / `hidden`. |
| `models.json` | Source of truth for the Printed section. One entry per design, `links` is an array. |
| `skills.json` | Generated catalogue for the Skills section, synced from github.com/amitkuzi/skills. |
| `scripts/sync-skills.mjs` | Fetches top-level public skills from branch `main` and regenerates the catalogue and HTML cards. |
| `robots.txt` | **Host-root** robots — governs `/OneWall/` and `/localViewer/` too. |
| `sitemap.xml` | All four indexable URLs on this host. |
| `llms.txt` | Plain-language summary for language models. |

## Rules that keep this page honest

- The markup is written out statically. Projects and models are hand-edited; Skills are regenerated
  every six hours by GitHub Actions from each top-level `SKILL.md` on `amitkuzi/skills@main`.
  Nothing is fetched at run time, so the page is fully crawlable without JavaScript.
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

## Sync Skills

The `Sync public skills` workflow runs every six hours and can also be started manually. It reads
the `name` and `description` fields from every top-level `<skill>/SKILL.md` on the public repository's
`main` branch, updates `skills.json` and the marked block in `index.html`, and commits only when the
generated content changed.

Run the same checks locally with:

```powershell
node --test scripts/sync-skills.test.mjs
node scripts/sync-skills.mjs
```
"# amitkuzi.github.io" 
