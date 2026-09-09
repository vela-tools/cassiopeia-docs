import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import HomepageEquation from '@site/src/components/HomepageEquation';
import HomepageSovereignty from '@site/src/components/HomepageSovereignty';
import HomepageEditions from '@site/src/components/HomepageEditions';
import HomepageCommunity from '@site/src/components/HomepageCommunity';

import styles from './index.module.css';

// The lead line and the tagline below it mirror the two-line header of the
// project README. The tagline lives in siteConfig because it also serves as
// the site's meta description.
function Hero() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.hero)}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          {siteConfig.title}
        </Heading>
        <p className={styles.heroLead}>
          Turn data from common formats into NGSI-LD entities.
        </p>
        <p className={styles.heroTagline}>{siteConfig.tagline}</p>
        <HomepageEquation />
        <div className={styles.heroButtons}>
          <Link
            className={clsx('button button--lg', styles.heroButtonPrimary)}
            to="/docs/guides/getting-started">
            Get started
          </Link>
          <Link
            className={clsx('button button--lg', styles.heroButtonSecondary)}
            to="/docs/">
            Read the docs
          </Link>
        </div>
      </div>
    </header>
  );
}

function Banner() {
  return (
    <div className={styles.banner}>
      <img
        src={useBaseUrl('/img/vela-banner.svg')}
        alt="Wind farm, industrial site, city centre and residential district drawn as connected isometric tiles, the kinds of data source Cassiopeia maps into NGSI-LD"
        width={7000}
        height={2400}
        loading="lazy"
      />
      <p className={styles.scope}>
        <Link href="https://ngsi-ld.org/">NGSI-LD</Link> is the linked-data
        model used by many smart-city, IoT, and dataspace platforms across
        Europe. Cassiopeia prepares data for these systems; it does not store or
        serve context itself.
      </p>
    </div>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    // The Layout title becomes "<title> | Cassiopeia". "Cassiopeia" alone is
    // ambiguous in a search result, so the page leads with what it is.
    <Layout
      title="Open-source NGSI-LD mapper"
      description={siteConfig.tagline}>
      <Hero />
      <main>
        <Banner />
        <HomepageSovereignty />
        <HomepageEditions />
        <HomepageCommunity />
      </main>
    </Layout>
  );
}
