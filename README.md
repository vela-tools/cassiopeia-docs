<p align="center">
  <img src="static/img/cassiopeia-mark.png" alt="" width="88" height="88">
</p>

<h1 align="center">Cassiopeia Documentation</h1>

<p align="center">
  <strong>The guides and reference for <a href="https://github.com/vela-tools/cassiopeia">Cassiopeia</a>, the pipeline that turns CSV, JSON, GeoJSON, KML/KMZ, XML, ESRI Shapefiles, and GRIB into validated <a href="https://ngsi-ld.org/">NGSI-LD</a> entities.</strong>
</p>

<p align="center">
  <a href="https://vela-tools.github.io/cassiopeia/">Read the documentation</a> ·
  <a href="#run-it-locally">Run it locally</a> ·
  <a href="#how-the-docs-are-versioned">Versioning</a> ·
  <a href="#community">Community</a> ·
  <a href="#license">License</a>
</p>

<p align="center">
  <a href="https://github.com/vela-tools/cassiopeia-docs/actions/workflows/build.yaml"><img alt="build" src="https://github.com/vela-tools/cassiopeia-docs/actions/workflows/build.yaml/badge.svg"></a>
  <a href="LICENSE.md"><img alt="license: CC-BY-4.0" src="https://img.shields.io/badge/license-CC--BY--4.0-blue"></a>
  <img alt="ngsi-ld v1.9.1" src="https://img.shields.io/badge/NGSI--LD-v1.9.1-orange">
</p>

<p align="center">
  <sub>Part of <a href="https://github.com/vela-tools">Vela Tools</a> · Based on EU open standards 🇪🇺 · Built in Ljubljana, Slovenia 🇸🇮 by SenLab d.o.o.</sub>
</p>

---

## What this is

The source of [vela-tools.github.io/cassiopeia](https://vela-tools.github.io/cassiopeia/), a [Docusaurus](https://docusaurus.io/) site holding the documentation pages for Cassiopeia.

The guides form a reading order: install the binary, learn what Cassiopeia produces, inspect a source, write a mapping, shape and check the output, then run and automate it. The reference covers the CLI, the container image, the terminal interface, the architecture, and NGSI-LD's attribute types and representations against the clauses of ETSI GS CIM 009 v1.9.1.

## Run it locally

```bash
npm install
npm run start
```

That serves the site with live reload. To reproduce what CI does:

```bash
npm run typecheck                              # the config and the theme components
npm run build                                  # fails on a broken internal link
npm run serve                                  # serve the built output
```

`onBrokenLinks` is set to `throw`, so a link into a page that does not exist stops the build rather than warning. Links out to the examples repository and the specification are absolute and are not checked here.

## How the docs are versioned

The site is versioned only. There is no current `docs/` directory, and `includeCurrentVersion` is off, so an edit goes straight into `versioned_docs/version-<v>` and its sidebar lives in `versioned_sidebars/version-<v>-sidebars.json`. The newest entry in `versions.json` is the default and is served at `/docs`, without a version in the path.

To cut a release, copy the newest version directory and its sidebar, add the version to `versions.json`, and name it in the `versions` map in `docusaurus.config.ts`. `docusaurus docs:version` needs a current version and will not work here.

```
versioned_docs/version-1.0.2/
├── index.md
├── guides/                                    # the reading order, twelve pages
├── reference/                                 # CLI, Docker, TUI, architecture, NGSI-LD
└── assets/                                    # screenshots of the terminal interface
```

`docusaurus-plugin-llms` points at the newest version and writes `llms.txt`, `llms-full.txt`, and a markdown copy of every page into the build output.

## Where the examples are

The worked examples are not in this repository. Each one is a directory in [vela-tools/cassiopeia-examples](https://github.com/vela-tools/cassiopeia-examples) holding a real public dataset's mapping, the commands, and the page that explains them, checked by a runner that executes the commands and compares the output against what the page claims. The guides link to those pages absolutely.

## Contributing

Cassiopeia is not accepting external contributions right now, this repository included. Reports are another matter, and all of them are welcome: a page that describes behaviour the binary does not have, a link that goes nowhere, a topic with no page, a step explained wrongly. [CONTRIBUTING.md](CONTRIBUTING.md) says why the door is shut and what to put in the report.

Never report a security vulnerability through a public issue. Follow the [Cassiopeia security policy](https://github.com/vela-tools/cassiopeia/security/policy) instead.

## Community

- Issues: [GitHub Issues](../../issues)
- Documentation: [vela-tools.github.io/cassiopeia](https://vela-tools.github.io/cassiopeia/)
- Cassiopeia itself: [vela-tools/cassiopeia](https://github.com/vela-tools/cassiopeia)
- Worked examples: [vela-tools/cassiopeia-examples](https://github.com/vela-tools/cassiopeia-examples)
- Newsletter: [velacontext.com/newsletter](https://velacontext.com/newsletter)
- General contact: info@velacontext.com
- Security: security@velacontext.com, see the [security policy](https://github.com/vela-tools/cassiopeia/security/policy)
- Code of conduct: [Contributor Covenant](https://github.com/vela-tools/cassiopeia?tab=coc-ov-file)

## License

One licence covers this repository: [CC-BY-4.0](LICENSE.md), for the prose and the site source alike. Reuse it anywhere, including commercially, as long as you credit SenLab d.o.o. and say whether you changed it. Cassiopeia itself is [EUPL-1.2](https://eupl.eu/1.2/en/) and the example files are MIT-0, each in its own repository. [NOTICE.md](NOTICE.md) has the detail and the trademark terms.

## About

Cassiopeia is part of Vela Tools, an open-core infrastructure project for the NGSI-LD ecosystem. SenLab d.o.o. builds it in Ljubljana, Slovenia. Learn more at [velacontext.com](https://velacontext.com).
