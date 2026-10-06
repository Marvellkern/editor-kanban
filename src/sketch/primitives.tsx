import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { SketchBox, hashSeed } from "./SketchBox";

type Variant = "default" | "primary" | "danger" | "ghost" | "chip";

interface SketchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  seedKey?: string;
  size?: "md" | "sm";
  pressed?: boolean;
}

const BUTTON_FILL: Record<Variant, string | undefined> = {
  default: "var(--card)",
  primary: "var(--hl-yellow)",
  danger: "var(--card)",
  ghost: undefined,
  chip: "var(--card)",
};

export const SketchButton = forwardRef<HTMLButtonElement, SketchButtonProps>(function SketchButton(
  { variant = "default", seedKey, size = "md", pressed, className, children, ...rest },
  ref,
) {
  const seed = hashSeed(seedKey ?? (typeof children === "string" ? children : rest["aria-label"] ?? "btn"));
  const fill = pressed ? "var(--hl-yellow)" : BUTTON_FILL[variant];
  return (
    <button
      ref={ref}
      type="button"
      className={`sk-btn sk-btn--${variant} sk-btn--${size} ${pressed ? "is-pressed" : ""} ${className ?? ""}`}
      aria-pressed={pressed}
      {...rest}
    >
      {variant !== "ghost" && (
        <SketchBox
          seed={seed}
          fill={fill}
          shadow={variant === "chip" ? 2 : 3}
          stroke={variant === "danger" ? "var(--red-pen)" : undefined}
          roughness={1.3}
        />
      )}
      <span className="sk-btn__label">{children}</span>
    </button>
  );
});

interface FieldShellProps {
  seedKey: string;
  children: ReactNode;
  className?: string;
  invalid?: boolean;
}

/** Wraps any native control in a hand-drawn box. */
export function FieldShell({ seedKey, children, className, invalid }: FieldShellProps) {
  return (
    <div className={`sk-field ${className ?? ""}`}>
      <SketchBox seed={hashSeed(seedKey)} fill="var(--card)" stroke={invalid ? "var(--red-pen)" : undefined} roughness={1.2} />
      {children}
    </div>
  );
}

export const SketchInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { seedKey?: string; invalid?: boolean; shellClass?: string }>(
  function SketchInput({ seedKey, invalid, shellClass, className, ...rest }, ref) {
    return (
      <FieldShell seedKey={seedKey ?? rest.id ?? rest.name ?? "input"} invalid={invalid} className={shellClass}>
        <input ref={ref} className={`sk-input ${className ?? ""}`} aria-invalid={invalid || undefined} {...rest} />
      </FieldShell>
    );
  },
);

export const SketchTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { seedKey?: string }>(
  function SketchTextarea({ seedKey, className, ...rest }, ref) {
    return (
      <FieldShell seedKey={seedKey ?? rest.id ?? "textarea"}>
        <textarea ref={ref} className={`sk-input sk-textarea ${className ?? ""}`} {...rest} />
      </FieldShell>
    );
  },
);

export function SketchSelect({ seedKey, className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { seedKey?: string }) {
  return (
    <FieldShell seedKey={seedKey ?? rest.id ?? "select"} className="sk-field--select">
      <select className={`sk-input sk-select ${className ?? ""}`} {...rest}>
        {children}
      </select>
      <svg className="sk-select__caret" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3.5 6.2c1.6 1.3 3 2.8 4.6 4.1 1.4-1.5 2.9-2.9 4.4-4.4" />
      </svg>
    </FieldShell>
  );
}

export type Highlight = "yellow" | "orange" | "blue" | "green" | "pink";

/** Text with a highlighter swipe behind it. */
export function HighlightTag({ color, children, className, title }: { color: Highlight; children: ReactNode; className?: string; title?: string }) {
  return (
    <span className={`hl hl--${color} ${className ?? ""}`} title={title}>
      <span className="hl__text">{children}</span>
    </span>
  );
}
