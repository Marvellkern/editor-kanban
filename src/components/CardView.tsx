import { memo, type CSSProperties, type KeyboardEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "../types";
import { seeded } from "../lib/ids";
import { SketchBox } from "../sketch/SketchBox";
import { NotesIcon } from "../sketch/icons";
import { DeadlineBadge, RevisionBadge, TypeTag } from "./Badges";
import { useBoard, useUI } from "../store";
import { CLIENT_COLORS, resolveClientColor } from "../lib/clientColors";
import { recentlyDragged } from "./dragGuard";

interface FaceProps {
  card: Card;
  isDone: boolean;
  lifted?: boolean;
}

/** The visible index card. Pure presentation, also used by the drag overlay. */
export const CardFace = memo(function CardFace({ card, isDone, lifted }: FaceProps) {
  const tilt = (seeded(card.seed) * 2 - 1).toFixed(2); // -1..+1 degree, stable per card
  const isNew = Date.now() - Date.parse(card.createdAt) < 1500;
  // Selecting a string keeps re-renders limited to cards whose client color actually changed.
  const color = useBoard((s) => resolveClientColor(card.client, s.board.clientColors));
  return (
    <article
      className={`card ${color ? "card--taped" : ""} ${lifted ? "card--lifted" : ""} ${isNew ? "card--new" : ""}`}
      style={{ "--tilt": `${tilt}deg` } as CSSProperties}
    >
      <SketchBox seed={card.seed} fill="var(--card)" shadow={lifted ? 7 : 3} strokeWidth={1.7} roughness={1.3} />
      {color && (
        <span
          className="tape"
          aria-hidden="true"
          style={{ "--tape": CLIENT_COLORS[color].css, "--tape-tilt": `${(seeded(card.seed, 2) * 6 - 3).toFixed(1)}deg` } as CSSProperties}
        />
      )}
      <h3 className="card__title">{card.title}</h3>
      {card.client && <p className="card__client"><span className="visually-hidden">Client: </span>{card.client}</p>}
      <div className="card__meta">
        <TypeTag type={card.videoType} />
        {card.targetLength && (
          <span className="badge badge--len"><span className="visually-hidden">Length </span>{card.targetLength}</span>
        )}
        <DeadlineBadge deadline={card.deadline} isDone={isDone} seed={card.seed} />
        <RevisionBadge card={card} />
        {card.notes && (
          <span className="badge badge--notes" title="Has notes">
            <NotesIcon size={18} />
            <span className="visually-hidden">Has notes</span>
          </span>
        )}
      </div>
    </article>
  );
});

interface Props {
  card: Card;
  isDone: boolean;
  columnId: string;
}

export const CardView = memo(function CardView({ card, isDone, columnId }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", columnId },
  });
  const openCard = useUI((s) => s.openCard);

  const style: CSSProperties = { transform: CSS.Translate.toString(transform), transition };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Enter opens the card; Space is reserved for picking it up.
    if (e.key === "Enter" && !isDragging && e.target === e.currentTarget) {
      e.preventDefault();
      openCard(card.id);
      return;
    }
    listeners?.onKeyDown?.(e);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card-slot ${isDragging ? "is-placeholder" : ""}`}
      {...attributes}
      {...listeners}
      onKeyDown={onKeyDown}
      onClick={() => !recentlyDragged() && openCard(card.id)}
      aria-roledescription="video card"
    >
      {isDragging && <SketchBox seed={card.seed + 11} dashed stroke="var(--ink-soft)" strokeWidth={1.8} className="placeholder-outline" />}
      <CardFace card={card} isDone={isDone} />
    </div>
  );
});
