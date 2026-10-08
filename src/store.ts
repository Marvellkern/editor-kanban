import { create } from "zustand";
import { LIMITS, type BoardState, type Card, type Column, type VideoType } from "./types";
import { createDefaultBoard, makeCard, makeColumn, SAMPLE_CARD_IDS } from "./lib/defaults";
import { validateBoard } from "./lib/validate";
import { clientKey, type ClientColor } from "./lib/clientColors";

export const STORAGE_KEY = "sketchkanban.board.v1";
export const CORRUPT_KEY = "sketchkanban.board.corrupt";

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

function loadBoard(): BoardState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return createDefaultBoard(); // storage blocked (private mode etc.)
  }
  if (raw === null) return createDefaultBoard();
  try {
    const result = validateBoard(JSON.parse(raw));
    if (result.ok) return result.board;
  } catch {
    /* fall through to corrupt handling */
  }
  try {
    localStorage.setItem(CORRUPT_KEY, raw);
  } catch {
    /* nothing more we can do */
  }
  return createDefaultBoard();
}

/** Boards from before saved clients existed start with every client already on their cards. */
function withClientList(board: BoardState): BoardState {
  if (board.clients) return board;
  const clients: string[] = [];
  const seen = new Set<string>();
  for (const card of Object.values(board.cards)) {
    const name = card.client?.trim();
    if (name && !seen.has(clientKey(name))) {
      seen.add(clientKey(name));
      clients.push(name);
    }
  }
  return { ...board, clients };
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleSave(board: BoardState) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => writeNow(board), 300);
}
function writeNow(board: BoardState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  } catch {
    /* quota or blocked storage: nothing sensible to do silently */
  }
}

/* ------------------------------------------------------------------ */
/* Board store                                                         */
/* ------------------------------------------------------------------ */

export interface RemovedCard {
  card: Card;
  columnId: string;
  index: number;
}

export interface MoveResult {
  bumped: boolean;
  round: number;
}

interface BoardStore {
  board: BoardState;
  addCard: (columnId: string, title: string) => string;
  updateCard: (id: string, patch: Partial<Omit<Card, "id" | "seed" | "createdAt">>) => void;
  deleteCard: (id: string) => RemovedCard | null;
  restoreCard: (removed: RemovedCard) => void;
  /** Moves a card; bumps the revision round when it lands in a revision column from elsewhere. */
  moveCard: (id: string, toColumnId: string, toIndex?: number) => MoveResult;
  /** Commit a whole column layout after a drag. `fromColumnId` is where the card started. */
  commitDrag: (columns: Column[], cardId: string, fromColumnId: string) => MoveResult;
  changeRevision: (id: string, delta: number) => void;
  addColumn: () => string | null;
  updateColumn: (id: string, patch: Partial<Pick<Column, "name" | "isRevisionColumn" | "isDoneColumn">>) => void;
  deleteColumn: (id: string) => void;
  moveColumn: (id: string, delta: -1 | 1) => void;
  clearSamples: () => void;
  /** Pick a color for every video of this client; null goes back to the automatic color. */
  setClientColor: (client: string, color: ClientColor | null) => void;
  dismissBackupNotice: () => void;
  replaceBoard: (board: BoardState) => void;
  /** Adds a client to the saved list (no-op if already there). */
  saveClient: (name: string) => void;
  /** Removes a client from the saved list; videos keep their client name. */
  removeClient: (name: string) => void;
}

const now = () => new Date().toISOString();

export function columnOf(board: BoardState, cardId: string): Column | undefined {
  return board.columns.find((c) => c.cardIds.includes(cardId));
}

export const useBoard = create<BoardStore>((set, get) => {
  const update = (fn: (b: BoardState) => BoardState) => set((s) => ({ board: fn(s.board) }));

  const bumpIfRevision = (b: BoardState, cardId: string, fromId: string, toId: string): [BoardState, MoveResult] => {
    const to = b.columns.find((c) => c.id === toId);
    const card = b.cards[cardId];
    if (!to || !card || fromId === toId || !to.isRevisionColumn) {
      return [b, { bumped: false, round: card?.revisionRound ?? 0 }];
    }
    const round = card.revisionRound + 1;
    return [
      { ...b, cards: { ...b.cards, [cardId]: { ...card, revisionRound: round, updatedAt: now() } } },
      { bumped: true, round },
    ];
  };

  return {
    board: withClientList(loadBoard()),

    addCard(columnId, title) {
      const card = makeCard(title.trim().slice(0, LIMITS.title));
      update((b) => ({
        ...b,
        cards: { ...b.cards, [card.id]: card },
        columns: b.columns.map((c) => (c.id === columnId ? { ...c, cardIds: [...c.cardIds, card.id] } : c)),
      }));
      return card.id;
    },

    updateCard(id, patch) {
      update((b) => {
        const card = b.cards[id];
        if (!card) return b;
        return { ...b, cards: { ...b.cards, [id]: { ...card, ...patch, updatedAt: now() } } };
      });
    },

    deleteCard(id) {
      const b = get().board;
      const col = columnOf(b, id);
      const card = b.cards[id];
      if (!col || !card) return null;
      const index = col.cardIds.indexOf(id);
      const { [id]: _removed, ...rest } = b.cards;
      update((cur) => ({
        ...cur,
        cards: rest,
        columns: cur.columns.map((c) => (c.id === col.id ? { ...c, cardIds: c.cardIds.filter((x) => x !== id) } : c)),
      }));
      return { card, columnId: col.id, index };
    },

    restoreCard({ card, columnId, index }) {
      update((b) => {
        if (b.cards[card.id]) return b;
        const target = b.columns.find((c) => c.id === columnId) ?? b.columns[0];
        return {
          ...b,
          cards: { ...b.cards, [card.id]: card },
          columns: b.columns.map((c) => {
            if (c.id !== target.id) return c;
            const ids = [...c.cardIds];
            ids.splice(Math.min(index, ids.length), 0, card.id);
            return { ...c, cardIds: ids };
          }),
        };
      });
    },

    moveCard(id, toColumnId, toIndex) {
      const b = get().board;
      const from = columnOf(b, id);
      if (!from) return { bumped: false, round: 0 };
      const columns = b.columns.map((c) => ({ ...c, cardIds: c.cardIds.filter((x) => x !== id) }));
      const to = columns.find((c) => c.id === toColumnId);
      if (!to) return { bumped: false, round: 0 };
      to.cardIds.splice(toIndex ?? to.cardIds.length, 0, id);
      const [next, result] = bumpIfRevision({ ...b, columns }, id, from.id, toColumnId);
      set({ board: next });
      return result;
    },

    commitDrag(columns, cardId, fromColumnId) {
      const b = get().board;
      const to = columns.find((c) => c.cardIds.includes(cardId));
      const [next, result] = bumpIfRevision({ ...b, columns }, cardId, fromColumnId, to?.id ?? fromColumnId);
      set({ board: next });
      return result;
    },

    changeRevision(id, delta) {
      update((b) => {
        const card = b.cards[id];
        if (!card) return b;
        const round = Math.max(0, card.revisionRound + delta);
        return { ...b, cards: { ...b.cards, [id]: { ...card, revisionRound: round, updatedAt: now() } } };
      });
    },

    addColumn() {
      if (get().board.columns.length >= LIMITS.maxColumns) return null;
      const col = makeColumn("New column");
      update((b) => ({ ...b, columns: [...b.columns, col] }));
      return col.id;
    },

    updateColumn(id, patch) {
      update((b) => ({ ...b, columns: b.columns.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
    },

    deleteColumn(id) {
      update((b) => {
        if (b.columns.length <= LIMITS.minColumns) return b;
        const col = b.columns.find((c) => c.id === id);
        if (!col) return b;
        const cards = { ...b.cards };
        for (const cid of col.cardIds) delete cards[cid];
        return { ...b, cards, columns: b.columns.filter((c) => c.id !== id) };
      });
    },

    moveColumn(id, delta) {
      update((b) => {
        const i = b.columns.findIndex((c) => c.id === id);
        const j = i + delta;
        if (i < 0 || j < 0 || j >= b.columns.length) return b;
        const columns = [...b.columns];
        [columns[i], columns[j]] = [columns[j], columns[i]];
        return { ...b, columns };
      });
    },

    clearSamples() {
      update((b) => {
        const ids = new Set<string>(SAMPLE_CARD_IDS);
        const cards = Object.fromEntries(Object.entries(b.cards).filter(([id]) => !ids.has(id)));
        // Forget the sample clients too, unless the user put one on a real video.
        const sampleClients = new Set(
          Object.values(b.cards).filter((c) => ids.has(c.id) && c.client).map((c) => clientKey(c.client!)),
        );
        for (const c of Object.values(cards)) if (c.client) sampleClients.delete(clientKey(c.client));
        const clientColors = Object.fromEntries(
          Object.entries(b.clientColors ?? {}).filter(([k]) => !sampleClients.has(k)),
        );
        return {
          ...b,
          cards,
          clients: (b.clients ?? []).filter((c) => !sampleClients.has(clientKey(c))),
          clientColors,
          columns: b.columns.map((c) => ({ ...c, cardIds: c.cardIds.filter((x) => !ids.has(x)) })),
          flags: { ...b.flags, sampleCleared: true },
        };
      });
    },

    setClientColor(client, color) {
      const key = clientKey(client);
      if (!key) return;
      update((b) => {
        const { [key]: _old, ...rest } = b.clientColors ?? {};
        return { ...b, clientColors: color ? { ...rest, [key]: color } : rest };
      });
    },

    dismissBackupNotice() {
      update((b) => ({ ...b, flags: { ...b.flags, backupNoticeDismissed: true } }));
    },

    replaceBoard(board) {
      set({ board: withClientList(board) });
    },

    saveClient(name) {
      const clean = name.trim().slice(0, LIMITS.client);
      if (!clean) return;
      update((b) => {
        const list = b.clients ?? [];
        if (list.some((c) => clientKey(c) === clientKey(clean)) || list.length >= LIMITS.savedClients) return b;
        return { ...b, clients: [...list, clean] };
      });
    },

    removeClient(name) {
      update((b) => ({ ...b, clients: (b.clients ?? []).filter((c) => clientKey(c) !== clientKey(name)) }));
    },
  };
});

useBoard.subscribe((s, prev) => {
  if (s.board !== prev.board) scheduleSave(s.board);
});
// Flush any pending save if the tab is closed within the debounce window.
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    clearTimeout(saveTimer);
    writeNow(useBoard.getState().board);
  });
}

/* ------------------------------------------------------------------ */
/* UI store (not persisted)                                            */
/* ------------------------------------------------------------------ */

export type TypeFilter = "all" | VideoType;

export interface Toast {
  id: number;
  message: string;
  /** A video or client name, shown in quotes after the message and hidden in blur mode. */
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ConfirmRequest {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  /** Only an "OK" button: used for errors. */
  alertOnly?: boolean;
  onConfirm?: () => void;
}

interface UIStore {
  /** Blur mode: hides video titles and client names for screenshots. */
  blur: boolean;
  setBlur: (v: boolean) => void;
  search: string;
  typeFilter: TypeFilter;
  dueThisWeek: boolean;
  editingCardId: string | null;
  settingsColumnId: string | null;
  toasts: Toast[];
  confirm: ConfirmRequest | null;
  setSearch: (v: string) => void;
  setTypeFilter: (v: TypeFilter) => void;
  setDueThisWeek: (v: boolean) => void;
  openCard: (id: string | null) => void;
  openColumnSettings: (id: string | null) => void;
  showToast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
  askConfirm: (c: ConfirmRequest | null) => void;
}

// A per-browser display preference, kept apart from the board so it never ends up in exports.
const BLUR_KEY = "sketchkanban.blur";
function readBlurPref(): boolean {
  try {
    return localStorage.getItem(BLUR_KEY) === "1";
  } catch {
    return false;
  }
}

let toastSeq = 0;
const TOAST_MS = 5000;

export const useUI = create<UIStore>((set, get) => ({
  blur: readBlurPref(),
  setBlur(blur) {
    set({ blur });
    try {
      localStorage.setItem(BLUR_KEY, blur ? "1" : "0");
    } catch {
      /* storage blocked: the toggle still works for this visit */
    }
  },
  search: "",
  typeFilter: "all",
  dueThisWeek: false,
  editingCardId: null,
  settingsColumnId: null,
  toasts: [],
  confirm: null,
  setSearch: (search) => set({ search }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  setDueThisWeek: (dueThisWeek) => set({ dueThisWeek }),
  openCard: (editingCardId) => set({ editingCardId }),
  openColumnSettings: (settingsColumnId) => set({ settingsColumnId }),
  showToast(t) {
    const id = ++toastSeq;
    // Keep the stack short: newest three.
    set({ toasts: [...get().toasts.slice(-2), { ...t, id }] });
    setTimeout(() => get().dismissToast(id), TOAST_MS);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  askConfirm: (confirm) => set({ confirm }),
}));

/** Shared helper: move a card and show the "Revision round N" toast with undo. */
export function announceMove(cardId: string, result: MoveResult) {
  if (!result.bumped) return;
  useUI.getState().showToast({
    message: `Revision round ${result.round}`,
    actionLabel: "Undo",
    onAction: () => useBoard.getState().changeRevision(cardId, -1),
  });
}
