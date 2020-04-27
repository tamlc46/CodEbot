const codebot = require("./src/codebot");

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const open = require("open");
const expressStaticGzip = require("express-static-gzip");


const PORT = 80;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// app.use(express.static("public"));

app.use("/", expressStaticGzip("public", {
  enableBrotli: true,
  orderPreference: ["br", "gz"],
  setHeaders: function (res, path) {
     res.setHeader("Cache-Control", "public, max-age=31536000");
  }
}));

io.on("connection", socket => {
  let bot = codebot();

  console.log("New Connection from", socket.id);

  socket.on("disconnect", () => {
    console.log(socket.id, "disconnected!");
    bot.kill_bot();
  });

  socket.on("ask", msg => {
    console.log(msg);
    bot.ask(msg.question);
  });
  
  bot.on("message", msg => {
    socket.emit("answer", msg);
  })
});

server.listen(PORT, "::", error => {
  if (error) console.log(error);
  else console.log("Server is listening on Port", PORT);
  // open_in_browser();
});

async function open_in_browser() {
  await open("http://localhost:8080");
}
