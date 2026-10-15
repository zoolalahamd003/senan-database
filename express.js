const express = require("express");


const mongoose = require("mongoose");

const multer = require("multer");

let bucket;

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

const { GridFSBucket } = require("mongodb");

const cors = require("cors");

require("dotenv").config();

const app = express();

app.use(cors());

app.use(express.json());

app.listen(3000, () => {
  console.log("the server is listning on port 3000");
});

console.log("mongo uri existed", !!process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("database connected successfully");
    bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: "shoeimages",
    });
    console.log("bucket :");
  })
  .catch((error) => {
    console.log(error);
  });

let shoeschema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, "comapny name is required"],
      uppercase: true,
    },
    shoename: {
      type: String,
      required: [true, "shoe name is required"],
      uppercase: true,
    },
    images: [
      {
        type: mongoose.Schema.Types.ObjectID,
      },
    ],
    shoesize: {
      type: Number,
      required: true,
      min: [1, "shoe size cant be negative or zero:"],
    },
    price: {
      type: Number,
      required: true,
      validate: {
        validator: function (price) {
          return price > 0;
        },
        message: "price cant be zero or negative",
      },
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      uppercase: true,
      enum: ["MALE", "male", "FEMALE", "female", "unisex"],
    },
    condition: {
      type: String,
      required: [true, "condition of the shoe id required"],
      uppercase: true,
      enum: ["USED", "used", "NEW", "new"],
    },
    stock: {
      type: Number,
      required: [true, "stock is required"],
      min: [0, "stock cant be negative"],
    },
  },
  {
    strict: true,
  },
  {
    timestamps: true,
  },
);

const SHOEMODEL = mongoose.model("SHOESCHEMA", shoeschema);

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

app.post(
  "/shoes",
  upload.array("images"),
  asyncHandler(async (req, res, next) => {
    let existingone = await SHOEMODEL.findOne({
      company: req.body.company,
      shoename: req.body.shoename,
    });

    if (existingone) {
      return res.status(409).json({
        message: "Shoe already exists",
      });
    }

    console.log("post");
    let imageid = [];

    for (let i = 0; i < req.files.length; i++) {
      let uploadstream = bucket.openUploadStream(req.files[i].originalname);
      await new Promise((resolve, reject) => {
        uploadstream.on("finish", () => {
          console.log("upload finish");
          resolve();
        });

        uploadstream.on("error", (error) => {
          console.log("some error occured");
          reject(error);
        });
        console.log("upload started");
        uploadstream.end(req.files[i].buffer);
        console.log("upoad finish");
        console.log("the image is ", uploadstream.id);
      });

      imageid.push(uploadstream.id);

      req.body.images = imageid;

      console.log("the image id are", imageid);
    }
    req.body.images = imageid;

    let data = await SHOEMODEL.create(req.body);
    //will directly create it
    res.status(201).json(data);
  }),
);

app.get(
  "/shoes",
  asyncHandler(async (req, res, next) => {
    console.log("get shoes");
    let wholedata = await SHOEMODEL.find();
    res.json(wholedata);
  }),
);

app.get(
  "/shoes/search",
  asyncHandler(async (req, res) => {
    let data = await SHOEMODEL.find({
      company: req.query.company,
    });
    res.status(200).json(data);
  }),
);


app.get(
  "/shoes/:id",
  asyncHandler(async (req, res, next) => {
    console.log(req.params.id);
    let id = req.params.id;

    let iddata = await SHOEMODEL.findById(id);
    if (iddata == null) {
      return res.status(404).json({ message: "shoe not found" });
    }
    res.json(iddata);
  }),
);

app.delete(
  "/shoes/:id",
  asyncHandler(async (req, res, next) => {
    console.log("delete");
    let id = req.params.id;
    let deletedata = await SHOEMODEL.findById(id);
    if (deletedata == null) {
      return res.status(404).json({
        message: "Shoe not found",
      });
    }
    for (let i = 0; i < deletedata.images.length; i++) {
      let deleteid = deletedata.images[i];
      await bucket.delete(deleteid);
    }
    let deleted = await SHOEMODEL.findByIdAndDelete(id);

    res.json(deleted);
  }),
);

app.get(
  "/images/:id",
  asyncHandler(async (req, res) => {
    let imageid = new mongoose.Types.ObjectId(req.params.id);
    //will simply sonvert te id to mongose id like the Number(id)

    let downloadstream = bucket.openDownloadStream(imageid);

    downloadstream.on("error", (error) => {
      res.status(404).send("image not found");
    });
    downloadstream.pipe(res);
  }),
);

app.patch(
  "/shoes/:id",
  upload.array("images"),
  asyncHandler(async (req, res, next) => {
    const updatewholedata = {
      company: req.body.company,
      shoename: req.body.shoename,
      shoesize: req.body.shoesize,
      price: req.body.price,
      gender: req.body.gender,
      condition: req.body.condition,
      stock: req.body.stock,
    };
    console.log("patch");
    let id = req.params.id;
    let imageid = [];
    let oldshoe = await SHOEMODEL.findById(id);

    if (oldshoe == null) {
      return res.status(404).json({
        message: "Shoe not found",
      });
    }

    for (let i = 0; i < req.files.length; i++) {
      console.log("1 - starting image upload");
      let uploadstream = bucket.openUploadStream(req.files[i].originalname);
      console.log("2 - upload stream created");
      await new Promise((resolve, reject) => {
        uploadstream.on("finish", () => {
          console.log("upload finish");
          console.log("3 - upload finished");
          resolve();
        });

        uploadstream.on("error", (error) => {
          console.log("some error occured");
          reject(error);
        });

        console.log("4 - sending buffer");
        uploadstream.end(req.files[i].buffer);
      });

      console.log("5 - promise finished");
      imageid.push(uploadstream.id);
    }

    if (imageid.length > 0) {
      updatewholedata.images = imageid;
    }

    let updateddata = await SHOEMODEL.findByIdAndUpdate(id, updatewholedata, {
      new: true,
      runValidators: true,
    });
    if (updateddata == null) {
      return res.status(404).json({
        message: "Shoe not found",
      });
    }

    if (imageid.length > 0) {
      for (let i = 0; i < oldshoe.images.length; i++) {
        await bucket.delete(oldshoe.images[i]);
      }
    }

    res.send(updateddata);
  }),
);




























app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.use((error, req, res) => {
  console.log("the middleware finuction has beens uesed:");
  console.log(error);
  if (error.name === "ValidationError") {
    return res
      .status(400)
      .json({ message: "validation failed", error: error.message });
  }
  if (error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID",
      error: error.message,
    });
  }
  if (error.code === 11000) {
    return res.status(409).json({
      message: "Duplicate value",
      error: error.message,
    });
  }
  res
    .status(500)
    .json({ message: "something went wrong", error: error.message });
});
