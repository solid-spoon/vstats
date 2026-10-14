const vscode = require("vscode");

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function currentMonthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}
function currentYearKey(d = new Date()) {
  return d.toISOString().slice(0, 4);
}

function isNightHour(d = new Date()) {
  const h = d.getHours();
  return h >= 0 && h < 5;
}
function isEarlyBirdHour(d = new Date()) {
  const h = d.getHours();
  return h >= 5 && h < 7;
}

function projectNameFromUri(uri) {
  if (!uri) return null;
  const folder = vscode.workspace.getWorkspaceFolder(uri);
  if (folder) return folder.name;
  const ws = vscode.workspace.workspaceFolders;
  if (ws && ws.length === 1) return ws[0].name;
  return null;
}

function extFromPath(p) {
  if (!p) return null;
  const base = p.split(/[/\\]/).pop() || "";
  const idx = base.lastIndexOf(".");
  if (idx <= 0) return null;
  return base.slice(idx).toLowerCase();
}

function levelFromXp(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function streakCount(days) {
  const keys = Object.keys(days || {})
    .filter((k) => days[k] > 60000)
    .sort();
  if (!keys.length) return 0;
  let count = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!keys.includes(todayKey())) cursor.setDate(cursor.getDate() - 1);
  while (true) {
    const k = cursor.toISOString().slice(0, 10);
    if (keys.includes(k)) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return count;
}

function fmtMsShort(ms) {
  if (!ms) return "0m";
  if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

module.exports = {
  todayKey,
  currentMonthKey,
  currentYearKey,
  isNightHour,
  isEarlyBirdHour,
  projectNameFromUri,
  extFromPath,
  levelFromXp,
  streakCount,
  fmtMsShort,
};
