import { LIMITS, type BoardState, type Card, type Column } from "../types";
import { isValidISODate } from "./dates";
import { isClientColor, type ClientColor } from "./clientColors";

/**
 * Strict validation of a full BoardState (used for both localStorage and
 * imported files). Returns a clean copy of the board, or a readable reason.
 */
export type ValidationResult = { ok: true; board: BoardState } | { ok: false; reason: string };

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown, max: number): v is string => typeof v === "string" && v.length <= max;
const optStr = (v: unknown, max: number) => v === undefined || isStr(v, max);
const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);

function checkCard(id: string, c: unknown): string | null {
  if (!isObj(c)) return "a card is not an object";
  if (c.id !== id) return "a card's id doesn't match its key";
  if (!isStr(c.title, LIMITS.title) || c.title.trim() === "") return "a card has a missing or too-long title";
  if (!optStr(c.client, LIMITS.client)) return "a card's client name is too long";
  if (!["short", "longform", "other"].includes(c.videoType as string)) return "a card has an unknown video type";
  if (!optStr(c.targetLength, LIMITS.targetLength)) return "a card's target length is too long";
  if (c.deadline !== undefined && !isValidISODate(c.deadline)) return "a card has an invalid deadline";
  if (!isInt(c.revisionRound) || c.revisionRound < 0) return "a card has an invalid revision round";
  if (c.revisionLimit !== undefined && (!isInt(c.revisionLimit) ||
      c.revisionLimit < LIMITS.minRevisionLimit || c.revisionLimit > LIMITS.maxRevisionLimit))
    return "a card has an invalid revision limit";
  if (!optStr(c.notes, LIMITS.notes)) return "a card's notes are too long";
  if (!isInt(c.seed)) return "a card is missing its sketch seed";
  if (typeof c.createdAt !== "string" || typeof c.updatedAt !== "string") return "a card is missing timestamps";
  return null;
}

function checkColumn(c: unknown): string | null {
  if (!isObj(c)) return "a column is not an object";
  if (typeof c.id !== "string" || !c.id) return "a column has no id";
  if (!isStr(c.name, LIMITS.columnName)) return "a column has an invalid name";
  if (!Array.isArray(c.cardIds) || !c.cardIds.every((x) => typeof x === "string")) return "a column's card list is broken";
  if (typeof c.isRevisionColumn !== "boolean" || typeof c.isDoneColumn !== "boolean") return "a column is missing its settings";
  return null;
}

export function validateBoard(data: unknown): ValidationResult {
  const fail = (reason: string): ValidationResult => ({ ok: false, reason });
  if (!isObj(data)) return fail("it isn't a board backup");
  if (data.schemaVersion !== 1) return fail("it isn't a backup from this app (unknown version)");
  if (!Array.isArray(data.columns)) return fail("it has no columns");
  if (data.columns.length < LIMITS.minColumns || data.columns.length > LIMITS.maxColumns)
    return fail(`it must have between ${LIMITS.minColumns} and ${LIMITS.maxColumns} columns`);
  if (!isObj(data.cards)) return fail("it has no cards section");
  const flags = data.flags;
  if (!isObj(flags) || typeof flags.sampleCleared !== "boolean" || typeof flags.backupNoticeDismissed !== "boolean")
    return fail("it has no settings section");

  for (const col of data.columns) {
    const e = checkColumn(col);
    if (e) return fail(e);
  }
  const cards = data.cards;
  for (const [id, card] of Object.entries(cards)) {
    const e = checkCard(id, card);
    if (e) return fail(e);
  }

  // Every card must live in exactly one column, and every reference must resolve.
  const colIds = new Set<string>();
  const seen = new Set<string>();
  for (const col of data.columns as Column[]) {
    if (colIds.has(col.id)) return fail("two columns share an id");
    colIds.add(col.id);
    for (const cid of col.cardIds) {
      if (!(cid in cards)) return fail("a column points at a card that doesn't exist");
      if (seen.has(cid)) return fail("a card appears twice");
      seen.add(cid);
    }
  }
  if (seen.size !== Object.keys(cards).length) return fail("some cards aren't in any column");

  // Optional (added after v1 shipped): older backups simply don't have it.
  let clientColors: Record<string, ClientColor> | undefined;
  if (data.clientColors !== undefined) {
    if (!isObj(data.clientColors)) return fail("its client colors are broken");
    clientColors = {};
    for (const [name, color] of Object.entries(data.clientColors)) {
      if (name.length > LIMITS.client || !isClientColor(color)) return fail("it has an unknown client color");
      clientColors[name] = color;
    }
  }

  let clients: string[] | undefined;
  if (data.clients !== undefined) {
    if (!Array.isArray(data.clients) || data.clients.length > LIMITS.savedClients ||
        !data.clients.every((c) => isStr(c, LIMITS.client) && c.trim() !== ""))
      return fail("its saved client list is broken");
    clients = [...data.clients];
  }

  // Rebuild a clean object so unknown extra keys never leak into state.
  const board: BoardState = {
    schemaVersion: 1,
    columns: (data.columns as Column[]).map((c) => ({
      id: c.id, name: c.name, cardIds: [...c.cardIds],
      isRevisionColumn: c.isRevisionColumn, isDoneColumn: c.isDoneColumn,
    })),
    cards: Object.fromEntries(
      Object.entries(cards as Record<string, Card>).map(([id, c]) => [id, {
        id: c.id, title: c.title, client: c.client, videoType: c.videoType,
        targetLength: c.targetLength, deadline: c.deadline, revisionRound: c.revisionRound,
        revisionLimit: c.revisionLimit, notes: c.notes, seed: c.seed,
        createdAt: c.createdAt, updatedAt: c.updatedAt,
      }]),
    ),
    flags: { sampleCleared: flags.sampleCleared as boolean, backupNoticeDismissed: flags.backupNoticeDismissed as boolean },
    ...(clientColors ? { clientColors } : {}),
    ...(clients ? { clients } : {}),
  };
  return { ok: true, board };
}
