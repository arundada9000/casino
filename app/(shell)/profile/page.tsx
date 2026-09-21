"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { Button } from "@/components/ui/Button";
import { ListGroup, ListRow } from "@/components/ui/ListRow";
import {
  CheckIcon,
  InfoIcon,
  ProfileIcon,
  SlidersIcon,
  SparkleIcon,
  TrophyIcon,
} from "@/components/ui/icons";
import { useEconomyStore } from "@/stores/economy";
import { useSettingsStore, sanitizeProfileName } from "@/stores/settings";
import { useMounted } from "@/hooks/useMounted";
import { formatCredits } from "@/lib/format";
import { ledgerTotals } from "@/lib/ledger";

import styles from "./profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const mounted = useMounted();
  const transactions = useEconomyStore((state) => state.transactions);
  const totals = ledgerTotals(transactions);
  const profileName = useSettingsStore((state) => state.profileName);
  const setProfileName = useSettingsStore((state) => state.setProfileName);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profileName);

  const displayName = profileName.trim() || "Guest";

  const startEditing = () => {
    setDraft(profileName);
    setEditing(true);
  };

  const saveName = () => {
    setProfileName(sanitizeProfileName(draft));
    setEditing(false);
  };

  return (
    <div>
      <LargeTitle subtitle="This is your local simulation profile.">Profile</LargeTitle>

      <ListGroup title="Session">
        {editing ? (
          <li className={styles.nameField}>
            <input
              value={draft}
              maxLength={24}
              aria-label="Player name"
              className={styles.nameInput}
              placeholder="Your name"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") saveName();
                if (event.key === "Escape") setEditing(false);
              }}
              onChange={(event) => setDraft(event.target.value)}
            />
            <Button variant="primary" size="md" onClick={saveName} icon={<CheckIcon size={16} />}>
              Save
            </Button>
          </li>
        ) : (
          <ListRow
            icon={<ProfileIcon size={17} />}
            title="Name"
            subtitle="Tap to give your table a name"
            trailing={displayName}
            onPress={startEditing}
          />
        )}
        <ListRow
          icon={<SparkleIcon size={17} />}
          title="Welcome allocation"
          trailing={mounted ? "25,000 cr" : "..."}
        />
        <ListRow
          icon={<TrophyIcon size={17} />}
          title="Net result"
          subtitle="Across every recorded transaction"
          trailing={
            mounted ? (
              <span style={{ color: totals.net >= 0 ? "var(--a-color-success)" : undefined }}>
                {formatCredits(totals.net, { signed: true })} cr
              </span>
            ) : (
              "..."
            )
          }
        />
      </ListGroup>

      <ListGroup title="Aurelia">
        <ListRow
          icon={<SlidersIcon size={17} />}
          title="Settings"
          subtitle="Appearance · sound · haptics"
          onPress={() => router.push("/settings")}
        />
        <ListRow
          icon={<InfoIcon size={17} />}
          title="About & legal"
          subtitle="Simulation policy and system status"
          onPress={() => router.push("/about")}
        />
      </ListGroup>
    </div>
  );
}