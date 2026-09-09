#!/usr/bin/env node
// Sync the worked example pages from vela-tools/cassiopeia-examples into the
// newest documentation version.
//
// The examples repository owns the prose: a page there is checked against the
// commands its descriptor declares, so it is the only copy that can be trusted.
// This script takes those pages, rewrites the links that only resolve on
// GitHub, and writes them into versioned_docs/version-<newest>/examples so the
// site can carry them with a sidebar, search, and the same metadata every other
// page has.
//
// Only the newest version is ever touched. An archived version keeps the
// examples it shipped with, which is what "documentation version N documents
// engine N" means in practice.
//
//   node tools/sync-examples.mjs                 # sync main into the newest version
//   node tools/sync-examples.mjs --ref v1.0.2    # sync a tag instead
//   node tools/sync-examples.mjs --check         # fail if the tree would change
//   node tools/sync-examples.mjs --source ../cassiopeia-examples   # skip the clone

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const REPO = 'https://github.com/vela-tools/cassiopeia-examples.git';
const REPO_WEB = 'https://github.com/vela-tools/cassiopeia-examples';
const SITE_DOCS = 'https://vela-tools.github.io/cassiopeia/docs';

// Files an example page links to by bare filename. They live beside the page in
// the examples repository and are deliberately not copied here: they are MIT-0
// material meant to be taken from the source of truth, not a second copy that
// can drift.
const SOURCE_FILE = /\.(?:json5|jsonld|json|toml|ya?ml|awk|sh|csv|xml|txt)$/;

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : (process.argv[i + 1] ?? true);
}
const flag = (name) => process.argv.includes(`--${name}`);

const root = path.resolve(import.meta.dirname, '..');
const ref = arg('ref', 'main');
const check = flag('check');

// The newest entry in versions.json is the version served at /docs, and the
// only one that still accepts changes.
const versions = JSON.parse(fs.readFileSync(path.join(root, 'versions.json'), 'utf8'));
const version = versions[0];
const versionDir = path.join(root, 'versioned_docs', `version-${version}`);
const targetDir = path.join(versionDir, 'examples');
const sidebarPath = path.join(root, 'versioned_sidebars', `version-${version}-sidebars.json`);

// A descriptor is TOML, but only its [example] table is read here and its keys
// are plain strings and string arrays. Pulling a TOML parser in for that would
// add a dependency to the site for four keys.
function exampleTable(toml) {
  const table = toml.split(/^\[/m).find((section) => section.startsWith('example]'));
  if (!table) throw new Error('descriptor has no [example] table');
  const read = (key) => {
    const line = table.match(new RegExp(`^${key}\\s*=\\s*(.+)$`, 'm'));
    return line ? line[1].trim() : null;
  };
  const string = (key) => read(key)?.replace(/^"(.*)"$/, '$1') ?? null;
  const list = (key) => [...(read(key) ?? '').matchAll(/"([^"]*)"/g)].map((m) => m[1]);
  return { title: string('title'), label: string('label'), summary: string('summary'), formats: list('formats'), models: list('models') };
}

// The three link shapes that mean something different once a page is served
// from the documentation site rather than from GitHub.
function rewrite(page, directory, linkRef) {
  return (
    page
      // A sibling example is a directory here, not a file.
      .replace(/\]\(\.\.\/(\d{2}-[a-z0-9-]+)\/example\.md/g, '](../$1/index.md')
      // Absolute links to the guides become relative, so that each version
      // links within itself and the build can check them. An absolute link
      // would always resolve to the newest version, whichever version the page
      // was synced into.
      .replace(new RegExp(`${SITE_DOCS}/([a-z0-9/-]+)`, 'g'), '../../$1.md')
      // A bare filename is a file that lives only in the examples repository.
      .replace(/\]\(([a-z0-9_.-]+)\)/g, (whole, file) =>
        SOURCE_FILE.test(file) ? `](${REPO_WEB}/blob/${linkRef}/examples/${directory}/${file})` : whole)
  );
}

function frontMatter({ title, label, summary, formats, models }, position) {
  const keywords = ['NGSI-LD', 'worked example', ...formats.map((f) => `${f} to NGSI-LD`), ...models];
  return [
    '---',
    `title: ${JSON.stringify(title)}`,
    `sidebar_label: ${JSON.stringify(label)}`,
    `sidebar_position: ${position}`,
    `description: ${JSON.stringify(summary)}`,
    `keywords: [${keywords.map((k) => JSON.stringify(k)).join(', ')}]`,
    '---',
    '',
    '<!-- Synced from vela-tools/cassiopeia-examples. Edit the page there, not here. -->',
    '',
  ].join('\n');
}

// --- source ------------------------------------------------------------------

// --locked syncs whatever commit examples.lock names instead of a moving branch.
// The drift check in CI uses it: a pull request that touches nothing to do with
// the examples should not fail because the examples repository moved overnight.
// Two different refs are in play. `fetchRef` says which commit to read, and is a
// raw SHA in locked mode so the check is reproducible. `linkRef` is the name that
// goes into the links back to the source files, and stays a branch or tag so a
// reader following one lands somewhere durable and the diff of a sync stays small.
let fetchRef = ref;
let linkRef = ref;
if (flag('locked')) {
  const lock = path.join(root, 'examples.lock');
  if (!fs.existsSync(lock)) {
    console.log('no examples.lock yet, nothing to check');
    process.exit(0);
  }
  const locked = JSON.parse(fs.readFileSync(lock, 'utf8'));
  fetchRef = locked.commit;
  linkRef = locked.ref;
}

let source = arg('source');
let temp = null;
if (!source) {
  temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cassiopeia-examples-'));
  if (/^[0-9a-f]{40}$/.test(fetchRef)) {
    // A commit is not a branch, so it has to be fetched by name rather than cloned.
    execFileSync('git', ['init', '--quiet', temp]);
    execFileSync('git', ['-C', temp, 'remote', 'add', 'origin', REPO]);
    execFileSync('git', ['-C', temp, 'fetch', '--depth', '1', '--quiet', 'origin', fetchRef]);
    execFileSync('git', ['-C', temp, 'checkout', '--quiet', 'FETCH_HEAD']);
  } else {
    execFileSync('git', ['clone', '--depth', '1', '--branch', fetchRef, REPO, temp], { stdio: 'inherit' });
  }
  source = temp;
}
const sha = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();


// --- render ------------------------------------------------------------------

const dirs = fs
  .readdirSync(path.join(source, 'examples'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^\d{2}-/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

if (dirs.length === 0) throw new Error(`no examples found under ${source}/examples`);

const files = new Map();
const entries = [];

dirs.forEach((directory, index) => {
  const descriptor = exampleTable(fs.readFileSync(path.join(source, 'examples', directory, 'example.toml'), 'utf8'));
  const page = fs.readFileSync(path.join(source, 'examples', directory, 'example.md'), 'utf8');
  files.set(path.join(targetDir, directory, 'index.md'), frontMatter(descriptor, index + 1) + rewrite(page, directory, linkRef));
  entries.push({ directory, ...descriptor });
});

// The index repeats the reading order the directory prefixes already encode.
const index = [
  '---',
  'title: "Worked examples"',
  'sidebar_label: "Overview"',
  'sidebar_position: 0',
  'description: "Thirty-one real public datasets mapped to NGSI-LD end to end, each example adding one idea to the ones before it."',
  'keywords: ["NGSI-LD", "worked example", "Smart Data Models", "data transformation"]',
  '---',
  '',
  '# Worked examples',
  '',
  'Each example maps one real public dataset from beginning to end: where the data comes from, the mapping that shapes it, the command that runs it, and the entities that come out. The order is a reading order, so each one builds on the ones before it.',
  '',
  `The mappings, manifests, and schemas themselves live in [${REPO_WEB.replace('https://github.com/', '')}](${REPO_WEB}), where a runner executes every example and checks its output against what its page claims.`,
  '',
  ...entries.flatMap(({ directory, label, summary, models }) => [
    `**[${label}](./${directory}/index.md)**${models.length ? ` → ${models.map((m) => `\`${m}\``).join(' ')}` : ''}`,
    '',
    `${summary}`,
    '',
  ]),
].join('\n');
files.set(path.join(targetDir, 'index.md'), index);

// --- sidebar -----------------------------------------------------------------

const sidebar = JSON.parse(fs.readFileSync(sidebarPath, 'utf8'));
const category = {
  type: 'category',
  label: 'Examples',
  link: { type: 'doc', id: 'examples/index' },
  items: entries.map(({ directory }) => `examples/${directory}/index`),
};
const at = sidebar.docs.findIndex((item) => item?.type === 'category' && item.label === 'Examples');
if (at === -1) sidebar.docs.push(category);
else sidebar.docs[at] = category;
files.set(sidebarPath, `${JSON.stringify(sidebar, null, 2)}\n`);

// Provenance, so a reader and a reviewer can both see which commit a page came from.
files.set(
  path.join(root, 'examples.lock'),
  `${JSON.stringify({ repository: REPO_WEB, ref: linkRef, commit: sha, examples: entries.length, syncedInto: version }, null, 2)}\n`,
);

// --- write or check ----------------------------------------------------------

let changed = [];
for (const [file, content] of files) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (current === content) continue;
  changed.push(path.relative(root, file));
  if (!check) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
}

// An example deleted upstream has to disappear here too, or the sidebar points
// at a page the source no longer has.
if (fs.existsSync(targetDir)) {
  for (const stale of fs.readdirSync(targetDir).filter((name) => /^\d{2}-/.test(name) && !dirs.includes(name))) {
    changed.push(path.relative(root, path.join(targetDir, stale)) + ' (removed)');
    if (!check) fs.rmSync(path.join(targetDir, stale), { recursive: true });
  }
}

if (temp) fs.rmSync(temp, { recursive: true, force: true });

console.log(`${entries.length} examples from ${fetchRef} (${sha.slice(0, 8)}) -> version-${version}`);
if (changed.length === 0) console.log('no changes');
else {
  console.log(`${changed.length} file(s) ${check ? 'would change' : 'written'}:`);
  for (const file of changed.slice(0, 12)) console.log(`  ${file}`);
  if (changed.length > 12) console.log(`  ... and ${changed.length - 12} more`);
}
if (check && changed.length) {
  console.error('\nThe synced pages are out of date. Run: npm run sync:examples');
  process.exit(1);
}
