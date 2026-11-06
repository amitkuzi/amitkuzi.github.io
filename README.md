# amitkuzi.github.io

The GitHub Pages portfolio for **[Amit Kuzi](https://amitkuzi.com)**, Software Architect,
Holon, Israel. Open to software engineering and architecture roles.

Live at <https://amitkuzi.github.io/>.

## Structure

A static page with no build step or browser data requests. Four sections: **Tools**,
**Source**, **Printed** and **Skills**. Keep visible copy, search/social metadata and
Person JSON-LD consistent with the role `Software Architect`.

| File | Purpose |
|------|---------|
| `index.html` | Page, styles, structured data and masthead contour. |
| `projects.json` | Existing project registry and app metadata. |
| `projects-reviewed.json` | Reviewed source repositories and curated descriptions. |
| `pinned.json` | Reviewed, public, non-fork profile pins in GitHub profile order. |
| `models.json` | Seven original designs, with links and provenance. |
| `skills-reviewed.json` | Authorship review and explicit skill allowlist. |
| `skills.json` | Generated reviewed skill catalogue. |
| `scripts/sync-skills.mjs` | Generates Skills from one immutable commit on `amitkuzi/skills@main`. |
| `scripts/sync-pinned.mjs` | Generates reviewed Source cards using authenticated GitHub GraphQL through `gh`. |
| `llms.txt` | Plain-language site summary. |
| `release.json` | Canonical release version and date; synchronized with footer and changelog. |
| `CHANGELOG.md` | Release notes. |
| `robots.txt`, `sitemap.xml` | Host-wide indexing settings. |

## Authorship and content

New skills and new profile pins are withheld until reviewed. Before adding an entry,
check its README, license, origin and any upstream attribution. An account-owned repository
or a non-fork flag alone does not establish authorship. Preserve legitimate original work.
The redistributed `grill-me` skill is Matt Pocock's work and is excluded. The mixed skills
repository is omitted from Source; individually reviewed skills remain in Skills.

The skills review retains the seven existing entries credited to Amit Kuzi in the source
repository's README and licenses. Missing reviewed manifests or an invalid review list fail
before replacing the generated page/catalogue. Repository descriptions are curated locally,
so profile metadata cannot silently restore outdated service marketing. Private repositories
and forks are excluded even when listed in the review file. Unpinned projects leave Source.

Tools and Printed cards are hand-edited; keep the model cards and `models.json` consistent.
Printed includes seven original designs. Two were verified on Printables on 2026-11-06: the
Centauri Carbon CANVAS Top Hat and Poop Collector, both by Amit Kuzi under CC BY 4.0
on Printables. Their exact MakerWorld listings are also linked; no generic profile links are used.
OneWall is restored based on its original parametric source, Git authorship history and
publication records explicitly naming Amit Kuzi as the original designer. Its current platform
license fields were not freshly confirmed, so its card carries no license badge.
Amit Kuzi explicitly confirmed on 2026-11-06 that all five earlier models are his original
work and authorized restoration. Their existing listing URLs are preserved, with the
confirmation recorded in `models.json`. No unverified platform licenses are asserted.
Verify origin before adding a model listing; avoid blanket authorship claims.

## Review updates locally

```powershell
node --test scripts/sync-skills.test.mjs scripts/sync-pinned.test.mjs
node scripts/sync-skills.mjs
node scripts/sync-pinned.mjs
```

Skills use public GitHub data. Pin sync uses existing `gh` authentication or `GH_TOKEN`;
credentials are never saved in catalogue files. Review the resulting diff and preview the
static files before publication.

The existing **Sync skills and pinned repositories** workflow is unchanged: it runs every
six hours and on manual dispatch, tests both sync scripts, refreshes the reviewed catalogues,
commits changed generated files and requests a Pages build. It retains its existing
`contents: write` and `pages: write` permissions. The sync scripts enforce the authored-entry
allowlists; new skills and profile pins cannot appear without a review-file change. Content
updates to already reviewed skills can still flow through the existing scheduled workflow.

## Publication

GitHub Pages uses `main`, folder `/ (root)`. Release **1.1.2**, dated **2026-11-06**, is
recorded in `release.json`. It increments the published 1.1.1 release.
The visible footer and `CHANGELOG.md` carry the same version/date; the existing test command
checks this consistency. Deployment status must be verified separately on the live page.

For each future release, update the canonical metadata, footer and changelog together and
run the checks before publishing. The scheduled workflow is unchanged; maintaining release
metadata for future automatically generated updates remains a release-process responsibility.
