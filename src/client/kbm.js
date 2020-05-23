import "bootstrap";
import $ from "jquery";
import Swal from "sweetalert2";

let list = $("#knowledge-list tbody");
let editor_wrapper = $("#editor-wrapper");
let editor = $("#knowledge-editor");
let current_edit = "";
let data = {};

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
        $(`#context-${context}__${intent}`).val(data[concept][context][intent].join("\n\n"));
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

  let context = ["general", "cpp", "py"];
  let intent = ["define", "apply", "compare", "__source__"];

  let kb = {
    old_concept: current_edit,
    concept: $("#concept").val()
  };

  context.forEach(c => {
    if ($(`#context-${c}__switch`)[0].checked) {
      kb[c] = {};
      intent.forEach(i => {
        if ($(`#context-${c}__${i}`).val().trim() != "") {
          if (i == "__source__") {
            kb[c][i] = $(`#context-${c}__${i}`).val().trim().split("\n");
            
          }
          else {
            kb[c][i] = $(`#context-${c}__${i}`).val().trim().split("\n\n");
          }
        }
      })
    }
  })

  // console.log(kb);

  if (kb["old_concept"]) {
    update_kb(kb);
  }
  else {
    add_kb(kb);
  }
});

load_list();
