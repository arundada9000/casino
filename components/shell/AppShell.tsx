"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { feedback } from "@/lib/app-feedback";
import { APP_BUILD, APP_VERSION } from "@/lib/app";
import {
  ActivityIcon,
  GamesIcon,
  HomeIcon,
  LogoIcon,
  ProfileIcon,
  WalletIcon,
} from "@/components/ui/icons";

import styles from "./shell.module.css";

interface TabDefinition {
  path: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

const TABS: TabDefinition[] = [
  { path: "/", label: "Home", icon: HomeIcon },
  { path: "/games", label: "Games", icon: GamesIcon },
  { path: "/wallet", label: "Wallet", icon: WalletIcon },
  { path: "/activity", label: "Activity", icon: ActivityIcon },
  { path: "/profile", label: "Profile", icon: ProfileIcon },
];

function isActive(path: string, current: string): boolean {
  if (path === "/") return current === "/";
  if (path === "/profile") {
    return (
      current === "/profile" || current.startsWith("/settings") || current.startsWith("/about")
    );
  }
  return current === path || current.startsWith(`${path}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skipLink} onClick={() => feedback("navigate")}>
        Skip to content
      </a>
      <aside className={styles.sidebar}>
        <Link
          href="/"
          className={styles.brand}
          onClick={() => feedback("navigate")}
        >
          <span className={styles.brandMark}>
            <LogoIcon size={22} />
          </span>
          <span className={styles.brandName}>Aurelia</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary navigation">
          {TABS.map((tab) => {
            const active = isActive(tab.path, pathname);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.path}
                href={tab.path}
                className={styles.navItem}
                data-active={active || undefined}
                aria-current={active ? "page" : undefined}
                onClick={() => feedback("navigate")}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        <p className={styles.version}>
          {APP_VERSION} · {APP_BUILD}
        </p>
      </aside>

      <main id="main" className={styles.main}>
        {children}
      </main>

      <nav className={styles.tabbar} aria-label="Primary navigation · tab bar">
        {TABS.map((tab) => {
          const active = isActive(tab.path, pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={styles.tabItem}
              data-active={active || undefined}
              aria-current={active ? "page" : undefined}
              onClick={() => feedback("navigate")}
            >
              <span className={styles.tabIcon}>
                <Icon size={24} />
              </span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}