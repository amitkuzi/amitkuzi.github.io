import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const OWNER = 'amitkuzi';
const REPOSITORY = 'skills';
const API_ROOT = `https://api.github.com/repos/${OWNER}/${REPOSITORY}`;
const BRANCH = 'main';
const START_MARKER = '<!-- skills:auto:start -->';
const END_MARKER = '<!-- skills:auto:end -->';

export function findPublicSkillPaths(treeEntries) {
  if (!Array.isArray(treeEntries)) {
    throw new TypeError('GitHub tree response must contain a tree array.');
  }

  return treeEntries
    .filter(({ path, type }) => type === 'blob' && /^[^/]+\/SKILL\.md$/.test(path))
    .map(({ path }) => path)
    .sort((left, right) => left.localeCompare(right));
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replaceAll("''", "'");
  }
  return trimmed;
}

export function parseSkillFrontmatter(source, folderName) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    throw new Error(`${folderName}/SKILL.md has no YAML frontmatter.`);
  }

  const lines = match[1].split(/\r?\n/);
  const values = {};
  for (let index = 0; index < lines.length; index += 1) {
    const field = lines[index].match(/^(name|description):\s*(.*)$/);
    if (!field) continue;

    const [, key, rawValue] = field;
    if (rawValue === '>' || rawValue === '|') {
      const parts = [];
      while (index + 1 < lines.length && /^\s+/.test(lines[index + 1])) {
        parts.push(lines[index + 1].trim());
        index += 1;
      }
      values[key] = rawValue === '>' ? parts.join(' ') : parts.join('\n');
    } else {
      values[key] = parseScalar(rawValue);
    }
  }

  const name = values.name || folderName;
  if (!values.description) {
    throw new Error(`${folderName}/SKILL.md has no description in its frontmatter.`);
  }

  return { name, description: values.description };
}

export function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderSkillCards(skills, branch) {
  const branchLabel = escapeHtml(branch);
  return skills.map((skill) => {
    const name = escapeHtml(skill.name);
    const description = escapeHtml(skill.description);
    const repo = escapeHtml(skill.repo);
    return `      <div class="repo"><div class="rn"><a href="${repo}">${name}</a></div>\n` +
      `        <div class="rd">${description}</div>\n` +
      `        <div class="rm">Agent Skill · Public · <b>${branchLabel}</b></div></div>`;
  }).join('\n');
}

export function replaceGeneratedSkills(html, renderedCards) {
  const start = html.indexOf(START_MARKER);
  const end = html.indexOf(END_MARKER);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Skills auto-generation markers are missing or out of order in index.html.');
  }

  const contentStart = start + START_MARKER.length;
  return `${html.slice(0, contentStart)}\n${renderedCards}\n      ${html.slice(end)}`;
}

async function fetchJson(fetchImpl, url) {
  const response = await fetchImpl(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'amitkuzi.github.io-skills-sync'
    }
  });
  if (!response.ok) {
    throw new Error(`GitHub request failed (${response.status}) for ${url}`);
  }
  return response.json();
}

async function fetchText(fetchImpl, url) {
  const response = await fetchImpl(url, {
    headers: { 'User-Agent': 'amitkuzi.github.io-skills-sync' }
  });
  if (!response.ok) {
    throw new Error(`GitHub request failed (${response.status}) for ${url}`);
  }
  return response.text();
}

export async function loadPublicSkills(fetchImpl = fetch) {
  const branch = BRANCH;
  const commit = await fetchJson(fetchImpl, `${API_ROOT}/commits/${encodeURIComponent(branch)}`);
  const sourceCommit = commit.sha;
  if (typeof sourceCommit !== 'string' || !/^[a-f0-9]{40}$/i.test(sourceCommit)) {
    throw new Error('GitHub commit response has no valid commit SHA.');
  }
  const tree = await fetchJson(fetchImpl, `${API_ROOT}/git/trees/${sourceCommit}?recursive=1`);
  if (tree.truncated) {
    throw new Error('GitHub returned a truncated repository tree; refusing a partial sync.');
  }

  const paths = findPublicSkillPaths(tree.tree);
  if (paths.length === 0) {
    throw new Error(`No top-level public skills were found on branch ${branch}.`);
  }

  const skills = await Promise.all(paths.map(async (skillPath) => {
    const folder = skillPath.split('/')[0];
    const source = await fetchText(fetchImpl, `https://raw.githubusercontent.com/${OWNER}/${REPOSITORY}/${sourceCommit}/${skillPath}`);
    const metadata = parseSkillFrontmatter(source, folder);
    return {
      id: folder,
      ...metadata,
      repo: `https://github.com/${OWNER}/${REPOSITORY}/tree/${encodeURIComponent(branch)}/${encodeURIComponent(folder)}`
    };
  }));

  return {
    source: `https://github.com/${OWNER}/${REPOSITORY}`,
    branch,
    sourceCommit,
    skills: skills.sort((left, right) => left.name.localeCompare(right.name))
  };
}

export async function syncSkills({ fetchImpl = fetch, rootDir } = {}) {
  const projectRoot = rootDir || resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const indexPath = resolve(projectRoot, 'index.html');
  const skillsPath = resolve(projectRoot, 'skills.json');
  const catalogue = await loadPublicSkills(fetchImpl);
  const index = await readFile(indexPath, 'utf8');
  const updatedIndex = replaceGeneratedSkills(index, renderSkillCards(catalogue.skills, catalogue.branch));

  await Promise.all([
    writeFile(indexPath, updatedIndex, 'utf8'),
    writeFile(skillsPath, `${JSON.stringify(catalogue, null, 2)}\n`, 'utf8')
  ]);

  return catalogue;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const catalogue = await syncSkills();
  console.log(`Synced ${catalogue.skills.length} skills from ${catalogue.sourceCommit}.`);
}
