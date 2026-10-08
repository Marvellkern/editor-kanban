import { useUI } from "../store";
import { hashSeed } from "../sketch/SketchBox";
import { seeded } from "../lib/ids";

const LOWER = "abcdefghijklmnopqrstuvwxyz";

/**
 * Same length and word shapes, different letters. The real text is never painted,
 * so a blurred screenshot can't be un-blurred back into the real name.
 */
export function scramble(text: string): string {
  const seed = hashSeed(text);
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const r = seeded(seed, i + 1);
    if (/[a-z]/.test(ch)) out += LOWER[Math.floor(r * 26)];
    else if (/[A-Z]/.test(ch)) out += LOWER[Math.floor(r * 26)].toUpperCase();
    else if (/[0-9]/.test(ch)) out += String(Math.floor(r * 10));
    else if (/\s/.test(ch) || /[.,:;!?'"()&/-]/.test(ch)) out += ch;
    else out += LOWER[Math.floor(r * 26)]; // accented / non-Latin letters
  }
  return out;
}

/** Renders text normally, or scrambled + blurred while blur mode is on. */
export function Private({ text }: { text: string }) {
  const blur = useUI((s) => s.blur);
  if (!blur) return <>{text}</>;
  return (
    <>
      <span className="private" aria-hidden="true">{scramble(text)}</span>
      <span className="visually-hidden">{text}</span>
    </>
  );
}
