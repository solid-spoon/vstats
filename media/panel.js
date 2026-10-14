var vscode = acquireVsCodeApi();
var liveRates = null;

vscode.postMessage({ type: "ready" });

window.addEventListener("message", function (e) {
  var msg = e.data;
  if (msg.type === "stats") {
    liveRates = msg.live || null;
    render(msg.payload);
  }
});
