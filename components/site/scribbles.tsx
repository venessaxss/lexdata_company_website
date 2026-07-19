/**
 * components/site/scribbles.tsx — original hand-drawn SVG doodles.
 * Server-safe (no "use client"). Colors via className: "" (ink),
 * "peri", "coral". Float animation via className "float" / "float slow"
 * and rotation via style={{ "--r": "-8deg" }}.
 */
import type { CSSProperties, ReactNode } from "react";

function Doodle({
  children,
  className = "",
  style,
  width,
  viewBox,
}: {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  width: number;
  viewBox: string;
}) {
  return (
    <div className={`doodle ${className}`} style={{ width, ...style }} aria-hidden="true">
      <svg viewBox={viewBox}>{children}</svg>
    </div>
  );
}

export function Sparkle(props: { className?: string; style?: CSSProperties; width?: number }) {
  return (
    <Doodle viewBox="0 0 40 40" width={props.width ?? 56} className={props.className} style={props.style}>
      <path d="M20 4 L20 36 M4 20 L36 20 M9 9 L31 31 M31 9 L9 31" />
    </Doodle>
  );
}

export function Squiggle(props: { className?: string; style?: CSSProperties; width?: number }) {
  return (
    <Doodle viewBox="0 0 60 40" width={props.width ?? 64} className={props.className} style={props.style}>
      <path d="M4 30 Q14 8 24 24 T44 20 T58 12" />
    </Doodle>
  );
}

export function Star(props: { className?: string; style?: CSSProperties; width?: number }) {
  return (
    <Doodle viewBox="0 0 40 40" width={props.width ?? 44} className={props.className} style={props.style}>
      <path d="M20 2 L24 15 L38 16 L27 25 L31 38 L20 30 L9 38 L13 25 L2 16 L16 15 Z" />
    </Doodle>
  );
}

export function Eye(props: { className?: string; style?: CSSProperties; width?: number }) {
  return (
    <Doodle viewBox="0 0 40 40" width={props.width ?? 52} className={props.className} style={props.style}>
      <path d="M6 20 Q 20 2 34 20 Q 20 38 6 20 Z" />
      <circle cx="20" cy="20" r="4" />
    </Doodle>
  );
}

export function SmileBook(props: { className?: string; style?: CSSProperties; width?: number }) {
  return (
    <Doodle viewBox="0 0 50 50" width={props.width ?? 60} className={props.className} style={props.style}>
      <path d="M25 4 C 12 4 6 14 6 24 C 6 36 16 44 25 46 C 34 44 44 36 44 24 C 44 14 38 4 25 4 Z M17 22 Q25 30 33 22" />
    </Doodle>
  );
}

export function CaretHat(props: { className?: string; style?: CSSProperties; width?: number }) {
  return (
    <Doodle viewBox="0 0 40 40" width={props.width ?? 48} className={props.className} style={props.style}>
      <path d="M6 34 Q20 2 34 34" />
      <circle cx="20" cy="38" r="1.5" />
    </Doodle>
  );
}

/** Wavy underline for a headline word: <SquigWord>language-data</SquigWord> */
export function SquigWord({ children }: { children: ReactNode }) {
  return (
    <span className="squig">
      {children}
      <svg viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true">
        <path d="M4 14 Q 30 4 55 13 T 105 13 T 155 12 T 205 14 T 255 12 T 296 13" />
      </svg>
    </span>
  );
}

/** Curved hand-drawn arrow (draw-on when revealed). */
export function ArrowDown(props: { className?: string }) {
  return (
    <svg className={`draw ${props.className ?? ""}`} viewBox="0 0 90 70" aria-hidden="true">
      <path d="M78 6 C 60 30, 44 44, 18 52 M30 44 L16 53 L32 60" />
    </svg>
  );
}

/** Hand-drawn checkmark for list items. */
export function Check() {
  return (
    <svg className="draw" viewBox="0 0 26 26" aria-hidden="true">
      <path d="M3 14 L10 21 L23 4" />
    </svg>
  );
}
