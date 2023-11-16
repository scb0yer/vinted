require("dotenv").config();
const express = require("express");
const { connect, default: mongoose } = require("mongoose");
const app = express();
app.use(express.json());

mongoose.connect(MONGODB_URL);

const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
app.use(userRoutes);

app.use(offerRoutes);

app.get("/", (req, res) => {
  try {
    return res.status(200).json("Bienvenue sur l'API Vinted !");
  } catch (error) {
    return res.status(500).json(error.message);
  }
});

app.all("*", (req, res) => {
  return res.status(404).json("Not found");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server has started 🚀");
});
