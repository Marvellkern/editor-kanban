import type { BoardState, Card, Column } from "../types";
import { addDaysISO, todayISO } from "./dates";
import { newSeed, uuid } from "./ids";

/** Fixed ids so "Clear sample cards" can find them later. */
export const SAMPLE_CARD_IDS = [
  "5a3b1e00-0000-4000-8000-000000000001",
  "5a3b1e00-0000-4000-8000-000000000002",
  "5a3b1e00-0000-4000-8000-000000000003",
  "5a3b1e00-0000-4000-8000-000000000004",
  "5a3b1e00-0000-4000-8000-000000000005",
] as const;

export function makeColumn(name: string, flags: Partial<Column> = {}): Column {
  return { id: uuid(), name, cardIds: [], isRevisionColumn: false, isDoneColumn: false, ...flags };
}

export function makeCard(title: string, fields: Partial<Card> = {}): Card {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    title,
    videoType: "short",
    revisionRound: 0,
    seed: newSeed(),
    createdAt: now,
    updatedAt: now,
    ...fields,
  };
}

export function createDefaultBoard(): BoardState {
  const today = todayISO();
  const incoming = makeColumn("Incoming");
  const editing = makeColumn("Editing");
  const review = makeColumn("Sent for Review");
  const revisions = makeColumn("Revisions", { isRevisionColumn: true });
  const delivered = makeColumn("Delivered", { isDoneColumn: true });

  const samples: [Column, Card][] = [
    [incoming, makeCard("Travel vlog ep. 3", {
      id: SAMPLE_CARD_IDS[0], client: "Sample client A", videoType: "longform",
      targetLength: "12 min", deadline: addDaysISO(today, 9),
      notes: "Footage arrives Friday. Keep the intro under 30s.",
    })],
    [editing, makeCard("Product launch short", {
      id: SAMPLE_CARD_IDS[1], client: "Sample client B", videoType: "short",
      targetLength: "0:45", deadline: addDaysISO(today, -2),
    })],
    [review, makeCard("Podcast ep. 12 highlights", {
      id: SAMPLE_CARD_IDS[2], client: "Sample client C", videoType: "short",
      targetLength: "60s", deadline: addDaysISO(today, 2), revisionLimit: 2,
    })],
    [revisions, makeCard("Cooking tutorial cut-down", {
      id: SAMPLE_CARD_IDS[3], client: "Sample client A", videoType: "longform",
      targetLength: "8 min", deadline: today, revisionRound: 2, revisionLimit: 3,
      notes: "Round 2: swap the music, tighten the middle section.",
    })],
    [delivered, makeCard("Event recap reel", {
      id: SAMPLE_CARD_IDS[4], client: "Sample client D", videoType: "other",
      targetLength: "3 min", deadline: addDaysISO(today, -4), revisionRound: 1,
    })],
  ];

  const cards: Record<string, Card> = {};
  for (const [col, card] of samples) {
    col.cardIds.push(card.id);
    cards[card.id] = card;
  }

  return {
    schemaVersion: 1,
    columns: [incoming, editing, review, revisions, delivered],
    cards,
    flags: { sampleCleared: false, backupNoticeDismissed: false },
    // Fixed picks so the sample clients are guaranteed to look different.
    clientColors: {
      "sample client a": "coral",
      "sample client b": "teal",
      "sample client c": "lavender",
      "sample client d": "sage",
    },
  };
}
