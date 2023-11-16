const express = require("express");
const router = express.Router();

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
        //   avatar: Object,
      },
      newsletter,
      token: token,
      salt: salt,
      hash: SHA256(password + salt).toString(encBase64),
    });
    console.log(`New User ${req.body.username} created 👏`);
    await newUser.save();
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

module.exports = router;
