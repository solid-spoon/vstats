const vscode = require("vscode");
const { state } = require("./state");
const { todayKey, levelFromXp, fmtMsShort } = require("./helpers");

let bar = null;

function create(context) {
  bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  bar.command = "vstats.openDashboard";
  bar.tooltip = "VStats — click to open dashboard";
  bar.show();
  context.subscriptions.push(bar);
  update();
}

function update() {
  if (!bar) return;
  const todayMs = state.days[todayKey()] || 0;
  const today = fmtMsShort(todayMs);
  const total = fmtMsShort(state.totalMs);
  const lvl = levelFromXp(state.xp);
  bar.text = `$(rocket) Lv.${lvl} · ${today} today · ${total} total`;
  bar.tooltip =
    `VStats\nToday: ${today}\nTotal: ${total}\n` +
    `Level ${lvl} · ${Math.floor(state.xp)} XP\nClick to open dashboard`;
}

module.exports = { create, update };
