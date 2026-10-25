# AR Sharvesh · Portfolio Card

A single-file, flip-card portfolio with a Clash-of-Clans vibe. One side is **Professional**, the other is **Personal**. Built to feel good on a phone, and it never scrolls.

## What's inside

- **Flip card:** tap the card, swipe it, or use the toggle at the top.
- **3D feel:** the card sways on its own, tilts as you drag it, then springs back. Desktop follows the mouse.
- **Playful bits:** tap the character for a squash and a line of text, and tap any tech logo to pop it and see its name.
- **Professional side:** role, education, what's being built (with a progress bar), and the tech stack.
- **Personal side:** music, favourite show, Clash tags, and social links.
- **Mobile first:** fits the screen with no page scroll, and both characters stay the same size on both sides.
- **Respectful:** honours `prefers-reduced-motion`, and the card is keyboard and screen-reader friendly.

## Run it

No build, no install, no dependencies.

```
open index-v3.html
```

Double-click the file, or drop it on any static host.

## Make it yours

Everything lives in one file, so search and edit.

| Want to change | Where to look |
| --- | --- |
| Name, role, college, links | the `<div class="hd">` and `<div class="info">` blocks |
| Progress text and percent | `.pb` (text) and `.pb i` width in the CSS |
| Tech logos | the `<div class="ft">` row. Each `.bd` has `--b` (colour) and a `title` |
| Accent colours | the CSS variables at the top, `--ca` is the main accent |
| Character lines on tap | the `lines` object in the script |

## Layout rules (so it stays tidy)

- Front and back share the same row heights, so the character is always the same size.
- Tech logos sit in a compact grid: 2 rows of 5 on mobile, 1 row of 10 on desktop.
- Name and status dot are optically centred. The display font sits high in its line, so they are nudged down.

## Browser support

Any modern browser (Chrome, Safari, Firefox, Edge). The 3D flip needs CSS `transform-style` and `perspective`, which all of them support.

---

Made by **AR Sharvesh**
