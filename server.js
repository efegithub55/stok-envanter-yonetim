const express = require("express");
const session = require("express-session");
const app = express();
const path = require("path");
require("dotenv").config();
const User = require("./models/User");

const loginRouter = require("./routes/login");
const dashboardRouter = require("./routes/dashboard");
const productManagementRouter = require("./routes/product-management");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session || null;
  next();
});

app.use(async (req, res, next) => {
  req.user = null;
  res.locals.user = null;

  if (!req.session.userId) {
    return next();
  }

  try {
    let result = await User.findById(req.session.userId);
    const user = Array.isArray(result) ? result[0] : result;

    if (!user) {
      return next();
    }

    req.user = user;
    res.locals.user = user;
  } catch (err) {
    console.error("User Middleware hata:", err);
  }

  next();
});

app.use("/login", loginRouter);
app.use("/", dashboardRouter);
app.use("/urun-yonetimi", productManagementRouter);

app.listen(process.env.PORT, () => {
  console.log("WEB | Aktif | " + process.env.PORT);
});
