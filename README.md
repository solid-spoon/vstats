<div align="center">

<img src="https://raw.githubusercontent.com/solid-spoon/vstats/main/icon.png" alt="VStats" width="128" height="128" />

# VStats

**Level up your code.**

A gamified coding tracker for VSCodium that turns every keystroke, save, and hour into XP, levels, ranks, and achievements — with a clean dashboard and a shareable recap.

[![VSCodium](https://img.shields.io/badge/VSCodium-%E2%89%A51.74-2F80ED?style=flat-square)](https://vscodium.com)
[![License](https://img.shields.io/badge/license-MIT-4ec9b0?style=flat-square)](./LICENSE)
[![Dependencies](https://img.shields.io/badge/dependencies-0-9c27b0?style=flat-square)](#architecture)
[![Telemetry](https://img.shields.io/badge/telemetry-none-ff6b6b?style=flat-square)](#where-your-data-lives)

**If VStats earns a place in your setup, a ⭐ helps more than you'd think.**
It's what keeps the project alive, visible, and worth maintaining.

<br />

<img src="https://raw.githubusercontent.com/solid-spoon/vstats/main/screenshots/banner.png" alt="VStats" width="100%" />

</div>

---

## Why

Coding is invisible work. You sit down, you type, and hours disappear without a trace. VStats makes that time visible again — and turns it into something you actually look forward to opening.

No accounts. No telemetry. No sign-ups. No upsells. No "AI-powered insights" you never asked for. Just you, your editor, and a single JSON file on your disk.

It's built for people who like their tools small, fast, honest, and quietly enjoyable. If that sounds like you, you're in the right place.

## Preview

### Every language. Every color.

Per-language time, weighted by real usage — colored with the actual VS Code / GitHub Linguist palette. `go` in blue, `python` in steel, `rust` in copper. You know your stack by looking at it.

<div align="center">

<img src="https://raw.githubusercontent.com/solid-spoon/vstats/main/screenshots/languages.png" alt="Language breakdown" width="100%" />

</div>

### From Novice to Godlike.

27 ranks on an exponential curve. Each tier gets its own color aura that glows in the dashboard hero. Every hour of code moves you up the ladder — a little faster between midnight and 5 AM.

<div align="center">

<img src="https://raw.githubusercontent.com/solid-spoon/vstats/main/screenshots/ranks.png" alt="Rank ladder" width="100%" />

</div>

### Your month, wrapped.

A Spotify-Wrapped-style recap for *This Month*, *Last Month*, *This Year*, or *All Time* — with period-over-period comparison, best day, top language, and top project. One click to copy as PNG to your clipboard or save to disk.

<div align="center">

<img src="https://raw.githubusercontent.com/solid-spoon/vstats/main/screenshots/recap.png" alt="Recap card" width="100%" />

</div>

## Features

### Track everything

- **Time** — per file, per language, per project, per day, per hour of day, per weekday
- **Sessions** — automatic session detection, longest session, session history
- **Typing** — keystrokes, chars added/removed, lines added/removed, undo/redo
- **Rates** — APM, CPM, WPM (average + live 60-second window)
- **Editor behavior** — files opened, unique files, language switches, project switches
- **Environment** — terminals opened, debug sessions, tasks run

### Gamify it

- **XP** with a night-hour multiplier (×1.5 between 00:00 and 05:00) — late hours count for more
- **Levels** on an exponential curve
- **27 ranks** from *Novice* to *Godlike*, each with its own color aura
- **10 rarity tiers** from *Common* to *Godlike*
- **15 achievements** with Material Symbols icons
- **Streak tracking** — current and all-time longest

### See it

- **Main dashboard** — hero with rank aura, weekly goal ring, primary stats, mini-stat grid, hour-of-day chart, day-of-week chart, language breakdown with real VS Code colors, project breakdown, file type breakdown, top files, 12-month heatmap, achievement grid, recent sessions
- **Recap modal** — Spotify-Wrapped-style card with *This Month* / *Last Month* / *This Year* / *All Time* views and period-over-period comparison
- **Export recap** — one click to copy as PNG to clipboard or save to disk

### Live

- **Status bar** shows `Lv. X · today Yh Zm · total Yh Zm`, refreshing every 15 seconds
- **Live indicator** in the hero when tracking is active

### Installation

Download the latest `.vsix` file from the [Releases](https://github.com/solid-spoon/vstats/releases) page.

#### In VSCodium / VS Code:
1. Open the Extensions view (`Ctrl+Shift+X`).
2. Click the **`...`** (More Actions) icon in the top right corner.
3. Select **Install from VSIX...** and choose the downloaded file.

Alternatively, install it via your terminal:
```bash
# for vscode
code --install-extension vstats.vsix
# for vscodium
codium --install-extension vstats.vsix
```

Then simply press `Ctrl+Shift+P` → **VStats: Open Dashboard** to level up your code!

## Commands

| Command | What it does |
|---|---|
| `VStats: Open Dashboard` | Open the main dashboard |
| `VStats: Reset Stats` | Wipe all tracked data |
| `VStats: Show Stats File` | Open `stats.json` in the editor |
| `VStats: Export Stats` | Save a backup JSON |
| `VStats: Import Stats` | Load a backup JSON |

## Configuration

| Setting | Default | Description |
|---|---|---|
| `vstats.weeklyGoalHours` | `20` | Weekly coding goal in hours, shown in the hero progress bar |

## Where your data lives

Nothing leaves your machine. Everything is a single JSON file — yours to read, back up, edit, `jq`, or delete:

| Platform | Path |
|---|---|
| Linux | `~/.config/VSCodium/User/globalStorage/local.vstats/stats.json` |
| macOS | `~/Library/Application Support/VSCodium/User/globalStorage/local.vstats/stats.json` |
| Windows | `%APPDATA%\VSCodium\User\globalStorage\local.vstats\stats.json` |

Use **VStats: Show Stats File** to open it directly. It's your data — the extension is just a guest in it.

## How it works

- **Idle protection** — tracking pauses after 5 minutes without activity, resumes on any edit, save, or window focus
- **Session detection** — a session ends after 5 minutes of inactivity
- **XP curve** — `level = floor(sqrt(xp / 100)) + 1`. Level 10 at 8,100 XP, level 50 at 240,100 XP, level 150 at 2,250,000 XP
- **Night multiplier** — code between 00:00 and 05:00 earns ×1.5 XP
- **Paste detection** — a single change over 300 chars counts as a paste, not typed input, and is excluded from rate metrics

## Architecture

No bundler. No TypeScript. No dependencies. Plain JavaScript, plain CSS, plain SVG. On purpose.

```
vstats/
├── extension.js              entry point
├── icon.png                  extension icon
├── src/
│   ├── app.js                orchestrator
│   ├── state.js              state shape + persistence
│   ├── helpers.js            pure utilities
│   ├── achievements.js       unlock conditions
│   ├── statusbar.js          status bar item
│   ├── dashboard.js          webview panel
│   ├── tracking.js           events, tick loop, live rates
│   └── commands.js           command palette
└── media/
    ├── panel.html
    ├── panel.css
    ├── panel.js              webview bootstrap
    ├── icons.js              Material Symbols SVG paths
    ├── helpers.js            formatting + constants
    ├── recap-svg.js          native SVG recap card builder
    ├── render.js             main dashboard renderer
    └── recap.js              recap modal + PNG export
```

The webview loads classic scripts in order — no bundling, no module system. Each file becomes a single global once loaded. It's deliberately boring, deliberately fast, and deliberately easy to fork at any hour of the day.

## Contributing

Issues, ideas, PRs, and thorough nitpicks are all welcome. If you find a bug — open an issue. If you fix a bug — open a PR. If you just want to say hi — open a discussion. Community is the whole point of a project like this.

And if you build something on top of VStats, or simply enjoy having it around: **a star goes a long way.** It's the cheapest way to say "keep going" — and honestly, it works. It helps the project stay discoverable, and it tells me someone out there finds this worth their time. That matters.

## License

MIT — see [LICENSE](LICENSE).