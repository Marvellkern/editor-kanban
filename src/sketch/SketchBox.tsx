import { memo, useLayoutEffect, useRef, useState } from "react";
import rough from "roughjs";

const generator = rough.generator();

export interface SketchOptions {
  shape?: "rect" | "ellipse";
  /** CSS color (CSS variables allowed). Omit for no fill. */
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  roughness?: number;
  /** Offset of a solid ink shadow, in px. */
  shadow?: number;
  shadowColor?: string;
  dashed?: boolean;
}

interface PathSet {
  shadow: { d: string; filled: boolean }[];
  face: { d: string; filled: boolean }[];
}

/* Cache drawn paths so identical boxes (same size + seed) never re-wobble or re-compute. */
const cache = new Map<string, PathSet>();
const CACHE_MAX = 3000;

function draw(w: number, h: number, seed: number, o: SketchOptions): PathSet {
  const key = [w, h, seed, o.shape, !!o.fill, o.strokeWidth, o.roughness, o.shadow, o.dashed].join("|");
  const hit = cache.get(key);
  if (hit) return hit;

  const sw = o.strokeWidth ?? 1.6;
  const pad = sw + 1;
  const shadow = o.shadow ?? 0;
  // The shadow hangs outside the box, so adding/removing it never changes the face's wobble.
  const bw = Math.max(4, w - pad * 2);
  const bh = Math.max(4, h - pad * 2);
  const base = {
    seed,
    roughness: o.roughness ?? 1.4,
    strokeWidth: sw,
    bowing: 1,
    fillStyle: "solid" as const,
    preserveVertices: false,
    disableMultiStroke: !!o.dashed,
    strokeLineDash: o.dashed ? [7, 6] : undefined,
  };
  const shape = (x: number, y: number, opts: object) =>
    o.shape === "ellipse"
      ? generator.ellipse(x + bw / 2, y + bh / 2, bw, bh, opts)
      : generator.rectangle(x, y, bw, bh, opts);

  const toSet = (drawable: ReturnType<typeof shape>) =>
    generator.toPaths(drawable).map((p) => ({ d: p.d, filled: !!p.fill && p.fill !== "none" }));

  const result: PathSet = {
    shadow: shadow
      ? toSet(shape(pad + shadow, pad + shadow, { ...base, seed: seed + 7, fill: "#000", stroke: "none" }))
      : [],
    face: toSet(shape(pad, pad, { ...base, fill: o.fill ? "#fff" : undefined, stroke: "#000" })),
  };
  if (cache.size > CACHE_MAX) cache.clear();
  cache.set(key, result);
  return result;
}

interface Props extends SketchOptions {
  seed: number;
  className?: string;
}

/**
 * A hand-drawn outline layer. Place it as a child of a `position: relative`
 * element; it fills that element and draws behind its content.
 */
export const SketchBox = memo(function SketchBox({ seed, className, ...o }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      // Round so sub-pixel layout jitter never causes a redraw.
      const w = Math.round(el.clientWidth || r.width);
      const h = Math.round(el.clientHeight || r.height);
      setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const paths = size && size.w > 0 && size.h > 0 ? draw(size.w, size.h, seed, o) : null;
  const stroke = o.stroke ?? "var(--ink)";

  return (
    <svg ref={ref} className={`sk-layer ${className ?? ""}`} aria-hidden="true" focusable="false">
      {paths && (
        <>
          <g className="sk-shadow">
            {paths.shadow.map((p, i) => (
              <path key={i} d={p.d} style={{ fill: p.filled ? (o.shadowColor ?? "var(--ink)") : "none", stroke: "none" }} />
            ))}
          </g>
          <g className="sk-face">
            {paths.face.map((p, i) => (
              <path
                key={i}
                d={p.d}
                style={
                  p.filled
                    ? { fill: o.fill, stroke: "none" }
                    : { fill: "none", stroke, strokeWidth: o.strokeWidth ?? 1.6, strokeLinecap: "round", strokeDasharray: o.dashed ? "7 6" : undefined }
                }
              />
            ))}
          </g>
        </>
      )}
    </svg>
  );
});

/** Stable small hash so un-seeded UI elements (buttons, inputs) still keep a fixed wobble. */
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) % 2147483647 || 1;
}
