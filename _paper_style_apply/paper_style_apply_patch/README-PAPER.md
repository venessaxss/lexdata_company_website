# LexData "paper & ink" style (Ellipsus-inspired)

The warm, hand-drawn, indie aesthetic: cream paper + navy ink, friendly
Fraunces serif headlines, Caveat handwritten annotations with a draw-on
arrow, sticker cards with hard offset shadows and slight rotations,
floating original SVG doodles, wavy underlines, pill buttons that press
like real buttons, a butter-yellow marquee strip, and gentle fade-up
reveals. Inspired by ellipsus.com's design language — all assets, doodles,
and copy here are original.

Open `preview/index.html` to see it.

## Files

- `app/paper-theme.css` — the whole design system
- `app/page.tsx` — homepage (replace yours)
- `components/site/scribbles.tsx` — original doodle SVGs (Sparkle, Star,
  Squiggle, Eye, SmileBook, CaretHat, SquigWord, ArrowDown, Check)
- `components/site/PaperMotion.tsx` — the (single, gentle) motion mount

## Integrate

1. `app/globals.css`:
   ```css
   @import "./paper-theme.css";
   ```
2. `app/layout.tsx` — fonts + motion mount + nav/footer in this style:
   ```tsx
   import { Fraunces, Work_Sans, Caveat } from "next/font/google";
   import { PaperMotion } from "@/components/site/PaperMotion";

   const display = Fraunces({ subsets: ["latin"], weight: ["500","600"], variable: "--font-display" });
   const body = Work_Sans({ subsets: ["latin"], weight: ["400","500","600"], variable: "--font-body" });
   const hand = Caveat({ subsets: ["latin"], weight: ["500","600"], variable: "--font-hand" });

   <body className={`${display.variable} ${body.variable} ${hand.variable}`}>
     <PaperMotion />
     <header className="site">
       <div className="wrap">
         <a className="logo" href="/"><span>LexData</span><span className="dots">…</span></a>
         <nav className="main">
           <a href="/about">About</a><a href="/services">Services</a>
           <a href="/courses">Courses</a><a href="/workshops">Workshops</a>
           <a className="btn ghost small" href="/login">Log in</a>
           <a className="btn small" href="/login">Sign up</a>
         </nav>
       </div>
     </header>
     {children}
     {/* footer: copy the <footer class="site"> block from preview/index.html into a component */}
   </body>
   ```
3. Replace `app/page.tsx` with the one here. Done — no npm packages.

NOTE: this style replaces the PRO layer for these pages. Don't wrap them
in <MotionLayerPro>; the paper style's charm is gentleness (no smooth
scroll, no custom cursor, no preloader). If you have PRO installed,
just don't mount it in layout.tsx.

## Reusable ingredients for other pages / future elements (board, etc.)

- `.paper-card` — white card, ink border, offset shadow (rotate with
  `--tilt`)
- `.sticker` — card that straightens + lifts on hover
- `.badge` (+ `.butter` `.coral`) — pill stickers
- `.btn` (+ `.ghost` `.coral` `.small`) — pressable buttons
- `.checks` + `<Check />` — hand-drawn checklist
- `.kicker`, `.block`, `.band`, `.strip` — section patterns
- `.rev` + `--d`/`--tilt` — reveal anything; `<ArrowDown/>`/`<Check/>`
  draw themselves in when revealed
- Doodles from `scribbles.tsx` — position absolutely, add `float`

A dashboard "board" in this style = a grid of `.paper-card`s with
`--tilt` variations, `.badge` status pills, and `.checks` lists. Send me
the board content when ready and I'll compose it.

## Content note

Copy is written in the style's voice but for LexData. Numbers
("1,200 (human) learners") are placeholders — set your real ones.
