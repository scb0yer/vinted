const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");

const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_PUBLIC_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

const User = require("../models/User");

const uid2 = require("uid2");
const encBase64 = require("crypto-js/enc-base64");
const SHA256 = require("crypto-js/sha256");

router.post("/user/signup", async (req, res) => {
  try {
    const { username, email, password, newsletter } = req.body;
    const emailAlreadyUsed = await User.findOne({ email });
    if (emailAlreadyUsed !== null) {
      return res
        .status(400)
        .json({ message: "Adresse email déjà existante 🙀" });
    }
    const salt = uid2(24);
    const token = uid2(18);
    const newUser = new User({
      email,
      account: {
        username,
        avatar: Object,
      },
      newsletter,
      token: token,
      salt: salt,
      hash: SHA256(password + salt).toString(encBase64),
    });
    console.log(`New User ${req.body.username} created 👏`);
    await newUser.save();
    if (req.files) {
      const pictureToUpload = req.files.account.avatar;
      const result = await cloudinary.uploader.upload(
        convertToBase64(pictureToUpload),
        { folder: `/vinted/avatars/${newUser._id}` }
      );
      newUser.account.avatar = result.secure_url;
    }
    return res.status(200).json({
      _id: newUser._id,
      token: token,
      account: {
        username: newUser.account.username,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    const hashLogin = SHA256(req.body.password + user.salt).toString(encBase64);
    if (hashLogin === user.hash) {
      console.log("Password OK 👌");
      res.status(200).json({
        _id: user._id,
        token: user.token,
        account: {
          username: user.account.username,
        },
      });
    } else {
      return res.status(401).json({ message: "Mot de passe incorrect 😾" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/user/addAvatar", fileUpload(), async (req, res) => {
  try {
    const user_id = req.body._id;
    const avatar = req.files.avatar;
    const result = await cloudinary.uploader.upload(convertToBase64(avatar), {
      folder: `/vinted/avatars/${user_id}`,
    });
    console.log(result);

    const user = await User.findByIdAndUpdate(user_id, {
      account: {
        avatar: result.secure_url,
      },
    });
    await user.save();
    console.log("l'image est bien uploadée");
    res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
