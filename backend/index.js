const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Game Engine API działa" });
});

app.listen(3001, () => {
  console.log("Backend działa na porcie 3001");
});