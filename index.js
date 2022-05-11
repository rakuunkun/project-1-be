require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;
const cors = require("cors");
const morgan = require("morgan");
const { Router } = require("express");
const path = require("path");

morgan.token("date", function (req, res) {
  return new Date().toString();
});
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :date")
);

app.use(express.json());
app.use(
  cors({
    exposedHeaders: ["x-total-count", "x-token-access"],
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("<h1>API socmed ready</h1>");
});
//

// Memanggil fungsi yang dibuat di folder lain
const { authRoutes } = require("./src/routes");
app.use("/auth", authRoutes);
// app.use("/product", productRoutes);

const { profileRoutes } = require("./src/routes");
app.use("/profile", profileRoutes);

const { postRoutes } = require("./src/routes");
app.use("/post", postRoutes);

app.listen(PORT, () => console.log(`App jalan di port${PORT}`));
