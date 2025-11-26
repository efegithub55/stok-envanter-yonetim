const Product = require("../models/Product");

exports.getDashboard = async (req, res) => {
  var totalProducts = await Product.getAllProducts();
  var totalValue = await Product.getTotalValue();
  res.render("dashboard", { totalProducts: totalProducts.length, totalValue });
};
