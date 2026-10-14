const vscode = require("vscode");
const { state, save } = require("./state");
const { checkAchievements } = require("./achievements");
const statusBar = require("./statusbar");
const dashboard = require("./dashboard");
const {
  todayKey,
  currentMonthKey,
  currentYearKey,
  isNightHour,
  projectNameFromUri,
  extFromPath,
} = require("./helpers");

const TICK_MS = 15000;
const IDLE_MS = 5 * 60 * 1000;
const SESSION_GAP_MS = 5 * 60 * 1000;
const POMODORO_MS = 25 * 60 * 1000;
const TYPING_GAP_MS = 5000;
const LIVE_WINDOW_MS = 60000;

let currentFile = null;
let currentLang = null;
let currentProject = null;
let lastTick = Date.now();
let lastActivity = Date.now();
let lastKeyTs = 0;
let timer = null;

let liveKeyTs = [];
let liveChars = [];

function emptyPeriod() {
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

function ensureMonth(key) {
  if (!state.months[key]) state.months[key] = emptyPeriod();
  return state.months[key];
}
function ensureYear(key) {
  if (!state.years[key]) state.years[key] = emptyPeriod();
  return state.years[key];
}

function computeLiveRates() {
  const now = Date.now();
  const cutoff = now - LIVE_WINDOW_MS;
  const keys = liveKeyTs.length;
  let chars = 0;
  for (const x of liveChars) chars += x.n;
  return {
    window: LIVE_WINDOW_MS / 1000,
    apm: keys,
    cpm: chars,
    wpm: chars / 5,
  };
}

function tick() {
  const now = Date.now();
  const dt = now - lastTick;
  lastTick = now;

  if (!currentFile) return;
  if (now - lastActivity > IDLE_MS) return;

  const d = new Date();
  const month = ensureMonth(currentMonthKey(d));
  const year = ensureYear(currentYearKey(d));

  state.totalMs += dt;
  state.files[currentFile] = (state.files[currentFile] || 0) + dt;
  if (currentLang)
    state.langs[currentLang] = (state.langs[currentLang] || 0) + dt;
  if (currentProject)
    state.projects[currentProject] = (state.projects[currentProject] || 0) + dt;

  const ext = extFromPath(currentFile);
  if (ext) state.extensions[ext] = (state.extensions[ext] || 0) + dt;

  state.days[todayKey()] = (state.days[todayKey()] || 0) + dt;
  state.hours[d.getHours()] += dt;
  state.weekdays[d.getDay()] += dt;

  month.ms += dt;
  year.ms += dt;
  if (currentLang) {
    month.langs[currentLang] = (month.langs[currentLang] || 0) + dt;
    year.langs[currentLang] = (year.langs[currentLang] || 0) + dt;
  }
  if (currentProject) {
    month.projects[currentProject] = (month.projects[currentProject] || 0) + dt;
    year.projects[currentProject] = (year.projects[currentProject] || 0) + dt;
  }

  state.xp += (dt / 60000) * (isNightHour(d) ? 1.5 : 1);

  if (!state.currentSession) {
    state.currentSession = { start: now, end: now, ms: 0 };
  } else if (now - state.currentSession.end > SESSION_GAP_MS) {
    if (state.currentSession.ms > state.longestSessionMs)
      state.longestSessionMs = state.currentSession.ms;
    state.sessions.push(state.currentSession);
    state.currentSession = { start: now, end: now, ms: 0 };
  }

  const prevPom = Math.floor(state.currentSession.ms / POMODORO_MS);
  state.currentSession.end = now;
  state.currentSession.ms += dt;
  const newPom = Math.floor(state.currentSession.ms / POMODORO_MS);
  if (newPom > prevPom) state.pomodoroCount += newPom - prevPom;

  if (state.currentSession.ms > state.longestSessionMs)
    state.longestSessionMs = state.currentSession.ms;

  checkAchievements(state);
  statusBar.update();
  dashboard.post();
}

function markActivity() {
  lastActivity = Date.now();
}

function onSave() {
  state.saves += 1;
  state.xp += 2;
  if (currentFile)
    state.fileSaves[currentFile] = (state.fileSaves[currentFile] || 0) + 1;
  const d = new Date();
  ensureMonth(currentMonthKey(d)).saves += 1;
  ensureYear(currentYearKey(d)).saves += 1;
  checkAchievements(state);
  statusBar.update();
}

function onChangeText(e) {
  markActivity();
  const now = Date.now();

  if (lastKeyTs > 0 && now - lastKeyTs < TYPING_GAP_MS)
    state.typingMs += now - lastKeyTs;
  lastKeyTs = now;

  state.keystrokes += 1;
  liveKeyTs.push(now);

  const d = new Date();
  const month = ensureMonth(currentMonthKey(d));
  const year = ensureYear(currentYearKey(d));
  month.keystrokes += 1;
  year.keystrokes += 1;

  if (e.reason === vscode.TextDocumentChangeReason.Undo) state.undos += 1;
  else if (e.reason === vscode.TextDocumentChangeReason.Redo) state.redos += 1;

  let added = 0;
  for (const c of e.contentChanges) {
    const rm = c.range.end.line - c.range.start.line;
    if (c.rangeLength > 0) {
      state.charsRemoved += c.rangeLength;
      month.charsRemoved += c.rangeLength;
      year.charsRemoved += c.rangeLength;
      if (rm > 0) state.linesRemoved += rm;
    }
    if (c.text && c.text.length > 0) {
      if (c.text.length > 300) {
        state.pasteCount += 1;
        state.pastedChars += c.text.length;
      } else {
        added += c.text.length;
        state.charsAdded += c.text.length;
        month.charsAdded += c.text.length;
        year.charsAdded += c.text.length;
      }
      const nl = (c.text.match(/\n/g) || []).length;
      if (nl > 0) state.linesAdded += nl;
    }
  }
  if (added > 0) liveChars.push({ ts: now, n: added });

  const cutoff = now - LIVE_WINDOW_MS;
  while (liveKeyTs.length && liveKeyTs[0] < cutoff) liveKeyTs.shift();
  while (liveChars.length && liveChars[0].ts < cutoff) liveChars.shift();
}

function onActiveEditor(e) {
  if (e) {
    const prevLang = currentLang;
    const prevProject = currentProject;
    currentFile = e.document.uri.fsPath;
    currentLang = e.document.languageId;
    currentProject = projectNameFromUri(e.document.uri);
    if (prevLang && currentLang && prevLang !== currentLang)
      state.languageSwitches += 1;
    if (prevProject !== currentProject) state.projectSwitches += 1;
  }
  markActivity();
}

function onOpenDoc(doc) {
  if (doc.uri.scheme !== "file") return;
  const p = doc.uri.fsPath;
  state.filesOpened += 1;
  if (!state.uniqueFilesOpened[p]) state.uniqueFilesOpened[p] = Date.now();
}

function wire(context) {
  const ed = vscode.window.activeTextEditor;
  if (ed) {
    currentFile = ed.document.uri.fsPath;
    currentLang = ed.document.languageId;
    currentProject = projectNameFromUri(ed.document.uri);
  }

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(onActiveEditor),
    vscode.workspace.onDidOpenTextDocument(onOpenDoc),
    vscode.workspace.onDidChangeTextDocument(onChangeText),
    vscode.workspace.onDidSaveTextDocument(() => {
      markActivity();
      onSave();
    }),
    vscode.window.onDidChangeWindowState((s) => {
      if (s.focused) {
        markActivity();
        statusBar.update();
      }
    }),
    vscode.window.onDidOpenTerminal(() => {
      state.terminalsOpened += 1;
    }),
    vscode.debug.onDidStartDebugSession(() => {
      state.debugSessions += 1;
    }),
    vscode.tasks.onDidStartTask(() => {
      state.tasksRun += 1;
    }),
  );
}

function startTimer() {
  timer = setInterval(() => {
    tick();
    save();
  }, TICK_MS);
}

function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
}

function finalizeSession() {
  if (
    state.currentSession &&
    state.currentSession.ms > state.longestSessionMs
  ) {
    state.longestSessionMs = state.currentSession.ms;
  }
}

module.exports = {
  wire,
  startTimer,
  stopTimer,
  finalizeSession,
  computeLiveRates,
};
