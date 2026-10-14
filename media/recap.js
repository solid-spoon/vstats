var recapState = { open: false, mode: "month", stats: null };

function openRecap(stats) {
  recapState.open = true;
  recapState.stats = stats;
  renderRecap();
  document.addEventListener("keydown", recapEsc);
}

function closeRecap() {
  recapState.open = false;
  document.removeEventListener("keydown", recapEsc);
  var el = document.getElementById("recap-overlay");
  if (el) {
    el.classList.add("closing");
    setTimeout(function () {
      el.remove();
    }, 220);
  }
}

function recapEsc(e) {
  if (e.key === "Escape") closeRecap();
}

function computeRecapPeriod(s, mode) {
  var now = new Date();

  if (mode === "month") {
    var key = now.toISOString().slice(0, 7);
    var p = (s.months || {})[key] || {};
    return {
      label:
        now.toLocaleDateString("en", { month: "long" }) +
        " " +
        now.getFullYear(),
      ms: p.ms || 0,
      saves: p.saves || 0,
      keystrokes: p.keystrokes || 0,
      charsAdded: p.charsAdded || 0,
      langs: p.langs || {},
      projects: p.projects || {},
      dayPrefix: key,
      periodStart: new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
    };
  }
  if (mode === "lastMonth") {
    var d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    var key2 = d.toISOString().slice(0, 7);
    var p2 = (s.months || {})[key2] || {};
    return {
      label:
        d.toLocaleDateString("en", { month: "long" }) + " " + d.getFullYear(),
      ms: p2.ms || 0,
      saves: p2.saves || 0,
      keystrokes: p2.keystrokes || 0,
      charsAdded: p2.charsAdded || 0,
      langs: p2.langs || {},
      projects: p2.projects || {},
      dayPrefix: key2,
      periodStart: d.getTime(),
      periodEnd: new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
    };
  }
  if (mode === "year") {
    var key3 = String(now.getFullYear());
    var p3 = (s.years || {})[key3] || {};
    return {
      label: key3,
      ms: p3.ms || 0,
      saves: p3.saves || 0,
      keystrokes: p3.keystrokes || 0,
      charsAdded: p3.charsAdded || 0,
      langs: p3.langs || {},
      projects: p3.projects || {},
      dayPrefix: key3,
      periodStart: new Date(now.getFullYear(), 0, 1).getTime(),
    };
  }
  return {
    label: "All Time",
    ms: s.totalMs || 0,
    saves: s.saves || 0,
    keystrokes: s.keystrokes || 0,
    charsAdded: s.charsAdded || 0,
    langs: s.langs || {},
    projects: s.projects || {},
    dayPrefix: null,
    periodStart: 0,
  };
}

function computePreviousPeriod(s, mode) {
  var now = new Date();
  if (mode === "month") {
    var d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    var key = d.toISOString().slice(0, 7);
    return {
      key: key,
      ms: ((s.months || {})[key] || {}).ms || 0,
      label: d.toLocaleDateString("en", { month: "short", year: "numeric" }),
    };
  }
  if (mode === "lastMonth") {
    var d2 = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    var key2 = d2.toISOString().slice(0, 7);
    return {
      key: key2,
      ms: ((s.months || {})[key2] || {}).ms || 0,
      label: d2.toLocaleDateString("en", { month: "short", year: "numeric" }),
    };
  }
  if (mode === "year") {
    var y = now.getFullYear() - 1;
    return {
      key: String(y),
      ms: ((s.years || {})[String(y)] || {}).ms || 0,
      label: String(y),
    };
  }
  return null;
}

function sessionCountIn(s, period) {
  var end = period.periodEnd || Date.now() + 86400000;
  var n = 0;
  var all = (s.sessions || []).slice();
  if (s.currentSession) all.push(s.currentSession);
  for (var i = 0; i < all.length; i++) {
    if (all[i].start >= period.periodStart && all[i].start < end) n++;
  }
  return n;
}

function bestDayIn(s, period) {
  var bestKey = null,
    bestMs = 0;
  for (var k in s.days || {}) {
    if (period.dayPrefix && k.indexOf(period.dayPrefix) !== 0) continue;
    if (s.days[k] > bestMs) {
      bestMs = s.days[k];
      bestKey = k;
    }
  }
  return bestKey ? { key: bestKey, ms: bestMs } : null;
}

function activeDaysIn(s, period) {
  var n = 0;
  for (var k in s.days || {}) {
    if (period.dayPrefix && k.indexOf(period.dayPrefix) !== 0) continue;
    if (s.days[k] > 60000) n++;
  }
  return n;
}

function achievementsIn(s, period) {
  var end = period.periodEnd || Date.now() + 86400000;
  var out = [];
  for (var id in s.achievements || {}) {
    var ts = s.achievements[id];
    if (ts >= period.periodStart && ts < end) {
      var meta = ACHIEVEMENTS.find(function (a) {
        return a.id === id;
      });
      if (meta)
        out.push({
          id: meta.id,
          name: meta.name,
          desc: meta.desc,
          icon: meta.icon,
          unlockedAt: ts,
        });
    }
  }
  return out.sort(function (a, b) {
    return a.unlockedAt - b.unlockedAt;
  });
}

function renderRecap() {
  if (!recapState.stats) return;
  var s = recapState.stats;
  var period = computeRecapPeriod(s, recapState.mode);
  var prev = computePreviousPeriod(s, recapState.mode);

  var topLang = topEntries(period.langs, 1)[0];
  var topProject = topEntries(period.projects, 1)[0];
  var bestDay = bestDayIn(s, period);
  var sessions = sessionCountIn(s, period);
  var active = activeDaysIn(s, period);
  var unlocked = achievementsIn(s, period).slice(-8);

  var langName = topLang ? topLang[0] : null;
  var langColorVal = langName
    ? langColor(langName)
    : s.langs && Object.keys(s.langs)[0]
      ? langColor(Object.keys(s.langs)[0])
      : "#8b8b8b";

  var compareHtml = "";
  if (prev && prev.ms > 0 && period.ms > 0) {
    var delta = ((period.ms - prev.ms) / prev.ms) * 100;
    var up = delta >= 0;
    compareHtml =
      '<div class="recap-compare ' +
      (up ? "up" : "down") +
      '">' +
      '<span class="recap-compare-arrow">' +
      (up ? "↑" : "↓") +
      "</span>" +
      "<span>" +
      Math.abs(delta).toFixed(1) +
      "%</span>" +
      '<span class="muted">vs ' +
      esc(prev.label) +
      "</span>" +
      "</div>";
  }

  var existing = document.getElementById("recap-overlay");
  if (existing) existing.remove();

  var overlay = document.createElement("div");
  overlay.id = "recap-overlay";
  overlay.className = "recap-overlay";
  overlay.innerHTML =
    '<div class="recap-backdrop"></div>' +
    '<div class="recap-card" style="--accent:' +
    langColorVal +
    '">' +
    '<div class="recap-actions">' +
    '<button class="recap-action" id="recap-copy" type="button" title="Copy to clipboard">' +
    icon("content_copy", 17) +
    "</button>" +
    '<button class="recap-action" id="recap-download" type="button" title="Save PNG">' +
    icon("download", 17) +
    "</button>" +
    '<button class="recap-close" id="recap-close" type="button" title="Close">' +
    icon("close", 20) +
    "</button>" +
    "</div>" +
    '<div class="recap-header">' +
    '<div class="recap-eyebrow">Recap</div>' +
    '<div class="recap-title">' +
    esc(period.label) +
    "</div>" +
    "</div>" +
    '<div class="recap-hero">' +
    '<div class="recap-hero-value">' +
    fmtHm(period.ms) +
    "</div>" +
    '<div class="recap-hero-label">tracked ' +
    (recapState.mode === "all" ? "all time" : "this period") +
    "</div>" +
    compareHtml +
    "</div>" +
    (topLang
      ? '<div class="recap-row"><div class="recap-row-label">Top Language</div>' +
        '<div class="recap-row-value"><span class="recap-dot" style="background:' +
        langColorVal +
        ";box-shadow:0 0 12px " +
        langColorVal +
        '"></span>' +
        "<b>" +
        esc(langName) +
        '</b> <span class="muted">· ' +
        fmtHm(topLang[1]) +
        "</span></div>" +
        '<div class="recap-bar"><div style="width:' +
        ((topLang[1] / period.ms) * 100).toFixed(1) +
        "%;background:linear-gradient(90deg, " +
        langColorVal +
        ", " +
        langColorVal +
        'aa)"></div></div></div>'
      : "") +
    (topProject
      ? '<div class="recap-row"><div class="recap-row-label">Top Project</div>' +
        '<div class="recap-row-value"><b>' +
        esc(topProject[0]) +
        '</b> <span class="muted">· ' +
        fmtHm(topProject[1]) +
        "</span></div></div>"
      : "") +
    (bestDay
      ? '<div class="recap-row"><div class="recap-row-label">Best Day</div>' +
        '<div class="recap-row-value"><b>' +
        esc(formatDayLabel(bestDay.key)) +
        '</b> <span class="muted">· ' +
        fmtHm(bestDay.ms) +
        "</span></div></div>"
      : "") +
    '<div class="recap-facts">' +
    '<div class="recap-fact"><div class="recap-fact-value">' +
    fmtXP(period.saves) +
    '</div><div class="recap-fact-label">Saves</div></div>' +
    '<div class="recap-fact"><div class="recap-fact-value">' +
    active +
    '</div><div class="recap-fact-label">Active Days</div></div>' +
    '<div class="recap-fact"><div class="recap-fact-value">' +
    sessions +
    '</div><div class="recap-fact-label">Sessions</div></div>' +
    '<div class="recap-fact"><div class="recap-fact-value">' +
    fmtXP(period.keystrokes) +
    '</div><div class="recap-fact-label">Keystrokes</div></div>' +
    "</div>" +
    (unlocked.length
      ? '<div class="recap-unlocked"><div class="recap-row-label" style="margin-bottom:8px">Unlocked</div>' +
        '<div class="recap-ach-list">' +
        unlocked
          .map(function (a) {
            return (
              '<div class="recap-ach" title="' +
              esc(a.desc) +
              '">' +
              '<div class="recap-ach-icon">' +
              icon(a.icon, 14) +
              "</div>" +
              '<div class="recap-ach-name">' +
              esc(a.name) +
              "</div></div>"
            );
          })
          .join("") +
        "</div></div>"
      : "") +
    '<div class="recap-tabs">' +
    '<button class="recap-tab ' +
    (recapState.mode === "month" ? "active" : "") +
    '" data-mode="month" type="button">This Month</button>' +
    '<button class="recap-tab ' +
    (recapState.mode === "lastMonth" ? "active" : "") +
    '" data-mode="lastMonth" type="button">Last Month</button>' +
    '<button class="recap-tab ' +
    (recapState.mode === "year" ? "active" : "") +
    '" data-mode="year" type="button">This Year</button>' +
    '<button class="recap-tab ' +
    (recapState.mode === "all" ? "active" : "") +
    '" data-mode="all" type="button">All Time</button>' +
    "</div>" +
    "</div>";

  document.body.appendChild(overlay);

  var cardEl = overlay.querySelector(".recap-card");

  overlay
    .querySelector(".recap-backdrop")
    .addEventListener("click", closeRecap);
  overlay.querySelector("#recap-close").addEventListener("click", closeRecap);
  overlay.querySelector("#recap-copy").addEventListener("click", function (e) {
    copyRecapPng(cardEl, e.currentTarget);
  });
  overlay
    .querySelector("#recap-download")
    .addEventListener("click", function () {
      saveRecapPng(cardEl).catch(function (e) {
        console.error("[vstats] save failed:", e);
      });
    });
  overlay.querySelectorAll(".recap-tab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      recapState.mode = btn.dataset.mode;
      renderRecap();
    });
  });
}

function formatDayLabel(key) {
  var d = new Date(key + "T00:00:00");
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

// ---------- PNG export ----------
function inlineComputedStyles(source, target) {
  var computed = getComputedStyle(source);
  var style = "";
  for (var i = 0; i < computed.length; i++) {
    var prop = computed[i];
    if (prop.indexOf("--") === 0) continue;
    if (prop === "transform" || prop === "animation" || prop === "transition")
      continue;
    if (prop.indexOf("animation-") === 0 || prop.indexOf("transition-") === 0)
      continue;
    var val = computed.getPropertyValue(prop);
    if (!val) continue;
    style += prop + ":" + val + ";";
  }
  target.setAttribute("style", style);
  var sc = source.children,
    tc = target.children;
  for (var j = 0; j < sc.length; j++) {
    if (tc[j]) inlineComputedStyles(sc[j], tc[j]);
  }
}

async function nodeToCanvas(node, scale) {
  scale = scale || 2;
  var rect = node.getBoundingClientRect();
  var w = Math.ceil(rect.width);
  var h = Math.ceil(node.scrollHeight);

  var clone = node.cloneNode(true);
  var closeBtn = clone.querySelector(".recap-close");
  if (closeBtn) closeBtn.remove();
  var actions = clone.querySelector(".recap-actions");
  if (actions) actions.remove();
  var tabs = clone.querySelector(".recap-tabs");
  if (tabs) tabs.remove();

  inlineComputedStyles(node, clone);

  clone.style.maxHeight = "none";
  clone.style.height = "auto";
  clone.style.overflow = "visible";
  clone.style.transform = "none";
  clone.style.animation = "none";
  clone.style.margin = "0";

  var xml = new XMLSerializer().serializeToString(clone);
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    w +
    '" height="' +
    h +
    '" viewBox="0 0 ' +
    w +
    " " +
    h +
    '">' +
    '<foreignObject x="0" y="0" width="' +
    w +
    '" height="' +
    h +
    '">' +
    '<div xmlns="http://www.w3.org/1999/xhtml">' +
    xml +
    "</div>" +
    "</foreignObject>" +
    "</svg>";

  var dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  var img = new Image();
  await new Promise(function (res, rej) {
    img.onload = res;
    img.onerror = function () {
      rej(new Error("svg load failed"));
    };
    img.src = dataUrl;
  });

  var canvas = document.createElement("canvas");
  canvas.width = w * scale;
  canvas.height = h * scale;
  var ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise(function (res) {
    canvas.toBlob(function (b) {
      res(b);
    }, "image/png");
  });
}

function recapFilename(mode, label) {
  var slug = String(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return "vstats-" + mode + "-" + slug + ".png";
}

async function copyRecapPng(cardEl, btn) {
  try {
    var canvas = await nodeToCanvas(cardEl, 2);
    var blob = await canvasToBlob(canvas);
    if (!blob) throw new Error("blob failed");
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    markSuccess(btn);
  } catch (e) {
    console.error("[vstats] clipboard failed:", e);
    await saveRecapPng(cardEl);
  }
}

async function saveRecapPng(cardEl) {
  var canvas = await nodeToCanvas(cardEl, 2);
  var dataUrl = canvas.toDataURL("image/png");
  vscode.postMessage({
    type: "savePng",
    dataUrl: dataUrl,
    filename: recapFilename(
      recapState.mode,
      computeRecapPeriod(recapState.stats, recapState.mode).label,
    ),
  });
}

function markSuccess(btn) {
  if (!btn) return;
  var prev = btn.innerHTML;
  btn.classList.add("success");
  btn.innerHTML = icon("check", 18);
  setTimeout(function () {
    btn.classList.remove("success");
    btn.innerHTML = prev;
  }, 1200);
}
