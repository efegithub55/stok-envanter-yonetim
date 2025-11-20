exports.getStockStatus = (req, res) => {
  res.render("stok-islemleri/stok-durumu");
};

exports.getStockAdd = (req, res) => {
  res.render("stok-islemleri/stok-girisi");
};
