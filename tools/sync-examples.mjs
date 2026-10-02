#!/usr/bin/env node
// Sync the worked example pages from vela-tools/cassiopeia-examples into every
// documentation version.
//
// The examples repository owns the prose: a page there is checked against the
// commands its descriptor declares, so it is the only copy that can be trusted.
// This script takes those pages, rewrites the links that only resolve on
// GitHub, and writes them into versioned_docs/version-<v>/examples so the site
// can carry them with a sidebar, search, and the same metadata every other page
// has.
//
// Each version is synced from the examples tag of the same name: version 1.0.3
// from tag v1.0.3. The examples repository names a tag after the Cassiopeia
// release its examples were run against, so a version's pages show the commands
// and the output of that release and no other. A version with no matching tag
// has no example pages at all, which is what a release whose examples never ran
// on it should show.
//
//   node tools/sync-examples.mjs            # sync every version from its tag
//   node tools/sync-examples.mjs --check    # fail if the tree would change
//   node tools/sync-examples.mjs --locked   # read the commits examples.lock records instead of the tags
//   node tools/sync-examples.mjs --source ../../cassiopeia-examples   # clone a local checkout instead of GitHub

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
const check = flag('check');
const locked = flag('locked');
const lockPath = path.join(root, 'examples.lock');

const versions = JSON.parse(fs.readFileSync(path.join(root, 'versions.json'), 'utf8'));

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
function rewrite(page, directory, tag) {
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
      // It links to the tag, so it shows the file as it stood for this version.
      .replace(/\]\(([a-z0-9_.-]+)\)/g, (whole, file) =>
        SOURCE_FILE.test(file) ? `](${REPO_WEB}/blob/${tag}/examples/${directory}/${file})` : whole)
  );
}

// GitHub alerts (`> [!WARNING]` and the blockquote under it) render only on
// GitHub; Docusaurus shows them as a plain quote with a literal `[!WARNING]`.
// They become `:::warning` admonitions. Lines inside code fences are left alone.
const ADMONITION = { NOTE: 'note', TIP: 'tip', IMPORTANT: 'info', WARNING: 'warning', CAUTION: 'danger' };

function admonitions(page) {
  const lines = page.split('\n');
  const out = [];
  let fence = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker && (!fence || marker[1].startsWith(fence))) fence = fence ? null : marker[1];
    const alert = !fence && line.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/);
    if (!alert) {
      out.push(line);
      continue;
    }
    const body = [];
    while (i + 1 < lines.length && lines[i + 1].startsWith('>')) body.push(lines[++i].replace(/^> ?/, ''));
    out.push(`:::${ADMONITION[alert[1]]}`, '', ...body, '', ':::');
  }
  return out.join('\n');
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

// The overview repeats the reading order the directory prefixes already encode.
// It names no count, since each version carries the examples its tag holds.
function overview(entries) {
  return [
    '---',
    'title: "Worked examples"',
    'sidebar_label: "Overview"',
    'sidebar_position: 0',
    'description: "Real public datasets mapped to NGSI-LD end to end, each example adding one idea to the ones before it."',
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
}

// --- source ------------------------------------------------------------------

// Each resolver answers the tag and commit a version is synced from, or null
// for a version without examples.

// --locked reads the commits examples.lock records, so the drift check in CI is
// reproducible: a pull request that touches nothing to do with the examples
// should not fail because a tag was pushed overnight.
function lockedSources() {
  if (!fs.existsSync(lockPath)) throw new Error('examples.lock is missing. Run: npm run sync:examples');
  const recorded = JSON.parse(fs.readFileSync(lockPath, 'utf8')).versions;
  if (!recorded) throw new Error('examples.lock records no versions. Run: npm run sync:examples');
  return (version) => recorded[version] ?? null;
}

function taggedSources(clone) {
  const tags = new Set(execFileSync('git', ['-C', clone, 'tag', '--list'], { encoding: 'utf8' }).split('\n').filter(Boolean));
  return (version) => {
    const tag = `v${version}`;
    if (!tags.has(tag)) return null;
    const commit = execFileSync('git', ['-C', clone, 'rev-parse', `refs/tags/${tag}^{commit}`], { encoding: 'utf8' }).trim();
    return { tag, commit };
  };
}

// One clone serves every version, each a checkout of a different commit. A
// --source checkout is cloned rather than read in place, so its tags resolve
// exactly as GitHub's would and its working tree is never touched.
const clone = fs.mkdtempSync(path.join(os.tmpdir(), 'cassiopeia-examples-'));
execFileSync('git', ['clone', '--quiet', '--no-checkout', arg('source') ? path.resolve(arg('source')) : REPO, clone], { stdio: 'inherit' });
const sourceFor = locked ? lockedSources() : taggedSources(clone);

// --- render ------------------------------------------------------------------

const files = new Map();
const lock = { repository: REPO_WEB, versions: {} };
const report = [];

for (const version of versions) {
  const targetDir = path.join(root, 'versioned_docs', `version-${version}`, 'examples');
  const sidebarPath = path.join(root, 'versioned_sidebars', `version-${version}-sidebars.json`);
  const source = sourceFor(version);
  const entries = [];

  if (source) {
    execFileSync('git', ['-C', clone, '-c', 'advice.detachedHead=false', 'checkout', '--quiet', '--detach', source.commit]);

    const dirs = fs
      .readdirSync(path.join(clone, 'examples'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^\d{2}-/.test(entry.name))
      .map((entry) => entry.name)
      .sort();
    if (dirs.length === 0) throw new Error(`no examples found at ${source.tag} (${source.commit})`);

    dirs.forEach((directory, index) => {
      const descriptor = exampleTable(fs.readFileSync(path.join(clone, 'examples', directory, 'example.toml'), 'utf8'));
      const page = fs.readFileSync(path.join(clone, 'examples', directory, 'example.md'), 'utf8');
      files.set(path.join(targetDir, directory, 'index.md'), frontMatter(descriptor, index + 1) + admonitions(rewrite(page, directory, source.tag)));
      entries.push({ directory, ...descriptor });
    });
    files.set(path.join(targetDir, 'index.md'), overview(entries));

    lock.versions[version] = { tag: source.tag, commit: source.commit, examples: entries.length };
    report.push(`version-${version}: ${entries.length} examples from ${source.tag} (${source.commit.slice(0, 8)})`);
  } else {
    report.push(`version-${version}: no v${version} tag, no examples`);
  }

  // The Examples category is there exactly when the version has examples.
  const sidebar = JSON.parse(fs.readFileSync(sidebarPath, 'utf8'));
  const others = sidebar.docs.filter((item) => !(item?.type === 'category' && item.label === 'Examples'));
  const category = {
    type: 'category',
    label: 'Examples',
    link: { type: 'doc', id: 'examples/index' },
    items: entries.map(({ directory }) => `examples/${directory}/index`),
  };
  sidebar.docs = entries.length ? [...others, category] : others;
  files.set(sidebarPath, `${JSON.stringify(sidebar, null, 2)}\n`);
}

// Provenance, so a reader and a reviewer can both see which commit each
// version's pages came from.
files.set(lockPath, `${JSON.stringify(lock, null, 2)}\n`);

fs.rmSync(clone, { recursive: true, force: true });

// --- write or check ----------------------------------------------------------

const changed = [];
for (const [file, content] of files) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (current === content) continue;
  changed.push(path.relative(root, file));
  if (!check) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
}

// An example deleted upstream, or every example of a version without a tag,
// has to disappear here too, or the sidebar and the overview point at pages the
// source does not have.
for (const version of versions) {
  const targetDir = path.join(root, 'versioned_docs', `version-${version}`, 'examples');
  if (!fs.existsSync(targetDir)) continue;
  for (const name of fs.readdirSync(targetDir)) {
    const entry = path.join(targetDir, name);
    if (files.has(entry) || files.has(path.join(entry, 'index.md'))) continue;
    changed.push(`${path.relative(root, entry)} (removed)`);
    if (!check) fs.rmSync(entry, { recursive: true });
  }
  if (!check && fs.readdirSync(targetDir).length === 0) fs.rmdirSync(targetDir);
}

for (const line of report) console.log(line);
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
