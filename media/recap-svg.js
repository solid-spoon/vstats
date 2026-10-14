// Builds a fully self-contained SVG recap card.
// Uses only native SVG primitives — no foreignObject, no external fonts.
// Renders identically in any browser, image viewer, or chat client.

var RECAP_SVG_W = 680;
var RECAP_SVG_H = 780;
var RECAP_SVG_PAD = 60;

function xmlEsc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&apos;",
        }[c];
    });
}

function shortenNum(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e4) return Math.round(n / 1e3) + "k";
    return Math.floor(n).toLocaleString();
}

function buildRecapSVG(s, period, prev, mode, opts) {
    opts = opts || {};
    var W = RECAP_SVG_W;
    var H = RECAP_SVG_H;
    var PAD = RECAP_SVG_PAD;

    var topLang = topEntries(period.langs, 1)[0];
    var topProject = topEntries(period.projects, 1)[0];
    var bestDay = bestDayIn(s, period);
    var sessions = sessionCountIn(s, period);
    var active = activeDaysIn(s, period);

    var accent = topLang
        ? langColor(topLang[0])
        : s.langs && Object.keys(s.langs)[0]
            ? langColor(Object.keys(s.langs)[0])
            : "#4ec9b0";

    var bigNum = fmtHm(period.ms);

    // ---- compare badge ----
    var compareSvg = "";
    if (prev && prev.ms > 0 && period.ms > 0) {
        var delta = ((period.ms - prev.ms) / prev.ms) * 100;
        var up = delta >= 0;
        var cColor = up ? "#4ec9b0" : "#ff8a80";
        var arrow = up ? "\u2191" : "\u2193";
        var label = arrow + " " + Math.abs(delta).toFixed(1) + "%  vs " + prev.label;
        var pillW = Math.max(140, label.length * 7.4 + 28);
        compareSvg =
            '<g transform="translate(' +
            PAD +
            ', 322)">' +
            '<rect width="' +
            pillW +
            '" height="30" rx="15" fill="' +
            cColor +
            '" fill-opacity="0.14"/>' +
            '<text x="14" y="20" font-size="12.5" font-weight="700" fill="' +
            cColor +
            '">' +
            xmlEsc(label) +
            "</text>" +
            "</g>";
    }

    // ---- top language bar ----
    var barW = 0;
    if (topLang && period.ms > 0) {
        barW = Math.max(6, (topLang[1] / period.ms) * (W - 2 * PAD));
    }

    // ---- right column: 4 mini facts ----
    var factsX = W - PAD;
    function factRow(y, value, label) {
        return (
            '<text x="' +
            factsX +
            '" y="' +
            y +
            '" font-size="20" font-weight="700" ' +
            'fill="#eef1f5" text-anchor="end" letter-spacing="-0.4">' +
            xmlEsc(value) +
            "</text>" +
            '<text x="' +
            factsX +
            '" y="' +
            (y + 18) +
            '" font-size="9.5" font-weight="700" ' +
            'letter-spacing="2" fill="#8a8f98" text-anchor="end">' +
            xmlEsc(label) +
            "</text>"
        );
    }
    var factsSvg =
        factRow(212, shortenNum(period.saves), "SAVES") +
        factRow(270, String(active), "ACTIVE DAYS") +
        factRow(328, String(sessions), "SESSIONS") +
        factRow(386, shortenNum(period.keystrokes), "KEYSTROKES");

    // ---- footer date ----
    var trackingSince = new Date(s.firstRun || Date.now())
        .toLocaleDateString("en", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
        .toUpperCase();

    // ---- assemble ----
    var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="' +
        W +
        '" height="' +
        H +
        '" ' +
        'viewBox="0 0 ' +
        W +
        " " +
        H +
        '" ' +
        "font-family=\"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif\" " +
        'font-variant-numeric="tabular-nums">' +
        "<defs>" +
        '<radialGradient id="aura" cx="20%" cy="14%" r="62%">' +
        '<stop offset="0%" stop-color="' +
        accent +
        '" stop-opacity="0.30"/>' +
        '<stop offset="45%" stop-color="' +
        accent +
        '" stop-opacity="0.08"/>' +
        '<stop offset="100%" stop-color="' +
        accent +
        '" stop-opacity="0"/>' +
        "</radialGradient>" +
        '<linearGradient id="heroNum" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="#ffffff"/>' +
        '<stop offset="100%" stop-color="' +
        accent +
        '"/>' +
        "</linearGradient>" +
        '<linearGradient id="langBar" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0%" stop-color="' +
        accent +
        '"/>' +
        '<stop offset="100%" stop-color="' +
        accent +
        '" stop-opacity="0.28"/>' +
        "</linearGradient>" +
        '<filter id="dotGlow" x="-300%" y="-300%" width="700%" height="700%">' +
        '<feGaussianBlur stdDeviation="5" result="b"/>' +
        '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>' +
        "</filter>" +
        "</defs>" +

        // background
        '<rect width="' +
        W +
        '" height="' +
        H +
        '" rx="26" fill="#0c0e12"/>' +
        '<rect width="' +
        W +
        '" height="' +
        H +
        '" rx="26" fill="url(#aura)"/>' +
        '<rect x="0.5" y="0.5" width="' +
        (W - 1) +
        '" height="' +
        (H - 1) +
        '" rx="26" ' +
        'fill="none" stroke="' +
        accent +
        '" stroke-opacity="0.22"/>' +

        // header
        '<text x="' +
        PAD +
        '" y="92" font-size="11" font-weight="700" letter-spacing="4" ' +
        'fill="' +
        accent +
        '">RECAP</text>' +
        '<text x="' +
        PAD +
        '" y="138" font-size="30" font-weight="700" fill="#eef1f5" ' +
        'letter-spacing="-0.6">' +
        xmlEsc(period.label) +
        "</text>" +

        // hero
        '<text x="' +
        PAD +
        '" y="268" font-size="84" font-weight="800" ' +
        'fill="url(#heroNum)" letter-spacing="-3">' +
        xmlEsc(bigNum) +
        "</text>" +
        '<text x="' +
        PAD +
        '" y="304" font-size="11" font-weight="700" letter-spacing="3" ' +
        'fill="#8a8f98">TRACKED ' +
        (mode === "all" ? "ALL TIME" : "THIS PERIOD") +
        "</text>" +
        compareSvg +

        // facts (right column)
        factsSvg +

        // divider 1
        '<line x1="' +
        PAD +
        '" y1="452" x2="' +
        (W - PAD) +
        '" y2="452" ' +
        'stroke="#ffffff" stroke-opacity="0.08"/>' +

        // top language
        '<text x="' +
        PAD +
        '" y="492" font-size="10" font-weight="700" letter-spacing="2.4" ' +
        'fill="#8a8f98">TOP LANGUAGE</text>' +
        (topLang
            ? '<g transform="translate(' +
            PAD +
            ', 534)">' +
            '<circle cx="5" cy="-5" r="5" fill="' +
            accent +
            '" filter="url(#dotGlow)"/>' +
            '<text x="22" y="0" font-size="18" font-weight="700" fill="#eef1f5">' +
            xmlEsc(topLang[0]) +
            "</text>" +
            '<text x="' +
            (22 + topLang[0].length * 11 + 14) +
            '" y="0" ' +
            'font-size="15" fill="#8a8f98">\u00B7 ' +
            xmlEsc(fmtHm(topLang[1])) +
            "</text>" +
            "</g>"
            : "") +
        '<rect x="' +
        PAD +
        '" y="562" width="' +
        (W - 2 * PAD) +
        '" height="4" rx="2" ' +
        'fill="#ffffff" fill-opacity="0.06"/>' +
        '<rect x="' +
        PAD +
        '" y="562" width="' +
        barW.toFixed(1) +
        '" height="4" rx="2" ' +
        'fill="url(#langBar)"/>' +

        // divider 2
        '<line x1="' +
        PAD +
        '" y1="606" x2="' +
        (W - PAD) +
        '" y2="606" ' +
        'stroke="#ffffff" stroke-opacity="0.06"/>' +

        // bottom row
        '<g transform="translate(' +
        PAD +
        ', 644)">' +
        '<text y="0" font-size="10" font-weight="700" letter-spacing="2.2" fill="#8a8f98">TOP PROJECT</text>' +
        '<text y="28" font-size="15" font-weight="600" fill="#eef1f5">' +
        (topProject ? xmlEsc(topProject[0]) : "\u2014") +
        "</text>" +
        '<text y="48" font-size="12" fill="#8a8f98">' +
        (topProject ? xmlEsc(fmtHm(topProject[1])) : "") +
        "</text>" +
        "</g>" +
        '<g transform="translate(' +
        Math.round(W * 0.56) +
        ', 644)">' +
        '<text y="0" font-size="10" font-weight="700" letter-spacing="2.2" fill="#8a8f98">BEST DAY</text>' +
        '<text y="28" font-size="15" font-weight="600" fill="#eef1f5">' +
        (bestDay ? xmlEsc(formatDayLabel(bestDay.key)) : "\u2014") +
        "</text>" +
        '<text y="48" font-size="12" fill="#8a8f98">' +
        (bestDay ? xmlEsc(fmtHm(bestDay.ms)) : "") +
        "</text>" +
        "</g>" +

        // footer
        '<text x="' +
        W / 2 +
        '" y="' +
        (H - 20) +
        '" font-size="9.5" font-weight="700" ' +
        'letter-spacing="3" fill="#8a8f98" fill-opacity="0.55" text-anchor="middle">' +
        "VSTATS  \u00B7  TRACKING SINCE " +
        xmlEsc(trackingSince) +
        "</text>" +

        "</svg>";

    return svg;
}

// Renders an SVG string to a PNG Blob via canvas. No foreignObject involved.
async function svgToPngBlob(svgString, scale) {
    scale = scale || 2;
    var blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    var url = URL.createObjectURL(blob);

    try {
        var img = new Image();
        await new Promise(function (res, rej) {
            img.onload = res;
            img.onerror = function () {
                rej(new Error("SVG failed to load"));
            };
            img.src = url;
        });

        var w = img.naturalWidth || RECAP_SVG_W;
        var h = img.naturalHeight || RECAP_SVG_H;

        var canvas = document.createElement("canvas");
        canvas.width = w * scale;
        canvas.height = h * scale;
        var ctx = canvas.getContext("2d");
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, w, h);

        return await new Promise(function (res) {
            canvas.toBlob(function (b) {
                res(b);
            }, "image/png");
        });
    } finally {
        URL.revokeObjectURL(url);
    }
}

async function svgToPngDataUrl(svgString, scale) {
    var blob = await svgToPngBlob(svgString, scale);
    return await new Promise(function (res) {
        var r = new FileReader();
        r.onload = function () {
            res(r.result);
        };
        r.readAsDataURL(blob);
    });
}