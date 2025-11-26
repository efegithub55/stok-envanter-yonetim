const Product = require("../models/Product");

exports.getDashboard = async (req, res) => {
  var totalProducts = await Product.getAllProducts();
  res.render("dashboard", { totalProducts: totalProducts.length });
};
