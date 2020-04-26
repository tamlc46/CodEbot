const bot = require("./lib/spawn_bot")();

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const open = require("open");
const PORT = 8080;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static("public"));

io.on("connection", socket => {
  console.log("New Connection from", socket.id);

  socket.on("disconnect", () => {
    console.log(socket.id, "disconnected!");
  });

  socket.on("ask", msg => {
    bot.ask(msg.question, answer => {
      socket.emit("answer", Object.assign({ answer: answer }, msg));
    });
  });
});

server.listen(PORT, "0.0.0.0", error => {
  if (error) console.log(error);
  else console.log("Server is listening on Port", PORT);
  // open_in_browser();
});

async function open_in_browser() {
  await open("http://localhost:8080");
}
