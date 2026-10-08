import { useRef } from "react";
import { useUI } from "../store";
import { Modal } from "./Modal";
import { SketchBox, hashSeed } from "../sketch/SketchBox";
import { SketchButton } from "../sketch/primitives";
import { CloseIcon } from "../sketch/icons";
import { Private } from "./Private";

export function ConfirmDialog() {
  const req = useUI((s) => s.confirm);
  const askConfirm = useUI((s) => s.askConfirm);
  const cancelRef = useRef<HTMLButtonElement>(null);
  if (!req) return null;
  const close = () => askConfirm(null);
  return (
    <Modal
      title={req.title}
      onClose={close}
      size="sm"
      role="alertdialog"
      initialFocus={cancelRef}
      footer={
        req.alertOnly ? (
          <SketchButton ref={cancelRef} variant="primary" onClick={close} seedKey="alert-ok">OK</SketchButton>
        ) : (
          <>
            <SketchButton ref={cancelRef} onClick={close} seedKey="confirm-cancel">Cancel</SketchButton>
            <SketchButton
              variant={req.danger ? "danger" : "primary"}
              seedKey="confirm-ok"
              onClick={() => {
                close();
                req.onConfirm?.();
              }}
            >
              {req.confirmLabel}
            </SketchButton>
          </>
        )
      }
    >
      <p className="dialog__body">{req.body}</p>
    </Modal>
  );
}

export function Toasts() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismissToast);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <SketchBox seed={hashSeed(t.message) + t.id} fill="var(--ink)" stroke="var(--ink)" shadow={3} shadowColor="var(--hl-yellow)" />
          <span className="toast__msg">
            {t.message}
            {t.detail && <> “<Private text={t.detail} />”</>}
          </span>
          {t.onAction && (
            <button
              type="button"
              className="toast__action"
              onClick={() => {
                t.onAction?.();
                dismiss(t.id);
              }}
            >
              {t.actionLabel ?? "Undo"}
            </button>
          )}
          <button type="button" className="toast__close" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
            <CloseIcon size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
