const express = require("express");
const session = require("express-session");
const app = express();
const path = require("path");
require("dotenv").config();

const loginRouter = require("./routes/login");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/login", loginRouter);

app.listen(process.env.PORT, () => {
  console.log("WEB | Aktif | " + process.env.PORT);
});
