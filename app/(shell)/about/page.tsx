"use client";

import { LargeTitle } from "@/components/ui/LargeTitle";
import { ListGroup, ListRow } from "@/components/ui/ListRow";
import { SystemStatus } from "@/components/about/SystemStatus";
import { CheckIcon, InfoIcon, LogoIcon } from "@/components/ui/icons";
import { APP_BUILD, APP_VERSION } from "@/lib/app";

import styles from "./about.module.css";

export default function AboutPage() {
  return (
    <div>
      <LargeTitle subtitle="What Aurelia is, and why it is simulation only.">About</LargeTitle>

      <section className={styles.hero}>
        <span className={styles.mark}>
          <LogoIcon size={30} />
        </span>
        <h2 className={styles.name}>Aurelia</h2>
        <p className={styles.tagline}>
          A premium fictional casino simulation. Virtual credits only, built to
          feel like a native app.
        </p>
        <p className={styles.version}>
          Version {APP_VERSION} · {APP_BUILD}
        </p>
      </section>

      <ListGroup title="The rules of the house">
        <ListRow
          icon={<CheckIcon size={17} />}
          title="No real money"
          subtitle="Every currency is fictional and exists purely for gameplay."
        />
        <ListRow
          icon={<CheckIcon size={17} />}
          title="No deposits or withdrawals"
          subtitle="There is nothing to cash out, ever."
        />
        <ListRow
          icon={<CheckIcon size={17} />}
          title="Simulation, not gambling"
          subtitle="No prizes, no cryptocurrency, no monetary value."
        />
      </ListGroup>

      <ListGroup title="How the simulation works">
        <ListRow
          icon={<InfoIcon size={17} />}
          title="Milestone-built games"
          subtitle="Ten games join the library one milestone at a time."
        />
      </ListGroup>

      <SystemStatus />
    </div>
  );
}