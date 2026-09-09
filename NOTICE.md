# Notice

One licence covers this repository. Everything in it is [CC-BY-4.0](LICENSE.md).

The site's own source is a Docusaurus configuration and a handful of React components that exist to present the prose. It is small enough that splitting a second licence out for it would obscure more than it clarified, so it travels under the same terms as the pages it renders. [Cassiopeia itself](https://github.com/vela-tools/cassiopeia) is [EUPL-1.2](https://eupl.eu/1.2/en/) and nothing here changes that. Documenting a program does not relicense it.

The code blocks in the guides are illustrative. A mapping, manifest, or schema quoted in a page is there to explain a technique, not to be lifted into a pipeline. The runnable equivalents live in [cassiopeia-examples](https://github.com/vela-tools/cassiopeia-examples) under MIT-0, which carries no attribution requirement at all, so copy from there rather than from here.

The screenshots under `versioned_docs/*/assets` show Cassiopeia's terminal interface. They were produced by SenLab d.o.o. and are covered by the same licence as the rest of the prose.

## Third-party material

No third-party code is vendored here. The build dependencies are declared in `package.json` and fetched at build time, each under its own licence: Docusaurus, React, and the Prism renderer are MIT. A distribution of this repository carries the manifests, not the packages.

The three webfonts are loaded by the reader's browser from Google Fonts and from `iosevka-webfonts.github.io`, under the terms their publishers set. No font file is stored in this repository or served from it.

The [Smart Data Models](https://smartdatamodels.org/) catalog is referenced by name and by URL. Its schemas and `@context` documents are fetched from the catalog at run time and remain under the catalog's own terms.

## Trademarks

Vela, Cassiopeia, and the associated logos are trademarks of SenLab d.o.o. All rights in these marks are reserved.

The licence grants no rights in trademarks. CC-BY-4.0 says so in Section 2(b)(2): "No trademark rights under this Public License. This Public License does not grant permission to use the trademarks, service marks, or logos of the Licensor." That applies to the mark files under `static/img` as much as to the names in the prose.

You may use the names to say where something came from: "based on Cassiopeia", "a fork of Cassiopeia", "compatible with Cassiopeia". That is descriptive use and needs no permission.

You may not use the names or the logos as the name or branding of your own distribution, product, or service, and you may not use them in a way that suggests SenLab d.o.o. endorses, maintains, or is the source of your version. A modified copy of this documentation published to the public must carry a different name and must not reuse the marks.

Section 3(a)(1) of CC-BY-4.0 is why this file travels with the prose: a licensee must retain the identification of the creator, the copyright notice, the licence notice, and the disclaimer notice, and must indicate any modifications. So this notice accompanies the documentation and any derivative of it.

Any other use of the marks needs written permission, which you can request at info@velacontext.com.
