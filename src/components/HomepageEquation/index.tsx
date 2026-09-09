import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';

import styles from './styles.module.css';

// Example 14 of the examples repo, trimmed to the temperature reading: the
// real mapping carries humidity, pressure, wind, and visibility too. The
// observation is public information published by ARSO under Article 14 of the
// national meteorology act: free reuse, source named.
const dataset = `<metData>
  <domain_id>65142878</domain_id>
  <domain_lat>46.0658</domain_lat>
  <domain_lon>14.5172</domain_lon>
  <domain_title>LJUBLJANA/BEZIGRAD</domain_title>
  <valid_UTC>21.08.2026 10:00 UTC</valid_UTC>
  <t>23</t>
</metData>`;

const mapping = `{
  dataModel: "dataModel.Weather/WeatherObserved",
  identity: {
    entityName: "{{ metData.domain_id }}",
  },
  attributes: {
    temperature: {
      source: "{{ metData.t }}",
      type: "Property",
      transformation: "float",
      properties: {
        unitCode: {
          source: "CEL",
        },
        observedAt: {
          source: "{{ metData.valid_UTC | replace(from='.', to='/') | replace(from=' UTC', to='') }}",
          type: "Property",
          transformation: "datetime",
        },
      },
    },
  },
}`;

const entity = `{
  "id": "urn:ngsi-ld:WeatherObserved:65142878",
  "type": "WeatherObserved",
  "temperature": {
    "type": "Property",
    "value": 23.0,
    "observedAt": "2026-08-21T10:00:00Z",
    "unitCode": "CEL"
  }
}`;

type PaneProps = {
  label: string;
  file: string;
  language: string;
  children: string;
};

function Pane({ label, file, language, children }: PaneProps) {
  return (
    <div className={styles.pane}>
      <div className={styles.paneLabel}>
        {label}
        <span className={styles.paneFile}>{file}</span>
      </div>
      <CodeBlock language={language}>{children}</CodeBlock>
    </div>
  );
}

export default function HomepageEquation(): ReactNode {
  return (
    <section className={styles.equation}>
      <div className={styles.inner}>
        <div className={styles.row}>
          <Pane label="Dataset" file="observation.xml" language="xml">
            {dataset}
          </Pane>
          <div className={styles.operator} aria-hidden="true">
            +
          </div>
          <Pane label="Mapping" file="weather.json5" language="json5">
            {mapping}
          </Pane>
          <div className={styles.operator} aria-hidden="true">
            =
          </div>
          <Pane label="Entity" file="WeatherObserved.json" language="json">
            {entity}
          </Pane>
        </div>

        <p className={styles.credit}>
          Surface observation for Ljubljana Bežigrad, trimmed to one reading.
          Source:{' '}
          <Link href="https://meteo.arso.gov.si/">
            Slovenian Environment Agency (ARSO)
          </Link>
          , free reuse with attribution.{' '}
          <Link href="https://github.com/vela-tools/cassiopeia-examples/blob/main/examples/14-xml-unit-code/example.md">
            Example 14
          </Link>{' '}
          works the full mapping through.
        </p>
      </div>
    </section>
  );
}
