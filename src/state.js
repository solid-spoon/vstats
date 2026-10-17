const fs = require("fs");
const path = require("path");

const state = {};
let filePath = "";

// ---------------------------------------------------------------------------
// Validation helpers. Keep them tiny and pure — they run on load and on every
// import/merge, so cost matters.
// ---------------------------------------------------------------------------

function num(v, fallback) {
  return typeof v === "number" && isFinite(v) ? v : fallback;
}

// Object whose values are all finite numbers. Paths, langs, projects,
// extension counts, day totals, achievement unlock timestamps — all fit here.
function numDict(v) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === "number" && isFinite(val)) out[k] = val;
  }
  return out;
}

function fixedNumArr(v, len) {
  const out = new Array(len).fill(0);
  if (!Array.isArray(v)) return out;
  const n = Math.min(len, v.length);
  for (let i = 0; i < n; i++) out[i] = num(v[i], 0);
  return out;
}

function period(v) {
  if (!v || typeof v !== "object") {
    return {
      ms: 0,
      saves: 0,
      keystrokes: 0,
      charsAdded: 0,
      charsRemoved: 0,
      langs: {},
      projects: {},
    };
  }
  return {
    ms: num(v.ms, 0),
    saves: num(v.saves, 0),
    keystrokes: num(v.keystrokes, 0),
    charsAdded: num(v.charsAdded, 0),
    charsRemoved: num(v.charsRemoved, 0),
    langs: numDict(v.langs),
    projects: numDict(v.projects),
  };
}

function periodsDict(v) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out = {};
  for (const [k, val] of Object.entries(v)) out[k] = period(val);
  return out;
}

function session(v) {
  if (!v || typeof v !== "object") return null;
  const start = num(v.start, 0);
  const end = num(v.end, 0);
  const ms = num(v.ms, 0);
  if (!start || !end || ms <= 0) return null;
  return { start, end, ms };
}

function sessionsArr(v) {
  if (!Array.isArray(v)) return [];
  return v.map(session).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Default state — the canonical shape. normalizeState() produces this shape.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// normalizeState — coerce any object into a valid state shape.
// Mutates and returns `m`. Safe to call with null/undefined.
// ---------------------------------------------------------------------------

function normalizeState(m) {
  if (!m || typeof m !== "object" || Array.isArray(m)) return defaultState();

  const def = defaultState();

  // Scalars
  m.xp = num(m.xp, 0);
  m.totalMs = num(m.totalMs, 0);
  m.saves = num(m.saves, 0);
  m.firstRun = num(m.firstRun, def.firstRun);

  // Per-entity time dictionaries
  m.files = numDict(m.files);
  m.fileSaves = numDict(m.fileSaves);
  m.langs = numDict(m.langs);
  m.projects = numDict(m.projects);
  m.extensions = numDict(m.extensions);
  m.days = numDict(m.days);

  // Fixed-length histograms
  m.hours = fixedNumArr(m.hours, 24);
  m.weekdays = fixedNumArr(m.weekdays, 7);

  // Path -> firstSeen timestamp
  m.uniqueFilesOpened = numDict(m.uniqueFilesOpened);

  // Sessions
  m.sessions = sessionsArr(m.sessions);
  m.currentSession = session(m.currentSession);
  m.longestSessionMs = num(m.longestSessionMs, 0);

  // Scalar counters
  m.keystrokes = num(m.keystrokes, 0);
  m.charsAdded = num(m.charsAdded, 0);
  m.charsRemoved = num(m.charsRemoved, 0);
  m.linesAdded = num(m.linesAdded, 0);
  m.linesRemoved = num(m.linesRemoved, 0);
  m.undos = num(m.undos, 0);
  m.redos = num(m.redos, 0);
  m.typingMs = num(m.typingMs, 0);
  m.pasteCount = num(m.pasteCount, 0);
  m.pastedChars = num(m.pastedChars, 0);
  m.filesOpened = num(m.filesOpened, 0);
  m.languageSwitches = num(m.languageSwitches, 0);
  m.projectSwitches = num(m.projectSwitches, 0);
  m.terminalsOpened = num(m.terminalsOpened, 0);
  m.debugSessions = num(m.debugSessions, 0);
  m.tasksRun = num(m.tasksRun, 0);
  m.pomodoroCount = num(m.pomodoroCount, 0);

  // Achievement id -> unlock timestamp
  m.achievements = numDict(m.achievements);

  // Period rollups
  m.months = periodsDict(m.months);
  m.years = periodsDict(m.years);

  return m;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

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
    const parsed = JSON.parse(raw);
    // Object.assign into a fresh default so missing keys fall back cleanly,
    // then normalize the whole thing. normalizeState is responsible for
    // fixing both missing keys and keys of the wrong type.
    replace(normalizeState(Object.assign(defaultState(), parsed)));
    console.log(
      "[vstats] loaded: xp=" +
        Math.floor(state.xp) +
        " totalMs=" +
        state.totalMs +
        " saves=" +
        state.saves +
        " files=" +
        Object.keys(state.files).length +
        " sessions=" +
        state.sessions.length +
        " months=" +
        Object.keys(state.months).length,
    );
  } catch (e) {
    console.error("[vstats] corrupt, backing up and resetting:", e);
    try {
      fs.renameSync(filePath, filePath + ".corrupt-" + Date.now());
    } catch (_) {
      /* ignore */
    }
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