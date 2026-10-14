const fs = require("fs");
const path = require("path");

const state = {};
let filePath = "";

function defaultState() {
  return {
    xp: 0,
    totalMs: 0,
    saves: 0,
    firstRun: Date.now(),
    files: {},
    fileSaves: {},
    langs: {},
    projects: {},
    extensions: {},
    days: {},
    hours: new Array(24).fill(0),
    weekdays: new Array(7).fill(0),
    sessions: [],
    currentSession: null,
    longestSessionMs: 0,
    keystrokes: 0,
    charsAdded: 0,
    charsRemoved: 0,
    linesAdded: 0,
    linesRemoved: 0,
    undos: 0,
    redos: 0,
    typingMs: 0,
    pasteCount: 0,
    pastedChars: 0,
    filesOpened: 0,
    uniqueFilesOpened: {},
    languageSwitches: 0,
    projectSwitches: 0,
    terminalsOpened: 0,
    debugSessions: 0,
    tasksRun: 0,
    pomodoroCount: 0,
    achievements: {},
    months: {},
    years: {},
  };
}

function normalizeState(m) {
  const def = defaultState();
  if (!Array.isArray(m.hours) || m.hours.length !== 24) m.hours = def.hours;
  if (!Array.isArray(m.weekdays) || m.weekdays.length !== 7)
    m.weekdays = def.weekdays;
  if (typeof m.uniqueFilesOpened !== "object" || !m.uniqueFilesOpened)
    m.uniqueFilesOpened = {};
  if (typeof m.typingMs !== "number" || !isFinite(m.typingMs)) m.typingMs = 0;
  if (typeof m.pasteCount !== "number" || !isFinite(m.pasteCount))
    m.pasteCount = 0;
  if (typeof m.pastedChars !== "number" || !isFinite(m.pastedChars))
    m.pastedChars = 0;
  if (typeof m.months !== "object" || !m.months) m.months = {};
  if (typeof m.years !== "object" || !m.years) m.years = {};
  return m;
}

function replace(newState) {
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, newState);
}

function init(context) {
  filePath = path.join(context.globalStorageUri.fsPath, "stats.json");
  if (!fs.existsSync(filePath)) {
    replace(defaultState());
    console.log("[vstats] no stats file yet, starting fresh");
    return;
  }
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (e) {
    console.error("[vstats] cannot read stats file:", e);
    replace(defaultState());
    return;
  }
  try {
    replace(normalizeState(Object.assign(defaultState(), JSON.parse(raw))));
    console.log(
      "[vstats] loaded: xp=" +
        Math.floor(state.xp) +
        " totalMs=" +
        state.totalMs +
        " saves=" +
        state.saves +
        " files=" +
        Object.keys(state.files).length +
        " months=" +
        Object.keys(state.months).length,
    );
  } catch (e) {
    console.error("[vstats] corrupt, backing up and resetting:", e);
    try {
      fs.renameSync(filePath, filePath + ".corrupt-" + Date.now());
    } catch (_) {}
    replace(defaultState());
  }
}

function save() {
  if (!filePath) return;
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error("[vstats] save failed:", e);
  }
}

function reset() {
  replace(defaultState());
}

module.exports = {
  state,
  init,
  save,
  reset,
  defaultState,
  normalizeState,
  replace,
};
