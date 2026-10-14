function fmtMs(ms) {
  if (!ms) return "0s";
  if (ms < 60000) return Math.floor(ms / 1000) + "s";
  var h = Math.floor(ms / 3600000);
  var m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? h + "h " + m + "m" : m + "m";
}

function fmtHm(ms) {
  var h = Math.floor(ms / 3600000);
  var m = Math.floor((ms % 3600000) / 60000);
  if (h === 0 && m === 0 && ms > 0) return "<1m";
  return h > 0 ? h + "h " + m + "m" : m + "m";
}

function fmtXP(xp) {
  return Math.floor(xp || 0).toLocaleString();
}

function fmtRate(v) {
  if (v == null || !isFinite(v) || v < 0.5) return "—";
  if (v >= 1000) return "999+";
  return Math.round(v).toString();
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c];
  });
}

function topEntries(o, n) {
  return Object.entries(o || {})
    .sort(function (a, b) {
      return b[1] - a[1];
    })
    .slice(0, n);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function pad(n) {
  return n < 10 ? "0" + n : String(n);
}

function hexToRgb(hex) {
  var h = hex.replace("#", "");
  return (
    parseInt(h.substr(0, 2), 16) +
    ", " +
    parseInt(h.substr(2, 2), 16) +
    ", " +
    parseInt(h.substr(4, 2), 16)
  );
}

function levelInfo(xp) {
  var level = Math.floor(Math.sqrt(xp / 100)) + 1;
  var cur = 100 * Math.pow(level - 1, 2);
  var next = 100 * Math.pow(level, 2);
  var progress = next === cur ? 0 : (xp - cur) / (next - cur);
  return {
    level: level,
    cur: cur,
    next: next,
    progress: Math.max(0, Math.min(1, progress)),
  };
}

var RANKS = [
  { lvl: 1, name: "Novice", color: "#8b8b8b", rarity: "Common" },
  { lvl: 3, name: "Apprentice", color: "#8b8b8b", rarity: "Common" },
  { lvl: 5, name: "Hobbyist", color: "#4caf50", rarity: "Common" },
  { lvl: 7, name: "Coder", color: "#4caf50", rarity: "Uncommon" },
  { lvl: 9, name: "Developer", color: "#2196f3", rarity: "Uncommon" },
  { lvl: 12, name: "Engineer", color: "#2196f3", rarity: "Uncommon" },
  { lvl: 15, name: "Architect", color: "#9c27b0", rarity: "Rare" },
  { lvl: 18, name: "Senior", color: "#9c27b0", rarity: "Rare" },
  { lvl: 22, name: "Tech Lead", color: "#e91e63", rarity: "Rare" },
  { lvl: 26, name: "Principal", color: "#e91e63", rarity: "Epic" },
  { lvl: 30, name: "Staff Engineer", color: "#f44336", rarity: "Epic" },
  { lvl: 35, name: "Archmage", color: "#f44336", rarity: "Epic" },
  { lvl: 40, name: "Wizard", color: "#ff9800", rarity: "Legendary" },
  { lvl: 45, name: "Sage", color: "#ff9800", rarity: "Legendary" },
  { lvl: 50, name: "Oracle", color: "#ffc107", rarity: "Legendary" },
  { lvl: 55, name: "Legend", color: "#ffc107", rarity: "Mythic" },
  { lvl: 60, name: "Mythic", color: "#00bcd4", rarity: "Mythic" },
  { lvl: 65, name: "Ascendant", color: "#00bcd4", rarity: "Mythic" },
  { lvl: 70, name: "Transcendent", color: "#7c4dff", rarity: "Celestial" },
  { lvl: 75, name: "Celestial", color: "#7c4dff", rarity: "Celestial" },
  { lvl: 80, name: "Cosmic", color: "#00e5ff", rarity: "Cosmic" },
  { lvl: 85, name: "Ethereal", color: "#00e5ff", rarity: "Cosmic" },
  { lvl: 90, name: "Voidwalker", color: "#b388ff", rarity: "Void" },
  { lvl: 100, name: "Quantum", color: "#ff4081", rarity: "Void" },
  { lvl: 110, name: "Reality Bender", color: "#ffea00", rarity: "Godlike" },
  { lvl: 120, name: "Omnipotent", color: "#ffffff", rarity: "Godlike" },
  { lvl: 150, name: "Godlike", color: "#ffffff", rarity: "Godlike" },
];

var RARITY_COLORS = {
  Common: "#9e9e9e",
  Uncommon: "#4caf50",
  Rare: "#2196f3",
  Epic: "#9c27b0",
  Legendary: "#ff9800",
  Mythic: "#ff5252",
  Celestial: "#7c4dff",
  Cosmic: "#00e5ff",
  Void: "#b388ff",
  Godlike: "#ffea00",
};

var LANG_COLORS = {
  go: "#00ADD8",
  golang: "#00ADD8",
  java: "#b07219",
  python: "#3572A5",
  typescript: "#3178c6",
  javascript: "#f1e05a",
  jsx: "#61dafb",
  tsx: "#3178c6",
  cpp: "#f34b7d",
  c: "#555555",
  csharp: "#178600",
  rust: "#dea584",
  ruby: "#701516",
  php: "#4F5D95",
  swift: "#F05138",
  kotlin: "#A97BFF",
  html: "#e34c26",
  css: "#563d7c",
  scss: "#c6538c",
  json: "#cbcb41",
  yaml: "#cb171e",
  toml: "#9c4221",
  markdown: "#083fa1",
  sql: "#e38c00",
  bash: "#89e051",
  shell: "#89e051",
  sh: "#89e051",
  zsh: "#89e051",
  protobuf: "#808080",
  starlark: "#76d275",
  lua: "#000080",
  perl: "#0298c3",
  r: "#198CE7",
  scala: "#c22d40",
  dart: "#00B4AB",
  elixir: "#6e4a7e",
  erlang: "#B83998",
  haskell: "#5e5086",
  clojure: "#db5855",
  nix: "#7e7eff",
  vue: "#41b883",
  svelte: "#ff3e00",
  zig: "#ec915c",
};
function langColor(id) {
  return LANG_COLORS[(id || "").toLowerCase()] || "#8b8b8b";
}

function rankInfo(level) {
  var r = RANKS[0];
  for (var i = 0; i < RANKS.length; i++)
    if (level >= RANKS[i].lvl) r = RANKS[i];
  return r;
}
function nextRank(level) {
  for (var i = 0; i < RANKS.length; i++)
    if (RANKS[i].lvl > level) return RANKS[i];
  return null;
}

function streak(days) {
  var keys = Object.keys(days || {})
    .filter(function (k) {
      return days[k] > 60000;
    })
    .sort();
  if (!keys.length) return 0;
  var count = 0;
  var cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (keys.indexOf(todayKey()) === -1) cursor.setDate(cursor.getDate() - 1);
  while (true) {
    var k = cursor.toISOString().slice(0, 10);
    if (keys.indexOf(k) !== -1) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return count;
}

function longestStreak(days) {
  var keys = Object.keys(days || {})
    .filter(function (k) {
      return days[k] > 60000;
    })
    .sort();
  if (!keys.length) return 0;
  var best = 1,
    cur = 1;
  for (var i = 1; i < keys.length; i++) {
    var diff = (new Date(keys[i]) - new Date(keys[i - 1])) / 86400000;
    if (Math.round(diff) === 1) {
      cur++;
      if (cur > best) best = cur;
    } else cur = 1;
  }
  return best;
}

function weekTotal(days) {
  var total = 0;
  for (var i = 0; i < 7; i++) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    total += days[d.toISOString().slice(0, 10)] || 0;
  }
  return total;
}

function last7Days(days) {
  var out = [];
  for (var i = 6; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var k = d.toISOString().slice(0, 10);
    out.push({
      key: k,
      ms: days[k] || 0,
      label: d.toLocaleDateString("en", { weekday: "short" }),
      isToday: i === 0,
    });
  }
  return out;
}

function weekdaySeries(weekdays) {
  var order = [1, 2, 3, 4, 5, 6, 0];
  var labels = {
    0: "Sun",
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
  };
  var todayDow = new Date().getDay();
  return order.map(function (d) {
    return {
      dow: d,
      ms: weekdays[d] || 0,
      label: labels[d],
      isToday: d === todayDow,
    };
  });
}

var ACHIEVEMENTS = [
  {
    id: "first_blood",
    name: "First Blood",
    desc: "Save a file for the first time",
    icon: "favorite",
  },
  {
    id: "marathon",
    name: "Marathon",
    desc: "Code for 30 minutes in one session",
    icon: "run",
  },
  {
    id: "night_owl",
    name: "Night Owl",
    desc: "Code between 00:00 and 05:00",
    icon: "dark_mode",
  },
  {
    id: "early_bird",
    name: "Early Bird",
    desc: "Code between 05:00 and 07:00",
    icon: "sunny",
  },
  {
    id: "polyglot",
    name: "Polyglot",
    desc: "Use 5+ different languages",
    icon: "translate",
  },
  {
    id: "streak_7",
    name: "On Fire",
    desc: "7-day coding streak",
    icon: "fire",
  },
  {
    id: "streak_30",
    name: "Unstoppable",
    desc: "30-day coding streak",
    icon: "bolt",
  },
  {
    id: "streak_100",
    name: "Centurion",
    desc: "100-day coding streak",
    icon: "diamond",
  },
  {
    id: "ten_hours",
    name: "Getting Started",
    desc: "10 hours total",
    icon: "eco",
  },
  {
    id: "hundred_hours",
    name: "Century",
    desc: "100 hours total",
    icon: "park",
  },
  {
    id: "thousand_hours",
    name: "Grandmaster",
    desc: "1000 hours total",
    icon: "landscape",
  },
  { id: "saver", name: "Serial Saver", desc: "1000 saves", icon: "save" },
  {
    id: "explorer",
    name: "Explorer",
    desc: "Open 100 distinct files",
    icon: "explore",
  },
  {
    id: "level_10",
    name: "Double Digits",
    desc: "Reach level 10",
    icon: "military",
  },
  { id: "level_25", name: "Veteran", desc: "Reach level 25", icon: "trophy" },
];

var STAT_ICONS = {
  total: "schedule",
  today: "today",
  week: "date_range",
  saves: "save",
  files: "description",
  languages: "code",
};

var WEEKLY_GOAL_HOURS = 20;
