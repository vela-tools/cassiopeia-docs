import type { ReactNode } from 'react';
import Heading from '@theme/Heading';

import styles from './styles.module.css';

export default function HomepageEditions(): ReactNode {
  return (
    <section className={styles.editions}>
      <div className="container">
        <Heading as="h2" className={styles.title}>
          Editions
        </Heading>
        <p className={styles.body}>
          Cassiopeia is open core. The FOSS edition is complete on its own: it
          maps, validates, and delivers NGSI-LD without a licence key or
          account, and what ships in it stays in it. Pro and Hub add operational
          tooling around the same engine.
        </p>
      </div>
    </section>
  );
}
