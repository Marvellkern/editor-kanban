import { memo } from "react";
import { VIDEO_TYPE_LABEL, type Card, type VideoType } from "../types";
import { deadlineInfo } from "../lib/dates";
import { HighlightTag, type Highlight } from "../sketch/primitives";
import { SketchBox } from "../sketch/SketchBox";
import { CheckIcon, ClockIcon } from "../sketch/icons";

const TYPE_COLOR: Record<VideoType, Highlight> = { short: "yellow", longform: "blue", other: "pink" };

export function TypeTag({ type }: { type: VideoType }) {
  return <HighlightTag color={TYPE_COLOR[type]}>{VIDEO_TYPE_LABEL[type]}</HighlightTag>;
}

export const DeadlineBadge = memo(function DeadlineBadge({ deadline, isDone, seed }: { deadline?: string; isDone: boolean; seed: number }) {
  const info = deadlineInfo(deadline, isDone);
  switch (info.state) {
    case "none":
      return null;
    case "normal":
      return (
        <span className="badge badge--date" title={info.long}>
          <ClockIcon size={16} /> <span className="visually-hidden">Due </span>{info.label}
        </span>
      );
    case "soon":
      return <HighlightTag color="yellow" title={info.long}><span className="visually-hidden">Due </span>{info.label}</HighlightTag>;
    case "today":
      return <HighlightTag color="orange" title={info.long}><span className="visually-hidden">Due </span>{info.label}</HighlightTag>;
    case "overdue":
      return (
        <span className="badge badge--overdue" title={info.long}>
          <SketchBox seed={seed + 3} shape="ellipse" stroke="var(--red-pen)" strokeWidth={1.8} roughness={1.8} />
          <span className="badge__text">{info.label}</span>
        </span>
      );
    case "done":
      return (
        <span className="badge badge--done" title={info.long}>
          <CheckIcon size={18} animate className="badge__check" />
          <span className="visually-hidden">Delivered, was due </span>{info.label}
        </span>
      );
  }
});

/** "R2" or "R2 / 3"; red with a scribble underline when over the agreed limit. */
export function RevisionBadge({ card }: { card: Pick<Card, "revisionRound" | "revisionLimit"> }) {
  const { revisionRound: r, revisionLimit: limit } = card;
  if (r <= 0) return null;
  const over = limit !== undefined && r > limit;
  const text = limit !== undefined ? `R${r} / ${limit}` : `R${r}`;
  const long = limit !== undefined
    ? `Revision round ${r} of ${limit}${over ? ", over the agreed limit" : ""}`
    : `Revision round ${r}`;
  return (
    <span className={`badge badge--rev ${over ? "is-over" : ""}`} title={long} aria-label={long}>
      <span aria-hidden="true">{text}</span>
      {over && (
        <svg className="scribble" viewBox="0 0 60 8" preserveAspectRatio="none" aria-hidden="true">
          <path d="M1 4.2c4-2.6 7.6 2.4 11.4-.2s7.2 2.6 11-.1 7.4 2.5 11.1-.1 7.4 2.6 11.2 0 7.3 2.4 12.3-.6" />
        </svg>
      )}
    </span>
  );
}
