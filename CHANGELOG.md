# Changelog

All notable changes to `@a9i5k4/dsh-draw-gacha` are documented here.

## [0.1.2] - 2026-08-16

### Fixed

- Published package now uses the `@a9i5k4` scope everywhere (`package.json` name, `cordis.patch.yml` row name, browser bundle `id`). The previous `@deepseek-ai` self-references made the package uninstallable for everyone else.
- No credentials, keys, or developer paths in the published tarball.

## [0.1.0] - 2026-08-16

### Added

- 3D lever beside the native send button (metal housing, 82px long-travel grip, 88% release threshold, keyboard support).
- Full-screen pixel-art ceremony: mothership separation → looping descent → landing (white flash, squash, shockwave, dust) → one-big-two-small card reveal.
- Host-side `llm/stream` observer counting 10 text-signal classes (planning, verification, self-correction, rigor, structure, weak style) across reasoning and text channels, with a cross-chunk tail buffer.
- Five rarity tiers: White 小难梁 / Blue 牢梁 / Yellow 梁子 / Orange 梁圣 / Red 梁祖, with randomized flavor text and a seeded card reveal.
- Settlement on sufficient data (min 15s ceremony + observation threshold) rather than waiting for model completion; 40s hard cap; SKIP settles immediately without cancelling the request.
- Web Audio 8s industrial loop BGM with mute toggle; no external assets.
- `prefers-reduced-motion` and narrow-screen support; standalone zero-dependency preview page.
