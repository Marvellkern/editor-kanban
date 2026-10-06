import { memo, useRef, useState, type FormEvent } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { LIMITS, type Card, type Column } from "../types";
import { SketchBox, hashSeed } from "../sketch/SketchBox";
import { SketchButton, SketchInput } from "../sketch/primitives";
import { DotsIcon, PlusIcon } from "../sketch/icons";
import { useBoard, useUI } from "../store";
import { CardView } from "./CardView";

interface Props {
  column: Column;
  cards: Card[]; // visible (filtered) cards, in order
  isDropTarget: boolean;
  filtered: boolean;
}

export const ColumnView = memo(function ColumnView({ column, cards, isDropTarget, filtered }: Props) {
  const { setNodeRef } = useDroppable({ id: column.id, data: { type: "column" } });
  const openSettings = useUI((s) => s.openColumnSettings);
  const total = column.cardIds.length;
  const countLabel = filtered ? `${cards.length} of ${total}` : String(total);
  const headingId = `col-h-${column.id}`;

  return (
    <section className={`column ${isDropTarget ? "is-drop-target" : ""}`} aria-labelledby={headingId} data-column-id={column.id}>
      <SketchBox seed={hashSeed(column.id)} roughness={1.1} strokeWidth={1.5} stroke="var(--ink-soft)" />
      {isDropTarget && (
        <SketchBox seed={hashSeed(column.id) + 5} dashed stroke="var(--ink)" strokeWidth={2} className="drop-outline" />
      )}
      <header className="column__head">
        <h2 id={headingId} className="column__title">
          {column.name}
          <span className="column__count" aria-label={`${countLabel} ${total === 1 ? "video" : "videos"}`}>
            {countLabel}
          </span>
        </h2>
        <button
          type="button"
          className="icon-btn"
          onClick={() => openSettings(column.id)}
          aria-label={`Settings for column ${column.name}`}
        >
          <DotsIcon />
        </button>
      </header>
      {(column.isRevisionColumn || column.isDoneColumn) && (
        <p className="column__flags">
          {column.isRevisionColumn && <span>counts a revision</span>}
          {column.isDoneColumn && <span>finished videos</span>}
        </p>
      )}

      <div ref={setNodeRef} className="column__list">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <CardView key={card.id} card={card} isDone={column.isDoneColumn} columnId={column.id} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <p className="column__empty">{filtered && total > 0 ? "No matches here" : "Nothing here yet"}</p>
        )}
      </div>

      <AddCard columnId={column.id} columnName={column.name} />
    </section>
  );
});

function AddCard({ columnId, columnName }: { columnId: string; columnName: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const addCard = useBoard((s) => s.addCard);
  const inputRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    setTitle("");
    requestAnimationFrame(() => openerRef.current?.focus());
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    addCard(columnId, t);
    setTitle(""); // stay open for quick entry of the next video
    inputRef.current?.focus();
  };

  if (!open) {
    return (
      <SketchButton
        ref={openerRef}
        variant="ghost"
        className="add-card-btn"
        seedKey={`add-${columnId}`}
        onClick={() => setOpen(true)}
        aria-label={`Add video to ${columnName}`}
      >
        <PlusIcon size={18} /> Add video
      </SketchButton>
    );
  }

  return (
    <form className="add-card" onSubmit={submit}>
      <label className="visually-hidden" htmlFor={`add-${columnId}`}>New video title in {columnName}</label>
      <SketchInput
        id={`add-${columnId}`}
        ref={inputRef}
        autoFocus
        value={title}
        maxLength={LIMITS.title}
        placeholder="Video title…"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && (e.stopPropagation(), close())}
      />
      <div className="add-card__actions">
        <SketchButton type="submit" variant="primary" size="sm" disabled={!title.trim()} seedKey={`addgo-${columnId}`}>
          Add
        </SketchButton>
        <SketchButton size="sm" onClick={close} seedKey={`addx-${columnId}`}>
          Done
        </SketchButton>
      </div>
    </form>
  );
}
