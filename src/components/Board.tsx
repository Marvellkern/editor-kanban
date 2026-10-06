import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  closestCorners,
  closestCenter,
  DndContext,
  DragOverlay,
  getFirstCollision,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { LIMITS, type Card, type Column } from "../types";
import { isDueThisWeek } from "../lib/dates";
import { announceMove, useBoard, useUI } from "../store";
import { ColumnView } from "./ColumnView";
import { CardFace } from "./CardView";
import { markDragEnd } from "./dragGuard";
import { SketchButton } from "../sketch/primitives";
import { PlusIcon } from "../sketch/icons";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function findColumn(cols: Column[], id: UniqueIdentifier): Column | undefined {
  return cols.find((c) => c.id === id) ?? cols.find((c) => c.cardIds.includes(String(id)));
}

export function Board() {
  const board = useBoard((s) => s.board);
  const commitDrag = useBoard((s) => s.commitDrag);
  const addColumn = useBoard((s) => s.addColumn);
  const search = useUI((s) => s.search);
  const typeFilter = useUI((s) => s.typeFilter);
  const dueThisWeek = useUI((s) => s.dueThisWeek);
  const openColumnSettings = useUI((s) => s.openColumnSettings);

  // While dragging, layout changes live here and are committed to the store on drop.
  const [dragCols, setDragCols] = useState<Column[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const fromColumnRef = useRef("");
  const columns = dragCols ?? board.columns;

  const filtered = search.trim() !== "" || typeFilter !== "all" || dueThisWeek;
  const isVisible = useCallback(
    (card: Card, col: Column) => {
      if (typeFilter !== "all" && card.videoType !== typeFilter) return false;
      if (dueThisWeek && !isDueThisWeek(card.deadline, col.isDoneColumn)) return false;
      const q = search.trim().toLowerCase();
      if (q && !card.title.toLowerCase().includes(q) && !(card.client ?? "").toLowerCase().includes(q)) return false;
      return true;
    },
    [search, typeFilter, dueThisWeek],
  );

  // Reuse each column's previous array when its contents are unchanged, so memoized
  // columns don't re-render while a card is dragged across a different column.
  const visibleCache = useRef(new Map<string, Card[]>());
  const visible = useMemo(() => {
    const next = new Map<string, Card[]>();
    const lists = columns.map((col) => {
      const list = col.cardIds
        .map((id) => board.cards[id])
        .filter((c): c is Card => !!c && (c.id === activeId || isVisible(c, col)));
      const prev = visibleCache.current.get(col.id);
      const stable = prev && prev.length === list.length && prev.every((c, i) => c === list[i]) ? prev : list;
      next.set(col.id, stable);
      return stable;
    });
    visibleCache.current = next;
    return lists;
  }, [columns, board.cards, isVisible, activeId]);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
    }),
  );

  /** Prefer the card under the pointer; fall back to the column, then to the nearest thing. */
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerHits = pointerWithin(args);
    const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args);
    const overId = getFirstCollision(hits, "id");
    if (overId == null) return closestCorners(args);
    const cols = columnsRef.current;
    const colIndex = cols.findIndex((c) => c.id === overId);
    if (colIndex >= 0) {
      // Includes the dragged card itself, so hovering below the last card keeps it there.
      const ids = new Set(visibleRef.current[colIndex].map((c) => c.id));
      if (ids.size > 0) {
        const nearest = closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((d) => ids.has(String(d.id))),
        });
        if (nearest.length > 0) return nearest;
      }
    }
    return [{ id: overId }];
  }, []);

  // Ref mirror of dragCols: drag events can fire faster than React re-renders.
  const dragColsRef = useRef<Column[] | null>(null);
  const setCols = (cols: Column[] | null) => {
    dragColsRef.current = cols;
    setDragCols(cols);
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
    fromColumnRef.current = findColumn(board.columns, active.id)?.id ?? "";
    setCols(board.columns);
  };

  /** Moves the card into another column, above or below the hovered card. */
  const placeAcross = (cols: Column[], { active, over }: DragOverEvent): Column[] => {
    if (!over) return cols;
    const from = findColumn(cols, active.id);
    const to = findColumn(cols, over.id);
    if (!from || !to || from.id === to.id) return cols;
    const activeKey = String(active.id);
    const overIsColumn = to.id === over.id;
    let index = overIsColumn ? to.cardIds.length : to.cardIds.indexOf(String(over.id));
    if (!overIsColumn && active.rect.current.translated && over.rect) {
      const activeMid = active.rect.current.translated.top + active.rect.current.translated.height / 2;
      if (activeMid > over.rect.top + over.rect.height / 2) index += 1;
    }
    return cols.map((c) => {
      if (c.id === from.id) return { ...c, cardIds: c.cardIds.filter((x) => x !== activeKey) };
      if (c.id === to.id) {
        const ids = [...c.cardIds];
        ids.splice(index < 0 ? ids.length : index, 0, activeKey);
        return { ...c, cardIds: ids };
      }
      return c;
    });
  };

  const onDragOver = (e: DragOverEvent) => {
    const cols = dragColsRef.current;
    if (!cols) return;
    const next = placeAcross(cols, e);
    if (next !== cols) setCols(next);
  };

  const reset = () => {
    setActiveId(null);
    setCols(null);
    markDragEnd();
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    const cardId = String(active.id);
    if (!dragColsRef.current) return reset();
    const cols = placeAcross(dragColsRef.current, e);
    let finalCols = cols;
    if (over && cols === dragColsRef.current) {
      const col = findColumn(cols, active.id);
      if (col && col.cardIds.includes(String(over.id))) {
        const oldIndex = col.cardIds.indexOf(cardId);
        const newIndex = col.cardIds.indexOf(String(over.id));
        if (oldIndex !== newIndex) {
          finalCols = cols.map((c) => (c.id === col.id ? { ...c, cardIds: arrayMove(c.cardIds, oldIndex, newIndex) } : c));
        }
      }
    }
    const result = commitDrag(finalCols, cardId, fromColumnRef.current);
    announceMove(cardId, result);
    reset();
  };

  const announcements: Announcements = useMemo(() => {
    const title = (id: UniqueIdentifier) => useBoard.getState().board.cards[String(id)]?.title ?? "card";
    const where = (id: UniqueIdentifier | undefined) => {
      if (id == null) return "";
      const cols = columnsRef.current;
      const col = findColumn(cols, id);
      if (!col) return "";
      const card = String(id);
      const pos = col.cardIds.indexOf(card);
      return pos >= 0 ? `${col.name}, position ${pos + 1} of ${col.cardIds.length}` : col.name;
    };
    return {
      onDragStart: ({ active }) => `Picked up ${title(active.id)}. Use arrow keys to move, Space to drop, Escape to cancel.`,
      onDragOver: ({ active }) => `${title(active.id)} is over ${where(active.id)}.`,
      onDragEnd: ({ active }) => `Dropped ${title(active.id)} in ${where(active.id)}.`,
      onDragCancel: ({ active }) => `Cancelled. ${title(active.id)} went back where it was.`,
    };
  }, []);

  /* ---------------- mobile column chips ---------------- */
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const first = el.querySelector<HTMLElement>(".column");
      if (!first) return;
      const step = first.offsetWidth + 12;
      setCurrent(Math.min(columns.length - 1, Math.round(el.scrollLeft / step)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [columns.length]);

  const jumpTo = (i: number) => {
    const el = scrollerRef.current?.querySelectorAll<HTMLElement>(".column")[i];
    el?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", inline: "start", block: "nearest" });
  };

  const handleAddColumn = () => {
    const id = addColumn();
    if (id) {
      openColumnSettings(id);
      requestAnimationFrame(() => jumpTo(columns.length));
    }
  };

  const activeCard = activeId ? board.cards[activeId] : null;
  const activeCol = activeId ? findColumn(columns, activeId) : undefined;

  return (
    <>
      <nav className="chips" aria-label="Jump to column">
        {columns.map((c, i) => (
          <SketchButton
            key={c.id}
            variant="chip"
            size="sm"
            seedKey={`chip-${c.id}`}
            pressed={i === current}
            onClick={() => jumpTo(i)}
          >
            {c.name} <span className="chip__count">{c.cardIds.length}</span>
          </SketchButton>
        ))}
      </nav>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={reset}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              "Press Enter to open this video. To move it, press Space to pick it up, use the arrow keys to move between positions and columns, Space to drop, or Escape to cancel.",
          },
        }}
      >
        <div className="board" ref={scrollerRef}>
          {columns.map((col, i) => (
            <ColumnView
              key={col.id}
              column={col}
              cards={visible[i]}
              filtered={filtered}
              isDropTarget={!!activeId && col.id === activeCol?.id}
            />
          ))}
          {columns.length < LIMITS.maxColumns && (
            <div className="add-column">
              <SketchButton seedKey="add-column" onClick={handleAddColumn}>
                <PlusIcon size={18} /> Add column
              </SketchButton>
            </div>
          )}
        </div>
        <DragOverlay dropAnimation={reducedMotion() ? null : { duration: 180, easing: "cubic-bezier(.2,.9,.3,1.2)" }}>
          {activeCard ? (
            <div className="overlay-card">
              <CardFace card={activeCard} isDone={!!activeCol?.isDoneColumn} lifted />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
