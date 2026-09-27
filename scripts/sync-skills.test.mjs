import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  findPublicSkillPaths,
  parseSkillFrontmatter,
  renderSkillCards,
  replaceGeneratedSkills,
  syncSkills
} from './sync-skills.mjs';

test('findPublicSkillPaths includes only top-level skill manifests', () => {
  const paths = findPublicSkillPaths([
    { path: 'alpha/SKILL.md', type: 'blob' },
    { path: 'nested/codex/SKILL.md', type: 'blob' },
    { path: 'README.md', type: 'blob' },
    { path: 'folder/SKILL.md', type: 'tree' }
  ]);

  assert.deepEqual(paths, ['alpha/SKILL.md']);
});

test('parseSkillFrontmatter reads quoted and folded descriptions', () => {
  assert.deepEqual(
    parseSkillFrontmatter('---\nname: "demo"\ndescription: "A \\"quoted\\" description"\n---\n', 'folder'),
    { name: 'demo', description: 'A "quoted" description' }
  );
  assert.deepEqual(
    parseSkillFrontmatter('---\nname: folded\ndescription: >\n  First line\n  second line\n---\n', 'folder'),
    { name: 'folded', description: 'First line second line' }
  );
});

test('parseSkillFrontmatter rejects a missing description', () => {
  assert.throws(
    () => parseSkillFrontmatter('---\nname: incomplete\n---\n', 'incomplete'),
    /has no description/
  );
});

test('renderSkillCards escapes remote content', () => {
  const html = renderSkillCards([{
    name: '<unsafe>',
    description: 'A & B',
    repo: 'https://example.com/?a=1&b=2'
  }]);

  assert.match(html, /&lt;unsafe&gt;/);
  assert.match(html, /A &amp; B/);
  assert.doesNotMatch(html, /<unsafe>/);
});

test('replaceGeneratedSkills replaces only the marked region', () => {
  const original = `before ${'<!-- skills:auto:start -->'}\nold\n${'<!-- skills:auto:end -->'} after`;
  const updated = replaceGeneratedSkills(original, 'new');

  assert.equal(updated, `before ${'<!-- skills:auto:start -->'}\nnew\n      ${'<!-- skills:auto:end -->'} after`);
});

test('syncSkills updates HTML and JSON from a GitHub tree response', async () => {
  const rootDir = await mkdtemp(join(tmpdir(), 'skills-sync-'));
  await writeFile(
    join(rootDir, 'index.html'),
    '<main><!-- skills:auto:start -->\nold\n    <!-- skills:auto:end --></main>',
    'utf8'
  );

  const responses = new Map([
    ['https://api.github.com/repos/amitkuzi/skills/git/trees/main?recursive=1', {
      ok: true,
      json: async () => ({
        sha: 'abc123',
        truncated: false,
        tree: [{ path: 'demo/SKILL.md', type: 'blob' }]
      })
    }],
    ['https://raw.githubusercontent.com/amitkuzi/skills/main/demo/SKILL.md', {
      ok: true,
      text: async () => '---\nname: demo\ndescription: Demo description\n---\n'
    }]
  ]);

  try {
    const options = {
      rootDir,
      fetchImpl: async (url) => responses.get(url) || { ok: false, status: 404 }
    };
    await syncSkills(options);
    const index = await readFile(join(rootDir, 'index.html'), 'utf8');
    const catalogue = JSON.parse(await readFile(join(rootDir, 'skills.json'), 'utf8'));

    await syncSkills(options);
    const repeatedIndex = await readFile(join(rootDir, 'index.html'), 'utf8');

    assert.match(index, /Demo description/);
    assert.equal(repeatedIndex, index);
    assert.equal(catalogue.sourceCommit, 'abc123');
    assert.equal(catalogue.skills[0].name, 'demo');
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});
