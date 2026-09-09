import type { ReactNode } from 'react';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import Metadata from '@theme-original/DocItem/Metadata';

// Docusaurus emits a BreadcrumbList for every doc page but nothing that says
// what the page itself is. This wrapper adds a TechArticle node per page,
// pointing back at the Organization and SoftwareApplication declared once in
// docusaurus.config.ts. Wrapping DocItem/Metadata rather than DocItem/Layout
// keeps this next to the rest of the page's head tags, and useDoc() gives the
// title, description, and last-update time without re-deriving them.
export default function MetadataWrapper(props: object): ReactNode {
  const { metadata, frontMatter } = useDoc();
  const { siteConfig } = useDocusaurusContext();
  const home = siteConfig.url + siteConfig.baseUrl;
  // Use the permalink verbatim so these URLs match the <link rel="canonical">
  // Docusaurus emits for the same page.
  const canonical = siteConfig.url + metadata.permalink;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': `${canonical}#article`,
    headline: metadata.title,
    name: metadata.title,
    description: metadata.description,
    url: canonical,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    inLanguage: 'en',
    isPartOf: { '@id': `${home}#website` },
    about: { '@id': `${home}#software` },
    author: { '@id': `${home}#organization` },
    publisher: { '@id': `${home}#organization` },
    license: 'https://eupl.eu/1.2/en/',
    // lastUpdatedAt is milliseconds since the epoch, not seconds.
    ...(metadata.lastUpdatedAt
      ? {
          dateModified: new Date(metadata.lastUpdatedAt)
            .toISOString()
            .slice(0, 10),
        }
      : {}),
    ...(frontMatter.keywords
      ? { keywords: (frontMatter.keywords as string[]).join(', ') }
      : {}),
  };

  return (
    <>
      <Metadata {...props} />
      <Head>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Head>
    </>
  );
}
