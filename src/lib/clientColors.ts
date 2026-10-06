import { hashSeed } from "../sketch/SketchBox";

/**
 * Client tape colors. Deliberately different hues from the highlighters
 * (which already mean video type / deadline state), all light enough for ink text.
 */
export const CLIENT_COLORS = {
  coral: { label: "Coral", css: "var(--client-coral)" },
  mint: { label: "Mint", css: "var(--client-mint)" },
  lavender: { label: "Lavender", css: "var(--client-lavender)" },
  sand: { label: "Sand", css: "var(--client-sand)" },
  sage: { label: "Sage", css: "var(--client-sage)" },
  rose: { label: "Rose", css: "var(--client-rose)" },
  teal: { label: "Teal", css: "var(--client-teal)" },
  periwinkle: { label: "Periwinkle", css: "var(--client-periwinkle)" },
} as const;

export type ClientColor = keyof typeof CLIENT_COLORS;
export const CLIENT_COLOR_KEYS = Object.keys(CLIENT_COLORS) as ClientColor[];

export function isClientColor(v: unknown): v is ClientColor {
  return typeof v === "string" && v in CLIENT_COLORS;
}

/** "  Acme Studio " and "acme studio" are the same client. */
export function clientKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Stable automatic color for a client name. */
export function autoClientColor(name: string): ClientColor {
  return CLIENT_COLOR_KEYS[hashSeed(clientKey(name)) % CLIENT_COLOR_KEYS.length];
}

export function resolveClientColor(name: string | undefined, overrides: Record<string, ClientColor> | undefined): ClientColor | null {
  if (!name || !name.trim()) return null;
  return overrides?.[clientKey(name)] ?? autoClientColor(name);
}
