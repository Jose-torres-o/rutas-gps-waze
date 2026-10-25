# Design Brief

## Direction

Night Drive HUD — a focused, cockpit-grade GPS navigation tool where the map is the interface and every overlay reads like live telemetry.

## Tone

Utilitarian dark-tech executed with conviction: deep cool near-black surfaces, high-voltage mint-teal signal color, and warm amber for hazards — a night-driving cockpit, not a generic dark dashboard.

## Differentiation

The signature is *live telemetry as design language*: a glowing mint route line, a heading-aware position marker with a pulsing radar ring, and monospace numerals for distance/duration/speed that make the app feel like an instrument panel mid-drive.

## Color Palette

| Token      | OKLCH         | Role                                        |
| ---------- | ------------- | ------------------------------------------- |
| background | 0.15 0.014 235 | Deep cool charcoal map canvas / app shell  |
| foreground | 0.95 0.008 220 | Primary text on dark surfaces              |
| card       | 0.19 0.018 235 | Elevated panels, docks, route cards        |
| primary    | 0.78 0.15 178  | Electric mint-teal — route lines, active states, record button |
| accent     | 0.76 0.16 65   | Signal amber — tags, hazards, warnings     |
| muted      | 0.24 0.02 235  | Inactive controls, secondary surfaces      |
| destructive| 0.66 0.2 25    | Delete / stop / error states               |
| success    | 0.72 0.17 150  | GPS locked, on-route confirmation          |
| warning    | 0.8 0.16 82    | Off-route, weak-signal states              |

## Typography

- Display: Space Grotesk — headings, route names, panel titles, buttons
- Body: Satoshi — labels, notes, list rows, form text
- Mono: JetBrains Mono — distance, duration, speed, coordinates (`.telemetry`)
- Scale: hero `text-3xl md:text-4xl font-bold tracking-tight`, h2 `text-xl md:text-2xl font-bold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase`, body `text-sm md:text-base`

## Elevation & Depth

Dark mode is primary (night driving reduces glare); surfaces layer via lightness steps (background → card → popover) with translucent glass overlays (`surface-glass`) floating over the map, lifted by `shadow-panel` and `shadow-dock`.

## Structural Zones

| Zone    | Background             | Border        | Notes                                              |
| ------- | ---------------------- | ------------- | -------------------------------------------------- |
| Map     | full-bleed OSM tiles   | —             | Centerpiece canvas; route line + markers overlay   |
| Header  | `surface-glass` strip  | `border-b`    | Travel mode, GPS state, last-updated indicator     |
| Content | `bg-background`        | —             | Bottom-sheet panels (mobile) / side panel (desktop)|
| Dock    | `bg-card` + `shadow-dock` | `border-t` | Primary actions: record, routes, tags, share       |

## Spacing & Rhythm

Dense, information-first: 4px micro-gaps inside controls, 12–16px panel padding, 8–12px between stacked overlay cards; generous 20–24px breathing room only around the map's floating controls.

## Component Patterns

- Buttons: medium-radius (12px) with mint primary for record/active; icon buttons are rounded squares on `bg-card`; destructive outlined in red
- Cards: 16px radius, `bg-card`, `border-border`, `shadow-panel`; route cards include a mini-map thumbnail and telemetry row
- Badges: pill (`rounded-full`) with category icon — amber for tags/hazards, mint for on-route, red for signal/stop

## Motion

- Entrance: bottom sheets slide up (`animate-sheet-up`, 280ms); panels fade with the same curve
- Hover: `transition-smooth` 300ms on color/border; buttons brighten, cards lift subtly
- Decorative: `animate-pulse-ring` on the live position marker, `animate-signal-blink` on the GPS/last-updated indicator

## Constraints

- Real-time live positioning only — never render route playback
- No traffic-light state display, turn-by-turn instructions, or offline tile caching
- Always show "© OpenStreetMap contributors" attribution on the map
- All colors via OKLCH semantic tokens; no raw hex or arbitrary color classes in components

## Signature Detail

The pulsing radar ring around the live position marker plus glowing mint route line — a "you are here, in motion" instrument cue that defines the whole cockpit feel.
