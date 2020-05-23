const fs = require("fs");

class KBM {
  constructor (filepath) {
    this.filepath = filepath;
    this.data = {};
    this.fd = null;
  }

  load_kb() {
    let kb_json = fs.readFileSync(this.filepath,{encoding: "utf-8"});
    this.data = JSON.parse(kb_json);      
  }

  save_kb() {
    try {
      fs.writeFileSync(this.filepath, JSON.stringify(this.data));
      return true;
    }
    catch (exception) {
      return false;
    }
  }

  get_json() {
    return JSON.stringify(this.data);
  }
    
  add_kb(kb) {
    let concept = kb.concept;

    delete kb["concept"];
    delete kb["old_concept"];

    this.data[concept] = kb;

    return this.save_kb();
  }

  update_kb(kb) {
    let {old_concept, concept} = kb;
    delete kb["concept"];
    delete kb["old_concept"];

    this.data[concept] = kb;

    if (concept != old_concept) {
      return this.remove_kb(old_concept);
    }

    return this.save_kb();
  }

  delete_kb(concept) {
    if (concept in this.data) {
      delete this.data[concept];
      return this.save_kb();
    }
    else {
      return false;
    }
  }
}

module.exports = KBM;