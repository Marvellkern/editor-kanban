import { useId } from "react";
import { SketchBox, hashSeed } from "../sketch/SketchBox";
import { CheckIcon } from "../sketch/icons";

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}

export function Checkbox({ checked, onChange, label, hint }: Props) {
  const id = useId();
  return (
    <label className="sk-check" htmlFor={id}>
      <input id={id} type="checkbox" className="visually-hidden" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="sk-check__box" aria-hidden="true">
        <SketchBox seed={hashSeed(label)} fill={checked ? "var(--hl-green)" : "var(--card)"} roughness={1.3} />
        {checked && <CheckIcon animate size={22} className="sk-check__mark" />}
      </span>
      <span className="sk-check__text">
        {label}
        {hint && <small className="sk-check__hint">{hint}</small>}
      </span>
    </label>
  );
}
