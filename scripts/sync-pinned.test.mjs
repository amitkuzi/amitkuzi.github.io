import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadPinnedRepositories, renderPinnedCards, replaceGeneratedSource, syncPinned } from './sync-pinned.mjs';

const profile = { data: { user: { pinnedItems: { nodes: [
  { nameWithOwner: 'amitkuzi/zeta', name: 'zeta', description: null, url: 'https://github.com/amitkuzi/zeta', isFork: false, isPrivate: false, primaryLanguage: null },
  { nameWithOwner: 'amitkuzi/private', name: 'private', description: 'Secret', url: 'https://github.com/amitkuzi/private', isPrivate: true },
  { nameWithOwner: 'amitkuzi/alpha', name: 'alpha', description: 'Real description', url: 'https://github.com/amitkuzi/alpha', isFork: true, isPrivate: false, primaryLanguage: { name: 'C#' } }
] } } } };

const reviewed = [{ nameWithOwner: 'amitkuzi/zeta', description: 'Reviewed description' }, { nameWithOwner: 'amitkuzi/alpha', description: 'Fork excluded' }, { nameWithOwner: 'amitkuzi/private', description: 'Private excluded' }];

test('pinned catalogue excludes forks and private repos and uses reviewed descriptions', async () => {
  const catalogue = await loadPinnedRepositories(async () => profile, reviewed);
  assert.deepEqual(catalogue.repositories.map((repo) => repo.name), ['zeta']);
  assert.equal(catalogue.repositories[0].description, 'Reviewed description');
});

test('incomplete GraphQL data fails before replacing the Source section', async () => {
  await assert.rejects(loadPinnedRepositories(async () => ({ data: { user: null } }), reviewed), /incomplete/);
  await assert.rejects(loadPinnedRepositories(async () => ({ ...profile, errors: [{ message: 'partial failure' }] }), reviewed), /incomplete/);
});

test('pinned cards escape remote text and show an honest missing-description fallback', () => {
  const html = renderPinnedCards([{ name: '<name>', repo: 'https://example.com/?x=1&y=2', description: null, language: 'C&X', isFork: false }]);
  assert.match(html, /&lt;name&gt;/);
  assert.match(html, /x=1&amp;y=2/);
  assert.match(html, /C&amp;X/);
  assert.match(html, /No description provided on GitHub\./);
  assert.doesNotMatch(html, /<name>/);
});

test('only the Source markers are replaced and missing markers are rejected', () => {
  assert.equal(replaceGeneratedSource('Tools<!-- source:auto:start -->old<!-- source:auto:end -->Printed', 'new'), 'Tools<!-- source:auto:start -->\nnew\n      <!-- source:auto:end -->Printed');
  assert.throws(() => replaceGeneratedSource('no markers', 'new'), /markers/);
});

test('pinned sync writes a static catalogue and is idempotent', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'pinned-sync-'));
  try {
    await writeFile(join(rootDir, 'index.html'), 'Tools<!-- source:auto:start -->old<!-- source:auto:end -->Printed');
    await writeFile(join(rootDir, 'projects-reviewed.json'), JSON.stringify({ repositories: reviewed }));
    const options = { rootDir, loadProfile: async () => profile };
    await syncPinned(options);
    const index = await readFile(join(rootDir, 'index.html'), 'utf8');
    const json = await readFile(join(rootDir, 'pinned.json'), 'utf8');
    await syncPinned(options);
    assert.equal(await readFile(join(rootDir, 'index.html'), 'utf8'), index);
    assert.equal(await readFile(join(rootDir, 'pinned.json'), 'utf8'), json);
    assert.deepEqual(JSON.parse(json).repositories.map((repo) => repo.name), ['zeta']);
    assert.ok(index.startsWith('Tools') && index.endsWith('Printed'));
  } finally { await rm(rootDir, { recursive: true, force: true }); }
});


test('new profile pins are withheld and remote consulting text cannot replace reviewed copy', async () => {
  const nodes = [
    { nameWithOwner: 'amitkuzi/zeta', name: 'zeta', description: 'Engineering Consultant', url: 'https://github.com/amitkuzi/zeta', isFork: false, isPrivate: false },
    { nameWithOwner: 'amitkuzi/new', name: 'new', description: 'Unknown origin', url: 'https://github.com/amitkuzi/new', isFork: false, isPrivate: false }
  ];
  const catalogue = await loadPinnedRepositories(async () => ({ data: { user: { pinnedItems: { nodes } } } }), reviewed);
  assert.deepEqual(catalogue.repositories.map((repo) => repo.name), ['zeta']);
  assert.equal(catalogue.repositories[0].description, 'Reviewed description');
});

test('missing or invalid project review fails before loading profile', async () => {
  for (const entries of [undefined, [], [{ nameWithOwner: 'other/repo', description: 'Other' }], [reviewed[0], reviewed[0]]]) {
    await assert.rejects(loadPinnedRepositories(() => { throw new Error('must not fetch'); }, entries), /reviewed repositories/);
  }
});


test('release footer and changelog match canonical version and date', async () => {
  const root = new URL('../', import.meta.url);
  const release = JSON.parse(await readFile(new URL('release.json', root), 'utf8'));
  const index = await readFile(new URL('index.html', root), 'utf8');
  const changelog = await readFile(new URL('CHANGELOG.md', root), 'utf8');
  assert.match(release.version, /^\d+\.\d+\.\d+$/);
  assert.match(release.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(index.includes(`<span id="release">Version ${release.version} &middot; ${release.date}</span>`));
  assert.ok(changelog.includes(`## ${release.version} - ${release.date}`));
});
