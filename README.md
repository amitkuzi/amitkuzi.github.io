# amitkuzi.github.io

The GitHub Pages hub for **[Amit Kuzi](https://amitkuzi.com)** — Software Architect & Engineering
Consultant, Holon, Israel.

Live at <https://amitkuzi.github.io/>.

## What this repo is

A single static page — no build step, no dependencies, no runtime fetches. It exists to close the
404 on the root of a hostname that carries the exact brand name, and to point every asset back at
one entity anchor: `https://amitkuzi.com/#amit-kuzi`.

Four sections: **Tools** (the live apps), **Source** (public repositories pinned on Amit's GitHub overview), **Printed**
(published 3D models), **Skills** (Agent Skills for Claude and compatible platforms).

## Files

| File | Purpose |
|------|---------|
| `index.html` | The whole page. Styles inline, toolpath thumbnails drawn in ~40 lines of JS. |
| `projects.json` | Existing project registry and app metadata, retained independently of profile pins. |
| `pinned.json` | Generated Source catalogue, mirroring public GitHub overview pins in profile order. |
| `models.json` | Source of truth for the Printed section. One entry per design, `links` is an array. |
| `skills.json` | Generated catalogue for the Skills section, synced from github.com/amitkuzi/skills. |
| `scripts/sync-skills.mjs` | Regenerates Skills from one immutable commit on the skills repository's `main` branch. |
| `scripts/sync-pinned.mjs` | Uses authenticated GitHub GraphQL through `gh` to regenerate the Source cards from public profile pins. |
| `robots.txt` | **Host-root** robots — governs `/OneWall/` and `/localViewer/` too. |
| `sitemap.xml` | All four indexable URLs on this host. |
| `llms.txt` | Plain-language summary for language models. |

## Rules that keep this page honest

- The markup is written out statically. Tools and models are hand-edited; Skills and Source are regenerated
  every six hours by GitHub Actions from `amitkuzi/skills@main` and Amit's public GitHub overview pins.
  Nothing is fetched at run time, so the page is fully crawlable without JavaScript.
- **Ember (`#e4632d`) appears once per screen.** Launch buttons and section numbers. Nothing else.
- **No engagement counts** on models — a hardcoded download count is wrong the day after it is written.
- **No hotlinked platform thumbnails.** Thumbnails are drawn as toolpath contours.
- Source preserves the exact profile pin order, including pinned forks. Missing GitHub descriptions
  are labeled honestly; no repository is dropped just because its description is blank. Private pins
  are never published.
- The job-title string is `Software Architect & Engineering Consultant`, in exactly three places:
  `<title>`, `.role`, and the `Person` JSON-LD. If it ever changes, change all three.

## Deploy

Settings → Pages → Source: `main`, folder `/ (root)`. Then add the property to Search Console
(HTML-file verification, committed here).

## Sync Skills

The `Sync skills and pinned repositories` workflow runs every six hours and can also be started manually. It reads
the `name` and `description` fields from every top-level `<skill>/SKILL.md` on the public repository's
`main` branch, updates `skills.json` and the marked Skills block in `index.html`, and commits only when the
generated content changed. A single commit SHA pins both the tree and every fetched manifest;
`skills.json.sourceCommit` records that commit, while card links and badges show `main`.

The same workflow refreshes `pinned.json` and the marked Source block through GitHub GraphQL,
using the runner's `gh` CLI and built-in `GH_TOKEN` only for that step. Local pin sync uses existing
`gh` authentication (or `GH_TOKEN`/`GITHUB_TOKEN`). Credentials are never written into the catalogue.

Run the same checks locally with:

```powershell
node --test scripts/sync-skills.test.mjs scripts/sync-pinned.test.mjs
node scripts/sync-skills.mjs
node scripts/sync-pinned.mjs
```
"# amitkuzi.github.io" 
