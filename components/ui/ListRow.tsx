"use client";

import type { ReactNode } from "react";
import { feedback } from "@/lib/app-feedback";
import { ChevronRightIcon } from "./icons";

import styles from "./list-row.module.css";

export interface ListRowProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}

export function ListRow({
  icon,
  title,
  subtitle,
  trailing,
  onPress,
  destructive,
}: ListRowProps) {
  const content = (
    <>
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <span className={styles.text}>
        <span className={styles.title} data-destructive={destructive || undefined}>
          {title}
        </span>
        {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
      </span>
      <span className={styles.trailing}>
        {trailing ?? (onPress ? <ChevronRightIcon size={17} /> : null)}
      </span>
    </>
  );

  if (onPress) {
    return (
      <li className={styles.item}>
        <button
          type="button"
          className={styles.row}
          onClick={() => {
            feedback("tap");
            onPress();
          }}
        >
          {content}
        </button>
      </li>
    );
  }

  return (
    <li className={styles.item}>
      <div className={styles.row} role="group">
        {content}
      </div>
    </li>
  );
}

export function ListGroup({
  title,
  footer,
  children,
}: {
  title?: string;
  footer?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.group} aria-label={title}>
      {title ? <h2 className={styles.header}>{title}</h2> : null}
      <ul className={styles.list}>{children}</ul>
      {footer ? <p className={styles.footer}>{footer}</p> : null}
    </section>
  );
}