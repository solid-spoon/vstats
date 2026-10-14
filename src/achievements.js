const {
  streakCount,
  levelFromXp,
  isNightHour,
  isEarlyBirdHour,
} = require("./helpers");

const ACHIEVEMENTS = [
  {
    id: "first_blood",
    name: "First Blood",
    desc: "Save a file for the first time",
  },
  {
    id: "marathon",
    name: "Marathon",
    desc: "Code for 30 minutes in one session",
  },
  { id: "night_owl", name: "Night Owl", desc: "Code between 00:00 and 05:00" },
  {
    id: "early_bird",
    name: "Early Bird",
    desc: "Code between 05:00 and 07:00",
  },
  { id: "polyglot", name: "Polyglot", desc: "Use 5+ different languages" },
  { id: "streak_7", name: "On Fire", desc: "7-day coding streak" },
  { id: "streak_30", name: "Unstoppable", desc: "30-day coding streak" },
  { id: "streak_100", name: "Centurion", desc: "100-day coding streak" },
  { id: "ten_hours", name: "Getting Started", desc: "10 hours total" },
  { id: "hundred_hours", name: "Century", desc: "100 hours total" },
  { id: "thousand_hours", name: "Grandmaster", desc: "1000 hours total" },
  { id: "saver", name: "Serial Saver", desc: "1000 saves" },
  { id: "explorer", name: "Explorer", desc: "Open 100 distinct files" },
  { id: "level_10", name: "Double Digits", desc: "Reach level 10" },
  { id: "level_25", name: "Veteran", desc: "Reach level 25" },
];

function unlock(state, id) {
  if (!state.achievements[id]) state.achievements[id] = Date.now();
}

function checkAchievements(state) {
  const langs = Object.keys(state.langs).length;
  const files = Object.keys(state.files).length;
  const st = streakCount(state.days);
  const lvl = levelFromXp(state.xp);
  const hours = state.totalMs / 3600000;

  if (state.saves >= 1) unlock(state, "first_blood");
  if (langs >= 5) unlock(state, "polyglot");
  if (st >= 7) unlock(state, "streak_7");
  if (st >= 30) unlock(state, "streak_30");
  if (st >= 100) unlock(state, "streak_100");
  if (hours >= 10) unlock(state, "ten_hours");
  if (hours >= 100) unlock(state, "hundred_hours");
  if (hours >= 1000) unlock(state, "thousand_hours");
  if (state.saves >= 1000) unlock(state, "saver");
  if (files >= 100) unlock(state, "explorer");
  if (lvl >= 10) unlock(state, "level_10");
  if (lvl >= 25) unlock(state, "level_25");
  if (isNightHour()) unlock(state, "night_owl");
  if (isEarlyBirdHour()) unlock(state, "early_bird");
}

module.exports = { ACHIEVEMENTS, checkAchievements, unlock };
