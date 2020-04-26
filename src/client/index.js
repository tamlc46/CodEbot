// import "bootstrap";
// import "bootstrap/js/dist/collapse";

// import $ from 'jquery';

import io from "socket.io-client";

console.log("Document Loaded!");

if (window.innerWidth <= 768)
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

// var socket = io();

// var card_template =
//   '<div class="card"><div class="card-header p-0"><a data-toggle="collapse" data-target="#{{ id }}" aria-expanded="true" aria-controls="{{ id }}"><i class="fas fa-caret-down"></i> {{ question }}</a></div><div id="{{ id }}" class="collapse show"><div class="card-body"><pre>{{ answer }}</pre></div></div></div>';

// socket.on("connect", () => {
//   console.log("Connected to Server");
// });

// socket.on("answer", msg => {
//   var box = $("#messages-view");

//   var card = card_template
//     .replace(/{{ id }}/g, msg.id)
//     .replace(/{{ question }}/g, msg.question)
//     .replace(/{{ answer }}/g, msg.answer);

//   box.append(card);
//   box.animate({ scrollTop: box.prop("scrollHeight") }, 1000);

//   $(`#${msg.id}`).on("hide.bs.collapse", () => {
//     var symbol = $(`#${msg.id}`)
//       .parent()
//       .find(".card-header a i");

//     symbol.removeClass("fa-caret-down");
//     symbol.addClass("fa-caret-right");
//   });

//   $(`#${msg.id}`).on("show.bs.collapse", () => {
//     var symbol = $(`#${msg.id}`)
//       .parent()
//       .find(".card-header a i");

//     symbol.removeClass("fa-caret-right");
//     symbol.addClass("fa-caret-down");
//   });
// });

// $("#chatbox").submit(event => {
//   event.preventDefault();

//   var value = $("#message")
//     .val()
//     .trim();

//   if (value != "") {
//     socket.emit("ask", {
//       id: id_generator(),
//       question: value
//     });
//   }
//   $("#message").val("");
//   $("#message").change();
// });

// // Autoresize message Input area
// (function() {
//   var msgInp = $("#message");
//   var msgBtn = $("#chatbox #outbound button");

//   function resize() {
//     msgInp.css("height", "40px");
//     msgInp.css("height", msgInp[0].scrollHeight + "px");

//     msgBtn.css("height", "40px");
//     msgBtn.css("height", msgInp[0].scrollHeight + "px");
//   }
//   /* 0-timeout to get the already changed msgInp */
//   function delayedResize() {
//     window.setTimeout(resize, 0);
//   }

//   msgInp.on("change", resize);
//   msgInp.on("cut", delayedResize);
//   msgInp.on("paste", delayedResize);
//   msgInp.on("drop", delayedResize);
//   msgInp.on("keydown", event => {
//     if (event.keyCode == 13) {
//       event.preventDefault();

//       if (event.ctrlKey) {
//         event.target.value = event.target.value + "\n";
//       } else {
//         $("#chatbox").submit();
//       }
//     }
//     delayedResize();
//   });

//   msgInp.focus();
//   msgInp.select();
//   resize();
// })();

// function id_generator() {
//   // Math.random should be unique because of its seeding algorithm.
//   // Convert it to base 36 (numbers + letters), and grab the first 9 characters
//   // after the decimal.
//   return (
//     "_" +
//     Math.random()
//       .toString(36)
//       .substr(2, 9)
//   );
// }
