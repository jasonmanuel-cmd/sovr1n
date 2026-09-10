# Sourc'n — Design System

## Brand Positioning
A warm, trustworthy local marketplace for Bakersfield's Central Valley community. Not corporate, not generic — feels like the neighborhood bulletin board reimagined for 2026.

## Aesthetic Direction: Desert Modern
Southwestern warmth meets clean modern utility. Sand, clay, sage, and sun-bleached textures with crisp contemporary typography.

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--sand` | #F4EFE6 | Page background |
| `--cream` | #FAF8F3 | Surface background |
| `--warm-white` | #FFFDF9 | Card/sheet background |
| `--clay` | #D4794A | Primary accent (CTA, links, active states) |
| `--clay-deep` | #B85E32 | Hover states |
| `--sage` | #5B8A5C | Success, positive actions |
| `--sage-deep` | #3F6E40 | Hover states |
| `--mesquite` | #2B241C | Text primary |
| `--dust` | #7A7268 | Text secondary |
| `--border` | #E5DDD2 | Borders, dividers |
| `--shadow` | rgba(43,36,28,0.08) | Shadows |

## Typography

| Role | Font | Weight | Size Scale |
|---|---|---|---|
| Display/Headings | **DM Serif Display** | 400 | clamp(1.5rem, 3vw, 2.75rem) |
| Subheadings | **Instrument Serif** (italic) | 400 | 1.125–1.5rem |
| Body/UI | **Plus Jakarta Sans** | 400, 500, 600, 700 | 0.875–1rem |
| Small/Label | **Plus Jakarta Sans** | 500, 600 | 0.75–0.8125rem |

## Spacing
4px base unit. Section padding: clamp(2rem, 5vw, 4rem). Card padding: 1rem–1.5rem.

## Border Radius
- Buttons/cards: 12px
- Modals/sheets: 16px
- Pills/tags: 9999px

## Shadows
- Card: `0 1px 3px var(--shadow)`
- Elevated: `0 4px 12px var(--shadow)`
- Modal: `0 8px 32px var(--shadow)`

## Iconography
Outline style, 20px default, rounded stroke caps. Clay accent on active.

## Motion
- Transitions: 200ms ease-out
- Modals: 300ms ease-out with slight scale (0.95→1)
- Page load: staggered fade-up (50ms delay per child)

## Components

### Buttons
- **Primary**: Clay bg, warm-white text, 12px radius, 44px height, Plus Jakarta Sans 600
- **Secondary**: Warm-white bg, clay border, mesquite text
- **Ghost**: No bg, mesquite text, hover fills clay-dim

### Cards
Warm-white bg, 12px radius, border, subtle shadow. Image aspect 16:9 or 4:3.

### Form Fields
Clay border (1.5px), 12px radius, 48px height, label above. Focus ring: clay 2px.

### City Pill / Tag
Sage or clay outline pill, 32px height, rounded-full, compact text.

### Navigation
Bottom tab bar (mobile) or sticky top bar (desktop). Clay accent on active tab.

---

## Page Direction

### Landing
Hero with search bar + city selector. "Find services", "Find drivers", "Load board" category cards below. Featured listings carousel.

### Listings
Card grid (2 cols mobile, 3-4 cols desktop). Filter sidebar on desktop, bottom sheet filter on mobile.

### Detail
Full-width image hero, sticky CTA bar at bottom. Description, pricing, seller card.

### Auth
Centered card layout. Minimal — email + magic link or Google OAuth.
