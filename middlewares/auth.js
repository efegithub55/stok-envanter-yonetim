module.exports = (req, res, next) => {
  if (!req.user) {
    req.session.alert = {
      type: "danger",
      message: "Bu sayfaya erişim yetkiniz bulunmamaktadır.",
    };
    return res.redirect("/login");
  }
  next();
};
