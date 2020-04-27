const { spawn } = require("child_process");
const path = require("path");

module.exports = (py_file = "./src/codebot/mainbot.py") => {
  var bot = spawn("python", [py_file], {
    stdio: ["pipe", "pipe", "pipe"]
  });

  bot.on("error", error => {
    console.error("Bot Error:", error);
  });

  bot.on("close", (code, signal) => {
    console.warn(`Bot Closed!\nCode: ${code}\nSignal:${signal}`);
  });

  process.on("beforeExit", () => {
    console.log("Kill bot");
    bot.kill();
  });

  bot.stdout.on("data", msg => {
    console.log(msg.toString());
    bot.emit("message", decodeURI(msg.toString()));
  });

  bot.stdout.on("data", msg => {
  });

  bot.ask = function(question, cb) {
    bot.stdin.write(`${question}\n`, error => {
      if (error) console.log(error);
    });
  };

  bot.kill_bot = function() {
    this.kill();
  }

  return bot;
};
