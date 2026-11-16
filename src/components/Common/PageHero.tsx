import type { ReactNode } from 'react';
import styles from './page-hero.module.css';

interface Props {
  eyebrow: string;
  title: string;
  intro?: string;
  children?: ReactNode;
}

/** Inner-page header: eyebrow, H1, lead paragraph. */
export const PageHero = ({ eyebrow, title, intro, children }: Props) => (
  <section className={styles.hero}>
    <div className={`container ${styles.inner}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h1 className={styles.title}>{title}</h1>
      {intro && <p className={`lead ${styles.intro}`}>{intro}</p>}
      {children}
    </div>
  </section>
);
