import { useId } from "react";
import { useBoard } from "../store";
import { CLIENT_COLORS, CLIENT_COLOR_KEYS, autoClientColor, clientKey, type ClientColor } from "../lib/clientColors";
import { SketchBox, hashSeed } from "../sketch/SketchBox";
import { CheckIcon } from "../sketch/icons";
import { Private } from "./Private";

/** Swatches for the client's tape color. The choice is shared by every video for that client. */
export function ClientColorPicker({ client }: { client: string }) {
  const key = clientKey(client);
  const picked = useBoard((s) => s.board.clientColors?.[key]);
  const setClientColor = useBoard((s) => s.setClientColor);
  const name = useId();
  const auto = autoClientColor(client);
  const current: ClientColor = picked ?? auto;

  return (
    <fieldset className="form__row form__fieldset">
      <legend className="form__label">Client color</legend>
      <div className="swatches">
        {CLIENT_COLOR_KEYS.map((c) => (
          <label key={c} className="swatch" title={CLIENT_COLORS[c].label}>
            <input
              type="radio"
              className="visually-hidden"
              name={name}
              checked={current === c}
              onChange={() => setClientColor(client, c)}
              aria-label={`${CLIENT_COLORS[c].label}${!picked && c === auto ? " (automatic)" : ""}`}
            />
            <span className="swatch__dot" aria-hidden="true">
              <SketchBox seed={hashSeed(c)} shape="ellipse" fill={CLIENT_COLORS[c].css} roughness={1.2} />
              {current === c && <CheckIcon size={18} className="swatch__check" />}
            </span>
          </label>
        ))}
      </div>
      <p className="form__hint">
        Used on every video for “<Private text={client.trim()} />”.{" "}
        {picked ? (
          <button type="button" className="link-btn" onClick={() => setClientColor(client, null)}>
            Back to automatic
          </button>
        ) : (
          "Picked automatically. Tap a color to change it."
        )}
      </p>
    </fieldset>
  );
}
