exports.getLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (err) {
    console.error("getLogin hata:", err);
    throw err;
  }
};
