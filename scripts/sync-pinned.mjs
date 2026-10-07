import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { escapeHtml } from './sync-skills.mjs';

const runFile = promisify(execFile);
const QUERY = 'query { user(login: "amitkuzi") { pinnedItems(first: 6, types: REPOSITORY) { nodes { ... on Repository { nameWithOwner name description url isFork isPrivate primaryLanguage { name } } } } } }';
const START_MARKER = '<!-- source:auto:start -->';
const END_MARKER = '<!-- source:auto:end -->';

async function fetchProfile() {
  // gh uses its existing local authentication or GH_TOKEN in Actions; never print credentials.
  const { stdout } = await runFile('gh', ['api', 'graphql', '-f', `query=${QUERY}`]);
  return JSON.parse(stdout);
}

export async function loadPinnedRepositories(loadProfile = fetchProfile) {
  const response = await loadProfile();
  const nodes = response.data?.user?.pinnedItems?.nodes;
  if (response.errors?.length || !Array.isArray(nodes)) {
    throw new Error('GitHub pinned repository response is incomplete; refusing to replace the Source section.');
  }
  return {
    source: 'https://github.com/amitkuzi',
    repositories: nodes.filter((repo) => repo && repo.isPrivate === false).map((repo) => ({
      nameWithOwner: repo.nameWithOwner,
      name: repo.name,
      description: repo.description,
      repo: repo.url,
      language: repo.primaryLanguage?.name || null,
      isFork: repo.isFork
    }))
  };
}

export function renderPinnedCards(repositories) {
  if (repositories.length === 0) return '      <p>No public repositories pinned on GitHub.</p>';
  return repositories.map((repo) => {
    const name = escapeHtml(repo.name);
    const url = escapeHtml(repo.repo);
    const description = escapeHtml(repo.description || 'No description provided on GitHub.');
    const language = escapeHtml(repo.language || 'Language not specified');
    const fork = repo.isFork ? ' · Fork' : '';
    return `      <div class="repo"><div class="rn"><a href="${url}">${name}</a></div>\n` +
      `        <div class="rd">${description}</div>\n` +
      `        <div class="rm">${language} · <b>Pinned</b>${fork}</div></div>`;
  }).join('\n');
}

export function replaceGeneratedSource(html, cards) {
  const start = html.indexOf(START_MARKER);
  const end = html.indexOf(END_MARKER);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Source auto-generation markers are missing or out of order in index.html.');
  }
  return `${html.slice(0, start + START_MARKER.length)}\n${cards}\n      ${html.slice(end)}`;
}

export async function syncPinned({ loadProfile, rootDir } = {}) {
  const projectRoot = rootDir || resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const catalogue = await loadPinnedRepositories(loadProfile);
  const indexPath = resolve(projectRoot, 'index.html');
  const index = await readFile(indexPath, 'utf8');
  await Promise.all([
    writeFile(indexPath, replaceGeneratedSource(index, renderPinnedCards(catalogue.repositories)), 'utf8'),
    writeFile(resolve(projectRoot, 'pinned.json'), `${JSON.stringify(catalogue, null, 2)}\n`, 'utf8')
  ]);
  return catalogue;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const catalogue = await syncPinned();
  console.log(`Synced ${catalogue.repositories.length} public pinned repositories in GitHub profile order.`);
}
