require("dotenv").config();
const express = require("express");
const { connect, default: mongoose } = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

console.log(process.env.MONGODB_URL);
mongoose.connect(process.env.MONGODB_URL);

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
