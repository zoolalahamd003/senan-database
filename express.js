const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { GridFSBucket } = require("mongodb");
const cors = require("cors");
require("dotenv").config();

let bucket;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

// ==================== COLOR PALETTE ====================
const COLOR_PALETTE = [
  "BLACK", "WHITE", "RED", "NAVY", "ROYAL_BLUE", "GREY", "BEIGE", "BROWN",
  "GREEN", "OLIVE", "ORANGE", "YELLOW", "PINK", "PURPLE", "MAROON",
  "GOLD", "SILVER", "MULTICOLOR",
];

// ==================== SCHEMA ====================
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
    colors: {
      type: [
        {
          type: String,
          enum: COLOR_PALETTE,
        },
      ],
      required: [true, "select at least one color"],
      validate: {
        validator: function (colors) {
          return Array.isArray(colors) && colors.length > 0;
        },
        message: "select at least one color",
      },
    },
    sizes: {
      type: [
        {
          size: {
            type: Number,
            required: [true, "size is required"],
            min: [1, "shoe size cant be negative or zero"],
          },
          stock: {
            type: Number,
            required: [true, "stock is required"],
            min: [0, "stock cant be negative"],
          },
        },
      ],
      required: [true, "add at least one size"],
      validate: {
        validator: function (sizes) {
          return Array.isArray(sizes) && sizes.length > 0;
        },
        message: "add at least one size",
      },
      _id: false,
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
      enum: ["MALE", "male", "FEMALE", "female", "UNISEX", "unisex"],
    },
    condition: {
      type: String,
      required: [true, "condition of the shoe id required"],
      uppercase: true,
      enum: ["USED", "used", "NEW", "new"],
    },
  },
  {
    strict: true,
    timestamps: true,
  },
);

const SHOEMODEL = mongoose.model("SHOESCHEMA", shoeschema);

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Colors and sizes arrive as JSON strings inside multipart form-data
// (FormData can't carry real arrays/objects), so parse them back into
// real arrays before they touch Mongoose.
function parseArrayField(rawValue, fieldName) {
  if (rawValue === undefined) return undefined;
  if (Array.isArray(rawValue)) return rawValue;
  try {
    return JSON.parse(rawValue);
  } catch (error) {
    let parseerror = new Error(`${fieldName} must be valid JSON`);
    parseerror.name = "ValidationError";
    throw parseerror;
  }
}

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

    let imageid = [];

    for (let i = 0; i < req.files.length; i++) {
      let uploadstream = bucket.openUploadStream(req.files[i].originalname);
      await new Promise((resolve, reject) => {
        uploadstream.on("finish", () => resolve());
        uploadstream.on("error", (error) => reject(error));
        uploadstream.end(req.files[i].buffer);
      });

      imageid.push(uploadstream.id);
    }

    let newshoe = {
      company: req.body.company,
      shoename: req.body.shoename,
      price: req.body.price,
      gender: req.body.gender,
      condition: req.body.condition,
      colors: parseArrayField(req.body.colors, "colors"),
      sizes: parseArrayField(req.body.sizes, "sizes"),
      images: imageid,
    };

    let data = await SHOEMODEL.create(newshoe);
    res.status(201).json(data);
  }),
);

app.get(
  "/shoes",
  asyncHandler(async (req, res, next) => {
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
    let id = req.params.id;
    let deletedata = await SHOEMODEL.findById(id);
    if (deletedata == null) {
      return res.status(404).json({ message: "Shoe not found" });
    }
    for (let i = 0; i < deletedata.images.length; i++) {
      await bucket.delete(deletedata.images[i]);
    }
    let deleted = await SHOEMODEL.findByIdAndDelete(id);
    res.json(deleted);
  }),
);

app.get(
  "/images/:id",
  asyncHandler(async (req, res) => {
    let imageid = new mongoose.Types.ObjectId(req.params.id);
    let downloadstream = bucket.openDownloadStream(imageid);
    downloadstream.on("error", (error) => {
      res.status(404).send("image not found");
    });
    downloadstream.pipe(res);
  }),
);

// ==================== PATCH (full edit AND inline single-field edit) ====================
const EDITABLE_FIELDS = ["company", "shoename", "price", "gender", "condition"];

app.patch(
  "/shoes/:id",
  upload.array("images"),
  asyncHandler(async (req, res, next) => {
    let id = req.params.id;
    let oldshoe = await SHOEMODEL.findById(id);

    if (oldshoe == null) {
      return res.status(404).json({ message: "Shoe not found" });
    }

    const updatewholedata = {};

    for (let i = 0; i < EDITABLE_FIELDS.length; i++) {
      let field = EDITABLE_FIELDS[i];
      if (req.body[field] !== undefined) {
        updatewholedata[field] = req.body[field];
      }
    }

    if (req.body.colors !== undefined) {
      updatewholedata.colors = parseArrayField(req.body.colors, "colors");
    }

    if (req.body.sizes !== undefined) {
      updatewholedata.sizes = parseArrayField(req.body.sizes, "sizes");
    }

    let imageid = [];

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        let uploadstream = bucket.openUploadStream(req.files[i].originalname);
        await new Promise((resolve, reject) => {
          uploadstream.on("finish", () => resolve());
          uploadstream.on("error", (error) => reject(error));
          uploadstream.end(req.files[i].buffer);
        });
        imageid.push(uploadstream.id);
      }
      updatewholedata.images = imageid;
    }

    let updateddata = await SHOEMODEL.findByIdAndUpdate(id, updatewholedata, {
      new: true,
      runValidators: true,
    });

    if (updateddata == null) {
      return res.status(404).json({ message: "Shoe not found" });
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
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  console.log(error);
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: "validation failed", error: error.message });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID", error: error.message });
  }
  if (error.code === 11000) {
    return res.status(409).json({ message: "Duplicate value", error: error.message });
  }
  res.status(500).json({ message: "something went wrong", error: error.message });
});
