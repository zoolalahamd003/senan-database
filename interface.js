
// ==================== LOADING OVERLAY ====================

const loadingOverlay = document.getElementById("loadingOverlay");


function showLoading() {

  loadingOverlay.style.display = "flex";

}


function hideLoading() {

  loadingOverlay.style.display = "none";

}



let companyinput = document.getElementById("companyinput");

let shoenameinput = document.getElementById("shoenameinput");

let imageinput = document.getElementById("imageinput");

let priceinput = document.getElementById("priceinput");

let genderinput = document.getElementById("genderinput");

let conditioninput = document.getElementById("conditioninput");

let stockinput = document.getElementById("stockinput");

let sizeinput = document.getElementById("sizeinput");

let mode = "add";

let selectedshoeid;

let addinputbtn = document.getElementById("addinputbtn");

let emptyinputmodal = document.getElementById("emptyinputmodal");

let emptyinputmessage = document.getElementById("emptyinputmessage");

let closeemptyinputmodal = document.getElementById("closeemptyinputmodal");

let images;

imageinput.addEventListener("change", function () {
  images = imageinput.files;

  console.log(images);

  console.log(images[0]);
});

console.log("js connected");

let shoearray = [];

let shoeform = document.getElementById("shoeform");


// ==================== GET SHOES ====================

async function getshoes() {
  try {
    showLoading();

    let response = await fetch(`http://localhost:3000/shoes`);

    shoearray = await response.json();

    console.log(response);

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
  for (let i = 0; i < shoearray.length; i++) {
    let shoe = shoearray[i];

    addShoeToTable(shoe);
  }
}


let shoe = {};

let tablerow = document.getElementById("tablerow");

let closemodalbtn = document.getElementById("closemodalbtn");


// ==================== ADD / UPDATE ====================

shoeform.addEventListener("submit", async function (event) {
  console.log("shoeform");

  event.preventDefault();

  let size = Number(sizeinput.value);

  let price = Number(priceinput.value);

  let stock = Number(stockinput.value);


  if (
    companyinput.value.trim() === "" ||
    shoenameinput.value.trim() === "" ||
    genderinput.value.trim() === "" ||
    conditioninput.value.trim() === "" ||
    priceinput.value === "" ||
    stockinput.value === "" ||
    sizeinput.value === ""
  ) {
    emptyinputmodal.classList.add("active");

    emptyinputmessage.textContent =
      "PLEASE FILL ALL THE INFORMATION ABOUT THE SHOE";

    return;
  }


  shoe = {
    company: companyinput.value,
    shoename: shoenameinput.value,
    shoesize: size,
    price: price,
    gender: genderinput.value,
    condition: conditioninput.value,
    stock: stock,
  };


  let formdata = new FormData();

  formdata.append("company", shoe.company);

  formdata.append("shoename", shoe.shoename);

  formdata.append("shoesize", shoe.shoesize);

  formdata.append("price", price);

  formdata.append("gender", shoe.gender);

  formdata.append("condition", shoe.condition);

  formdata.append("stock", stock);


  if (images) {
    for (let i = 0; i < images.length; i++) {
      formdata.append("images", images[i]);
    }
  }


  // ==================== ADD ====================

  if (mode == "add") {

    try {

      showLoading();

      let response = await fetch("http://localhost:3000/shoes", {
        method: "POST",
        body: formdata,
      });


      if (response.status == 409) {

        let modaloverlay = document.getElementById("modaloverlay");

        let brandmodal = document.getElementById("brandmodal");

        let shoemodal = document.getElementById("shoemodal");

        modaloverlay.classList.add("active");

        brandmodal.textContent =
          "BRAND :" + companyinput.value.toUpperCase();

        shoemodal.textContent =
          "SHOE NAME :" + shoenameinput.value.toUpperCase();

        return;
      }


      if (response.ok) {

        console.log(response);

        let savedobject = await response.json();

        console.log(savedobject);

        addShoeToTable(savedobject);

        imageinput.value = "";

        images = null;
      }

    } catch (error) {

      console.log(error);

    } finally {

      hideLoading();

    }
  }


  // ==================== EDIT ====================

  else if (mode == "edit") {

    try {

      showLoading();

      let response = await fetch(
        `http://localhost:3000/shoes/${selectedshoeid}`,
        {
          method: "PATCH",
          body: formdata,
        },
      );


      if (response.ok) {

        let updatedshoe = await response.json();

        console.log(updatedshoe);
      }


      addinputbtn.textContent = "ADD SHOE";

      tablerow.textContent = "";

      companyinput.value = "NIKE";

      shoenameinput.value = "";

      imageinput.value = "";

      genderinput.value = "MALE";

      conditioninput.value = "USED";

      priceinput.value = "";

      stockinput.value = "";

      sizeinput.value = "";

      mode = "add";

      images = null;

      getshoes();

    } catch (error) {

      console.log(error);

    } finally {

      hideLoading();

    }
  }
});


// ==================== CLOSE DUPLICATE MODAL ====================

closemodalbtn.addEventListener("click", function () {
  modaloverlay.classList.remove("active");
});


// ==================== ADD SHOE TO TABLE ====================

function addShoeToTable(shoe) {

  let tablerow = document.getElementById("tablerow");

  let row = document.createElement("tr");

  let comapnycell = document.createElement("td");

  let shoenamecell = document.createElement("td");

  let imagecell = document.createElement("td");

  let pricecell = document.createElement("td");

  let gendercell = document.createElement("td");

  let conditioncell = document.createElement("td");

  let stockcell = document.createElement("td");

  let sizecell = document.createElement("td");

  let actioncell = document.createElement("td");

  if (shoe.images && shoe.images.length > 0) {

  let slider = document.createElement("div");

  slider.classList.add("slider");

  let previousBtn = document.createElement("button");

  let nextBtn = document.createElement("button");

  previousBtn.textContent = "Previous";

  nextBtn.textContent = "Next";

  slider.append(previousBtn);

  let currentimageindex = 0;

  let imageid = shoe.images[currentimageindex];

  let image = document.createElement("img");

  image.src = `http://localhost:3000/images/${imageid}`;

  slider.append(image);

  slider.append(nextBtn);

  imagecell.append(slider);


  nextBtn.addEventListener("click", function () {

    currentimageindex++;

    if (currentimageindex === shoe.images.length) {
      currentimageindex = 0;
    }

    showimage();
  });


  previousBtn.addEventListener("click", function () {

    currentimageindex--;

    if (currentimageindex < 0) {
      currentimageindex = shoe.images.length - 1;
    }

    showimage();
  });


  function showimage() {

    let imageid = shoe.images[currentimageindex];

    image.classList.add("changing");

    setTimeout(function () {

      image.src = `http://localhost:3000/images/${imageid}`;

      image.classList.remove("changing");

    }, 300);
  }
}
else {

  imagecell.textContent = "No Image";

}
  


  let shoedeletebtn = document.createElement("button");

  let eidtshoebtn = document.createElement("button");

  actioncell.append(shoedeletebtn);

  actioncell.append(eidtshoebtn);


  comapnycell.textContent = shoe.company.toUpperCase();

  shoenamecell.textContent = shoe.shoename.toUpperCase();

  pricecell.textContent = shoe.price;

  gendercell.textContent = shoe.gender.toUpperCase();

  conditioncell.textContent = shoe.condition.toUpperCase();

  stockcell.textContent = shoe.stock;

  sizecell.textContent = shoe.shoesize + " :uk";


  shoedeletebtn.textContent = "🗑️";

  shoedeletebtn.classList.add("shoedeletebtn");


  eidtshoebtn.textContent = "✏️";

  eidtshoebtn.classList.add("shoedeletebtn");

row.append(
  comapnycell,
  shoenamecell,
  imagecell,
  sizecell,
  pricecell
  ,gendercell,
  conditioncell,
  stockcell,
  actioncell
)

  tablerow.append(row);


  // ==================== DELETE ====================

  shoedeletebtn.addEventListener("click", async function (event) {

    console.log(event.target);

    let id = shoe._id;


    try {

      showLoading();

      let response = await fetch(
        `http://localhost:3000/shoes/${id}`,
        {
          method: "DELETE",
        }
      );


      if (response.status == 404) {

        alert("shoe not found");

        return;
      }


      if (response.ok) {

        console.log(
          `the shoe with id ${id} has been deleted`
        );

        tablerow.textContent = "";

        getshoes();
      }

    } catch (error) {

      console.log(error);

    } finally {

      hideLoading();

    }

  });


  // ==================== EDIT BUTTON ====================

  eidtshoebtn.addEventListener("click", function (event) {

    images = null;

    companyinput.value = shoe.company.toUpperCase();

    shoenameinput.value = shoe.shoename.toUpperCase();

    priceinput.value = shoe.price;

    genderinput.value = shoe.gender.toUpperCase();

    conditioninput.value = shoe.condition.toUpperCase();

    stockinput.value = shoe.stock;

    sizeinput.value = shoe.shoesize;

    addinputbtn.textContent = "UPDATE";

    mode = "edit";

    selectedshoeid = shoe._id;
  });
}


// ==================== CLOSE EMPTY INPUT MODAL ====================

closeemptyinputmodal.addEventListener("click", function () {
  emptyinputmodal.classList.remove("active");
});





  // ==================== SEARCH ====================
  const searchmodal = document.getElementById("searchmodal");

const searchbox = document.getElementById("searchbox");

const closesearchmodal = document.getElementById("closesearchmodal");

const searchbrandinput = document.getElementById("searchbrandinput");

const performsearchbtn = document.getElementById("performsearchbtn");


const searchbtn=document.getElementById("searchbtn")


const resetbtn=document.getElementById("resetbtn")



searchbtn.addEventListener("click", function () {
       resetbtn.style.display="flex"
    searchmodal.style.display = "flex";
    searchmodal.style.opacity = "1";
    searchmodal.style.visibility = "visible";

    searchbox.style.transform = "translateY(0) scale(1)";

});
closesearchmodal.addEventListener("click", function () {

    searchmodal.style.display = "none";
    searchmodal.style.opacity = "0";
    searchmodal.style.visibility = "hidden";

});
  performsearchbtn.addEventListener("click",async function(){

    let searchinput=searchbrandinput.value
     let response = await fetch(`http://localhost:3000/shoes/search?company=${searchinput}`);
    let data=await response.json()
    shoearray=data
    tablerow.innerHTML=""
    displayshoes()
        searchmodal.style.display = "none";
    searchmodal.style.opacity = "0";
    searchmodal.style.visibility = "hidden";
    searchbtn.style.display="none"

  })


  resetbtn.addEventListener("click",function(){
    searchbtn.style.display="flex"

    tablerow.innerHTML=""
    getshoes()
    resetbtn.style.display="none"

  })



