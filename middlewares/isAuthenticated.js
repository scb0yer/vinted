const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  const token = req.headers.authorization.replace("Bearer ", "");
  const userFound = await User.findOne({ token });
  if (userFound) {
    req.userFound = userFound;
    next();
  } else {
    return res.status(401).json("Unauthorized 😾");
  }
};
module.exports = isAuthenticated;
