import { useEffect, useRef, useState } from "react";
import { LIMITS, VIDEO_TYPE_LABEL, type VideoType } from "../types";
import { announceMove, columnOf, useBoard, useUI } from "../store";
import { Modal } from "./Modal";
import { RevisionBadge } from "./Badges";
import { ClientColorPicker } from "./ClientColorPicker";
import { ClientField } from "./ClientField";
import { HighlightTag, SketchButton, SketchInput, SketchSelect, SketchTextarea } from "../sketch/primitives";
import { MinusIcon, PlusIcon, TrashIcon } from "../sketch/icons";
import { deadlineInfo } from "../lib/dates";

const TYPES: VideoType[] = ["short", "longform", "other"];
const TYPE_COLOR = { short: "yellow", longform: "blue", other: "pink" } as const;

export function EditPanel() {
  const id = useUI((s) => s.editingCardId);
  return id ? <EditPanelInner key={id} id={id} /> : null;
}

function EditPanelInner({ id }: { id: string }) {
  const card = useBoard((s) => s.board.cards[id]);
  const columns = useBoard((s) => s.board.columns);
  const { updateCard, deleteCard, restoreCard, changeRevision, moveCard } = useBoard.getState();
  const openCard = useUI((s) => s.openCard);
  const showToast = useUI((s) => s.showToast);
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(card?.title ?? "");

  useEffect(() => {
    if (!card) openCard(null); // card vanished (e.g. undo / import)
  }, [card, openCard]);
  if (!card) return null;

  const col = columnOf(useBoard.getState().board, id);
  const titleInvalid = title.trim() === "";
  const f = (name: string) => `card-${id}-${name}`;

  const close = () => {
    // The field may still have focus (Escape / Done), so save a newly typed client here too.
    if (card.client?.trim()) useBoard.getState().saveClient(card.client);
    openCard(null);
  };

  const onDelete = () => {
    const removed = deleteCard(id);
    close();
    if (removed) {
      showToast({
        message: "Deleted",
        detail: removed.card.title,
        actionLabel: "Undo",
        onAction: () => restoreCard(removed),
      });
    }
  };

  const onMove = (toId: string) => {
    if (!col || toId === col.id) return;
    const result = moveCard(id, toId);
    const name = columns.find((c) => c.id === toId)?.name ?? "";
    if (result.bumped) announceMove(id, result);
    else showToast({ message: `Moved to ${name}` });
  };

  const dl = deadlineInfo(card.deadline, !!col?.isDoneColumn);

  return (
    <Modal
      title="Edit video"
      onClose={close}
      sheet
      initialFocus={titleRef}
      footer={
        <>
          <SketchButton variant="danger" onClick={onDelete} seedKey="delete-card">
            <TrashIcon size={18} /> Delete
          </SketchButton>
          <SketchButton variant="primary" onClick={close} seedKey="done-card">
            Done
          </SketchButton>
        </>
      }
    >
      <div className="form">
        <div className="form__row">
          <label htmlFor={f("title")} className="form__label">Title <span className="req">(required)</span></label>
          <SketchInput
            id={f("title")}
            className="private-input"
            ref={titleRef}
            value={title}
            maxLength={LIMITS.title}
            invalid={titleInvalid}
            aria-describedby={titleInvalid ? f("title-err") : undefined}
            onChange={(e) => {
              setTitle(e.target.value);
              if (e.target.value.trim()) updateCard(id, { title: e.target.value.trim() });
            }}
          />
          {titleInvalid && (
            <p id={f("title-err")} className="form__error">A video needs a title. The old one is kept until you type a new one.</p>
          )}
        </div>

        <ClientField
          id={f("client")}
          value={card.client ?? ""}
          onChange={(v) => updateCard(id, { client: v || undefined })}
        />

        {card.client?.trim() && <ClientColorPicker client={card.client} />}

        <div className="form__grid">
          <div className="form__row">
            <label htmlFor={f("length")} className="form__label">Target length</label>
            <SketchInput
              id={f("length")}
              value={card.targetLength ?? ""}
              maxLength={LIMITS.targetLength}
              placeholder="0:45, 12 min…"
              onChange={(e) => updateCard(id, { targetLength: e.target.value || undefined })}
            />
          </div>

        <fieldset className="form__row form__fieldset">
          <legend className="form__label">Video type</legend>
          <div className="type-picker">
            {TYPES.map((t) => (
              <label key={t} className={`type-option ${card.videoType === t ? "is-on" : ""}`}>
                <input
                  type="radio"
                  className="visually-hidden"
                  name={f("type")}
                  value={t}
                  checked={card.videoType === t}
                  onChange={() => updateCard(id, { videoType: t })}
                />
                {card.videoType === t ? <HighlightTag color={TYPE_COLOR[t]}>{VIDEO_TYPE_LABEL[t]}</HighlightTag> : VIDEO_TYPE_LABEL[t]}
              </label>
            ))}
          </div>
        </fieldset>
        </div>

        <div className="form__grid">
          <div className="form__row">
            <label htmlFor={f("deadline")} className="form__label">Deadline</label>
            <div className="inline">
              <SketchInput
                id={f("deadline")}
                type="date"
                shellClass="grow"
                value={card.deadline ?? ""}
                aria-describedby={f("deadline-state")}
                onChange={(e) => updateCard(id, { deadline: e.target.value || undefined })}
              />
              {card.deadline && (
                <SketchButton size="sm" onClick={() => updateCard(id, { deadline: undefined })} seedKey="clear-deadline" aria-label="Clear deadline">
                  Clear
                </SketchButton>
              )}
            </div>
            <p id={f("deadline-state")} className="form__hint">{dl.long || "No deadline set"}</p>
          </div>

          <div className="form__row">
            <label htmlFor={f("move")} className="form__label">Move to…</label>
            <SketchSelect id={f("move")} value={col?.id ?? ""} onChange={(e) => onMove(e.target.value)}>
              {columns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </SketchSelect>
          </div>
        </div>

        <div className="form__grid">
          <div className="form__row">
            <span className="form__label" id={f("rev-label")}>Revision round</span>
            <div className="stepper" role="group" aria-labelledby={f("rev-label")}>
              <SketchButton
                size="sm"
                seedKey="rev-minus"
                aria-label="One fewer revision round"
                disabled={card.revisionRound <= 0}
                onClick={() => changeRevision(id, -1)}
              >
                <MinusIcon size={18} />
              </SketchButton>
              <output className="stepper__value" aria-live="polite">
                {card.revisionRound === 0 ? "None yet" : <RevisionBadge card={card} />}
              </output>
              <SketchButton size="sm" seedKey="rev-plus" aria-label="One more revision round" onClick={() => changeRevision(id, 1)}>
                <PlusIcon size={18} />
              </SketchButton>
            </div>
          </div>

          <div className="form__row">
            <label htmlFor={f("limit")} className="form__label">Rounds included in the deal</label>
            <SketchSelect
              id={f("limit")}
              value={card.revisionLimit ?? ""}
              onChange={(e) => updateCard(id, { revisionLimit: e.target.value ? Number(e.target.value) : undefined })}
            >
              <option value="">No limit set</option>
              {Array.from({ length: LIMITS.maxRevisionLimit }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? "round" : "rounds"}</option>
              ))}
            </SketchSelect>
          </div>
        </div>

        <div className="form__row">
          <label htmlFor={f("notes")} className="form__label">Notes</label>
          <SketchTextarea
            id={f("notes")}
            rows={4}
            maxLength={LIMITS.notes}
            value={card.notes ?? ""}
            placeholder="Client feedback, music choice, export settings…"
            aria-describedby={f("notes-count")}
            onChange={(e) => updateCard(id, { notes: e.target.value || undefined })}
          />
          <p id={f("notes-count")} className="form__hint form__hint--right">
            {(card.notes ?? "").length} / {LIMITS.notes}
          </p>
        </div>
      </div>
    </Modal>
  );
}
