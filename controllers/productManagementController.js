exports.getProducts = (req, res) => {
  res.render("urun-yonetimi/urunler");
};

exports.getAddProduct = (req, res) => {
  res.render("urun-yonetimi/urun-ekle");
};

exports.getCategories = (req, res) => {
  res.render("urun-yonetimi/kategoriler");
};
