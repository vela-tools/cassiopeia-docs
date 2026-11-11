#!/usr/bin/env node
// Import the guides and reference pages of one documentation version from the
// docs/ directory of vela-tools/cassiopeia.
//
// The Cassiopeia repository owns the prose: a page there changes in the same
// commit as the behaviour it describes. A version here is that directory at the
// release, reshaped for the site and otherwise unchanged. Each page moves to its
// place under guides/ or reference/, its links are rewritten to resolve within
// the version, its GitHub alerts become admonitions, and the image tags in its
// commands name the release the version documents. A page is therefore edited in
// the Cassiopeia repository and never here.
//
// Front matter is the one part written here. A page keeps the front matter it
// already has in the version being imported, so importing again after a fix at
// the source loses nothing. A page the version does not have yet starts from the
// front matter of the same page in the version before it, and the report names
// every page whose prose changed since that version so its title, description,
// and keywords can be checked against what it now says.
//
//   node tools/import-docs.mjs --version 1.2.0                                # from tag v1.2.0 on GitHub
//   node tools/import-docs.mjs --version 1.2.0 --ref <commit>                 # from another ref
//   node tools/import-docs.mjs --version 1.2.0 --source ../../cassiopeia      # from a local checkout's history

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { admonitions } from './admonitions.mjs';

const REPO = 'https://github.com/vela-tools/cassiopeia.git';
const EXAMPLES_WEB = 'https://github.com/vela-tools/cassiopeia-examples';

// Where each page of docs/ lives in a version. A page missing from this list
// stops the import: its place in the reading order and in the sidebar is a
// decision to make here, not one to guess.
const PAGES = {
  'index.md': 'index.md',
  'getting-started.md': 'guides/getting-started.md',
  'concepts.md': 'guides/concepts.md',
  'source-formats.md': 'guides/source-formats.md',
  'mapping.md': 'guides/mapping.md',
  'templates.md': 'guides/templates.md',
  'data-models.md': 'guides/data-models.md',
  'output.md': 'guides/output.md',
  'representation.md': 'guides/representations.md',
  'validation.md': 'guides/validation.md',
  'running.md': 'guides/running.md',
  'manifest.md': 'guides/manifests.md',
  'scheduling.md': 'guides/scheduling.md',
  'cli.md': 'reference/cli.md',
  'docker.md': 'reference/docker.md',
  'tui.md': 'reference/tui.md',
  'architecture.md': 'reference/architecture.md',
  'ngsi-ld/attribute-types.md': 'reference/ngsi-ld/attribute-types.md',
  'ngsi-ld/representation.md': 'reference/ngsi-ld/representations.md',
};

// The examples directory belongs to tools/sync-examples.mjs and is never
// written or pruned here.
const SYNCED = 'examples';

const FRONT_MATTER = /^---\n[\s\S]*?\n---\n/;

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : (process.argv[i + 1] ?? fallback);
}

const root = path.resolve(import.meta.dirname, '..');
const version = arg('version');
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) throw new Error('--version <major.minor.patch> is required');
const ref = arg('ref', `v${version}`);
const versionDir = path.join(root, 'versioned_docs', `version-${version}`);
const sidebarPath = (v) => path.join(root, 'versioned_sidebars', `version-${v}-sidebars.json`);

const semver = (v) => v.split('.').map(Number);
const older = (a, b) => {
  const [x, y] = [semver(a), semver(b)];
  const i = x.findIndex((part, j) => part !== y[j]);
  return i !== -1 && x[i] < y[i];
};
const previous = JSON.parse(fs.readFileSync(path.join(root, 'versions.json'), 'utf8'))
  .filter((v) => older(v, version))
  .sort((a, b) => (older(a, b) ? 1 : -1))[0] ?? null;
const previousDir = previous && path.join(root, 'versioned_docs', `version-${previous}`);

// --- source ------------------------------------------------------------------

// A --source checkout is read through git alone, so the import sees the ref as
// committed and never the working tree. Without one, a blobless clone fetches
// only the files actually read.
const local = arg('source');
const repo = local ? path.resolve(local) : fs.mkdtempSync(path.join(os.tmpdir(), 'cassiopeia-'));
if (!local) execFileSync('git', ['clone', '--quiet', '--bare', '--filter=blob:none', REPO, repo], { stdio: 'inherit' });
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { maxBuffer: 1 << 28 });

const commit = git('rev-parse', '--verify', `${ref}^{commit}`).toString().trim();
const tree = git('ls-tree', '-r', '--name-only', commit, 'docs/').toString().split('\n').filter(Boolean)
  .map((file) => file.slice('docs/'.length));
const read = (file) => git('show', `${commit}:docs/${file}`);

const unplaced = tree.filter((file) => file.endsWith('.md') && !(file in PAGES));
if (unplaced.length) throw new Error(`docs/ at ${ref} has pages with no place here, add them to PAGES and the sidebar: ${unplaced.join(', ')}`);
const vanished = Object.keys(PAGES).filter((file) => !tree.includes(file));
if (vanished.length) throw new Error(`pages in PAGES that docs/ at ${ref} no longer has: ${vanished.join(', ')}`);

// --- rewrite -----------------------------------------------------------------

const relative = (fromPage, to) => {
  const link = path.posix.relative(path.posix.dirname(fromPage), to);
  return link.startsWith('../') ? link : `./${link}`;
};

// Assets are copied only when a page links to them. docs/assets also holds
// images that only the repository's README uses.
const assets = new Set();

// On GitHub a page links into the examples repository; here the examples are
// pages of the same version, synced from the examples tag of that release, so
// the link stays inside the version and the build checks it.
function target(link, from) {
  if (link.startsWith('#')) return link;
  const example = link.match(/^https:\/\/github\.com\/vela-tools\/cassiopeia-examples\/blob\/[^/]+\/examples\/(\d{2}-[a-z0-9-]+)\/example\.md(#.*)?$/);
  if (example) return relative(PAGES[from], `${SYNCED}/${example[1]}/index.md`) + (example[2] ?? '');
  if (link === `${EXAMPLES_WEB}#the-examples`) return relative(PAGES[from], `${SYNCED}/index.md`);
  if (/^[a-z][a-z0-9+.-]*:/i.test(link)) return link;
  const [file, anchor] = link.split(/(?=#)/);
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(from), file));
  if (resolved in PAGES) return relative(PAGES[from], PAGES[resolved]) + (anchor ?? '');
  if (resolved.startsWith('assets/') && tree.includes(resolved)) {
    assets.add(resolved);
    return relative(PAGES[from], resolved) + (anchor ?? '');
  }
  throw new Error(`${from}: link to ${link} resolves to ${resolved}, which is neither a page nor an asset`);
}

// docs/ names whichever release was current when a command was written. Each
// version names its own, so a command copied from it pins the release the page
// describes.
const releaseTags = (page) => page
  .replace(/(ghcr\.io\/vela-tools\/cassiopeia:)v\d+\.\d+\.\d+(?![\w.-])/g, `$1v${version}`)
  .replace(/(for example `)v\d+\.\d+\.\d+(`)/g, `$1v${version}$2`);

const body = (from) => admonitions(releaseTags(read(from).toString('utf8').replace(/\]\(([^)\s]+)\)/g, (_, link) => `](${target(link, from)})`)));

const frontMatterOf = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8').match(FRONT_MATTER)?.[0] ?? null : null);
const proseOf = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(FRONT_MATTER, '') : null);

// --- render ------------------------------------------------------------------

const files = new Map();
const missingFrontMatter = [];
const changedSincePrevious = [];

for (const [from, to] of Object.entries(PAGES)) {
  const prose = body(from);
  const frontMatter = frontMatterOf(path.join(versionDir, to)) ?? (previousDir && frontMatterOf(path.join(previousDir, to)));
  if (!frontMatter) missingFrontMatter.push(to);
  if (previousDir && proseOf(path.join(previousDir, to)) !== prose) changedSincePrevious.push(to);
  files.set(path.join(versionDir, to), (frontMatter ?? '') + prose);
}
for (const asset of assets) files.set(path.join(versionDir, asset), read(asset));

// The sidebar decides the reading order, so a new version takes the previous
// one's. Its Examples category is left to tools/sync-examples.mjs, which adds
// it exactly when the version has examples.
let sidebar;
if (fs.existsSync(sidebarPath(version))) sidebar = JSON.parse(fs.readFileSync(sidebarPath(version), 'utf8'));
else if (previous) {
  sidebar = JSON.parse(fs.readFileSync(sidebarPath(previous), 'utf8'));
  sidebar.docs = sidebar.docs.filter((item) => !(item?.type === 'category' && item.label === 'Examples'));
  files.set(sidebarPath(version), `${JSON.stringify(sidebar, null, 2)}\n`);
} else throw new Error(`version-${version} has no sidebar and no earlier version to take one from`);

const ids = new Set();
const collect = (item) => {
  if (typeof item === 'string') ids.add(item);
  else if (item?.type === 'doc') ids.add(item.id);
  item?.items?.forEach(collect);
  if (item?.link?.type === 'doc') ids.add(item.link.id);
};
sidebar.docs.forEach(collect);
const unlisted = Object.values(PAGES).map((to) => to.replace(/\.md$/, '')).filter((id) => !ids.has(id));
if (unlisted.length) throw new Error(`the version-${version} sidebar does not list: ${unlisted.join(', ')}`);

if (!local) fs.rmSync(repo, { recursive: true, force: true });

// --- write -------------------------------------------------------------------

const same = (current, content) => (Buffer.isBuffer(content) ? current.equals(content) : current.toString('utf8') === content);
const changed = [];
for (const [file, content] of files) {
  if (fs.existsSync(file) && same(fs.readFileSync(file), content)) continue;
  changed.push(path.relative(root, file));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

// A page or an asset the source no longer has disappears here too, or the
// version keeps serving prose that no release of Cassiopeia carries.
const prune = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (dir === versionDir && entry.name === SYNCED) continue;
    if (entry.isDirectory()) {
      prune(full);
      if (fs.readdirSync(full).length === 0) fs.rmdirSync(full);
    } else if (!files.has(full)) {
      fs.rmSync(full);
      changed.push(`${path.relative(root, full)} (removed)`);
    }
  }
};
prune(versionDir);

console.log(`version-${version}: ${Object.keys(PAGES).length} pages and ${assets.size} assets from ${ref} (${commit.slice(0, 8)})`);
console.log(changed.length ? `${changed.length} file(s) written:\n${changed.map((f) => `  ${f}`).join('\n')}` : 'no changes');
if (changedSincePrevious.length) {
  console.log(`\nProse changed since version-${previous}; check each page's front matter against it:`);
  for (const page of changedSincePrevious) console.log(`  ${page}`);
}
if (missingFrontMatter.length) {
  console.log('\nNo front matter to start from; write it by hand:');
  for (const page of missingFrontMatter) console.log(`  ${page}`);
}
