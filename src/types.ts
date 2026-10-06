import type { ClientColor } from "./lib/clientColors";

export type VideoType = "short" | "longform" | "other";

export interface Card {
  id: string; // uuid
  title: string;
  client?: string;
  videoType: VideoType;
  targetLength?: string;
  deadline?: string; // "YYYY-MM-DD", local date
  revisionRound: number; // 0 = none yet
  revisionLimit?: number;
  notes?: string;
  seed: number; // for stable sketch rendering
  createdAt: string; // ISO timestamp
  updatedAt: string;
}

export interface Column {
  id: string;
  name: string;
  cardIds: string[]; // order = display order
  isRevisionColumn: boolean; // dropping here bumps revisionRound
  isDoneColumn: boolean; // suppresses deadline warnings
}

export interface BoardState {
  schemaVersion: 1;
  columns: Column[]; // order = display order
  cards: Record<string, Card>;
  flags: { sampleCleared: boolean; backupNoticeDismissed: boolean };
  /** Optional per-client color picks, keyed by normalized client name. Clients without one get an automatic color. */
  clientColors?: Record<string, ClientColor>;
  /** Saved client names offered as one-tap suggestions. */
  clients?: string[];
}

export const LIMITS = {
  title: 80,
  client: 40,
  targetLength: 12,
  notes: 1000,
  columnName: 30,
  savedClients: 200,
  minColumns: 1,
  maxColumns: 8,
  minRevisionLimit: 1,
  maxRevisionLimit: 10,
} as const;

export const VIDEO_TYPE_LABEL: Record<VideoType, string> = {
  short: "Short",
  longform: "Long-form",
  other: "Other",
};
