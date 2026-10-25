# Project Guidance

## User Preferences

- Waze-style map interface: full-screen map, route lines, live position marker, bottom control panels
- Real-time live positioning only, never route playback
- Travel modes: private car, bus, motorcycle, bicycle, walking
- Location sharing must include a WhatsApp share intent
- Built-in management panel for routes, tags and notes

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- Custom Web-Mercator projection (lib/geo.ts project/unproject) renders OSM raster tiles, SVG route lines and DOM markers without a mapping library; OSM tiles need a CSS invert+hue-rotate filter for a dark map.
- OSRM demo server (router.project-osrm.org) supports only driving/cycling/walking profiles; bus and motorcycle must map to driving. Its geometry=geojson returns [lng,lat] pairs, not [lat,lng].
- Backend enum variants must be value-imported (TravelMode.car), never `import type`, or TS1361/TS2345 fires.
- TanStack Router: pass a selected entity between routes via validateSearch + useSearch({ from: '/' }) rather than shared component state.
- tailwind darkMode is 'class'; a dark-primary design needs document.documentElement.classList.add('dark') in main.tsx or it silently renders in light mode.
- Motoko has no triple-quoted strings; multi-line doc literals must be single strings with \n escapes. getApiDoc belongs in its own mixin included from main.mo.
- Biome rejects role="status" on a div (use <output>) and flags onClick on map pointer surfaces (needs a biome-ignore lint/a11y/useKeyWithClickEvents comment).
