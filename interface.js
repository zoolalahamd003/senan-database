// ==================== CONSTANTS ====================

const API_BASE = "https://senan-database.onrender.com";

// Real shoe colors -> a swatch color to render. Keep this list in
// sync with COLOR_PALETTE in server.js.
const COLOR_PALETTE = [
  { value: "BLACK", label: "Black", swatch: "#111318" },
  { value: "WHITE", label: "White", swatch: "#F5F5F5" },
  { value: "RED", label: "Red", swatch: "#D63A2E" },
  { value: "NAVY", label: "Navy", swatch: "#1F3358" },
  { value: "ROYAL_BLUE", label: "Royal blue", swatch: "#2A5CDB" },
  { value: "GREY", label: "Grey", swatch: "#8B8F98" },
  { value: "BEIGE", label: "Beige", swatch: "#D8C4A0" },
  { value: "BROWN", label: "Brown", swatch: "#6B4226" },
  { value: "GREEN", label: "Green", swatch: "#2E7D4F" },
  { value: "OLIVE", label: "Olive", swatch: "#6B6B2A" },
  { value: "ORANGE", label: "Orange", swatch: "#E8722C" },
  { value: "YELLOW", label: "Yellow", swatch: "#E6C229" },
  { value: "PINK", label: "Pink", swatch: "#E38AAE" },
  { value: "PURPLE", label: "Purple", swatch: "#6C4A9C" },
  { value: "MAROON", label: "Maroon", swatch: "#7A2331" },
  { value: "GOLD", label: "Gold", swatch: "#C9A227" },
  { value: "SILVER", label: "Silver", swatch: "#B9BEC7" },
  {
    value: "MULTICOLOR",
    label: "Multicolor",
    swatch:
      "conic-gradient(from 90deg, #D63A2E, #E6C229, #2E7D4F, #2A5CDB, #6C4A9C, #D63A2E)",
  },
];

const GENDER_OPTIONS = [
  { value: "MALE", label: "Men" },
  { value: "FEMALE", label: "Women" },
  { value: "UNISEX", label: "Unisex" },
];

const CONDITION_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "USED", label: "Used" },
];

function colorMeta(value) {
  return COLOR_PALETTE.find((c) => c.value === value.toUpperCase());
}

// ==================== LOADING OVERLAY ====================

const loadingOverlay = document.getElementById("loadingOverlay");

function showLoading() {
  loadingOverlay.style.display = "flex";
}

function hideLoading() {
  loadingOverlay.style.display = "none";
}

// ==================== VALIDATION / ERROR MODAL ====================

const emptyinputmodal = document.getElementById("emptyinputmodal");
const emptyinputmessage = document.getElementById("emptyinputmessage");
const closeemptyinputmodal = document.getElementById("closeemptyinputmodal");

function showMessage(text) {
  emptyinputmessage.textContent = text;
  emptyinputmodal.classList.add("active");
}

closeemptyinputmodal.addEventListener("click", function () {
  emptyinputmodal.classList.remove("active");
});

// ==================== ADD-SHOE FORM ELEMENTS ====================

let companyinput = document.getElementById("companyinput");
let shoenameinput = document.getElementById("shoenameinput");
let imageinput = document.getElementById("imageinput");
let priceinput = document.getElementById("priceinput");
let genderinput = document.getElementById("genderinput");
let conditioninput = document.getElementById("conditioninput");
let addinputbtn = document.getElementById("addinputbtn");
let shoeform = document.getElementById("shoeform");
let form = document.getElementById("form");

let images;

imageinput.addEventListener("change", function () {
  images = imageinput.files;
});

console.log("js connected");

let shoearray = [];
let tablerow = document.getElementById("tablerow");

// ==================== COLOR SWATCH PICKER (add form) ====================

const colorpicker = document.getElementById("colorpicker");
let selectedColors = [];

function buildSwatchPicker(container, selected, onToggle) {
  container.innerHTML = "";
  COLOR_PALETTE.forEach(function (color) {
    let swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = "swatch";
    swatch.title = color.label;
    swatch.style.background = color.swatch;
    if (color.value === "WHITE") swatch.classList.add("swatch-outline");
    if (selected.includes(color.value)) swatch.classList.add("selected");

    swatch.addEventListener("click", function () {
      onToggle(color.value);
    });

    container.append(swatch);
  });
}

function refreshFormColorPicker() {
  buildSwatchPicker(colorpicker, selectedColors, function (value) {
    let index = selectedColors.indexOf(value);
    if (index === -1) selectedColors.push(value);
    else selectedColors.splice(index, 1);
    refreshFormColorPicker();
  });
}

refreshFormColorPicker();

// ==================== SIZE + STOCK REPEATER (add form) ====================

const sizerows = document.getElementById("sizerows");
const addsizerowbtn = document.getElementById("addsizerowbtn");
let sizeRowCount = 0;

function addSizeRow(sizeValue, stockValue) {
  sizeRowCount++;
  let row = document.createElement("div");
  row.className = "sizerow";

  let sizeInput = document.createElement("input");
  sizeInput.type = "number";
  sizeInput.placeholder = "Size, e.g. 8";
  sizeInput.className = "sizerow-size";
  sizeInput.min = "1";
  if (sizeValue !== undefined) sizeInput.value = sizeValue;

  let stockInput = document.createElement("input");
  stockInput.type = "number";
  stockInput.placeholder = "Pairs in stock";
  stockInput.className = "sizerow-stock";
  stockInput.min = "0";
  if (stockValue !== undefined) stockInput.value = stockValue;

  let removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "sizerow-remove";
  removeBtn.textContent = "✕";
  removeBtn.addEventListener("click", function () {
    row.remove();
  });

  row.append(sizeInput, stockInput, removeBtn);
  sizerows.append(row);
}

addsizerowbtn.addEventListener("click", function () {
  addSizeRow();
});

addSizeRow();

function collectSizeRows(container) {
  let rows = container.querySelectorAll(".sizerow");
  let sizes = [];
  rows.forEach(function (row) {
    let size = row.querySelector(".sizerow-size").value;
    let stock = row.querySelector(".sizerow-stock").value;
    if (size !== "" && stock !== "") {
      sizes.push({ size: Number(size), stock: Number(stock) });
    }
  });
  return sizes;
}

// ==================== STATS ====================

function updateStats() {
  let totalStock = 0;
  shoearray.forEach(function (shoe) {
    (shoe.sizes || []).forEach(function (row) {
      totalStock += row.stock;
    });
  });
  document.getElementById("statpairs").textContent = totalStock;
  document.getElementById("statmodels").textContent = shoearray.length;
}

// ==================== GET SHOES ====================

async function getshoes() {
  try {
    showLoading();

    let response = await fetch(`${API_BASE}/shoes`);
    shoearray = await response.json();

    displayshoes();
  } catch (error) {
    console.log(error);
  } finally {
    hideLoading();
  }
}

getshoes();

// ==================== DISPLAY SHOES ====================

function displayshoes() {
  tablerow.innerHTML = "";
  for (let i = 0; i < shoearray.length; i++) {
    addShoeToTable(shoearray[i]);
  }
  updateStats();
}

// ==================== ADD SHOE (submit) ====================

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  let sizes = collectSizeRows(sizerows);

  if (
    companyinput.value.trim() === "" ||
    shoenameinput.value.trim() === "" ||
    genderinput.value.trim() === "" ||
    conditioninput.value.trim() === "" ||
    priceinput.value === ""
  ) {
    showMessage("Please fill in the brand, name, price, gender and condition.");
    return;
  }

  if (selectedColors.length === 0) {
    showMessage("Pick at least one color for this shoe.");
    return;
  }

  if (sizes.length === 0) {
    showMessage("Add at least one size with its stock count.");
    return;
  }

  let formdata = new FormData();
  formdata.append("company", companyinput.value);
  formdata.append("shoename", shoenameinput.value);
  formdata.append("price", Number(priceinput.value));
  formdata.append("gender", genderinput.value);
  formdata.append("condition", conditioninput.value);
  formdata.append("colors", JSON.stringify(selectedColors));
  formdata.append("sizes", JSON.stringify(sizes));

  if (images) {
    for (let i = 0; i < images.length; i++) {
      formdata.append("images", images[i]);
    }
  }

  try {
    showLoading();

    let response = await fetch(`${API_BASE}/shoes`, {
      method: "POST",
      body: formdata,
    });

    if (response.status == 409) {
      let modaloverlay = document.getElementById("modaloverlay");
      let brandmodal = document.getElementById("brandmodal");
      let shoemodal = document.getElementById("shoemodal");

      modaloverlay.classList.add("active");
      brandmodal.textContent = "Brand: " + companyinput.value.toUpperCase();
      shoemodal.textContent = "Shoe: " + shoenameinput.value.toUpperCase();
      return;
    }

    if (response.ok) {
      let savedobject = await response.json();
      shoearray.push(savedobject);
      displayshoes();

      form.reset();
      imageinput.value = "";
      images = null;
      selectedColors = [];
      refreshFormColorPicker();
      sizerows.innerHTML = "";
      sizeRowCount = 0;
      addSizeRow();
    } else {
      let errorbody = await response.json().catch(function () {
        return {};
      });
      showMessage(errorbody.message || "Could not save this shoe.");
    }
  } catch (error) {
    console.log(error);
  } finally {
    hideLoading();
  }
});

// ==================== DUPLICATE MODAL CLOSE ====================

document
  .getElementById("closemodalbtn")
  .addEventListener("click", function () {
    document.getElementById("modaloverlay").classList.remove("active");
  });

// ==================== INLINE EDIT (shared PATCH helper) ====================

async function patchShoe(id, fieldsObject) {
  let formdata = new FormData();
  Object.keys(fieldsObject).forEach(function (key) {
    let value = fieldsObject[key];
    formdata.append(
      key,
      typeof value === "object" ? JSON.stringify(value) : value,
    );
  });

  showLoading();
  try {
    let response = await fetch(`${API_BASE}/shoes/${id}`, {
      method: "PATCH",
      body: formdata,
    });

    if (!response.ok) {
      let errorbody = await response.json().catch(function () {
        return {};
      });
      showMessage(errorbody.message || "Could not save that change.");
      return null;
    }

    return await response.json();
  } catch (error) {
    console.log(error);
    showMessage("Could not reach the server. Please try again.");
    return null;
  } finally {
    hideLoading();
  }
}

// Turns a <td> into a text/number input; commits on blur or Enter,
// cancels on Escape, and always saves via PATCH with only the one
// changed field.
function makeCellEditable(cell, shoe, fieldName, options) {
  options = options || {};
  cell.classList.add("editable-cell");

  cell.addEventListener("click", function startEdit() {
    if (cell.classList.contains("editing")) return;
    cell.classList.add("editing");

    let currentText = cell.textContent;
    let input = document.createElement("input");
    input.type = options.type || "text";
    input.value = options.rawValue !== undefined ? options.rawValue : currentText;
    input.className = "cell-input";

    cell.textContent = "";
    cell.append(input);
    input.focus();
    input.select();

    let finished = false;

    async function commit() {
      if (finished) return;
      finished = true;

      let newValue = input.value.trim();
      cell.classList.remove("editing");

      if (newValue === "" || newValue === String(options.rawValue ?? currentText)) {
        cell.textContent = currentText;
        return;
      }

      let patchValue = options.type === "number" ? Number(newValue) : newValue;
      let updated = await patchShoe(shoe._id, { [fieldName]: patchValue });

      if (updated) {
        Object.assign(shoe, updated);
        cell.textContent = options.format
          ? options.format(updated)
          : String(updated[fieldName]);
      } else {
        cell.textContent = currentText;
      }
    }

    function cancel() {
      if (finished) return;
      finished = true;
      cell.classList.remove("editing");
      cell.textContent = currentText;
    }

    input.addEventListener("blur", commit);
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") input.blur();
      if (event.key === "Escape") {
        input.removeEventListener("blur", commit);
        cancel();
      }
    });
  });
}

// Turns a <td> into a <select>; commits immediately on change.
function makeCellSelectable(cell, shoe, fieldName, options) {
  cell.classList.add("editable-cell");

  cell.addEventListener("click", function startEdit() {
    if (cell.classList.contains("editing")) return;
    cell.classList.add("editing");

    let currentText = cell.textContent;
    let select = document.createElement("select");
    select.className = "cell-input";

    options.forEach(function (option) {
      let optionEl = document.createElement("option");
      optionEl.value = option.value;
      optionEl.textContent = option.label;
      if (shoe[fieldName].toUpperCase() === option.value) {
        optionEl.selected = true;
      }
      select.append(optionEl);
    });

    cell.textContent = "";
    cell.append(select);
    select.focus();

    async function commit() {
      cell.classList.remove("editing");
      let newValue = select.value;

      if (newValue === shoe[fieldName].toUpperCase()) {
        cell.textContent = currentText;
        return;
      }

      let updated = await patchShoe(shoe._id, { [fieldName]: newValue });

      if (updated) {
        Object.assign(shoe, updated);
        let matched = options.find((o) => o.value === updated[fieldName]);
        cell.textContent = matched ? matched.label : updated[fieldName];
      } else {
        cell.textContent = currentText;
      }
    }

    select.addEventListener("change", commit);
    select.addEventListener("blur", function () {
      if (cell.classList.contains("editing")) {
        cell.classList.remove("editing");
        cell.textContent = currentText;
      }
    });
  });
}

// Colors cell: click opens an inline swatch popover with a Save button.
function makeColorsCellEditable(cell, shoe) {
  cell.classList.add("editable-cell");
  renderColorChips(cell, shoe.colors || []);

  cell.addEventListener("click", function (event) {
    if (cell.classList.contains("editing")) return;
    cell.classList.add("editing");

    let working = (shoe.colors || []).slice();
    let popover = document.createElement("div");
    popover.className = "cell-popover";

    let picker = document.createElement("div");
    picker.className = "swatchpicker";
    popover.append(picker);

    function refresh() {
      buildSwatchPicker(picker, working, function (value) {
        let index = working.indexOf(value);
        if (index === -1) working.push(value);
        else working.splice(index, 1);
        refresh();
      });
    }
    refresh();

    let saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "ghostbtn";
    saveBtn.textContent = "Save";
    popover.append(saveBtn);

    cell.innerHTML = "";
    cell.append(popover);

    saveBtn.addEventListener("click", async function (clickEvent) {
      clickEvent.stopPropagation();

      if (working.length === 0) {
        showMessage("Pick at least one color for this shoe.");
        return;
      }

      let updated = await patchShoe(shoe._id, { colors: working });
      cell.classList.remove("editing");

      if (updated) {
        Object.assign(shoe, updated);
      }
      renderColorChips(cell, shoe.colors || []);
    });

    function outsideClick(outsideEvent) {
      if (!cell.contains(outsideEvent.target)) {
        cell.classList.remove("editing");
        renderColorChips(cell, shoe.colors || []);
        document.removeEventListener("click", outsideClick, true);
      }
    }
    setTimeout(function () {
      document.addEventListener("click", outsideClick, true);
    }, 0);

    event.stopPropagation();
  });
}

function renderColorChips(cell, colors) {
  cell.innerHTML = "";
  let wrap = document.createElement("div");
  wrap.className = "colorchips";
  colors.forEach(function (value) {
    let meta = colorMeta(value);
    let dot = document.createElement("span");
    dot.className = "colordot";
    dot.title = meta ? meta.label : value;
    dot.style.background = meta ? meta.swatch : "#999";
    if (value === "WHITE") dot.classList.add("swatch-outline");
    wrap.append(dot);
  });
  cell.append(wrap);
}

// Sizes/stock cell: click opens an inline size-row editor with Save.
function makeSizesCellEditable(cell, shoe) {
  cell.classList.add("editable-cell");
  renderSizeChips(cell, shoe.sizes || []);

  cell.addEventListener("click", function (event) {
    if (cell.classList.contains("editing")) return;
    cell.classList.add("editing");

    let popover = document.createElement("div");
    popover.className = "cell-popover";

    let rowsContainer = document.createElement("div");
    popover.append(rowsContainer);

    function addRow(sizeValue, stockValue) {
      let row = document.createElement("div");
      row.className = "sizerow";

      let sizeInput = document.createElement("input");
      sizeInput.type = "number";
      sizeInput.placeholder = "Size";
      sizeInput.className = "sizerow-size";
      sizeInput.value = sizeValue;

      let stockInput = document.createElement("input");
      stockInput.type = "number";
      stockInput.placeholder = "Stock";
      stockInput.className = "sizerow-stock";
      stockInput.value = stockValue;

      let removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "sizerow-remove";
      removeBtn.textContent = "✕";
      removeBtn.addEventListener("click", function () {
        row.remove();
      });

      row.append(sizeInput, stockInput, removeBtn);
      rowsContainer.append(row);
    }

    (shoe.sizes || []).forEach(function (row) {
      addRow(row.size, row.stock);
    });
    if ((shoe.sizes || []).length === 0) addRow("", "");

    let addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "ghostbtn";
    addBtn.textContent = "+ Add size";
    addBtn.addEventListener("click", function (clickEvent) {
      clickEvent.stopPropagation();
      addRow("", "");
    });
    popover.append(addBtn);

    let saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "ghostbtn";
    saveBtn.textContent = "Save";
    popover.append(saveBtn);

    cell.innerHTML = "";
    cell.append(popover);

    saveBtn.addEventListener("click", async function (clickEvent) {
      clickEvent.stopPropagation();
      let sizes = collectSizeRows(rowsContainer);

      if (sizes.length === 0) {
        showMessage("Add at least one size with its stock count.");
        return;
      }

      let updated = await patchShoe(shoe._id, { sizes: sizes });
      cell.classList.remove("editing");

      if (updated) {
        Object.assign(shoe, updated);
      }
      renderSizeChips(cell, shoe.sizes || []);
      updateStats();
    });

    function outsideClick(outsideEvent) {
      if (!cell.contains(outsideEvent.target)) {
        cell.classList.remove("editing");
        renderSizeChips(cell, shoe.sizes || []);
        document.removeEventListener("click", outsideClick, true);
      }
    }
    setTimeout(function () {
      document.addEventListener("click", outsideClick, true);
    }, 0);

    event.stopPropagation();
  });
}

function renderSizeChips(cell, sizes) {
  cell.innerHTML = "";
  let wrap = document.createElement("div");
  wrap.className = "sizechips";
  sizes.forEach(function (row) {
    let chip = document.createElement("span");
    chip.className = "sizechip";
    if (row.stock === 0) chip.classList.add("sizechip-out");
    chip.textContent = "UK " + row.size + " · " + row.stock;
    wrap.append(chip);
  });
  cell.append(wrap);
}

// ==================== ADD SHOE TO TABLE ====================

function addShoeToTable(shoe) {
  let row = document.createElement("tr");

  let companycell = document.createElement("td");
  let shoenamecell = document.createElement("td");
  let imagecell = document.createElement("td");
  let colorscell = document.createElement("td");
  let sizescell = document.createElement("td");
  let pricecell = document.createElement("td");
  let gendercell = document.createElement("td");
  let conditioncell = document.createElement("td");
  let actioncell = document.createElement("td");

  // ---- image slider ----
  if (shoe.images && shoe.images.length > 0) {
    let slider = document.createElement("div");
    slider.classList.add("slider");

    let previousBtn = document.createElement("button");
    let nextBtn = document.createElement("button");
    previousBtn.textContent = "‹";
    nextBtn.textContent = "›";

    slider.append(previousBtn);

    let currentimageindex = 0;
    let image = document.createElement("img");
    image.src = `${API_BASE}/images/${shoe.images[currentimageindex]}`;
    slider.append(image);
    slider.append(nextBtn);
    imagecell.append(slider);

    function showimage() {
      let imageid = shoe.images[currentimageindex];
      image.classList.add("changing");
      setTimeout(function () {
        image.src = `${API_BASE}/images/${imageid}`;
        image.classList.remove("changing");
      }, 300);
    }

    nextBtn.addEventListener("click", function () {
      currentimageindex++;
      if (currentimageindex === shoe.images.length) currentimageindex = 0;
      showimage();
    });

    previousBtn.addEventListener("click", function () {
      currentimageindex--;
      if (currentimageindex < 0) currentimageindex = shoe.images.length - 1;
      showimage();
    });
  } else {
    imagecell.textContent = "No photo";
  }

  // ---- static/plain text on load, then wired for inline edit ----
  companycell.textContent = shoe.company.toUpperCase();
  shoenamecell.textContent = shoe.shoename.toUpperCase();
  pricecell.textContent = shoe.price;
  gendercell.textContent =
    (GENDER_OPTIONS.find((g) => g.value === shoe.gender.toUpperCase()) || {})
      .label || shoe.gender;
  conditioncell.textContent =
    (
      CONDITION_OPTIONS.find(
        (c) => c.value === shoe.condition.toUpperCase(),
      ) || {}
    ).label || shoe.condition;

  makeCellEditable(companycell, shoe, "company", {
    rawValue: shoe.company,
    format: (updated) => updated.company.toUpperCase(),
  });
  makeCellEditable(shoenamecell, shoe, "shoename", {
    rawValue: shoe.shoename,
    format: (updated) => updated.shoename.toUpperCase(),
  });
  makeCellEditable(pricecell, shoe, "price", {
    type: "number",
    rawValue: shoe.price,
    format: (updated) => updated.price,
  });
  makeCellSelectable(gendercell, shoe, "gender", GENDER_OPTIONS);
  makeCellSelectable(conditioncell, shoe, "condition", CONDITION_OPTIONS);
  makeColorsCellEditable(colorscell, shoe);
  makeSizesCellEditable(sizescell, shoe);

  // ---- delete ----
  let shoedeletebtn = document.createElement("button");
  shoedeletebtn.textContent = "🗑";
  shoedeletebtn.classList.add("shoedeletebtn");
  actioncell.append(shoedeletebtn);

  shoedeletebtn.addEventListener("click", async function () {
    let id = shoe._id;

    try {
      showLoading();

      let response = await fetch(`${API_BASE}/shoes/${id}`, {
        method: "DELETE",
      });

      if (response.status == 404) {
        showMessage("That shoe was already removed.");
        return;
      }

      if (response.ok) {
        shoearray = shoearray.filter((item) => item._id !== id);
        displayshoes();
      }
    } catch (error) {
      console.log(error);
    } finally {
      hideLoading();
    }
  });

  row.append(
    companycell,
    shoenamecell,
    imagecell,
    colorscell,
    sizescell,
    pricecell,
    gendercell,
    conditioncell,
    actioncell,
  );

  tablerow.append(row);
}

// ==================== SEARCH ====================

const searchmodal = document.getElementById("searchmodal");
const searchbox = document.getElementById("searchbox");
const closesearchmodal = document.getElementById("closesearchmodal");
const searchbrandinput = document.getElementById("searchbrandinput");
const performsearchbtn = document.getElementById("performsearchbtn");
const searchbtn = document.getElementById("searchbtn");
const resetbtn = document.getElementById("resetbtn");

resetbtn.style.display = "none";

searchbtn.addEventListener("click", function () {
  searchmodal.classList.add("active");
});

closesearchmodal.addEventListener("click", function () {
  searchmodal.classList.remove("active");
});

performsearchbtn.addEventListener("click", async function () {
  let searchinput = searchbrandinput.value;
  let response = await fetch(
    `${API_BASE}/shoes/search?company=${searchinput}`,
  );
  let data = await response.json();
  shoearray = data;
  displayshoes();
  searchmodal.classList.remove("active");
  searchbtn.style.display = "none";
  resetbtn.style.display = "inline-flex";
});

resetbtn.addEventListener("click", function () {
  searchbtn.style.display = "inline-flex";
  resetbtn.style.display = "none";
  getshoes();
});
