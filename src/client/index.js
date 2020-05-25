import io from "socket.io-client";
import marked from "marked";
import hljs from "./highlight";
import {throttle, debounce} from "throttle-debounce";

marked.setOptions({
  renderer: new marked.Renderer(),
  highlight: function(code, language) {
    const validLanguage = hljs.getLanguage(language) ? language : 'bash';
    return hljs.highlight(validLanguage, code).value;
  },
  pedantic: false,
  gfm: true,
  breaks: true,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false
});

console.log("Document Loaded!");

const chat_text = document.getElementById("chat-text");
const chat_submit = document.getElementById("chat-submit");
var socket;

if (window.innerWidth <= 1024)
{
  console.log("Mobile View! Width:", window.innerWidth);
  let info = document.getElementById("information");
  let show_info = document.getElementsByClassName("show-info")[0];
  info.classList.remove("show");

  show_info.onclick = function (ev) {
    console.log(ev.target);
    if (!info.classList.contains("show")) info.classList.add("show");
  };

  info.onclick = function (ev) {
    if (ev.target == show_info) return;
    console.log(ev.target, show_info);
    if (info.classList.contains("show")) info.classList.remove("show");
  };
}

chat_text.onkeydown = function (ev) {
  let value = chat_text.value;

  if (ev.keyCode == 13) {  // Enter key pressed
    ev.preventDefault();
    console.log(value.endsWith("\n"));
    if (value.length > 0 && 
        !value.endsWith("\n") && 
        (ev.ctrlKey || ev.shiftKey)) {

      chat_text.value = value + "\n";
      chat_text.dispatchEvent(new InputEvent("input"));
    } else {
      chat_submit.click();
    }
  }
};

chat_text.oninput = function (ev) {
  let value = chat_text.value;
  chat_submit.disabled = !(value.length != 0);
};

chat_submit.onclick = function (ev) {
  let value = chat_text.value.trim();

  if (socket == null || !socket.connected)
    show_status("Không thể gửi tin nhắn!", "fas fa-times-circle", "error", 3);
  if (value == "") return;

  chat_text.value = "";
  chat_text.dispatchEvent(new InputEvent("input"));

  // Clean input text
  value = value.split("\n").map(x => x.trim()).join("\n");
  console.log(value)

  user_bubble(value);
  socket.emit("ask", {
    id: id_generator(),
    question: value
  });
}

function user_bubble(text) {
  let msg_list = document.querySelector("#chatbox .chatview .message-list");
  let bubble = `<div class="row user-message message justify-content-end"><div class="chat-bubble">${text.replace(/\n+/g, "<br>")}</div><div class="avatar"></div></div>`;
  
  msg_list.insertAdjacentHTML("beforeend", bubble);
  scroll_to_bottom();
}

function codebot_bubble(raw_text) {
  let parsed = marked(raw_text);
  console.log(parsed);
  let msg_list = document.querySelector("#chatbox .chatview .message-list");
  let bubble = `<div class="row bot-message message"><div class="avatar"></div><div class="chat-bubble">${parsed}</div></div>`;
  
  let scrollHeight = msg_list.scrollHeight;
  msg_list.insertAdjacentHTML("beforeend", bubble);
  if (msg_list.scrollTop + msg_list.clientHeight >= scrollHeight - 200) {
    msg_list.scrollTop = msg_list.scrollHeight;
  }
  else {
    // Show statusbar
    let status = show_status("Có tin nhắn mới!", "fas fa-comments", "info", 0);
    let msg_list = document.querySelector("#chatbox .chatview .message-list");
    let chatview = document.querySelector("#chatbox .chatview");

    msg_list.onscroll = throttle(300, false, () => {
      if (msg_list.scrollTop + chatview.offsetHeight == msg_list.scrollHeight)
        status.click();
    });
    status.onclick = function(ev) {
      close_status();
      scroll_to_bottom();
      status.onclick = null;
      msg_list.onscroll.cancel();
      msg_list.onscroll = null;
    };
  }
}

const scroll_to_bottom = debounce(300, false, () => {
  let msg_list = document.querySelector("#chatbox .chatview .message-list");
  msg_list.scrollTop = msg_list.scrollHeight;
});

function show_status(msg, fa_icon, type="info", timeup=3) {
  let status = document.querySelector("#chatbox .chat-status");
  let status_dom = `<div class="${type}"><i class="${fa_icon}"></i> ${msg}</div>`;

  status.innerHTML = status_dom;
  status.classList.toggle("show", true);

  if (timeup > 0)
    setTimeout(close_status, timeup*1000);

  return status;
}

function close_status() {
  let status = document.querySelector("#chatbox .chat-status");
  status.classList.toggle("show", false);
}

function connect_ws() {
  show_status("Đang kết nối...", "fas fa-spinner fa-spin", "info", 0);
  socket = io();

  socket.on("connect", () => {
    show_status("Kết nối thành công!", "fas fa-check-circle", "success", 3);
  });

  socket.on("connect_error", (error) => {
    show_status("Kết nối thất bại!", "fas fa-times-circle", "error", 3);
  });

  socket.on("reconnecting", (number) => {
    show_status("Đang thử kết nối lại...", "fas fa-spinner fa-spin", "info", 0);
  });

  socket.on("answer", (data) => {
    console.log(data);
	data = JSON.parse(data);
	if (Array.isArray(data)) {
    show_status("Đang soạn...", "", "info", 0);
    setTimeout(function print_single() {
      let next_time = data[0].split(" ").length / 5 * 1000;
      // console.log(next_time);
      close_status();
      codebot_bubble(data.shift());
      
      if (data.length > 0){
        show_status("Đang soạn...", "", "info", 0);
        setTimeout(print_single, next_time);
      }
    }, 25);
	}
	else {
	  codebot_bubble(data);
	}
  })
}

connect_ws();

function id_generator() {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return (
    "_" +
    Math.random()
      .toString(36)
      .substr(2, 9)
  );
}
