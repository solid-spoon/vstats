const state = require("./state");
const statusBar = require("./statusbar");
const tracking = require("./tracking");
const commands = require("./commands");

let started = false;

function start(context) {
  if (started) return;
  started = true;

  state.init(context);
  statusBar.create(context);
  tracking.wire(context);
  commands.register(context);
  tracking.startTimer();
}

function stop() {
  tracking.stopTimer();
  tracking.finalizeSession();
  state.save();
}

module.exports = { start, stop };
