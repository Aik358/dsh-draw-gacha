# Changelog

All notable changes to `@a9i5k4/dsh-draw-gacha` are documented here.

## [0.1.7] - 2026-09-16

### Fixed

- **拉杆恒为 disabled（dsh ≥ 0.1.5-rc.1）**：host 在 `5f1eca58ea`（`perf: InputBar use immutable props`）之后以空 owner props 渲染 `conversation.input.right`，插件却仍从 `props.input` 取草稿，于是 `draft === undefined` → `inputReady()` 恒为 false → 按钮永久 `disabled`，与草稿内容无关。`Lever` 现在在组件体内通过标准 `useInput` selector hook（`SnapshotSelectorHook<InputState>`）读取实时输入，`inputActions` / `sessionId` 沿用标准 props；旧 host 继续走 `props.input`，两代契约都可用。
- 可用性判定改为读取 `InputState.draft` + `phase`：`plain` / `claimed` 可发送（与 host 原生发送按钮一致，它只屏蔽 `adjudicating` / `submitting`），同时保留 `draftText` 与 `disabled` / `busy` / `blocked` 等旧字段的兼容判断。
- README「安装 → 方式一」不再让用户手写 `cordis.patch.yml`：包已声明 `dsh.bundle.patch`，`dsh plugin add` 会自动注入插件行，重复添加会产生重复 loader entry。

### Added

- `lever.test.js`：离线契约测试。用桩 module loader 加载真实 `lib/client.js`，在新旧两代 slot 契约下校验拉杆 gate、拉到底发送（POST `/api/draw-gacha/start` + `inputActions.submit()`）、键盘 Enter 发送与空草稿不触发；已接入 CI。

## [0.1.6] - 2026-08-18

### Fixed

- **llm/stream waterfall consumer defense**: the listener now iterates `for await (const chunk of await next())` instead of `for await (const chunk of next())`. Any downstream listener that returns a Promise (e.g. an `async` listener wrapping an async generator) would previously crash every model request with `next(...) is not a function or its return value is not async iterable`; awaiting first makes the chain robust regardless of what downstream returns. (See the rule written into dsh-anchored-monitor: llm/stream producers must be plain functions returning async generators; consumers must `await next()` first.)

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
