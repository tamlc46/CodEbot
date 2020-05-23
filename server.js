const codebot = require("./src/codebot");
const KBM = require("./src/kbm");

const path = require("path");
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const open = require("open");
const expressStaticGzip = require("express-static-gzip");
const body_parser = require("body-parser");


const PORT = 80;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const kb = new KBM(path.join(__dirname, "/src/codebot/model/knowledge.json"));
kb.load_kb();

// app.use(express.static("public"));

app.use(body_parser.json())

app.use("/", expressStaticGzip(path.join(__dirname, "public"), {
  enableBrotli: true,
  orderPreference: ["br", "gz"],
  setHeaders: function (res, path) {
     res.setHeader("Cache-Control", "public, max-age=31536000");
  }
}));

app.get("/kbm", (req, res) => {
  res.sendFile(path.join(__dirname, "public/kbm.html"));
})

app.get("/kbm/list", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.end(kb.get_json());
})

app.post("/kbm/add", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (!req.body.concept) {
    res.end(`{
      "exitcode": 1,
      "message": "Vui lòng nhập khái niệm!
    }`);
  }
  else {
    if (kb.add_kb(req.body)) {
      res.end(`{
        "exitcode": 0,
        "message": "Thêm tri thức mới thành công!"
      }`);
    }
    else {
      res.end(`{
        "exitcode": 1,
        "message": "Lỗi không xác định!\nCó lỗi trong quá trình cập nhật tri thức."
      }`)
    }
  }
})

app.post("/kbm/update", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (!req.body.old_concept || !req.body.concept) {
    res.end(`{
      "exitcode": 1,
      "message": "Vui lòng nhập khái niệm!
    }`);
  }
  else {
    if (kb.update_kb(req.body)) {
      res.end(`{
        "exitcode": 0, 
        "message": "Cập nhật tri thức thành công!"
      }`);
    }
    else {
      res.end(`{
        "exitcode": 1,
        "message": "Lỗi không xác định!\nCó lỗi trong quá trình cập nhật tri thức."
      }`);
    }
  }
})

app.post("/kbm/delete", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  console.log(req.body)
  if (kb.delete_kb(req.body.concept)) {
    res.end(`{
      "exitcode": 0,
      "message": "Tri thức ${req.body.concept} đã được xóa!"
    }`);
  } 
  else {
    res.end(`{
      "exitcode": 1,
      "message": "Lỗi không xác định!\nCó lỗi trong quá trình cập nhật tri thức."
    }`);
  }
});


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
