const checkPassword = require("../utils/checkPassword");

exports.getLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (err) {
    console.error("getLogin hata:", err);
    throw err;
  }
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  const { auth, user } = await checkPassword.check(email, password);
  if (auth) {
    req.session.user = user;
    console.log(req.session);
    res.redirect("/dashboard");
  } else {
    req.session.alert = {
      message: "E-posta veya şifre hatalı!",
      type: "warning",
    };
    return res.redirect("/login");
  }
};
