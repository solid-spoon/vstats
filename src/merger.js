'use strict';

const fs = require('fs');

// ---------------------------------------------------------------------------
// Path normalisation for cross-machine merge.
//
// NOTE: this lowercases the path. That's fine on Windows/macOS, but on a
// case-sensitive Linux FS two files that differ only by case will be folded
// into one. Acceptable trade-off for "merge my laptop with my desktop", but
// worth knowing.
// ---------------------------------------------------------------------------
function cleanPath(p) {
  if (!p) return p;
  let clean = p.replace(/\\/g, '/').toLowerCase();

  const match = clean.match(/\/proj\/([^/]+\/.*)/);
  if (match) return match[1];

  const parts = clean.split('/');
  return parts.slice(-3).join('/');
}

function mergePathDict(d1, d2) {
  const out = {};
  const mapping = {};

  for (const [k, v] of Object.entries(d1 || {})) {
    const cleanKey = cleanPath(k);
    mapping[cleanKey] = k;
    out[k] = (out[k] || 0) + v;
  }

  for (const [k, v] of Object.entries(d2 || {})) {
    const cleanKey = cleanPath(k);
    const targetKey = mapping[cleanKey] || k;
    out[targetKey] = (out[targetKey] || 0) + v;
  }

  return out;
}

function mergePathTimestamps(t1, t2) {
  const out = {};
  const mapping = {};

  for (const [k, v] of Object.entries(t1 || {})) {
    const cleanKey = cleanPath(k);
    mapping[cleanKey] = k;
    if (!out[k] || v < out[k]) out[k] = v;
  }

  for (const [k, v] of Object.entries(t2 || {})) {
    const cleanKey = cleanPath(k);
    const targetKey = mapping[cleanKey] || k;
    if (!out[targetKey] || v < out[targetKey]) out[targetKey] = v;
  }
  return out;
}

function mergeDict(d1, d2) {
  const out = { ...(d1 || {}) };
  for (const k in d2 || {}) out[k] = (out[k] || 0) + d2[k];
  return out;
}

function mergeProjects(p1, p2) {
  const out = {};
  const mapping = {};

  for (const [k, v] of Object.entries(p1 || {})) {
    const cleanKey = k.toLowerCase();
    mapping[cleanKey] = k;
    out[k] = (out[k] || 0) + v;
  }

  for (const [k, v] of Object.entries(p2 || {})) {
    const cleanKey = k.toLowerCase();
    const targetKey = mapping[cleanKey] || k;
    out[targetKey] = (out[targetKey] || 0) + v;
  }
  return out;
}

function mergePeriods(p1, p2) {
  const out = JSON.parse(JSON.stringify(p1 || {}));
  for (const key in p2 || {}) {
    if (!out[key]) {
      out[key] = p2[key];
    } else {
      out[key].ms += p2[key].ms || 0;
      out[key].saves += p2[key].saves || 0;
      out[key].keystrokes += p2[key].keystrokes || 0;
      out[key].charsAdded += p2[key].charsAdded || 0;
      out[key].charsRemoved += p2[key].charsRemoved || 0;

      out[key].langs = mergeDict(out[key].langs, p2[key].langs);
      out[key].projects = mergeProjects(out[key].projects, p2[key].projects);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Core merge: a + b -> new state. Pure, no side effects.
// ---------------------------------------------------------------------------
function mergeStats(a, b) {
  a = a || {};
  b = b || {};
  const out = JSON.parse(JSON.stringify(a));

  out.xp = (a.xp || 0) + (b.xp || 0);
  out.totalMs = (a.totalMs || 0) + (b.totalMs || 0);
  out.saves = (a.saves || 0) + (b.saves || 0);
  out.firstRun = Math.min(a.firstRun || Date.now(), b.firstRun || Date.now());

  out.files = mergePathDict(a.files, b.files);
  out.fileSaves = mergePathDict(a.fileSaves, b.fileSaves);
  out.uniqueFilesOpened = mergePathTimestamps(
    a.uniqueFilesOpened,
    b.uniqueFilesOpened,
  );

  out.langs = mergeDict(a.langs, b.langs);
  out.projects = mergeProjects(a.projects, b.projects);
  out.extensions = mergeDict(a.extensions, b.extensions);
  out.days = mergeDict(a.days, b.days);

  out.achievements = { ...(a.achievements || {}) };
  for (const [k, v] of Object.entries(b.achievements || {})) {
    if (!out.achievements[k] || v < out.achievements[k]) {
      out.achievements[k] = v;
    }
  }

  if (a.hours && b.hours) {
    out.hours = a.hours.map((v, i) => v + (b.hours[i] || 0));
  }
  if (a.weekdays && b.weekdays) {
    out.weekdays = a.weekdays.map((v, i) => v + (b.weekdays[i] || 0));
  }

  const allSessions = [...(a.sessions || []), ...(b.sessions || [])];
  out.sessions = Array.from(
    new Map(allSessions.map((s) => [s.start, s])).values(),
  ).sort((x, y) => x.start - y.start);

  // Keep the longer of the two current sessions instead of dropping both.
  const aCur = a.currentSession;
  const bCur = b.currentSession;
  if (aCur && bCur) {
    out.currentSession = aCur.ms >= bCur.ms ? aCur : bCur;
  } else {
    out.currentSession = aCur || bCur || null;
  }

  out.longestSessionMs = Math.max(
    a.longestSessionMs || 0,
    b.longestSessionMs || 0,
  );

  for (const k of [
    'keystrokes',
    'charsAdded',
    'charsRemoved',
    'linesAdded',
    'linesRemoved',
    'undos',
    'redos',
    'typingMs',
    'pasteCount',
    'pastedChars',
    'filesOpened',
    'languageSwitches',
    'projectSwitches',
    'terminalsOpened',
    'debugSessions',
    'tasksRun',
    'pomodoroCount',
  ]) {
    out[k] = (a[k] || 0) + (b[k] || 0);
  }

  out.months = mergePeriods(a.months, b.months);
  out.years = mergePeriods(a.years, b.years);

  return out;
}

module.exports = {
  mergeStats,
  cleanPath,
  mergePathDict,
  mergePathTimestamps,
  mergeDict,
  mergeProjects,
  mergePeriods,
};

// ---------------------------------------------------------------------------
// CLI entry point — only fires when run directly:
//   node merger.js <stats1.json> <stats2.json> [output.json]
// ---------------------------------------------------------------------------
if (require.main === module) {
  const SRC1 = process.argv[2];
  const SRC2 = process.argv[3];
  const DEST = process.argv[4] || 'merged.json';

  if (!SRC1 || !SRC2) {
    console.error(
      'Usage: node merger.js <stats1.json> <stats2.json> [output.json]',
    );
    process.exit(1);
  }

  try {
    const s1 = JSON.parse(fs.readFileSync(SRC1, 'utf8'));
    const s2 = JSON.parse(fs.readFileSync(SRC2, 'utf8'));
    const merged = mergeStats(s1, s2);
    fs.writeFileSync(DEST, JSON.stringify(merged, null, 2));
    console.log(`✅ Merged successfully to ${DEST}`);
    console.log(
      `   Time: ${(merged.totalMs / 3600000).toFixed(1)}h · XP: ${Math.floor(merged.xp)}`,
    );
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}