import "bootstrap";
import $ from "jquery";
import Swal from "sweetalert2";
import {debounce} from "throttle-debounce";
import marked from "marked";
import hljs from "./highlight";

const contexts = ["general", "cpp", "py"];
const intents = ["define", "apply", "compare", "__source__"];

let list = $("#knowledge-list tbody");
let editor_wrapper = $("#editor-wrapper");
let editor = $("#knowledge-editor");
let current_edit = "";
let data = {};

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

function get_data() {
  $.ajax("/kbm/list", {
    method: "GET",
    async: false,
    success: function (kb_json){
      data = kb_json;
      // console.log(data["c++"]);
    },
    error: function(error) {
      console.log(error);
    }
  })
}


function update_kb(kb) {
  $.ajax("/kbm/update", {
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(kb),
    success: function (result) {
      if (result.exitcode == 0) {
        Swal.fire({
          title: "Thành công",
          text: result.message,
          icon: "success"
        });
      }
      else {
        Swal.fire({
          title: "Lỗi",
          text: result.message,
          icon: "error"
        });
      }

      editor_wrapper.modal("hide");
      load_list();
    },
    error: function (err) {
      console.log(err);
    }
  });
}

function add_kb(kb) {
  $.ajax("/kbm/add", {
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(kb),
    success: function (result) {
      if (result.exitcode == 0) {
        Swal.fire({
          title: "Thành công",
          text: result.message,
          icon: "success"
        });
      }
      else {
        Swal.fire({
          title: "Lỗi",
          text: result.message,
          icon: "error"
        });
      }

      editor_wrapper.modal("hide");
      load_list();
    },
    error: function (err) {
      console.log(err);
    }
  });
}

function delete_kb(concept) {
  Swal.fire({
    title: "XÁC NHẬN",
    html: `Bạn có chắc chắn muốn xóa khái niệm ${concept}?<br/>Tri thức sẽ không thể được khôi phục một khi đã xóa!`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "rgb(162, 162, 162)",
    confirmButtonText: "XÓA",
    cancelAButtonText: "Hủy!"
  }).then((result) => {
    if (result.value) {
      $.ajax("/kbm/delete", {
        method: "POST",
        contentType: "application/json",
        data: `{"concept": "${concept}"}`,
        success: function (result) {
          if (result.exitcode == 0) {
            Swal.fire({
              title: "Đã xóa",
              text: result.message,
              icon: "success"
            });
          }
          else {
            Swal.fire({
              title: "Lỗi",
              text: result.message,
              icon: "error"
            });
          }
          
          load_list();
        },
        error: function (err) {
          console.log(err);
        }
      });
    }
  });
}

function load_list() {
  get_data();
  list.html("");

  Object.keys(data).forEach(concept => {
    console.log(data[concept]);
    let child = $(`<tr><td>${concept}</td><td>${Object.keys(data[concept]).join(", ")}</td><td><button class="btn btn-primary" data-toggle="tooltip" data-placement="bottom" title="Chỉnh sửa"><i class="fas fa-pencil-alt"></i></button><button class="btn btn-danger" data-toggle="tooltip" data-placement="bottom" title="Xóa"><i class="fas fa-eraser"></i></button></td></tr>`);

    $(child).find("button[title='Chỉnh sửa']").click((ev) => {
      load_editor(concept);
    })

    $(child).find("button[title='Xóa']").click((ev) => {
      delete_kb(concept);
    })

    list.append(child);
  })
}

function load_editor(concept) {
  console.log("Editor", concept);
  current_edit = concept;

  editor_wrapper.modal("show");

  if (concept == "") return;

  $("#concept").val(concept);
  Object.keys(data[concept]).forEach(context => {
    console.log(context);
    $(`#context-${context}__switch`).click();

    Object.keys(data[concept][context]).forEach(intent => {
      if (intent == "__source__") {
        $(`#context-${context}__${intent}`).val(data[concept][context][intent].join("\n"));
      }
      else {
        $(`#context-${context}__${intent}`).val(data[concept][context][intent].join("\n%break;\n"));
      }
    })
  })
}

editor_wrapper.on("hide.bs.modal", (ev) => {
  // Reset form
  editor.trigger("reset");
  current_edit = "";
  $("#context-general").collapse("hide");
  $("#context-cpp").collapse("hide");
  $("#context-py").collapse("hide");
});

$("#refresh").click(load_list);
$("#add-new").click((ev) => {load_editor("")});

editor.submit(ev => {
  ev.preventDefault();
  console.log("Submitted!");
  console.log(editor.serializeArray());

  let kb = {
    old_concept: current_edit,
    concept: $("#concept").val()
  };

  contexts.forEach(context => {
    if ($(`#context-${context}__switch`)[0].checked) {
      kb[context] = {};
      intents.forEach(intent => {
        if ($(`#context-${context}__${intent}`).val().trim() != "") {
          if (intent == "__source__") {
            kb[context][intent] = $(`#context-${context}__${intent}`).val().split("\n").map(x => {console.log(x); return x.trim()});
            
          }
          else {
            kb[context][intent] = $(`#context-${context}__${intent}`).val().split("%break;").map(x =>{console.log(x); return x.trim()});
          }
        }
      });

      if ($.isEmptyObject(kb[context])) {
        delete kb[context];
      }
    }
  })

  console.log(kb);

  if (kb["old_concept"]) {
    update_kb(kb);
  }
  else {
    add_kb(kb);
  }
});

contexts.forEach(context => {
  intents.forEach(intent => {
    let dom = $(`#context-${context}__${intent}`)

    function create_popover() {
      dom.popover("dispose");

      let raw_text = dom.val();
      let markdown_dom = marked(raw_text.replace(/%break;/g, "\n\n--------------------"));

      dom.popover({
        placement: "bottom",
        trigger: "none",
        html: true,
        title: "Xem trước Markdown",
        content: markdown_dom
      });

      dom.popover("show");
      return ;
    }

    // function create_markdown()

    dom.focusin(ev => {
      create_popover();
    });

    let update = debounce(250, false, () => {
      console.log("Hello World");
      create_popover();
    })

    dom.on("input", ev => {
      update();
    });

    dom.focusout(ev => {
      dom.popover("dispose");
    });
  });
});

load_list();
