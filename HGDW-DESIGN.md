# HGDW Design System

The single source of truth for the visual system lives in code at
[`src/brand.ts`](src/brand.ts) (colors, fonts, video dimensions) and
[`src/types.ts`](src/types.ts) (the frame types). This doc explains them.

## Wordmark

> **HOT GIRLS DONT WORK** — intentionally no apostrophe.

## Color palette

| Token | Hex | Use |
| --- | --- | --- |
| Yellow | `#FFD56B` | Gradient start, highlights |
| Coral | `#FF7E5F` | Gradient midpoint |
| Sunset | `#FF5263` | Gradient end, accents |
| Dark BG | `#0a0808` | Demo / dark frame backgrounds |
| Text | `#f6efe6` | Primary text |
| Soft Text | `#cbb7a2` | Secondary / muted text |

**Brand gradient:** `linear-gradient(135deg, #FFD56B 0%, #FF7E5F 50%, #FF5263 100%)`
A **3px** gradient border frames branded cards.

## Typography

- **Sans:** Inter (weights 300–900)
- **Mono:** JetBrains Mono (400, 700)

## Video / render spec

| Property | Value |
| --- | --- |
| Output | 1920×1080, H.264 + AAC, MP4 |
| Frame rate | 24 fps |
| Deck render | 960×540 CSS @ 2× device scale → 1920×1080 |

## The frame types

`N*` narrative/structural · `C*` content · `D*` demo · `O*` outro.
Each frame is rendered by the Slides Agent and then **individually verified** (see below).

| Frame | Background | Purpose | Common fields |
| --- | --- | --- | --- |
| `N1-title` | gradient | Big title card | `title`, `subtitle`, `eyebrow` |
| `N2-section` | gradient | Section divider | `title`, `eyebrow` |
| `N3-quote` | gradient | Large mantra / quote | `title` |
| `N4-vocab` | gradient | Vocab tags (often silent, visual-only) | `tags[]` |
| `N5-agenda` | gradient | Roadmap / agenda list | `title`, `body[]` |
| `C1-bullets` | dark | Title + bullet list | `title`, `body[]` |
| `C2-statement` | dark | Single big statement | `title` |
| `C3-compare` | dark | Two-column comparison | `columns[] {heading, items[]}` |
| `C4-steps` | dark | Numbered steps | `title`, `body[]` |
| `C5-callout` | dark | Callout / warning box | `title`, `body[]` |
| `C6-code` | dark | Code block | `code`, `lang` |
| `C7-stat` | dark | Big stat / number | `stat`, `statLabel` |
| `C8-figure` | dark | Image / figure with caption | `image`, `caption` |
| `C9-grid` | dark | **Infographic:** grid of 2–4 stat/info cards | `title`, `cards[] {icon?, stat?, title, body?}` |
| `C10-flow` | dark | **Infographic:** horizontal process flow (A → B → C) | `title`, `body[]` (ordered stages) |
| `C11-icons` | dark | **Infographic:** emoji/icon feature grid (2–6 tiles) | `title`, `cards[] {icon, title, body?}` |
| `D1-placeholder` | dark | Demo placeholder (app eyebrow) — used when a recording is missing | `eyebrow`, `title` |
| `D2-lowerthird` | — | Lower-third label overlay for a recording | `title`, `subtitle` |
| `O1-outro` | gradient | Closing / CTA card | `title`, `subtitle`, `footer` |

## Slide verification (ViMax consistency-checker pattern)

After rendering **each** slide (never batched), the verifier:

1. Downscales the PNG to an 8×8 RGB grid via ffmpeg to sample dominant colors.
2. Checks those colors against the expected family for the frame's background —
   **warm tones** (`#FFD56B / #FF7E5F / #FF5263`) for gradient frames, **dark tones**
   (`#0a0808`) for dark frames.
3. Confirms the rendered text matches the slide's YAML spec.

A slide that fails verification is flagged, not silently shipped.
