# dsh-draw-gacha

> A 3D lever next to the send button in DeepSeek Harness — pull it, and turn the model's reasoning signals into a pixel-art gacha draw. **Just for fun.**

> Preview: after cloning, open `persistent/dev-preview.html` in a browser (zero dependencies, no DSH needed).

## What is this

Model calls in DeepSeek Harness vary wildly — like pulling gacha. This plugin makes that literal:

1. A **3D mechanical lever** (metal housing, long-travel yellow grip) appears next to the native send button.
2. Pull the grip all the way down until the gold glow peaks, then release — your message is sent as usual, and a full-screen pixel-art gacha ceremony begins.
3. In the background the plugin reads the current **reasoning chain** (plus the text channel) and counts 10 classes of text signals in real time:
   - **Planning**: `I will / I'll / I need / we need / we should / 我会 / 我需要 / 我们得…`
   - **Verification**: `verify / check / test / confirm / double-check / make sure / 验证 / 检查 / 核实…`
   - **Self-correction**: `however / wait / I was wrong / let me reconsider / 但是 / 重新 / 等等…`
   - **Rigor**: `constraint / trade-off / edge case / 约束 / 边界 / 权衡…`
   - **Structure**: `first / second / step / finally / 首先 / 其次 / 总结…`
   - Plus weak style signals like `let me / 让我`.
4. Once enough data is collected (minimum 15s ceremony **and** sufficient observation — or the model already finished), the pods land and reveal a rarity: **White · 小难梁 / Blue · 牢梁 / Yellow · 梁子 / Orange · 梁圣 / Red · 梁祖**.

> Signals are matched across stream chunks (DeepSeek tokenizes mid-word, e.g. `I wi` + `ll`); a cross-chunk tail buffer prevents missed matches.

## The ceremony

- **Semi-transparent gray overlay** (`rgba(26,30,38,.62)` + backdrop blur): the conversation stays visible behind it.
- **Three descending pods**: CSS 3D multi-face return pods detach from the mothership and fall along a fixed axis — they keep looping while listening, and only play the landing animation (white flash → squash → shockwave → dust) once results are ready.
- **One-big-two-small reveal**: the center card is the **滑动变祖器** Liang-series portrait with a slider track (拉 → 燃 → 稳 → 夯); two weapon cards flank it; stars light up by rarity.
- **Flavor text**: multiple randomized gacha quips per tier, seeded by the run.
- **Built-in BGM**: an 8-second industrial synth loop generated via Web Audio, toggleable, no external assets.
- **Controls**: ✕ to close anytime; **SKIP** settles immediately with current observations (without cancelling the model); click anywhere or "点击继续" to dismiss the result.
- Full `prefers-reduced-motion` and narrow-screen support.

## Design principles

- **Settle on sufficient data, not on model completion.** The model may work for 40 minutes — the plugin lands after ~15s once enough signal is observed (~2000 chars or signal-sum ≥ 8). It never makes you watch pods fall for 40 minutes.
- **`let me` is not a crime.** It is a weak style signal; it only costs points when verification / self-correction / structure signals are missing (capped penalty).
- **No reasoning persistence.** Host keeps only counts, lengths, phase, and a tiny sample; the full chain never leaves the host.
- **Pure entertainment disclaimer**: results are based only on text signals during generation — not answer quality, model capability, model version, person, or any official relationship.

## Install

### As a DSH profile plugin (recommended)

```bash
dsh plugin --profile web add @a9i5k4/dsh-draw-gacha
```

Then register the row in your profile's `cordis.patch.yml` (`$DSH_HOME/profiles/web/cordis.patch.yml`):

```yaml
- insert:
    - id: draw-gacha
      name: '@a9i5k4/dsh-draw-gacha'
```

Restart `dsh web`.

### Local link install (development)

```bash
dsh plugin --profile web add link:D:/path/to/dsh-draw-gacha
```

Same patch registration as above.

## Usage

1. Type a message in any session (the lever is disabled on empty draft / busy state).
2. Grab the grip and pull it down the full travel (~82px, 88% threshold) until gold overflows, then release.
3. The message is sent and the full-screen ceremony starts; the subtitle shows `reasoning X · text Y` and signal stats live.
4. When data is sufficient (or the model finishes): landing → impact → card reveal → stars → flavor text.
5. Click anywhere or "点击继续" to dismiss; ✕ or SKIP available anytime.

> Keyboard: `Enter` / `Space` triggers the full lever action; `Escape` cancels an un-sent pull.

## Development

```text
persistent/
├── lib/index.js       # Host: llm/stream observer, 10 signal classes, /api/draw-gacha/* routes
├── lib/client.js      # Browser: lever + 3D ceremony + reveal (dsh.client bundle)
├── cordis.patch.yml   # plugin row
├── dev-preview.html   # standalone zero-dependency preview (open in browser, no DSH)
└── package.json
```

- Host reads `llm/stream` and forwards every chunk untouched; never mutates the frozen `GenerateOptions`.
- Session isolation via `options.sessionId + generation`; auxiliary `purpose=compaction/session-title` requests are excluded.
- Chinese and English reasoning both supported; cross-chunk tail buffer (120 chars) prevents token-split misses.
- To tweak the ceremony: edit `dev-preview.html` first, then sync into `lib/client.js` (both must stay identical).

## Validate

```bash
node --check lib/index.js
node --check lib/client.js
```

Offline simulation with 5-char token splits confirms all 10 signal classes count > 0.

## License

MIT. Plugin code and CSS are original; the Liang-series portraits and 滑动变祖器 assets come from community open-source projects (e.g. [Liang-Saint-Slider](https://github.com/BruzWJ/Liang-Saint-Slider)) — respect their original licenses for reuse/redistribution. The characters and theme are memes only, unrelated to any real person or DeepSeek official.

## Disclaimer

> Results are entertainment-only settlements based on text signals during generation; they do not represent answer quality, model capability, model version, person, or any official relationship. Pull responsibly.
