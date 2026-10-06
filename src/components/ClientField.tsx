import { useState, type CSSProperties } from "react";
import { LIMITS } from "../types";
import { useBoard } from "../store";
import { CLIENT_COLORS, clientKey, resolveClientColor } from "../lib/clientColors";
import { SketchInput } from "../sketch/primitives";
import { CloseIcon } from "../sketch/icons";

const MAX_CHIPS = 12;

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Client input with the saved client list underneath as one-tap chips.
 * A new name is saved to the list when the field loses focus.
 */
export function ClientField({ id, value, onChange }: Props) {
  const clients = useBoard((s) => s.board.clients);
  const colors = useBoard((s) => s.board.clientColors);
  const { saveClient, removeClient } = useBoard.getState();
  const [editing, setEditing] = useState(false);

  const typed = clientKey(value);
  const sorted = [...(clients ?? [])].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  const matches = editing
    ? sorted
    : sorted.filter((c) => clientKey(c) !== typed && clientKey(c).includes(typed)).slice(0, MAX_CHIPS);
  const hasSaved = sorted.length > 0;

  return (
    <div className="form__row">
      <label htmlFor={id} className="form__label">Client</label>
      <SketchInput
        id={id}
        value={value}
        maxLength={LIMITS.client}
        placeholder={hasSaved ? "Type or pick below" : "Who's it for?"}
        autoComplete="off"
        aria-describedby={hasSaved ? `${id}-saved` : undefined}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => value.trim() && saveClient(value)}
      />

      {hasSaved && (
        <div className="saved-clients" id={`${id}-saved`}>
          <div className="saved-clients__head">
            <span className="form__hint">{editing ? "Remove clients you no longer need:" : "Saved clients:"}</span>
            <button type="button" className="link-btn" onClick={() => setEditing(!editing)} aria-pressed={editing}>
              {editing ? "Done" : "Edit list"}
            </button>
          </div>
          {matches.length > 0 ? (
            <ul className="client-chips" aria-label={editing ? "Saved clients, remove" : "Saved clients, pick one"}>
              {matches.map((name) => {
                const color = resolveClientColor(name, colors);
                const dot = { "--dot": color ? CLIENT_COLORS[color].css : "transparent" } as CSSProperties;
                return (
                  <li key={name}>
                    {editing ? (
                      <button
                        type="button"
                        className="client-chip client-chip--remove"
                        style={dot}
                        onClick={() => removeClient(name)}
                        aria-label={`Remove ${name} from saved clients`}
                      >
                        <span className="client-chip__dot" aria-hidden="true" />
                        {name}
                        <CloseIcon size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="client-chip"
                        style={dot}
                        onClick={() => onChange(name)}
                        aria-label={`Set client to ${name}`}
                      >
                        <span className="client-chip__dot" aria-hidden="true" />
                        {name}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="form__hint">
              {value.trim() ? "No other saved clients match. This one is saved when you leave the field." : "No saved clients yet."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
