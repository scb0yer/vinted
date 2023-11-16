require("dotenv").config();
const express = require("express");
const router = express.Router();
const isAuthenticated = require("../middlewares/isAuthenticated");
const fileUpload = require("express-fileupload");
const Offer = require("../models/Offer");
const mongoose = require("mongoose");

const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: CLOUDINARY_NAME,
  api_key: CLOUDINARY_PUBLIC_KEY,
  api_secret: CLOUDINARY_SECRET_KEY,
});

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const {
        _id,
        title,
        description,
        price,
        condition,
        city,
        brand,
        size,
        color,
      } = req.body;
      if (req.files) {
        const picturesToUpload = req.files.pictures;
        const arrayOfFilesUrl = [];
        for (let i = 0; i < picturesToUpload.length; i++) {
          const picture = picturesToUpload[i];
          const result = await cloudinary.uploader.upload(
            convertToBase64(picture),
            { folder: "Vinted" }
          );
          arrayOfFilesUrl.push(result.secure_url);
        }
      }
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { marque: brand },
          { taille: size },
          { état: condition },
          { emplacement: city },
          { couleur: color },
        ],
        // product_image: arrayOfFilesUrl,
        owner: req.userFound,
      });
      await newOffer.save();
      console.log("new offer successfully added 🤌");
      return res.status(200).json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    const filter = {};
    filter.product_price = { $gt: 0 };
    const limit = 5;
    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    let sorting = 1;
    const keys = Object.keys(req.query);
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] === "title") {
        filter.product_name = new RegExp(req.query[keys[i]], "i");
      }
      if (keys[i] === "brand") {
        filter.product_details.brand = new RegExp(req.query[keys[i]], "i");
      }
      if (keys[i] === "priceMin") {
        filter.product_price.$gt = req.query[keys[i]];
      }
      if (keys[i] === "priceMax") {
        filter.product_price.$lt = req.query[keys[i]];
      }
    }
    if (req.query.sort) {
      if (req.query.sort === "price-desc") {
        sorting = -1;
      } else {
        sorting = 1;
      }
    }
    console.log(filter);
    const offers = await Offer.find(filter)
      .select("product_name product_price -_id")
      .sort({ product_price: sorting })
      .limit(limit)
      .skip((page - 1) * limit);
    return res.status(200).json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offers = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account",
    });
    if (offers) {
      return res.status(200).json(offers);
    } else {
      return res
        .status(400)
        .json({ message: "Aucune offre ne correspond à cet id" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
