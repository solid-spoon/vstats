var hasRendered = false;

function avgRates(s) {
  var typingMin = (s.typingMs || 0) / 60000;
  if (typingMin < 0.5) return { apm: null, cpm: null, wpm: null };
  return {
    apm: s.keystrokes / typingMin,
    cpm: s.charsAdded / typingMin,
    wpm: s.charsAdded / 5 / typingMin,
  };
}

function render(s) {
  if (!s) return;
  var lvl = levelInfo(s.xp);
  var rank = rankInfo(lvl.level);
  var next = nextRank(lvl.level);
  var st = streak(s.days);
  var achCount = Object.keys(s.achievements || {}).length;
  var root = document.getElementById("root");

  var lastEnd = s.currentSession ? s.currentSession.end : 0;
  var isLive = Date.now() - lastEnd < 120000;

  var rarityColor = RARITY_COLORS[rank.rarity] || rank.color;
  var levelsToNext = next ? next.lvl - lvl.level : 0;

  var weekMs = weekTotal(s.days);
  var goalMs = WEEKLY_GOAL_HOURS * 3600000;
  var goalPct = Math.min(100, (weekMs / goalMs) * 100);
  var goalDone = weekMs >= goalMs;

  var activeDays = Object.keys(s.days || {}).filter(function (k) {
    return s.days[k] > 60000;
  }).length;
  var longest = longestStreak(s.days);

  var avg = avgRates(s);
  var live = (typeof liveRates !== "undefined" && liveRates) || {
    apm: 0,
    cpm: 0,
    wpm: 0,
  };

  root.innerHTML =
    '<header class="hero" style="--rank-color:' +
    rank.color +
    ";--rank-rgb:" +
    hexToRgb(rank.color) +
    '">' +
    '<div class="hero-left">' +
    '<div class="rank-line">' +
    '<span class="rank">' +
    esc(rank.name) +
    "</span>" +
    '<span class="rank-chip" style="color:' +
    rarityColor +
    '">' +
    esc(rank.rarity) +
    "</span>" +
    '<button class="recap-btn" id="open-recap" type="button">' +
    icon("date_range", 14) +
    " <span>Recap</span></button>" +
    '<span class="live ' +
    (isLive ? "active" : "") +
    '">Live</span>' +
    "</div>" +
    '<div class="level">Level ' +
    lvl.level +
    "</div>" +
    '<div class="xp-bar"><div class="xp-fill" style="width:' +
    (lvl.progress * 100).toFixed(2) +
    '%"></div></div>' +
    '<div class="xp-text"><b>' +
    fmtXP(s.xp) +
    '</b> XP <span class="sep">·</span> <b>' +
    fmtXP(Math.max(0, lvl.next - s.xp)) +
    "</b> to next level</div>" +
    (next
      ? '<div class="rank-next">' +
        icon("trending_up", 13) +
        " Next: <b>" +
        esc(next.name) +
        "</b> at Lv." +
        next.lvl +
        " · " +
        levelsToNext +
        " level" +
        (levelsToNext === 1 ? "" : "s") +
        " away</div>"
      : '<div class="rank-next">' +
        icon("trending_up", 13) +
        " <b>Max rank</b> — you are Godlike</div>") +
    '<div class="goal-block">' +
    '<div class="goal-header"><span>Weekly Goal</span><b>' +
    fmtHm(weekMs) +
    " / " +
    WEEKLY_GOAL_HOURS +
    "h</b></div>" +
    '<div class="goal-track"><div class="goal-fill ' +
    (goalDone ? "done" : "") +
    '" style="width:' +
    goalPct.toFixed(1) +
    '%"></div></div>' +
    "</div>" +
    "</div>" +
    '<div class="hero-right">' +
    '<div class="streak">' +
    '<div class="streak-num ' +
    (st === 0 ? "zero" : "") +
    '">' +
    st +
    "</div>" +
    '<div class="streak-label">Day Streak</div>' +
    "</div>" +
    "</div>" +
    "</header>" +
    '<section class="grid">' +
    statCard(STAT_ICONS.total, "Total Time", fmtHm(s.totalMs)) +
    statCard(STAT_ICONS.today, "Today", fmtHm(s.days[todayKey()] || 0)) +
    statCard(STAT_ICONS.week, "This Week", fmtHm(weekMs)) +
    statCard(STAT_ICONS.saves, "Saves", fmtXP(s.saves)) +
    statCard(
      STAT_ICONS.files,
      "Files",
      fmtXP(Object.keys(s.files || {}).length),
    ) +
    statCard(
      STAT_ICONS.languages,
      "Languages",
      fmtXP(Object.keys(s.langs || {}).length),
    ) +
    "</section>" +
    '<section class="mini-grid">' +
    miniStat("keyboard", "APM (avg)", fmtRate(avg.apm)) +
    miniStat("text_fields", "CPM (avg)", fmtRate(avg.cpm)) +
    miniStat("trending_up", "WPM (avg)", fmtRate(avg.wpm)) +
    miniStat("bolt", "APM (live 60s)", fmtRate(live.apm)) +
    miniStat("keyboard", "Keystrokes", fmtXP(s.keystrokes)) +
    miniStat("text_fields", "Chars Added", fmtXP(s.charsAdded)) +
    miniStat("backspace", "Chars Removed", fmtXP(s.charsRemoved)) +
    miniStat("add", "Lines Added", fmtXP(s.linesAdded)) +
    miniStat("remove", "Lines Removed", fmtXP(s.linesRemoved)) +
    miniStat("undo", "Undos", fmtXP(s.undos)) +
    miniStat("redo", "Redos", fmtXP(s.redos)) +
    miniStat("schedule", "Typing Time", fmtHm(s.typingMs)) +
    miniStat("content_paste", "Pastes", fmtXP(s.pasteCount || 0)) +
    miniStat("content_paste", "Pasted Chars", fmtXP(s.pastedChars || 0)) +
    miniStat("file_open", "Files Opened", fmtXP(s.filesOpened)) +
    miniStat(
      "description",
      "Unique Files",
      fmtXP(Object.keys(s.uniqueFilesOpened || {}).length),
    ) +
    miniStat("swap_horiz", "Lang Switches", fmtXP(s.languageSwitches)) +
    miniStat("swap_vert", "Proj. Switches", fmtXP(s.projectSwitches)) +
    miniStat("terminal", "Terminals", fmtXP(s.terminalsOpened)) +
    miniStat("bug_report", "Debug Sessions", fmtXP(s.debugSessions)) +
    miniStat("task_alt", "Tasks Run", fmtXP(s.tasksRun)) +
    miniStat("hourglass", "Pomodoros", fmtXP(s.pomodoroCount)) +
    miniStat("timer", "Longest Session", fmtHm(s.longestSessionMs)) +
    miniStat("fire", "Longest Streak", longest + "d") +
    miniStat("calendar_m", "Active Days", activeDays + "d") +
    "</section>" +
    '<section class="two-col">' +
    '<div class="card"><h2>Last 7 Days <span class="muted">' +
    fmtHm(weekMs) +
    "</span></h2>" +
    '<div class="week-bars">' +
    renderWeekBars(s.days) +
    "</div></div>" +
    '<div class="card"><h2>Hour of Day <span class="muted">' +
    peakHourLabel(s.hours) +
    "</span></h2>" +
    '<div class="hour-chart">' +
    renderHourChart(s.hours) +
    "</div></div>" +
    "</section>" +
    '<section class="two-col">' +
    '<div class="card"><h2>Day of Week <span class="muted">' +
    peakWeekdayLabel(s.weekdays) +
    "</span></h2>" +
    '<div class="week-bars">' +
    renderWeekdayBars(s.weekdays) +
    "</div></div>" +
    '<div class="card"><h2>Languages</h2>' +
    renderLanguages(s.langs) +
    "</div>" +
    "</section>" +
    '<section class="two-col">' +
    '<div class="card"><h2>Projects</h2>' +
    renderProjects(s.projects) +
    "</div>" +
    '<div class="card"><h2>File Types</h2>' +
    renderExtensions(s.extensions) +
    "</div>" +
    "</section>" +
    '<section class="card"><h2>Top Files</h2>' +
    renderTopFiles(s.files) +
    "</section>" +
    '<section class="card"><h2>Activity <span class="muted">Last 12 months</span></h2>' +
    renderHeatmap(s.days) +
    "</section>" +
    '<section class="card"><h2>Achievements <span class="muted">' +
    achCount +
    " / " +
    ACHIEVEMENTS.length +
    "</span></h2>" +
    '<div class="ach-grid">' +
    ACHIEVEMENTS.map(function (a) {
      return renderAch(a, s.achievements || {});
    }).join("") +
    "</div></section>" +
    '<section class="card"><h2>Recent Sessions</h2>' +
    renderSessions(s.sessions || [], s.currentSession) +
    "</section>" +
    '<div class="footer"><span>VStats</span><span class="dot"></span><span>Tracking since ' +
    new Date(s.firstRun || Date.now()).toLocaleDateString("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) +
    "</span></div>";

  if (!hasRendered) {
    root.classList.add("entering");
    hasRendered = true;
    setTimeout(function () {
      root.classList.remove("entering");
    }, 1600);
  }

  var btn = document.getElementById("open-recap");
  if (btn)
    btn.addEventListener("click", function () {
      openRecap(s);
    });
}

function statCard(iconName, label, value) {
  return (
    '<div class="stat"><div class="stat-icon">' +
    icon(iconName, 20) +
    "</div>" +
    '<div class="stat-value">' +
    esc(value) +
    "</div>" +
    '<div class="stat-label">' +
    esc(label) +
    "</div></div>"
  );
}
function miniStat(iconName, label, value) {
  return (
    '<div class="mini-stat"><div class="mini-icon">' +
    icon(iconName, 18) +
    "</div>" +
    '<div class="mini-text"><div class="mini-value">' +
    esc(value) +
    "</div>" +
    '<div class="mini-label">' +
    esc(label) +
    "</div></div></div>"
  );
}

function renderWeekBars(days) {
  var data = last7Days(days);
  var max = Math.max.apply(
    null,
    data
      .map(function (d) {
        return d.ms;
      })
      .concat(1),
  );
  return data
    .map(function (d) {
      var h = Math.round((d.ms / max) * 100);
      var cls = d.isToday ? "week-bar today" : "week-bar";
      return (
        '<div class="' +
        cls +
        '">' +
        '<div class="week-bar-value">' +
        fmtHm(d.ms) +
        "</div>" +
        '<div class="week-bar-fill" style="height:' +
        h +
        '%" title="' +
        fmtMs(d.ms) +
        '"></div>' +
        '<div class="week-bar-label">' +
        esc(d.label) +
        "</div></div>"
      );
    })
    .join("");
}

function renderWeekdayBars(weekdays) {
  var data = weekdaySeries(weekdays);
  var max = Math.max.apply(
    null,
    data
      .map(function (d) {
        return d.ms;
      })
      .concat(1),
  );
  return data
    .map(function (d) {
      var h = Math.round((d.ms / max) * 100);
      var cls = d.isToday ? "week-bar today" : "week-bar";
      return (
        '<div class="' +
        cls +
        '">' +
        '<div class="week-bar-value">' +
        fmtHm(d.ms) +
        "</div>" +
        '<div class="week-bar-fill" style="height:' +
        h +
        '%" title="' +
        fmtMs(d.ms) +
        '"></div>' +
        '<div class="week-bar-label">' +
        esc(d.label) +
        "</div></div>"
      );
    })
    .join("");
}

function peakWeekdayLabel(weekdays) {
  var data = weekdaySeries(weekdays);
  var idx = 0;
  for (var i = 1; i < data.length; i++) if (data[i].ms > data[idx].ms) idx = i;
  if (!data[idx] || data[idx].ms === 0) return "No data";
  return "Peak: " + data[idx].label;
}

function renderHourChart(hours) {
  var arr =
    Array.isArray(hours) && hours.length === 24 ? hours : new Array(24).fill(0);
  var max = Math.max.apply(null, arr.concat(1));
  var now = new Date().getHours();
  var peakIdx = 0;
  for (var i = 1; i < arr.length; i++) if (arr[i] > arr[peakIdx]) peakIdx = i;
  var hasData = arr[peakIdx] > 0;

  var cells = [];
  for (var h = 0; h < 24; h++) {
    var ms = arr[h];
    var pct = Math.round((ms / max) * 100);
    var cls = ["hour-bar"];
    if (h === now) cls.push("now");
    if (hasData && h === peakIdx) cls.push("peak");
    var label = h % 3 === 0 ? String(h).padStart(2, "0") : "";
    cells.push(
      '<div class="' +
        cls.join(" ") +
        '" title="' +
        String(h).padStart(2, "0") +
        ":00 · " +
        fmtMs(ms) +
        '">' +
        '<div class="hour-bar-fill" style="height:' +
        pct +
        '%"></div>' +
        '<div class="hour-bar-label">' +
        label +
        "</div></div>",
    );
  }
  return cells.join("");
}

function peakHourLabel(hours) {
  var arr =
    Array.isArray(hours) && hours.length === 24 ? hours : new Array(24).fill(0);
  var peakIdx = 0;
  for (var i = 1; i < arr.length; i++) if (arr[i] > arr[peakIdx]) peakIdx = i;
  if (arr[peakIdx] === 0) return "No data";
  return "Peak: " + String(peakIdx).padStart(2, "0") + ":00";
}

function renderLanguages(langs) {
  var entries = topEntries(langs, 8);
  if (!entries.length) return '<p class="muted">No data yet.</p>';
  var total = entries.reduce(function (a, e) {
    return a + e[1];
  }, 0);
  return entries
    .map(function (e) {
      var k = e[0],
        v = e[1];
      var pct = (v / total) * 100;
      var color = langColor(k);
      return (
        '<div class="lang-row">' +
        '<span class="lang-dot" style="color:' +
        color +
        '"></span>' +
        '<div class="lang-name">' +
        esc(k) +
        "</div>" +
        '<div class="lang-bar"><div class="lang-fill" style="width:' +
        pct.toFixed(1) +
        "%;background:linear-gradient(90deg, " +
        color +
        ", " +
        color +
        'aa)"></div></div>' +
        '<div class="lang-time">' +
        fmtHm(v) +
        "</div>" +
        '<div class="lang-pct">' +
        pct.toFixed(1) +
        "%</div></div>"
      );
    })
    .join("");
}

function renderProjects(projects) {
  var entries = topEntries(projects, 8);
  if (!entries.length)
    return '<p class="muted">No projects yet. Open a folder to start tracking.</p>';
  var max = entries[0][1];
  return entries
    .map(function (e) {
      var k = e[0],
        v = e[1];
      var pct = (v / max) * 100;
      return (
        '<div class="file-row" title="' +
        esc(k) +
        '">' +
        '<div class="file-name">' +
        esc(k) +
        "</div>" +
        '<div class="file-bar"><div class="file-fill file-fill-project" style="width:' +
        pct.toFixed(1) +
        '%"></div></div>' +
        '<div class="file-time">' +
        fmtHm(v) +
        "</div></div>"
      );
    })
    .join("");
}

function renderExtensions(extensions) {
  var entries = topEntries(extensions, 8);
  if (!entries.length) return '<p class="muted">No data yet.</p>';
  var max = entries[0][1];
  return entries
    .map(function (e) {
      var k = e[0],
        v = e[1];
      var pct = (v / max) * 100;
      return (
        '<div class="file-row" title="' +
        esc(k) +
        '">' +
        '<div class="file-name">' +
        esc(k) +
        "</div>" +
        '<div class="file-bar"><div class="file-fill" style="width:' +
        pct.toFixed(1) +
        '%"></div></div>' +
        '<div class="file-time">' +
        fmtHm(v) +
        "</div></div>"
      );
    })
    .join("");
}

function renderTopFiles(files) {
  var entries = topEntries(files, 10);
  if (!entries.length) return '<p class="muted">No data yet.</p>';
  var max = entries[0][1];
  return entries
    .map(function (e) {
      var k = e[0],
        v = e[1];
      var name = k.split(/[/\\]/).pop();
      var pct = (v / max) * 100;
      return (
        '<div class="file-row" title="' +
        esc(k) +
        '">' +
        '<div class="file-name">' +
        esc(name) +
        "</div>" +
        '<div class="file-bar"><div class="file-fill" style="width:' +
        pct.toFixed(1) +
        '%"></div></div>' +
        '<div class="file-time">' +
        fmtHm(v) +
        "</div></div>"
      );
    })
    .join("");
}

function renderHeatmap(days) {
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var start = new Date(today);
  start.setDate(start.getDate() - 52 * 7 - today.getDay());

  var vals = Object.values(days || {});
  var maxMs = vals.length ? Math.max.apply(null, vals.concat(1)) : 1;
  var cells = [];
  var cur = new Date(start);
  for (var i = 0; i < 53 * 7; i++) {
    var k = cur.toISOString().slice(0, 10);
    var ms = (days && days[k]) || 0;
    var level =
      ms === 0 ? 0 : Math.max(1, Math.min(4, Math.ceil((ms / maxMs) * 4)));
    cells.push(
      '<div class="heat-cell heat-' +
        level +
        '" title="' +
        k +
        ": " +
        fmtMs(ms) +
        '"></div>',
    );
    cur.setDate(cur.getDate() + 1);
  }
  return '<div class="heatmap">' + cells.join("") + "</div>";
}

function renderAch(a, unlocked) {
  var ts = unlocked[a.id];
  var cls = ts ? "ach unlocked" : "ach locked";
  var tip = ts
    ? " · Unlocked " + new Date(ts).toLocaleDateString()
    : " · Locked";
  return (
    '<div class="' +
    cls +
    '" title="' +
    esc(a.desc + tip) +
    '">' +
    '<div class="ach-icon-wrap">' +
    icon(a.icon, 16) +
    "</div>" +
    '<div class="ach-text"><div class="ach-name">' +
    esc(a.name) +
    "</div>" +
    '<div class="ach-desc">' +
    esc(a.desc) +
    "</div></div></div>"
  );
}

function renderSessions(sessions, current) {
  var all = sessions.slice();
  if (current) all.push(current);
  var recent = all.slice(-5).reverse();
  if (!recent.length) return '<p class="muted">No sessions yet.</p>';
  var maxMs = Math.max.apply(
    null,
    recent
      .map(function (s) {
        return s.ms;
      })
      .concat(1),
  );
  return recent
    .map(function (s) {
      var start = new Date(s.start);
      var end = new Date(s.end);
      var date = start.toLocaleDateString("en", {
        month: "short",
        day: "numeric",
      });
      var t1 = pad(start.getHours()) + ":" + pad(start.getMinutes());
      var t2 = pad(end.getHours()) + ":" + pad(end.getMinutes());
      var pct = (s.ms / maxMs) * 100;
      return (
        '<div class="session-row">' +
        '<div class="session-date">' +
        date +
        " · " +
        t1 +
        "–" +
        t2 +
        "</div>" +
        '<div class="session-bar"><div class="session-bar-fill" style="width:' +
        pct.toFixed(1) +
        '%"></div></div>' +
        '<div class="session-dur">' +
        fmtHm(s.ms) +
        "</div></div>"
      );
    })
    .join("");
}
