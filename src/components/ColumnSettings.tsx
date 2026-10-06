import { useRef, useState } from "react";
import { LIMITS } from "../types";
import { useBoard, useUI } from "../store";
import { Modal } from "./Modal";
import { Checkbox } from "./Checkbox";
import { SketchButton, SketchInput } from "../sketch/primitives";
import { ArrowLeftIcon, ArrowRightIcon, TrashIcon } from "../sketch/icons";

export function ColumnSettings() {
  const id = useUI((s) => s.settingsColumnId);
  return id ? <Inner key={id} id={id} /> : null;
}

function Inner({ id }: { id: string }) {
  const columns = useBoard((s) => s.board.columns);
  const { updateColumn, moveColumn, deleteColumn } = useBoard.getState();
  const close = () => useUI.getState().openColumnSettings(null);
  const askConfirm = useUI((s) => s.askConfirm);
  const index = columns.findIndex((c) => c.id === id);
  const col = columns[index];
  const [name, setName] = useState(col?.name ?? "");
  const nameRef = useRef<HTMLInputElement>(null);
  if (!col) return null;

  const invalid = name.trim() === "";
  const canDelete = columns.length > LIMITS.minColumns;

  const onDelete = () => {
    if (col.cardIds.length === 0) {
      deleteColumn(id);
      close();
      return;
    }
    close(); // one dialog at a time
    const n = col.cardIds.length;
    askConfirm({
      title: "Delete this column?",
      body: `“${col.name}” has ${n} ${n === 1 ? "video" : "videos"} in it. Deleting the column deletes ${n === 1 ? "it" : "them"} too, and this can't be undone.`,
      confirmLabel: `Delete column and ${n === 1 ? "video" : `${n} videos`}`,
      danger: true,
      onConfirm: () => deleteColumn(id),
    });
  };

  return (
    <Modal
      title="Column settings"
      onClose={close}
      sheet
      initialFocus={nameRef}
      footer={
        <>
          <SketchButton
            variant="danger"
            onClick={onDelete}
            disabled={!canDelete}
            seedKey="delete-col"
            title={canDelete ? undefined : "A board needs at least one column"}
          >
            <TrashIcon size={18} /> Delete column
          </SketchButton>
          <SketchButton variant="primary" onClick={close} seedKey="done-col">Done</SketchButton>
        </>
      }
    >
      <div className="form">
        <div className="form__row">
          <label className="form__label" htmlFor={`col-name-${id}`}>Column name</label>
          <SketchInput
            id={`col-name-${id}`}
            ref={nameRef}
            value={name}
            maxLength={LIMITS.columnName}
            invalid={invalid}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value.trim()) updateColumn(id, { name: e.target.value.trim() });
            }}
          />
          {invalid && <p className="form__error">A column needs a name. The old one is kept until you type a new one.</p>}
        </div>

        <Checkbox
          label="Count a revision when a video lands here"
          hint="Dragging a video in adds 1 to its revision round."
          checked={col.isRevisionColumn}
          onChange={(v) => updateColumn(id, { isRevisionColumn: v })}
        />
        <Checkbox
          label="Videos here are finished"
          hint="Hides due-soon and overdue warnings for videos in this column."
          checked={col.isDoneColumn}
          onChange={(v) => updateColumn(id, { isDoneColumn: v })}
        />

        <div className="form__row">
          <span className="form__label">Position ({index + 1} of {columns.length})</span>
          <div className="inline">
            <SketchButton size="sm" seedKey="col-left" disabled={index === 0} onClick={() => moveColumn(id, -1)}>
              <ArrowLeftIcon size={18} /> Move left
            </SketchButton>
            <SketchButton size="sm" seedKey="col-right" disabled={index === columns.length - 1} onClick={() => moveColumn(id, 1)}>
              Move right <ArrowRightIcon size={18} />
            </SketchButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}
