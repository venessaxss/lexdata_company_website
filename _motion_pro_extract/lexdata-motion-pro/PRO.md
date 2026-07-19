# Motion Layer PRO — maximum dynamics, same clean integration

The base Motion Layer did triggered animations. PRO adds the machinery that
makes award-style sites feel alive: everything is **scrubbed to scroll** or
**reactive to input**, not just triggered once.

## What PRO adds

| Effect                 | What it feels like                                          |
| ---------------------- | ----------------------------------------------------------- |
| Inertia smooth scroll  | The whole page glides with lag/ease instead of jumping      |
| Preloader intro        | Brand word cycles through languages, curtain sweeps up      |
| Custom cursor          | Dot + trailing blend-mode ring, grows over links            |
| Scrub engine           | Any element translates/rotates/scales tied to scroll pos    |
| Split-text             | Headlines rise word-by-word from a mask, on load or in view |
| Pin + horizontal       | A section pins while its content scrolls sideways           |
| Velocity marquee       | Strip speeds up and skews with your scroll speed            |
| Theme morph            | Page background cross-fades light↔dark between sections     |
| Clip reveals           | Cards unclip into view with stagger                         |
| 3D tilt                | Pointer-tracking card tilt                                  |

Open `preview/index.html` — it demonstrates all of it on LexData content.

## Install

Files:
- `components/dynamic/MotionLayerPro.tsx`
- `app/motion-layer-pro.css`

`app/globals.css`:

```css
@import "./motion-layer-pro.css";
```

`app/layout.tsx` — wrap your pages; keep fixed chrome outside the wrapper:

```tsx
import MotionLayerPro from "@/components/dynamic/MotionLayerPro";

<body className={...unchanged...}>
  <YourNavbar />                    {/* fixed/sticky chrome OUTSIDE */}
  <MotionLayerPro intro cursor smooth
    introWords={["Language","语言","Lengua","اللغة","Langue","언어","Data."]}>
    {children}                      {/* your original pages, unchanged */}
  </MotionLayerPro>
  <YourFooterIfFixed />
</body>
```

Props: `smooth`, `cursor`, `intro` are independently toggleable
(`<MotionLayerPro smooth={false} ...>` keeps native scrolling and still
gives you every other effect). `lerp={0.06}` = floatier, `0.12` = snappier.

## Animate your existing markup with attributes

```html
<!-- hero heading rises word-by-word after the preloader -->
<h1 data-split>Bridging Humanities and Data Science</h1>

<!-- subtitle drifts upward as you scroll past (scrubbed, not triggered) -->
<p data-scrub-y="-40">Intelligent Data Solutions ...</p>

<!-- giant background text slides horizontally with scroll -->
<div class="giant-line" data-scrub-x="-14">Corpus → Annotation → Model →</div>

<!-- decorative glyph rotates while scrolling -->
<span data-scrub-rotate="15">言</span>

<!-- section heading reveals word-by-word when reached -->
<h2 data-split-view>What we do</h2>

<!-- cards unclip into view; stagger via --i -->
<div class="card" data-view style="--i:0">...</div>
<div class="card" data-view style="--i:1" data-tilt>...</div>

<!-- pinned horizontal method section: pins for 300vh of scroll -->
<div data-pin="300" data-theme="dark">
  <div> <!-- first child auto-becomes the pinned stage -->
    <h2 data-split-view>Our method</h2>
    <div data-pin-track>  <!-- scrolls sideways as you scroll down -->
      <div class="step">Corpus</div> ... 
    </div>
    <div class="bar"><b data-pin-fill></b></div>
  </div>
</div>

<!-- topics strip reacting to scroll velocity -->
<div class="flex gap-10" data-marquee-velocity>
  <span>Corpus linguistics</span><span>Machine translation</span>...
</div>

<!-- this section morphs the page dark while it's centered -->
<section data-theme="dark">...</section>
```

Pages stay server components; the attributes are plain HTML.

## Compatibility & caveats (read these)

1. **Smooth scroll moves content in a transformed fixed wrapper.** Anything
   `position: fixed` or `position: sticky` must live OUTSIDE
   `<MotionLayerPro>` (navbar, cookie banners). Inside it, use `data-pin`
   for pinning — the layer pins manually so it works with the scroller.
   If restructuring chrome isn't worth it, set `smooth={false}`: native
   scroll returns, sticky/fixed work as usual, and pins fall back to
   `position: sticky` automatically. You keep every other effect.
2. **Anchor links**: with smooth scroll on, `#hash` jumps set `scrollY`
   natively and the content glides to it — no extra work.
3. **Theme morph** maps `.mlp-dark` on `<html>` to colors at the bottom of
   the CSS file — edit that block to your palette (it ships with your
   ink/porcelain colors).
4. **Layering**: PRO composes with the base Motion Layer (different
   prefixes). Use base for simple reveals/counters and PRO for the heavy
   effects, or PRO alone.
5. **Performance**: one rAF loop drives everything; transforms only, no
   layout thrash. Still, scrub effects multiply per element — keep it to
   dozens, not hundreds.
6. **Accessibility**: `prefers-reduced-motion` turns off smooth scroll,
   the intro, the cursor, scrubs, and split animations; content is always
   present for SSR/SEO.

## Rollback

Remove the `<MotionLayerPro>` wrapper (keep `{children}`) and the import.
Original site, untouched.
